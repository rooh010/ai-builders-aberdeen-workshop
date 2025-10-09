# Incident: Memory Leak Leading to OOM Kill

```
[13:45] PagerDuty: WARNING - Memory usage >85% - api-server-01
[13:47] @sam: seeing memory climbing on api-server-01
[13:48] @taylor: yeah it's been creeping up all morning
[13:49] @sam: looking at heap dumps
[13:52] @taylor: memory at 92% now
[13:54] @sam: finding lots of event listeners not being cleaned up
[13:55] @sam: looks like websocket connections aren't closing properly
[13:56] PagerDuty: CRITICAL - api-server-01 OOM killed and restarted
[13:57] @taylor: server came back up but memory already at 45%
[13:58] @sam: need to deploy the fix asap
[14:00] @sam: found the leak - connection event listeners in ws handler
[14:02] @taylor: can we deploy now or wait for tonight?
[14:03] @sam: deploying fix now, it's just a 3 line change
[14:05] @sam: deployment started
[14:08] @taylor: new version deployed, watching memory
[14:10] @sam: memory stable at 35%, looking good
[14:12] @taylor: yep holding steady, leak is fixed
```
