### Project Specification: ###

Incident Summariser
with Post-Mortem Generator

Incident Summariser (with Post-Mortem Generator)
Transform incident logs and notes into professional summaries and reports

- **Output:** Executive summaries, technical post-mortems, RCA documents, lessons learned
- **Features:** Timeline reconstruction, impact analysis, root cause identification, action items
- **Templates:** Severity classifications, stakeholder communications, improvement recommendations
- **Example scenarios:** Service outages, data incidents, performance degradations, security events
- **Claude strength:** Log analysis, technical writing, pattern recognitio

At my job I am often dealing with incidents that involve large numbers of people and lots of back and forth messages, it
is often difficult to look back afterward and piece together what happened, what the impact was, what the root cause
was and what actions need to be taken based on lots of messy information in slack, zoom chats, pagerduty alerts and
notes. This tool would help to quickly summarise and create professional documents based on messy input.

## Tech to use

Python Flask backend

We can build the frontend in python flask also it can all be one application for this demo as it is just an MVP

Example of how to interact with claude cli is in /Users/Afay/personal/flask-claude-test in specific this implementation
flask-claude-streaming. We are doing it this way as I don't have an API key for this MVP, so we will directly call the
claude cli from python subprocess. Also, no prompt we use in this method should modify any files on disk, so we can run
this safely.

### Example Scenario ###

A typical SRE incident: API latency spike caused by an unindexed database query from a new dashboard feature.

5 Different Output Formats:

1. Executive Summary (1 page)

- Quick overview for leadership
- Impact, root cause, resolution in plain English
- Business impact assessment
- Perfect for stakeholder updates

2. Technical Post-Mortem (Detailed)

- Complete timeline with timestamps
- Root cause analysis (What, Why, Why it wasn't caught)
- Impact assessment (technical + business)
- Action items with owners and due dates
- Lessons learned (what went well, what to improve)
- Supporting data and metrics

3. Executive Communication Template

- Email-ready format for leadership
- Non-technical language
- Focus on customer impact and prevention
- Reassuring tone

4. Visual Timeline

- ASCII art timeline showing incident flow
- Detection → Diagnosis → Mitigation breakdown
- Great for presentations

5. Action Item Tracker

- Categorized by timeframe (immediate, short-term, medium-term, long-term)
- Checkbox format for tracking
- Owner assignments

  ---

How It Would Work:

INPUT: Paste messy Slack logs, PagerDuty alerts, raw notes
[14:23] @sarah: API latency spiking on prod
[14:24] @mike: seeing it too, p95 latency at 5s...

OUTPUT: Clean, professional documents in multiple formats

  ---
Build Complexity Options for Tonight:

Minimum Viable (1-2 hours):

- Text input → Single markdown output (executive summary)
- Basic timestamp extraction
- Simple formatting

Medium (2-3 hours) - we are going to do this one:

- Multiple output formats
- Timeline extraction
- Action item detection
- Export to markdown
- Web interface with text input

Ambitious (3-4 hours with Claude's help):

- Web interface with text input
- All 5 output formats
- Multiple export options (MD, PDF, HTML)
- Template customization
- Database storage of incidents

  ---