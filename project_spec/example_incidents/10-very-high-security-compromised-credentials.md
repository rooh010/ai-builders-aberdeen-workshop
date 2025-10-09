# Incident: Security - Compromised AWS Credentials

```
[11:23] AWS GuardDuty Alert: "Unusual API call pattern detected for IAM user ci-deploy-user"
[11:25] @security-oncall: investigating GuardDuty alert
[11:27] @security-oncall: seeing API calls from IP in China, we don't operate there
[11:30] @security-oncall: SECURITY INCIDENT - compromised credentials, starting incident response
[11:32] @sre-lead: [joining] what's the scope?
[11:33] @security-oncall: IAM user ci-deploy-user making API calls from unauthorized IPs
[11:35] @sre-lead: that's our CI/CD deployment user, has broad permissions
[11:37] @security-oncall: calls include: ListBuckets, GetObject, DescribeInstances, DescribeDBInstances
[11:39] @sre-lead: they're enumerating our infrastructure
[11:40] @security-team-lead: [joining] IMMEDIATE ACTION: rotate credentials NOW
[11:42] @security-oncall: rotating IAM access keys for ci-deploy-user
[11:44] @sre-lead: this will break all active CI/CD pipelines
[11:45] @security-team-lead: acceptable, security takes priority
[11:47] @security-oncall: credentials rotated, old keys deactivated
[11:50] @security-oncall: monitoring... still seeing API calls
[11:52] @sre-lead: WHAT? we just rotated
[11:54] @security-oncall: checking CloudTrail... calls are using different credentials
[11:56] @security-team-lead: which credentials?
[11:58] @security-oncall: tracing... IAM role eks-node-role
[12:00] @sre-lead: that's our Kubernetes worker nodes role
[12:02] @security-team-lead: how did they get from CI user to node role?
[12:05] @security-oncall: checking assume-role calls in CloudTrail
[12:08] @security-oncall: found it - ci-deploy-user assumed eks-node-role at 10:45 this morning
[12:10] @sre-lead: before we detected the breach
[12:12] @security-team-lead: they're using temporary session credentials, still valid for hours
[12:15] @security-oncall: need to revoke all active sessions for eks-node-role
[12:17] @sre-lead: that will terminate sessions for ALL our K8s nodes
[12:19] @security-team-lead: no choice, do it
[12:22] @security-oncall: attaching policy to deny all for eks-node-role current sessions
[12:25] @sre-lead: pods starting to fail... nodes can't pull images or access AWS services
[12:27] @security-oncall: confirmed - attacker's API calls stopped
[12:30] @sre-lead: we need to recreate the node role and restart all nodes
[12:32] @infra-team: [joining] working on it
[12:35] @infra-team: creating new IAM role eks-node-role-v2
[12:40] @infra-team: updating EKS cluster to use new role
[12:45] @infra-team: rolling restart of all nodes
[12:50] @sre-lead: nodes coming up with new role
[12:55] @sre-lead: 15/50 nodes healthy
[13:05] @sre-lead: 30/50 nodes healthy
[13:15] @sre-lead: 45/50 nodes healthy
[13:25] @sre-lead: all nodes healthy, pods rescheduled
[13:30] @security-oncall: no more suspicious API calls detected
[13:35] @security-team-lead: starting forensics - what did they access?
[13:45] @security-oncall: analyzing CloudTrail logs from past 4 hours
[14:00] @security-oncall: they listed all S3 buckets
[14:05] @security-oncall: downloaded objects from: backups-bucket, config-bucket
[14:10] @security-team-lead: what's in those buckets?
[14:12] @infra-team: database backups and terraform state files
[14:15] @security-team-lead: potential data breach, escalating to legal and compliance
[14:20] @dba-team: checking backup contents... encrypted with KMS keys
[14:25] @dba-team: they got encrypted backups but shouldn't have KMS access
[14:30] @security-oncall: checking KMS calls... no decrypt operations
[14:35] @security-team-lead: good, they have encrypted blobs but can't decrypt
[14:40] @security-oncall: terraform state files are NOT encrypted
[14:42] @infra-team: state files contain database passwords and API keys
[14:45] @security-team-lead: CRITICAL - rotate ALL credentials in terraform state
[14:50] @infra-team: creating credential rotation plan
[15:00] @infra-team: rotating: DB passwords, API keys, service account tokens
[15:15] @dba-team: rotating RDS master passwords
[15:30] @backend-team: rotating application API keys
[15:45] @infra-team: rotating Kubernetes service account tokens
[16:00] @security-oncall: updated terraform state encryption to use S3 encryption
[16:15] @infra-team: all critical credentials rotated
[16:30] @security-team-lead: how did the initial credentials get compromised?
[16:45] @security-oncall: checking where ci-deploy-user credentials are used
[17:00] @security-oncall: credentials found in GitHub Actions secrets
[17:05] @security-oncall: also found in... CircleCI, and... oh no
[17:10] @security-oncall: found credentials in public GitHub repo - committed 2 weeks ago
[17:15] @security-team-lead: there it is, credentials leaked in git history
[17:20] @devops-team: that repo was supposed to be private
[17:25] @devops-team: checking... someone changed it to public 3 weeks ago
[17:30] @security-team-lead: well we found the root cause
[17:35] @security-oncall: need to scrub credentials from git history
[17:40] @devops-team: using git-filter-repo to remove sensitive files
[17:45] @devops-team: history cleaned, force pushed
[17:50] @security-team-lead: too late, already compromised
[17:55] @security-oncall: adding GitHub secret scanning and AWS credential monitoring
[18:00] @security-team-lead: preparing incident report for leadership
```
