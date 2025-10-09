# Incident: API Latency Spike from Unindexed Database Query

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
