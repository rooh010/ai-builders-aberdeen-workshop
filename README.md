# Incident Summariser & Post-Mortem Generator

Transform messy incident logs and notes into professional documentation using AI.

**Aberdeen AI Builders Workshop - October 9, 2025**

## Overview

A Flask web application that takes raw incident notes (Slack messages, PagerDuty alerts, Zoom chat logs) and automatically generates professional incident documentation in multiple formats using Claude AI.

Stop spending hours writing incident reports manually. Paste your messy logs, select a format, and get professional documentation in seconds.

## Features

### 5 Output Formats

1. **Executive Summary (1 page)**
   - Concise overview for leadership
   - Impact, root cause, resolution in plain English
   - Business impact assessment
   - Perfect for stakeholder updates

2. **Technical Post-Mortem (Detailed)**
   - Complete timeline with timestamps
   - Detailed root cause analysis (What, Why, Why it wasn't caught)
   - Impact assessment (technical + business)
   - Action items with owners and due dates
   - Lessons learned (what went well, what to improve)
   - Supporting data and metrics

3. **Executive Communication Template**
   - Email-ready format for leadership
   - Non-technical language
   - Focus on customer impact and prevention
   - Reassuring professional tone

4. **Visual Timeline**
   - ASCII art timeline showing incident flow
   - Detection → Diagnosis → Mitigation breakdown
   - Great for presentations and visual representation

5. **Action Item Tracker**
   - Organized by timeframe (immediate, short-term, medium-term, long-term)
   - Checkbox format for tracking
   - Owner assignments
   - Priority-based sorting

### Additional Features

- Real-time streaming output with progress indicators
- Copy to clipboard functionality
- Quick-load example incidents (API latency, DB lag, K8s crashes)
- 11 realistic example incident scenarios (LOW to CRITICAL severity)
- Professional markdown formatting
- No API keys required (uses Claude CLI)

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **AI**: Claude CLI (via subprocess)
- **Streaming**: Server-Sent Events (SSE)

## Prerequisites

- Python 3.10 or higher
- Claude CLI installed and authenticated
- Virtual environment support

### Installing Claude CLI

If you don't have Claude CLI installed:

```bash
# Install Claude CLI (see https://docs.anthropic.com/claude/docs/claude-cli for latest instructions)
# Authenticate with your Anthropic account
claude auth login
```

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd ai-builders-aberdeen-workshop
```

2. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install Flask Werkzeug
# or
pip install -r requirements.txt
```

## Usage

### Running the Application

1. Activate your virtual environment:
```bash
source .venv/bin/activate  # On macOS/Linux
```

2. Start the Flask server:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### Using the Application

1. **Navigate to the Generate page** (click "Start Generating Reports" or go to `/generate`)

2. **Paste your incident notes** into the text area. Format can be:
   - Slack messages with timestamps: `[14:23] @user: message`
   - PagerDuty alerts: `PagerDuty alert: HIGH - Service Down`
   - Zoom chat logs
   - Any raw incident notes or logs

3. **Select an output format** from the dropdown:
   - Executive Summary
   - Technical Post-Mortem
   - Executive Communication Email
   - Visual Timeline
   - Action Item Tracker

4. **Click "Generate Report"** and watch as Claude analyzes your incident and streams the output in real-time

5. **Copy the result** to your clipboard or clear to start over

### Example Input

```
[14:23] @sarah: API latency spiking on prod
[14:24] @mike: seeing it too, p95 latency at 5s usually 200ms
[14:27] PagerDuty alert: HIGH - API Response Time
[14:31] @sarah: found it - unindexed query from new dashboard
[14:35] @mike: latency dropping back to normal
```

### Example Output

The app will generate a professionally formatted document with:
- Incident summary with metadata (ID, date, duration, severity, status)
- Impact analysis
- Root cause explanation
- Resolution steps
- Follow-up actions
- Business impact assessment

See the Examples page (`/examples`) for 11 realistic incident scenarios.

## Project Structure

```
ai-builders-aberdeen-workshop/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── templates/
│   ├── index.html                  # Landing page
│   ├── generate.html               # Report generation page
│   └── examples.html               # Example incidents gallery
├── project_spec/
│   ├── project_spec.md             # Project specification
│   ├── incident-summariser-example-output.md
│   └── example_incidents/          # 11 example incident scenarios
│       ├── 01-low-app-restart-502s.md
│       ├── 02-low-medium-memory-leak-oom.md
│       ├── 03-medium-cert-expiration-https.md
│       ├── 04-medium-k8s-pod-crashloop-config.md
│       ├── 05-medium-high-alb-target-group-health.md
│       ├── 06-medium-high-terraform-state-lock.md
│       ├── 07-high-db-replication-lag-data-inconsistency.md
│       ├── 08-high-k8s-cluster-autoscaling-failure.md
│       ├── 09-very-high-multi-region-cascading-failure.md
│       ├── 10-very-high-security-compromised-credentials.md
│       └── 11-high-api-latency-unindexed-query.md
├── README.md                       # This file
└── CLAUDE.md                       # Project-specific Claude instructions
```

## Architecture

### How It Works

1. **User Input**: User pastes incident notes into web interface
2. **Format Selection**: User selects desired output format
3. **Prompt Generation**: Backend formats appropriate Claude prompt template with incident notes
4. **Claude CLI**: Python subprocess calls `claude --print` with the prompt
5. **Streaming**: Claude response is streamed back via Server-Sent Events (SSE)
6. **Display**: Frontend displays output in real-time with typing effect

### Key Components

- **`app.py`**: Main Flask application with:
  - 5 detailed prompt templates for different output formats
  - Claude CLI subprocess management
  - SSE streaming implementation
  - Error handling and timeouts (5 minutes max)

- **Frontend**: Vanilla JavaScript with:
  - Fetch API for POST requests
  - ReadableStream for SSE consumption
  - Real-time progress indicators
  - Copy to clipboard functionality

## Example Incidents Included

The project includes 11 realistic incident scenarios:

| Severity | Incident | Duration | Impact |
|----------|----------|----------|--------|
| LOW | App Restart 502s | 2 min | ~20 users |
| LOW-MEDIUM | Memory Leak OOM | 3 hours | Background jobs delayed |
| MEDIUM | Certificate Expiration | 45 min | All HTTPS failed |
| MEDIUM | K8s Pod CrashLoop | 30 min | Service degradation |
| MEDIUM-HIGH | ALB Target Health | 25 min | Traffic routing issues |
| MEDIUM-HIGH | Terraform State Lock | 1 hour | Deployments blocked |
| HIGH | DB Replication Lag | 45 min | Data inconsistency |
| HIGH | K8s Autoscaling Failure | 20 min | Service slowdown |
| HIGH | API Latency Spike | 15 min | 25x normal latency |
| VERY HIGH | Multi-Region Cascade | 2 hours | Complete outage |
| VERY HIGH | Compromised Credentials | 3 hours | Security breach |

## Development

### Running in Debug Mode

Flask debug mode is enabled by default in `app.py`:

```python
app.run(debug=True, port=5000)
```

This provides:
- Auto-reload on code changes
- Detailed error pages
- Debugger access

### Customizing Prompt Templates

Edit the `PROMPT_TEMPLATES` dictionary in `app.py` to customize or add new output formats.

## Limitations

- Requires Claude CLI to be installed and authenticated
- Uses subprocess to call Claude CLI (not the API)
- Development server only (not production-ready)
- 5-minute timeout on Claude responses
- No database storage (stateless)

## Future Enhancements

Potential improvements:
- [ ] Switch to Claude API for better performance
- [ ] Add database storage for generated reports
- [ ] Export to PDF and HTML formats
- [ ] Template customization UI
- [ ] Multiple incident batch processing
- [ ] Integration with Slack, PagerDuty APIs
- [ ] Historical incident analysis and trends

## License

This project is for educational purposes as part of the AI Builders Aberdeen Workshop.

## Contact

Built for Aberdeen AI Builders Workshop - October 9, 2025

For questions or feedback about this project, reach out via the AI Builders Aberdeen community.

## Acknowledgments

- Built with Flask and Claude AI
- Inspired by real-world SRE incident management challenges
- Created for the AI Builders Aberdeen community workshop
