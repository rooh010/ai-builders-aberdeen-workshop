# Incident: Multi-Region AWS Cascading Failure

```
[02:15] CloudWatch Alarm: CRITICAL - us-east-1 ALB unhealthy targets >80%
[02:16] @oncall-primary: investigating us-east-1 region issues
[02:18] @oncall-primary: RDS primary showing high connection count, maxed out
[02:20] @oncall-secondary: also seeing elevated latency in eu-west-1
[02:22] @oncall-primary: us-east-1 connection pool: 500/500 connections used
[02:24] @oncall-secondary: is there a DDoS? checking WAF
[02:26] @oncall-primary: WAF shows normal traffic patterns, no spike
[02:28] @oncall-primary: checking application logs... seeing slow queries
[02:30] @oncall-secondary: eu-west-1 RDS read replica lag at 120 seconds
[02:32] @oncall-primary: same query running thousands of times: SELECT * FROM sessions WHERE expires_at < NOW()
[02:34] @oncall-secondary: that's the session cleanup job, runs every minute
[02:36] @oncall-primary: sessions table has 50 million rows, job is overwhelmed
[02:38] @oncall-secondary: why so many sessions?
[02:40] @oncall-primary: checking... session expiry job hasn't completed in 3 days
[02:42] @oncall-primary: each run times out before completing, leaving more expired sessions
[02:45] @oncall-secondary: vicious cycle, table growing faster than we can clean it
[02:47] @oncall-primary: and now it's taking down all DB connections
[02:50] @sre-lead: [joining] full incident response, start war room
[02:52] @sre-lead: immediate action: kill the cleanup job in all regions
[02:54] @oncall-primary: killing cron job in us-east-1
[02:55] @oncall-secondary: killed in eu-west-1
[02:56] @oncall-asia: killed in ap-southeast-1
[02:58] @oncall-primary: connection count dropping: 450/500
[03:00] @sre-lead: us-east-1 still critical, need to free up connections faster
[03:02] @dba-oncall: [joining] can terminate long-running queries
[03:05] @dba-oncall: identified 200+ queries running >5 minutes, terminating
[03:08] @oncall-primary: connection count: 280/500
[03:10] @oncall-secondary: eu-west-1 recovering, latency improving
[03:12] @oncall-asia: ap-southeast-1 stable now
[03:15] @oncall-primary: us-east-1 connection count: 150/500
[03:18] @sre-lead: health checks starting to pass
[03:20] @oncall-primary: ALB unhealthy targets: 45%
[03:25] @oncall-primary: unhealthy targets: 20%
[03:30] @sre-lead: us-east-1 stabilized, all regions green
[03:35] @dba-oncall: now we need to clean up 50M expired sessions without taking down the DB
[03:40] @sre-lead: we'll do it in small batches with delays
[03:45] @dba-oncall: wrote script to delete 10k sessions every 30 seconds
[03:50] @dba-oncall: starting cleanup script with heavy monitoring
[03:55] @oncall-primary: DB load increasing slightly but manageable
[04:00] @dba-oncall: 500k sessions deleted so far, DB stable
[04:15] @dba-oncall: 2M sessions deleted, continuing
[04:30] @sre-lead: this will take hours, let's handle in business hours
[04:35] @sre-lead: pausing cleanup script, resuming at 08:00
[04:40] @oncall-primary: verifying all services stable
[04:45] @oncall-secondary: all regions healthy, latency normal
[04:50] @sre-lead: incident contained, cleanup continues tomorrow
[05:00] @sre-lead: writing up timeline for post-mortem
[08:00] @dba-team: resuming session cleanup
[09:30] @dba-team: 10M sessions cleaned up
[11:00] @dba-team: 25M sessions cleaned up
[13:30] @dba-team: cleanup complete, 48M expired sessions removed
[14:00] @backend-team: implemented new indexed-based cleanup strategy
[14:30] @backend-team: added monitoring for session table size
[15:00] @sre-lead: deploying improved cleanup job with batching
[15:30] @backend-team: new cleanup job tested and deployed to all regions
[16:00] @sre-lead: full post-mortem scheduled for tomorrow
```
