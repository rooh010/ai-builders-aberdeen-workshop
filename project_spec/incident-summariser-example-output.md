# Incident Summariser & Post-Mortem Generator - Example Output

**Date:** 2025-10-09
**Purpose:** Demo output for Mini Sprint project idea
**Based on:** `example_incidents/11-high-api-latency-unindexed-query.md`

---

## Example Input (Messy Incident Notes)

This is what you'd paste into the tool - raw notes, Slack messages, alerts, etc.

```
[14:23] @sarah: API latency spiking on prod
[14:24] @mike: seeing it too, p95 latency at 5s usually 200ms
[14:25] @sarah: checking DB connections
[14:27] PagerDuty alert: HIGH - API Response Time - api.production
[14:28] @mike: DB connection pool maxed out showing 100/100
[14:29] @sarah: looking at slow queries
[14:31] @sarah: found it - reporting query from new dashboard feature released this morning
[14:32] @mike: that query has no index on user_events table
[14:33] @sarah: killing slow queries now
[14:35] @mike: latency dropping back to normal
[14:36] @sarah: added read replica to config for reporting queries
[14:38] @mike: all metrics green, incident over
[14:45] @sarah: creating ticket to add index on user_events.created_at
[14:50] @mike: also need to review query before next release
```

---

## Output 1: Executive Summary

**INCIDENT SUMMARY**

**Incident ID:** INC-2025-10-09-001
**Date:** October 9, 2025
**Duration:** 15 minutes (14:23 - 14:38)
**Severity:** High
**Status:** Resolved

### Impact
Production API experienced elevated response times (5000ms vs normal 200ms) affecting all customer-facing services. Approximately 2,500 requests were impacted during the incident window.

### Root Cause
A new dashboard feature released in the morning deployment included an unoptimized database query without proper indexing, causing connection pool exhaustion.

### Resolution
- Terminated slow-running queries
- Routed reporting queries to read replica
- Restored normal service operations

### Follow-up Actions
- Database index creation scheduled
- Enhanced pre-deployment query review process

**Business Impact:** Moderate - temporary service degradation, no data loss, no customer escalations reported.

---

## Output 2: Technical Post-Mortem

# Post-Mortem: API Latency Incident - October 9, 2025

## Incident Overview

**Date:** October 9, 2025
**Time:** 14:23 - 14:38 UTC (15 minutes)
**Severity:** High
**Affected Service:** Production API (api.production)
**Impact:** Elevated API response times affecting all endpoints

## Timeline

| Time  | Event |
|-------|-------|
| 09:00 | New dashboard feature deployed to production |
| 14:23 | First observation of elevated API latency |
| 14:24 | P95 latency confirmed at 5000ms (baseline: 200ms) |
| 14:27 | PagerDuty alert triggered: HIGH - API Response Time |
| 14:28 | Database connection pool found at maximum capacity (100/100) |
| 14:31 | Root cause identified: Unindexed query from new dashboard |
| 14:33 | Slow queries terminated |
| 14:35 | Latency returning to normal levels |
| 14:36 | Read replica configured for reporting queries |
| 14:38 | All metrics restored to baseline - incident resolved |
| 14:45 | Remediation ticket created (index creation) |

## Root Cause Analysis

### What Happened
A new dashboard feature deployed in the morning introduced a reporting query that performed a full table scan on the `user_events` table due to missing index on the `created_at` column.

### Why It Happened
1. **Immediate cause:** Query executed without index on `user_events.created_at`
2. **Contributing factors:**
   - Pre-deployment query performance testing not conducted
   - Database query review not part of code review process
   - No automatic query plan analysis in CI/CD pipeline

### Why It Wasn't Caught
- Feature tested in staging environment with minimal data (< 1000 rows)
- Production table has > 10M rows, causing full table scan
- Load testing did not include the new dashboard endpoint

## Impact Assessment

### Technical Impact
- API P95 latency: 5000ms (25x normal)
- Database connection pool: 100% utilization
- Approximately 2,500 API requests affected
- No data loss or corruption

### Business Impact
- **Customer Impact:** Moderate - slow page loads for 15 minutes
- **Revenue Impact:** Minimal - no reported transaction failures
- **Reputation Impact:** Low - resolved before customer escalations

## Resolution

### Immediate Actions Taken
1. Identified and terminated slow-running queries
2. Routed reporting queries to read replica
3. Monitored system recovery to baseline

### Verification
- API latency returned to 200ms average
- Database connection pool returned to 40% utilization
- No error rate increase observed

## Action Items

| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| P0 | Add index on user_events.created_at | @sarah | 2025-10-10 | Scheduled |
| P1 | Implement query plan review in code review checklist | @mike | 2025-10-15 | Open |
| P1 | Add slow query monitoring with alerting | @sarah | 2025-10-16 | Open |
| P2 | Enhance staging environment with production-scale data | @mike | 2025-10-23 | Open |
| P2 | Add query performance testing to CI/CD pipeline | @sarah | 2025-10-30 | Open |

## Lessons Learned

### What Went Well
✅ Fast detection - team noticed issue within 1 minute
✅ Efficient troubleshooting - root cause identified in 8 minutes
✅ Quick mitigation - issue resolved in 15 minutes
✅ Good communication - clear updates throughout incident

### What Could Be Improved
❌ Pre-deployment query review process missing
❌ Staging environment doesn't reflect production data scale
❌ No automated query performance checks in CI/CD
❌ Dashboard feature should route to read replica by default

### Recommendations
1. **Short-term:** Implement manual query review checklist
2. **Medium-term:** Add automated query plan analysis to CI/CD
3. **Long-term:** Consider query performance SLOs with automated testing

## Supporting Data

### Metrics During Incident
```
API Response Time (P95):
14:23 - 5200ms
14:25 - 5400ms
14:30 - 4800ms
14:35 - 800ms
14:38 - 200ms (baseline restored)

Database Connection Pool:
14:28 - 100/100 (100%)
14:35 - 65/100 (65%)
14:38 - 40/100 (40% - normal)
```

### Slow Query Details
```sql
-- Problematic query
SELECT * FROM user_events
WHERE created_at >= '2025-10-01'
ORDER BY created_at DESC
LIMIT 1000;

-- Explain plan showed full table scan on 10M+ rows
-- Execution time: 4500ms average
```

---

## Output 3: Executive Communication Template

**Subject:** [RESOLVED] Brief API Performance Issue - October 9

**To:** Engineering Leadership, Product Team
**From:** SRE Team
**Date:** October 9, 2025

### Summary
We experienced a brief API performance degradation today lasting 15 minutes (2:23 PM - 2:38 PM). The issue was quickly identified and resolved with no data loss or customer escalations.

### What Happened
A database query from a new dashboard feature caused temporary API slowdowns due to missing database optimization.

### Customer Impact
- **Duration:** 15 minutes
- **Severity:** Moderate slowdowns, no outages
- **Scale:** All users experienced slower page loads
- **Escalations:** None reported

### Resolution
Our team identified the issue within 8 minutes and implemented an immediate fix. All systems returned to normal performance by 2:38 PM.

### Prevention
We're implementing additional database query review processes and automated performance checks to prevent similar issues.

### Questions?
Contact: SRE Team (@sarah, @mike)

---

## Output 4: Incident Timeline (Visual Format)

```
Incident Timeline - API Latency Incident
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

09:00 │ ⚙️  Deploy new dashboard feature
      │
      │ [5 hours normal operation]
      │
14:23 │ 🔴 Issue detected - high latency
14:24 │ 📊 Confirmed: P95 = 5000ms
14:27 │ 🚨 PagerDuty alert fired
14:28 │ 🔍 Investigation: DB pool maxed
14:31 │ 💡 Root cause found: unindexed query
14:33 │ 🛠️  Mitigation: Kill slow queries
14:35 │ 📈 Recovery: Latency improving
14:36 │ ⚡ Additional fix: Read replica
14:38 │ ✅ Resolved: Metrics at baseline
14:45 │ 📝 Follow-up: Ticket created
      │
      └─────────────────────────────────────────────

🔴 Detection: 0 min
🔍 Diagnosis: 8 min
🛠️  Mitigation: 7 min
━━━━━━━━━━━━━━━━━
Total: 15 minutes
```

---

## Output 5: Action Item Tracker

### Immediate Actions (Complete)
- [x] Terminate slow queries - @sarah - 14:33
- [x] Configure read replica routing - @sarah - 14:36
- [x] Verify service recovery - @mike - 14:38
- [x] Create incident ticket - @sarah - 14:45

### Short-term (< 1 week)
- [ ] Add index on user_events.created_at - @sarah - Due: Oct 10
- [ ] Create query review checklist - @mike - Due: Oct 15
- [ ] Implement slow query alerting - @sarah - Due: Oct 16

### Medium-term (1-4 weeks)
- [ ] Scale staging environment data - @mike - Due: Oct 23
- [ ] Add query perf testing to CI/CD - @sarah - Due: Oct 30

### Long-term (Future)
- [ ] Consider automatic query plan analysis
- [ ] Evaluate query performance SLO framework
- [ ] Review all dashboard queries for optimization

---

## How This Tool Would Work

### Input Options
1. **Paste raw text** - Slack logs, notes, alerts
2. **Upload files** - PagerDuty exports, monitoring graphs
3. **Structured form** - Fill in key fields (time, impact, actions)

### Output Formats
- Executive Summary (1 page)
- Technical Post-Mortem (detailed)
- Timeline (visual or table)
- Action Items (trackable list)
- Communication templates (email, Slack)

### Features
- Automatic timeline extraction from timestamps
- Severity classification
- Impact estimation
- Action item extraction
- Multiple export formats (Markdown, PDF, Confluence, Jira)

### AI Enhancements
- Summarize long chat logs into key events
- Extract action items automatically
- Suggest root cause categories
- Generate recommendations based on incident type
- Create follow-up questions for completeness

---

**This is what you could build tonight!**

Start simple: text input → formatted markdown output
Add complexity: timeline extraction, action items, multiple formats
