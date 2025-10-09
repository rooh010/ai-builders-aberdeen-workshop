# Incident: Kubernetes Cluster Autoscaling Failure During Traffic Spike

```
[18:45] @marketing: heads up, email blast going out in 15 minutes, expect traffic spike
[18:50] @sre-team: acknowledged, monitoring dashboards ready
[19:00] @marketing: blast sent to 500k users
[19:02] @skyler: traffic ramping up, looking good so far
[19:05] @reese: seeing increased latency on api service
[19:07] @skyler: p95 latency at 800ms, usually 200ms
[19:09] @reese: HPA scaling up pods: 10 -> 15 -> 20
[19:11] @skyler: latency still climbing, 1200ms now
[19:13] @reese: HPA wants to scale to 30 pods but stuck at 20
[19:15] @skyler: checking node capacity... we're out of nodes
[19:17] @reese: cluster autoscaler should be adding nodes
[19:19] @skyler: checking autoscaler logs: "failed to increase node group size: scaling activity in progress"
[19:21] @reese: there's already a scaling operation running?
[19:23] @skyler: AWS console shows ASG scaling from 10 to 15 nodes
[19:25] @reese: how long has that been running?
[19:27] @skyler: started 12 minutes ago, still only showing 10 nodes
[19:29] @reese: EC2 console... there are nodes stuck in "pending" state
[19:31] @skyler: checking EC2 instance status... "Instance launch failed: InsufficientInstanceCapacity"
[19:33] @reese: AWS doesn't have capacity for our instance type in this AZ
[19:35] @skyler: we're using c5.2xlarge, let me check other instance types
[19:37] @reese: meanwhile latency is 2500ms and error rate climbing
[19:40] @skyler: can we modify the ASG to use multiple instance types?
[19:42] @reese: yes but need to update launch template and ASG config
[19:45] @skyler: doing it through console, no time for terraform
[19:48] @reese: what instance types should we add?
[19:50] @skyler: adding c5.2xlarge, c5a.2xlarge, c5n.2xlarge, m5.2xlarge
[19:53] @skyler: ASG updated with mixed instances policy
[19:55] @reese: triggering new scale up
[19:57] @skyler: seeing new instances launching... m5.2xlarge coming up
[20:00] @reese: 2 new nodes joined the cluster
[20:02] @skyler: cluster autoscaler recognizing new capacity
[20:05] @reese: pods scheduling on new nodes
[20:08] @skyler: 4 new nodes now, total 14
[20:10] @reese: HPA scaling pods: 20 -> 25 -> 28
[20:12] @skyler: latency starting to drop: 2000ms
[20:15] @reese: 5 new nodes, total 15
[20:18] @skyler: latency down to 1200ms
[20:22] @reese: all pods running, 30/30 ready
[20:25] @skyler: latency back to 400ms and dropping
[20:30] @reese: latency at 250ms, stabilizing
[20:35] @skyler: error rate back to baseline
[20:40] @reese: traffic still elevated but cluster handling it
[20:50] @skyler: need to update terraform with mixed instances policy
[21:00] @reese: also should pre-scale before known events
[21:15] @skyler: creating runbook for pre-scaling before marketing events
```
