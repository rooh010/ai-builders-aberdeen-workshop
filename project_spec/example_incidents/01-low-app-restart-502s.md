# Incident: App Restart - 502 Errors

```
[09:15] @alex: getting reports of 502s on the checkout page
[09:16] @jordan: confirmed, seeing them in datadog too
[09:17] @alex: checking app server
[09:18] @alex: app process is hung, CPU at 100%
[09:19] @jordan: yeah seeing timeout errors in logs
[09:20] @alex: restarting the app now
[09:21] PagerDuty: CRITICAL - HTTP 502 rate elevated - checkout-app-prod
[09:22] @alex: app restarted, waiting for health checks
[09:23] @jordan: seeing successful requests coming through
[09:25] @alex: all green, 502s cleared
[09:26] @jordan: customers can checkout again
[09:28] @alex: will investigate what caused the hang, might be that memory leak we saw last week
```
