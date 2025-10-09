# Incident: SSL Certificate Expiration

```
[02:03] PagerDuty: CRITICAL - SSL handshake failures - www.example.com
[02:05] @chris (on-call): checking the site... getting cert error in browser
[02:06] @chris: certificate expired at 02:00 UTC today
[02:07] @chris: how did we miss this? checking cert manager
[02:09] @chris: cert-manager shows certificate renewal failed 7 days ago
[02:10] @chris: error: "DNS challenge failed for route53"
[02:12] @morgan: i can help, let me check route53 permissions
[02:15] @morgan: found it - cert-manager IAM role lost route53 permissions in last terraform apply
[02:17] @chris: ugh, that terraform change from last week
[02:19] @morgan: fixing IAM policy now
[02:22] @morgan: policy updated, cert-manager should be able to renew now
[02:24] @chris: triggering manual cert renewal
[02:26] @chris: DNS challenge in progress
[02:30] @morgan: seeing new cert in ACM
[02:35] @chris: certificate renewed and propagated
[02:38] @morgan: ALB picked up new cert
[02:40] @chris: testing... site loads with valid cert
[02:45] @morgan: monitoring, all SSL handshakes successful
[02:48] @chris: adding alerts for cert expiry warnings at 30 days
```
