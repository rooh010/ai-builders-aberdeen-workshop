"""
Incident Summariser with Post-Mortem Generator
Transforms messy incident logs into professional documentation

Aberdeen AI Builders Workshop - October 9, 2025
"""

from flask import Flask, render_template, request, Response, stream_with_context
import subprocess
import json
import time
import threading
import queue
from datetime import datetime

app = Flask(__name__)

# Prompt templates for different output formats
PROMPT_TEMPLATES = {
    'executive_summary': """
You are an expert SRE technical writer. Analyze the following incident notes and create a concise Executive Summary (1 page).

INCIDENT NOTES:
{incident_notes}

Generate an Executive Summary with these sections:
1. INCIDENT SUMMARY header with: Incident ID, Date, Duration, Severity, Status
2. Impact - brief description of what was affected and scale
3. Root Cause - one clear sentence
4. Resolution - 2-3 bullet points of what was done
5. Follow-up Actions - key next steps
6. Business Impact assessment

Keep it to one page. Use clear, non-technical language suitable for leadership.
Format in clean markdown.
""",

    'technical_postmortem': """
You are an expert SRE technical writer. Analyze the following incident notes and create a comprehensive Technical Post-Mortem.

INCIDENT NOTES:
{incident_notes}

Generate a detailed Technical Post-Mortem with these sections:

## Incident Overview
- Date, Time, Duration, Severity
- Affected Service
- Impact statement

## Timeline
Create a markdown table with Time | Event columns showing the incident progression with timestamps

## Root Cause Analysis
### What Happened
Clear technical explanation

### Why It Happened
1. Immediate cause
2. Contributing factors (list them)

### Why It Wasn't Caught
Explain what prevented early detection

## Impact Assessment
### Technical Impact
- Metrics and numbers
- Systems affected

### Business Impact
- Customer Impact
- Revenue Impact
- Reputation Impact

## Resolution
### Immediate Actions Taken
Numbered list

### Verification
How we confirmed the fix

## Action Items
Create a markdown table: Priority | Action | Owner | Due Date | Status

## Lessons Learned
### What Went Well
✅ Use checkmarks

### What Could Be Improved
❌ Use X marks

### Recommendations
Short, medium, and long-term

## Supporting Data
Any relevant metrics, queries, or technical details

Format in professional markdown suitable for engineering documentation.
""",

    'executive_communication': """
You are an expert in executive communication. Analyze the following incident notes and create an email template for leadership.

INCIDENT NOTES:
{incident_notes}

Generate an Executive Communication email with:

**Subject:** [RESOLVED] Brief description - Date

**To:** Engineering Leadership, Product Team
**From:** SRE Team
**Date:** {date}

### Summary
2-3 sentences in plain English

### What Happened
Non-technical explanation

### Customer Impact
- Duration
- Severity (in business terms)
- Scale
- Escalations

### Resolution
How we fixed it and when (non-technical)

### Prevention
What we're doing to prevent recurrence

### Questions?
Contact information

Use reassuring, professional tone. NO technical jargon. Focus on customer impact and prevention.
""",

    'visual_timeline': """
You are an expert at creating visual timelines. Analyze the following incident notes and create an ASCII art timeline.

INCIDENT NOTES:
{incident_notes}

Generate a visual timeline using this format:

```
Incident Timeline - [Brief Title]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Time] │ [emoji] [Event description]
       │
       │ [time passage note if gap]
       │
[Time] │ [emoji] [Event description]
[Time] │ [emoji] [Event description]
       │
       └─────────────────────────────────────────────

🔴 Detection: X min
🔍 Diagnosis: X min
🛠️  Mitigation: X min
━━━━━━━━━━━━━━━━━
Total: X minutes
```

Use these emojis appropriately:
⚙️  (deployment/setup)
🔴 (issue detected)
🚨 (alert fired)
📊 (metrics/monitoring)
🔍 (investigation)
💡 (root cause found)
🛠️  (mitigation action)
⚡ (quick fix)
📈 (improvement/recovery)
✅ (resolved)
📝 (follow-up)

Make it visually clear and easy to follow.
""",

    'action_items': """
You are an expert at organizing action items. Analyze the following incident notes and create a comprehensive action item tracker.

INCIDENT NOTES:
{incident_notes}

Generate an Action Item Tracker with these sections:

### Immediate Actions (Complete)
- [x] Action description - @owner - timestamp
(List completed actions with checkmarks)

### Short-term (< 1 week)
- [ ] Action description - @owner - Due: date
(List pending actions)

### Medium-term (1-4 weeks)
- [ ] Action description - @owner - Due: date

### Long-term (Future)
- [ ] Action description
(Items without specific dates)

Extract ALL action items mentioned or implied in the incident notes.
Organize by timeframe and priority.
Assign owners based on context (use @name format).
Add realistic due dates based on priority.
Use markdown checkboxes.
"""
}


def stream_claude_output(prompt, output_queue):
    """
    Call Claude CLI and stream the output
    """
    try:
        print(f"[DEBUG] Starting Claude CLI for prompt ({len(prompt)} chars)")
        start_time = time.time()

        # Send initial status
        output_queue.put(json.dumps({
            'type': 'status',
            'message': '🔌 Connecting to Claude CLI...',
            'timestamp': datetime.now().isoformat()
        }))

        # Start Claude CLI process
        process = subprocess.Popen(
            ['claude', '--print'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Send status update
        time.sleep(0.5)
        output_queue.put(json.dumps({
            'type': 'status',
            'message': '📝 Analyzing incident and generating report...',
            'timestamp': datetime.now().isoformat()
        }))

        # Send the prompt and wait for response
        print(f"[DEBUG] Waiting for Claude response...")
        response_start = time.time()
        stdout, stderr = process.communicate(input=prompt, timeout=300)
        elapsed = time.time() - response_start

        if process.returncode == 0 and stdout:
            print(f"✅ Claude responded in {elapsed:.1f}s ({len(stdout)} chars)")

            # Send status
            output_queue.put(json.dumps({
                'type': 'status',
                'message': f'✨ Generated in {elapsed:.1f}s. Streaming output...',
                'timestamp': datetime.now().isoformat()
            }))

            # Stream the output in chunks
            chars = list(stdout)
            chunk_size = 20
            total_chars = len(chars)

            for i in range(0, total_chars, chunk_size):
                chunk = ''.join(chars[i:i+chunk_size])
                output_queue.put(json.dumps({
                    'type': 'content',
                    'chunk': chunk,
                    'progress': f"{min(100, int((i+chunk_size)/total_chars*100))}%",
                    'timestamp': datetime.now().isoformat()
                }))
                time.sleep(0.02)  # Typing effect

            # Send completion
            total_time = time.time() - start_time
            output_queue.put(json.dumps({
                'type': 'complete',
                'success': True,
                'total_time': f"{total_time:.1f}s",
                'generation_time': f"{elapsed:.1f}s",
                'timestamp': datetime.now().isoformat()
            }))
        else:
            print(f"❌ Claude failed: {stderr}")
            output_queue.put(json.dumps({
                'type': 'error',
                'error': stderr or 'Process failed',
                'timestamp': datetime.now().isoformat()
            }))

    except subprocess.TimeoutExpired:
        process.kill()
        output_queue.put(json.dumps({
            'type': 'error',
            'error': 'Claude CLI timed out after 5 minutes',
            'timestamp': datetime.now().isoformat()
        }))
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        output_queue.put(json.dumps({
            'type': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }))


def generate_sse_stream(prompt):
    """
    Generate Server-Sent Events stream
    """
    output_queue = queue.Queue()

    # Start streaming in a separate thread
    thread = threading.Thread(target=stream_claude_output, args=(prompt, output_queue))
    thread.daemon = True
    thread.start()

    # Stream events as they arrive
    timeout_counter = 0
    max_timeout = 300

    while True:
        try:
            message = output_queue.get(timeout=1)
            yield f"data: {message}\n\n"

            # Check if done
            data = json.loads(message)
            if data['type'] in ['complete', 'error']:
                break

        except queue.Empty:
            timeout_counter += 1
            if timeout_counter >= max_timeout:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Timeout after 5 minutes'})}\n\n"
                break

            # Heartbeat every 10 seconds
            if timeout_counter % 10 == 0:
                yield f"data: {json.dumps({'type': 'heartbeat', 'message': f'Processing... ({timeout_counter}s)', 'timestamp': datetime.now().isoformat()})}\n\n"


@app.route('/')
def index():
    """Generate incident report page"""
    return render_template('generate.html')


@app.route('/api/generate_report', methods=['POST'])
def api_generate_report():
    """API endpoint to generate incident report (streaming)"""
    try:
        data = request.get_json()
        incident_notes = data.get('incident_notes', '').strip()
        output_format = data.get('format', 'executive_summary')

        if not incident_notes:
            return Response(
                f"data: {json.dumps({'type': 'error', 'error': 'No incident notes provided'})}\n\n",
                content_type='text/event-stream'
            )

        # Get the appropriate prompt template
        prompt_template = PROMPT_TEMPLATES.get(output_format, PROMPT_TEMPLATES['executive_summary'])

        # Format the prompt with incident notes and current date
        prompt = prompt_template.format(
            incident_notes=incident_notes,
            date=datetime.now().strftime('%B %d, %Y')
        )

        # Stream the response
        return Response(
            stream_with_context(generate_sse_stream(prompt)),
            content_type='text/event-stream'
        )

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        return Response(
            f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n",
            content_type='text/event-stream'
        )


if __name__ == '__main__':
    print("=" * 60)
    print("🚨 Incident Summariser & Post-Mortem Generator")
    print("=" * 60)
    print("📍 Aberdeen AI Builders Workshop - October 9, 2025")
    print("🎯 Transform messy incident logs into professional docs")
    print("")
    print("✨ Features:")
    print("  • Executive Summary (1 page)")
    print("  • Technical Post-Mortem (detailed)")
    print("  • Executive Communication Template")
    print("  • Visual Timeline (ASCII art)")
    print("  • Action Item Tracker")
    print("")
    print("🚀 Starting Flask app on http://127.0.0.1:5000")
    print("=" * 60)

    app.run(debug=True, port=5000)
