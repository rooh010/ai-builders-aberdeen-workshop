# Incident: Terraform State Lock Causing Failed Deployments

```
[11:00] @quinn: trying to deploy to staging but terraform is locked
[11:02] @parker: i got the same error 10 minutes ago
[11:03] @quinn: Error: "state locked by user elliott, operation: OperationTypeApply"
[11:05] @parker: elliott's not online, he's on PTO today
[11:07] @quinn: checking when the lock was acquired... 2 hours ago
[11:09] @quinn: his CI job probably failed mid-apply
[11:10] @parker: can we force unlock?
[11:12] @quinn: we could but that's dangerous if his apply is still running
[11:15] @parker: checking CI history for elliott's last run
[11:18] @parker: found it - job failed at 09:15 with timeout error
[11:20] @quinn: so the lock should have been released but wasn't
[11:22] @parker: checking s3 backend... lock item still in dynamodb
[11:25] @quinn: this is blocking all deployments to staging
[11:27] @parker: i'll force unlock, the job definitely died
[11:30] @quinn: okay do it, we need to ship
[11:32] @parker: terraform force-unlock running
[11:33] @parker: Error: "context deadline exceeded"
[11:35] @quinn: what? the unlock is timing out?
[11:37] @parker: checking dynamodb directly
[11:40] @parker: dynamodb table is throttling! provisioned throughput exceeded
[11:42] @quinn: how is that possible?
[11:45] @parker: there are 47 concurrent terraform operations trying to acquire locks
[11:47] @quinn: from where? checking CI pipeline
[11:50] @quinn: found it - there's a CI job loop, retrying every minute
[11:52] @parker: which job?
[11:54] @quinn: automated dependency update job, it's been retrying for 2 hours
[11:56] @parker: killing that job now
[11:58] @quinn: job killed
[12:00] @parker: dynamodb throughput settling down
[12:05] @quinn: try the force-unlock again?
[12:07] @parker: running it... success! lock released
[12:10] @quinn: trying my deployment... it's working!
[12:15] @parker: we should increase dynamodb capacity or use on-demand pricing
[12:20] @quinn: also need to fix that CI retry loop
[12:30] @parker: creating tickets for both
[12:45] @quinn: also adding timeout alerts for CI jobs
[13:00] @parker: terraform applied, switching dynamodb to on-demand mode
```
