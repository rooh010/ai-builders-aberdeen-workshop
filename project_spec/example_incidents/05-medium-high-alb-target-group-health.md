# Incident: AWS ALB Target Group Health Check Misconfiguration

```
[15:30] @avery: deployed new version to prod, rolling out now
[15:35] @dakota: deployment looks stuck, only 2/20 pods are serving traffic
[15:36] @avery: checking ALB target group health
[15:37] @avery: seeing 18 targets marked unhealthy in target group
[15:38] @dakota: but pods are running and health checks passing in k8s
[15:40] @avery: ALB health check is hitting /health but getting 404s
[15:42] @dakota: wait... the new version changed the health endpoint to /healthz
[15:43] @avery: but terraform should have updated the target group health check
[15:45] @dakota: let me check the terraform... oh no
[15:46] @dakota: health check path is hardcoded in target group, not parameterized
[15:47] @avery: so the terraform apply succeeded but didn't update the path
[15:49] @dakota: correct, we need to update terraform and reapply
[15:52] @avery: or we could add /health endpoint back to the app
[15:54] @dakota: app change is faster, let me do that
[15:56] @dakota: adding alias route for /health -> /healthz
[15:58] @avery: how long for deployment?
[15:59] @dakota: building now... 2-3 minutes
[16:02] @dakota: new image pushed, updating deployment
[16:05] @avery: pods rolling out
[16:08] @avery: ALB seeing healthy targets! 8/20 healthy
[16:12] @dakota: 15/20 healthy
[16:15] @avery: 20/20 healthy, all green
[16:20] @dakota: traffic distribution looks normal
[16:25] @avery: no errors, latency normal
[16:30] @dakota: creating ticket to parameterize health check path in terraform
[16:45] @avery: PR up to fix terraform config
```
