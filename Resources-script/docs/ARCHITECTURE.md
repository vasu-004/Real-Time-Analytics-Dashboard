# 🏗️ Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                             │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │   VM Metrics     │           │  Web Application │           │
│  │                  │           │     Metrics      │           │
│  │  • CPU Usage     │           │  • Active Users  │           │
│  │  • Memory Usage  │           │  • Request Rate  │           │
│  │  • Disk I/O      │           │  • Response Time │           │
│  │  • Network       │           │  • Error Rate    │           │
│  └──────────────────┘           └──────────────────┘           │
└─────────────────────┬────────────────────┬──────────────────────┘
                      │                    │
                      ▼                    ▼
         ┌─────────────────────────────────────────┐
         │      Data Collectors (Python)           │
         │  • vm-metrics-collector.py              │
         │  • webapp-metrics-collector.py          │
         │  • Sends data every 10 seconds          │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │      AWS Kinesis Data Stream            │
         │  • Stream: real-time-analytics-stream   │
         │  • 1 MB/sec write capacity per shard    │
         │  • 24-hour data retention               │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │      AWS Lambda Function                │
         │  • Function: kinesis-analytics-processor│
         │  • Runtime: Node.js 14.x                │
         │  • Triggered by Kinesis events          │
         │  • Processes & enriches data            │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │      AWS DynamoDB Table                 │
         │  • Table: analytics-data                │
         │  • On-demand billing mode               │
         │  • Partition Key: id                    │
         │  • Sort Key: timestamp                  │
         │  • Point-in-Time Recovery enabled       │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────┐
         │      Web Dashboard (Browser)            │
         │  • Real-time data visualization         │
         │  • Chart.js for charts                  │
         │  • AWS SDK for data fetching            │
         │  • Auto-refresh every 5 seconds         │
         └─────────────────────────────────────────┘
```

## Component Details

### 1. Data Collectors

**Purpose:** Collect metrics from VM and web application

**Technology:** Python 3.8+

**Libraries:**
- `boto3` - AWS SDK for Python
- `psutil` - System monitoring
- `requests` - HTTP client

**Metrics Collected:**

**VM Metrics:**
- CPU: Usage %, per-core usage, frequency
- Memory: Total, used, available, swap
- Disk: Usage, read/write bytes, I/O counts
- Network: Bytes sent/received, packets, errors
- System: Hostname, platform, uptime

**Web App Metrics:**
- Active users count
- Requests per second
- Response time (ms)
- Error rate (%)
- Traffic sources (direct, organic, referral, social)

### 2. AWS Kinesis Stream

**Purpose:** Ingest real-time streaming data

**Configuration:**
- **Name:** `real-time-analytics-stream`
- **Shards:** 1 (scalable to N)
- **Retention:** 24 hours
- **Encryption:** Optional (KMS)

**Capacity per Shard:**
- **Write:** 1 MB/sec or 1,000 records/sec
- **Read:** 2 MB/sec or 5 transactions/sec

**Cost:** ~$0.015/hour per shard = ~$11/month

### 3. AWS Lambda Function

**Purpose:** Process Kinesis records and store in DynamoDB

**Configuration:**
- **Name:** `kinesis-analytics-processor`
- **Runtime:** Node.js 14.x
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **Concurrency:** Default (1000)

**IAM Permissions:**
- Read from Kinesis Stream
- Write to DynamoDB Table
- Write to CloudWatch Logs

**Processing Logic:**
1. Receive batch of records from Kinesis
2. Decode base64-encoded data
3. Parse JSON payload
4. Enrich with metadata
5. Write to DynamoDB
6. Return processing results

### 4. AWS DynamoDB

**Purpose:** Store processed analytics data

**Configuration:**
- **Name:** `analytics-data`
- **Billing:** On-demand (pay per request)
- **Partition Key:** `id` (String)
- **Sort Key:** `timestamp` (Number)

**Features Enabled:**
- DynamoDB Streams (for change capture)
- Point-in-Time Recovery (automated backups)
- Encryption at rest (AWS managed)

**Data Model:**
```json
{
  "id": "uuid-string",
  "timestamp": 1234567890123,
  "type": "vm-metrics | webapp-metrics",
  "source": "hostname or URL",
  "cpu": { ... },
  "memory": { ... },
  "usage": { ... },
  "performance": { ... }
}
```

### 5. Web Dashboard

**Purpose:** Visualize real-time analytics data

**Technology:**
- HTML5
- CSS3 (Glassmorphism design)
- Vanilla JavaScript
- Chart.js (charts)
- AWS SDK for JavaScript

**Features:**
- 📊 Real-time metric cards
- 📈 Live updating charts
- 🎨 Modern glassmorphic design
- 🌙 Dark mode
- ✨ Smooth animations
- 📱 Responsive layout

**Update Frequency:** 5 seconds (configurable)

## Data Flow

### Write Path (Data Ingestion)

```
1. Data Collector runs every 10 seconds
   ↓
2. Collects system/app metrics
   ↓
3. Formats data as JSON
   ↓
4. Sends to Kinesis via boto3
   ↓
5. Kinesis stores in shard buffer
   ↓
6. Lambda polls for new records
   ↓
7. Lambda processes batch (up to 100 records)
   ↓
8. Lambda writes to DynamoDB
   ↓
9. DynamoDB confirms write
   ↓
10. Data available for queries
```

**Latency:** ~1-3 seconds end-to-end

### Read Path (Dashboard Query)

```
1. Dashboard polls every 5 seconds
   ↓
2. Queries DynamoDB via AWS SDK
   ↓
3. DynamoDB returns latest records
   ↓
4. Dashboard processes data
   ↓
5. Updates metric cards
   ↓
6. Updates charts
   ↓
7. User sees real-time updates
```

**Latency:** < 1 second

## Scalability

### Horizontal Scaling

**Kinesis:**
- Add shards for higher throughput
- Each shard: +1 MB/sec write, +2 MB/sec read
- Auto-scaling available

**Lambda:**
- Auto-scales to 1000 concurrent executions (default)
- Can request higher limits
- Provisioned concurrency for consistent performance

**DynamoDB:**
- On-demand mode auto-scales
- Or use provisioned mode with auto-scaling
- Global Tables for multi-region deployment

### Vertical Scaling

**Lambda:**
- Increase memory (128 MB - 10 GB)
- CPU scales with memory

**DynamoDB:**
- Increase provisioned capacity
- Use DAX for caching (microsecond latency)

## High Availability

### Built-in HA Features

✅ **Kinesis:** Multi-AZ replication  
✅ **Lambda:** Multi-AZ execution  
✅ **DynamoDB:** Multi-AZ replication  
✅ **S3 (for Lambda code):** 99.999999999% durability  

### Disaster Recovery

**RTO (Recovery Time Objective):** < 1 hour  
**RPO (Recovery Point Objective):** < 5 minutes

**Backup Strategy:**
- DynamoDB Point-in-Time Recovery (35 days)
- Lambda code in S3 (version control)
- Infrastructure as Code (recreate easily)

## Security

### Authentication & Authorization

**Data Collectors:**
- Use IAM user/role credentials
- Least privilege permissions
- Rotate access keys regularly

**Lambda:**
- Execution role with specific permissions
- No public access

**DynamoDB:**
- Private VPC access (optional)
- IAM-based access control

### Encryption

**In Transit:**
- TLS 1.2+ for all AWS API calls
- HTTPS for dashboard

**At Rest:**
- DynamoDB: AWS managed encryption
- Kinesis: Optional KMS encryption
- Lambda code: S3 server-side encryption

### Network Security

**VPC Configuration (Optional):**
```
┌─────────────────────────────────┐
│           VPC                    │
│  ┌───────────────────────────┐  │
│  │  Private Subnet           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  Lambda Function    │  │  │
│  │  │  (No internet)      │  │  │
│  │  └─────────────────────┘  │  │
│  │                           │  │
│  │  VPC Endpoints:           │  │
│  │  • DynamoDB              │  │
│  │  • Kinesis               │  │
│  │  • CloudWatch Logs       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Monitoring

### CloudWatch Metrics

**Kinesis:**
- IncomingBytes
- IncomingRecords
- WriteProvisionedThroughputExceeded
- ReadProvisionedThroughputExceeded

**Lambda:**
- Invocations
- Errors
- Duration
- Throttles
- IteratorAge (for Kinesis)

**DynamoDB:**
- UserErrors
- SystemErrors
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits

### CloudWatch Logs

**Lambda Logs:**
```
/aws/lambda/kinesis-analytics-processor
```

**Log Retention:** 7 days (configurable to 1 day - 10 years)

### Alarms (Recommended)

1. **Lambda Errors > 10 in 5 minutes**
2. **Kinesis Iterator Age > 60 seconds**
3. **DynamoDB User Errors > 100 in 5 minutes**
4. **Lambda Throttles > 0**

## Cost Optimization

### Right-Sizing

**Kinesis:**
- Start with 1 shard
- Monitor IncomingBytes metric
- Add shards only when needed

**Lambda:**
- Use 256 MB memory (optimal for most workloads)
- Monitor Duration metric
- Increase only if timeout occurs

**DynamoDB:**
- Use On-Demand mode for variable traffic
- Switch to Provisioned mode for consistent high traffic
- Enable auto-scaling

### Cost Monitoring

**Set Budget Alerts:**
```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json
```

**Enable Cost Anomaly Detection**

---

## Performance Benchmarks

### Expected Throughput

| Component | Throughput | Latency |
|-----------|-----------|---------|
| Data Collector | 1 record/10s per collector | N/A |
| Kinesis | 1000 records/sec (per shard) | < 1s |
| Lambda | 100 records/batch | 100-500ms |
| DynamoDB | 40,000 read/write per sec (on-demand) | < 10ms |
| Dashboard | 1 query/5s | 100-300ms |

### Bottleneck Analysis

**Current bottleneck:** Data collection frequency (10s)

**To increase throughput:**
1. Reduce collection interval
2. Add more data collectors
3. Increase Kinesis shards

---

**For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**
