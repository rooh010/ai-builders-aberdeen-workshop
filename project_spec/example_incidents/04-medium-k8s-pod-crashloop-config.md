# Incident: Kubernetes Pod CrashLoopBackOff After Config Change

```
[10:15] @jamie: just deployed the new config to prod
[10:17] @riley: seeing pods restarting
[10:18] @jamie: oh no... they're in CrashLoopBackOff
[10:19] @riley: kubectl logs showing: "Error: Missing required env var: REDIS_URL"
[10:20] @jamie: but i added that to the configmap
[10:21] @riley: let me check... kubectl get configmap app-config -o yaml
[10:22] @riley: configmap has REDIS_URI not REDIS_URL
[10:23] @jamie: typo in my PR, facepalm
[10:24] @riley: should we rollback or fix forward?
[10:25] @jamie: fix forward, it's just one character
[10:26] @riley: updating configmap now
[10:28] @jamie: configmap updated but pods still crashing
[10:29] @riley: need to restart deployment to pick up new config
[10:30] @jamie: kubectl rollout restart deployment web-app
[10:32] @riley: pods coming up... 3/10 ready
[10:35] @jamie: 8/10 ready
[10:37] @riley: 10/10 ready, all passing health checks
[10:40] @jamie: traffic flowing normally
[10:42] @riley: adding validation to our CI to catch env var mismatches
[10:50] @jamie: PR up for validation check
```
