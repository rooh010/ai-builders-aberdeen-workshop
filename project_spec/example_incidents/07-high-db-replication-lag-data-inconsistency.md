# Incident: Database Replication Lag Causing Data Inconsistency

```
[14:23] @customer-support: getting reports that users see old data after making changes
[14:25] @casey: checking database replication lag
[14:27] @casey: replica lag is 45 seconds, that's really high
[14:29] @morgan: normal is <1 second, what's causing this?
[14:31] @casey: checking replica performance metrics
[14:33] @casey: replica CPU at 95%, IO wait very high
[14:35] @morgan: checking slow query logs on replica
[14:38] @morgan: seeing massive full table scans on orders table
[14:40] @casey: where are those coming from?
[14:42] @morgan: tracing queries... it's from the new analytics dashboard
[14:44] @casey: that launched yesterday, why is it hitting the replica so hard?
[14:46] @morgan: the dashboard auto-refreshes every 5 seconds
[14:48] @casey: and we have 200+ users with it open all day
[14:50] @morgan: so 40 expensive queries per second hammering the replica
[14:52] @casey: no wonder it can't keep up with replication
[14:55] @morgan: immediate fix: disable auto-refresh on dashboard
[14:57] @casey: need product team approval to push that change
[15:00] @product: approved, push the fix
[15:02] @morgan: deploying dashboard fix now
[15:05] @casey: deployment complete, dashboard no longer auto-refreshes
[15:10] @casey: replica CPU dropping... 75%... 60%
[15:15] @morgan: replication lag decreasing: 30 seconds
[15:20] @casey: lag at 15 seconds
[15:25] @morgan: lag at 5 seconds
[15:30] @casey: lag back to normal <1 second
[15:35] @morgan: but we still have data consistency issues to investigate
[15:40] @casey: checking for users who got inconsistent data
[15:45] @morgan: found 23 users who made updates during high lag period
[15:50] @casey: their updates were successful but reads showed old data for 30-45 seconds
[15:55] @morgan: any data corruption or lost writes?
[16:00] @casey: checking... all writes are in the database correctly
[16:05] @morgan: so just a temporary consistency issue, nothing lost
[16:10] @casey: correct, but we need better handling
[16:15] @morgan: options: route critical reads to primary, add staleness warnings, or cache
[16:20] @casey: let's do staleness detection for now
[16:25] @morgan: adding check to compare replica lag before reads
[16:40] @casey: also need to optimize those analytics queries
[16:50] @morgan: adding indexes and moving analytics to separate reporting DB
[17:00] @casey: creating architecture proposal for analytics separation
[17:15] @morgan: added monitoring for replica lag with alerts at 5 seconds
[17:30] @casey: documented incident, sending post-mortem in the morning
```
