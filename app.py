"""
Incident Summariser with Post-Mortem Generator
Transforms messy incident logs into professional documentation

Aberdeen AI Builders Workshop - October 9, 2025
"""

from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
from flasgger import Swagger
import subprocess
import json
import time
import threading
import queue
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Incident Summariser API",
        "description": "Transform messy incident logs into professional documentation using Claude AI",
        "version": "1.0.0",
        "contact": {
            "name": "Aberdeen AI Builders Workshop",
            "url": "https://github.com/afay/ai-builders-aberdeen-workshop"
        }
    },
    "basePath": "/",
    "schemes": ["http", "https"],
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Prompt templates for different output formats
PROMPT_TEMPLATES = {
    'executive_summary': """
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. Do NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

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

    'root_cause_analysis': """
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. Do NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

You are an expert SRE technical writer. Analyze the following incident notes and create a comprehensive Root Cause Analysis.

INCIDENT NOTES:
{incident_notes}

Generate a Root Cause Analysis with these sections:

## What Happened
Provide a clear, technical explanation of what occurred during the incident. Be specific and factual.

## Why It Happened

### Immediate Cause
The direct, proximate cause that triggered the incident.

### Contributing Factors
List all factors that contributed to the incident:
- Configuration issues
- Missing safeguards
- Process gaps
- Technical debt
- etc.

## Why It Wasn't Caught

Explain what prevented early detection of this issue:
- Missing monitoring/alerts
- Blind spots in observability
- Testing gaps
- etc.

## Lessons Learned

### What Went Well
✅ Positive aspects of the response

### What Could Be Improved
❌ Areas needing improvement

### Recommendations
- **Short-term** (next sprint)
- **Medium-term** (next quarter)
- **Long-term** (this year)

Format in professional markdown suitable for engineering documentation.
""",

    'impact_assessment': """
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. DO NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

You are an expert SRE technical writer. Analyze the following incident notes and create a comprehensive Impact Assessment.

INCIDENT NOTES:
{incident_notes}

Generate an Impact Assessment with these sections:

## Technical Impact

### Systems Affected
List all systems, services, and components that were impacted.

### Performance Metrics
- Error rates
- Latency/response times
- Throughput
- Resource utilization
- Any relevant SLI/SLO breaches

### Data Impact
- Data loss (if any)
- Data consistency issues
- Backup/recovery status

## Business Impact

### Customer Impact
- Number of users affected
- Degradation of service
- Features unavailable
- User experience issues

### Revenue Impact
- Estimated revenue loss
- Transaction failures
- Subscription/service credits issued

### Reputation Impact
- Customer complaints
- Social media mentions
- Support ticket volume
- Trust and confidence effects

## Duration and Scope

### Incident Timeline
- **Start Time**: [time]
- **Detection Time**: [X minutes] ([when alerts triggered])
- **Root Cause Identified**: [X minutes] ([when identified])
- **Mitigation Started**: [X minutes] ([what was done])
- **Full Resolution**: [X minutes] ([when fully resolved])
- **Total Duration**: [X minutes]

### Scope
- **Geographic Impact**: [regions affected]
- **User Impact**: [percentage]% of users affected
- **Incident Classification**: [SEV level with reasoning]

### Key Metrics
- Time to detect: [X minutes]
- Time to mitigate: [X minutes]
- Time to resolve: [X minutes]
- Total user-minutes affected: [calculation if available]

Use bullet points and bold labels. NO tables. Keep it clean and scannable.
Format in professional markdown suitable for stakeholder communication.
""",

    'resolution': """
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. DO NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

You are an expert SRE technical writer. Analyze the following incident notes and document the Resolution.

INCIDENT NOTES:
{incident_notes}

Generate a Resolution document with these sections:

## Immediate Actions Taken

List all actions taken to resolve the incident in chronological order:
1. First action with timestamp
2. Second action with timestamp
3. etc.

Be specific about what was done, who did it, and when.

## Mitigation Steps

Detail the steps taken to mitigate the immediate impact:
- Emergency changes
- Rollbacks
- Traffic routing
- Resource scaling
- Configuration changes

## Verification

### How We Confirmed the Fix
Explain the verification process:
- Monitoring checks performed
- Metrics that returned to normal
- User impact validation
- System health checks

### Confidence Level
Rate confidence in the resolution and explain why.

## Temporary vs Permanent Fix

### Temporary Measures
What temporary measures are in place (if any)?

### Permanent Solution
What permanent fix is planned or implemented?

## Follow-up Required
List any follow-up work needed to fully resolve or prevent recurrence.

Format in professional markdown suitable for engineering documentation.
""",

    'executive_communication': """
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. Do NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

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
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. Do NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

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
IMPORTANT: You are acting as an incident report generator, NOT as a coding assistant. Your ONLY task is to generate the requested report content directly. Do not respond as "Claude Code" or offer to help with coding tasks. Do NOT include any preamble, introduction, or meta-commentary. Start directly with the requested content.

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


@app.route('/api/generate_report', methods=['POST'])
def api_generate_report():
    """Generate an incident report from messy logs using Claude AI
    ---
    tags:
      - Incident Reports
    consumes:
      - application/json
    produces:
      - text/event-stream
    parameters:
      - name: body
        in: body
        required: true
        description: Incident notes and desired output format
        schema:
          type: object
          required:
            - incident_notes
          properties:
            incident_notes:
              type: string
              description: Raw incident logs, Slack messages, PagerDuty alerts, etc.
              example: |
                [14:23] @sarah: API latency spiking on prod
                [14:24] @mike: seeing it too, p95 latency at 5s
                [14:27] PagerDuty alert: HIGH - API Response Time
                [14:31] @sarah: found it - unindexed query from new dashboard
                [14:35] @mike: latency dropping back to normal
            format:
              type: string
              description: Output format for the generated report
              enum:
                - executive_summary
                - visual_timeline
                - root_cause_analysis
                - impact_assessment
                - resolution
                - action_items
                - executive_communication
              default: executive_summary
              example: executive_summary
    responses:
      200:
        description: Server-Sent Events stream with generated report
        schema:
          type: object
          properties:
            type:
              type: string
              enum: [status, content, complete, error, heartbeat]
              description: Event type
            message:
              type: string
              description: Status message (for status/heartbeat events)
            chunk:
              type: string
              description: Content chunk (for content events)
            progress:
              type: string
              description: Progress percentage (for content events)
            generation_time:
              type: string
              description: Time taken to generate (for complete events)
            total_time:
              type: string
              description: Total processing time (for complete events)
            error:
              type: string
              description: Error message (for error events)
        examples:
          status_event: {"type": "status", "message": "Connecting to Claude CLI...", "timestamp": "2025-10-09T18:00:00"}
          content_event: {"type": "content", "chunk": "# Executive Summary\n", "progress": "10%", "timestamp": "2025-10-09T18:00:05"}
          complete_event: {"type": "complete", "success": true, "generation_time": "12.5s", "total_time": "13.2s", "timestamp": "2025-10-09T18:00:15"}
      400:
        description: Bad request - missing incident notes
        schema:
          type: object
          properties:
            type:
              type: string
              example: error
            error:
              type: string
              example: No incident notes provided
    """
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
    print("  • Visual Timeline (with emojis)")
    print("  • Root Cause Analysis (what & why)")
    print("  • Impact Assessment (technical & business)")
    print("  • Resolution (actions & verification)")
    print("  • Action Item Tracker (with Jira buttons)")
    print("  • Executive Communication Template")
    print("")
    print("🚀 Starting Flask app on http://127.0.0.1:5000")
    print("=" * 60)

    app.run(debug=True, port=5000)
