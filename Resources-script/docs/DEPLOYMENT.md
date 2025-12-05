# 🚀 Deployment Guide

## Overview

This guide covers deploying the Real-Time Analytics Dashboard infrastructure on AWS.

## Architecture

```
┌─────────────────┐
│  Data Sources   │
│  (VM + WebApp)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Collectors │
│    (Python)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kinesis Stream  │◄─── Real-time ingestion
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lambda Function │◄─── Event processing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   DynamoDB      │◄─── Data storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │◄─── Visualization
└─────────────────┘
```

## Deployment Methods

### Method 1: One-Click Deployment (Recommended)

```bash
cd aws-infrastructure
./deploy-all.sh
```

This master script will:
1. Create Kinesis stream
2. Create DynamoDB table
3. Create IAM roles and policies
4. Deploy Lambda function with event source mapping

### Method 2: Manual Step-by-Step Deployment

#### Step 1: Create Kinesis Stream

```bash
./01-create-kinesis-stream.sh
```

**What it does:**
- Creates a Kinesis stream with 1 shard
- Waits for stream to become active
- Saves stream ARN to file

**Verification:**
```bash
aws kinesis describe-stream --stream-name real-time-analytics-stream
```

#### Step 2: Create DynamoDB Table

```bash
./02-create-dynamodb-table.sh
```

**What it does:**
- Creates DynamoDB table with on-demand billing
- Configures partition key (id) and sort key (timestamp)
- Enables DynamoDB Streams
- Enables Point-in-Time Recovery

**Verification:**
```bash
aws dynamodb describe-table --table-name analytics-data
```

#### Step 3: Create IAM Roles

```bash
./03-create-iam-roles.sh
```

**What it does:**
- Creates Lambda execution role
- Attaches Kinesis read permissions
- Attaches DynamoDB write permissions
- Attaches CloudWatch Logs permissions

**Verification:**
```bash
aws iam get-role --role-name lambda-kinesis-analytics-role
```

#### Step 4: Deploy Lambda Function

```bash
./04-create-lambda-function.sh
```

**What it does:**
- Installs Node.js dependencies
- Creates deployment package (ZIP)
- Uploads Lambda function
- Configures environment variables
- Creates Kinesis event source mapping

**Verification:**
```bash
aws lambda get-function --function-name kinesis-analytics-processor
```

## Post-Deployment Tasks

### 1. Verify Data Flow

**Start Data Collectors:**
```bash
# Terminal 1
cd ../data-collectors
python vm-metrics-collector.py

# Terminal 2
python webapp-metrics-collector.py
```

**Monitor Lambda Logs:**
```bash
aws logs tail /aws/lambda/kinesis-analytics-processor --follow
```

**Check DynamoDB Data:**
```bash
aws dynamodb scan --table-name analytics-data --max-items 10
```

### 2. Configure Dashboard

**For Demo Mode (No AWS credentials needed):**
```javascript
// dashboard/config.js
demoMode: true
```

**For Production (AWS credentials required):**
```javascript
// dashboard/config.js
demoMode: false,
credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY'
}
```

**⚠️ Production Security:** Use Cognito or API Gateway instead of hardcoded credentials!

### 3. Test Dashboard

```bash
cd ../dashboard
python -m http.server 8080
```

Open: http://localhost:8080

## Production Deployment

### Security Best Practices

1. **Use IAM Roles Instead of Access Keys**
   ```bash
   # For EC2 instances
   aws iam attach-role-policy \
       --role-name EC2-Analytics-Role \
       --policy-arn arn:aws:iam::aws:policy/AmazonKinesisFullAccess
   ```

2. **Enable CloudWatch Alarms**
   ```bash
   aws cloudwatch put-metric-alarm \
       --alarm-name high-lambda-errors \
       --metric-name Errors \
       --namespace AWS/Lambda \
       --statistic Sum \
       --period 300 \
       --threshold 10 \
       --comparison-operator GreaterThanThreshold
   ```

3. **Enable VPC for Lambda (Optional)**
   ```bash
   aws lambda update-function-configuration \
       --function-name kinesis-analytics-processor \
       --vpc-config SubnetIds=subnet-xxx,SecurityGroupIds=sg-xxx
   ```

4. **Enable Encryption**
   ```bash
   # Enable encryption for Kinesis
   aws kinesis start-stream-encryption \
       --stream-name real-time-analytics-stream \
       --encryption-type KMS \
       --key-id alias/aws/kinesis
   
   # Enable encryption for DynamoDB (at rest)
   aws dynamodb update-table \
       --table-name analytics-data \
       --sse-specification Enabled=true,SSEType=KMS
   ```

### Scaling Configuration

#### Kinesis Scaling

```bash
# Increase shard count for higher throughput
aws kinesis update-shard-count \
    --stream-name real-time-analytics-stream \
    --target-shard-count 2 \
    --scaling-type UNIFORM_SCALING
```

**Throughput per shard:**
- **Read:** 2 MB/sec, 5 transactions/sec
- **Write:** 1 MB/sec, 1000 records/sec

#### Lambda Scaling

```bash
# Configure reserved concurrency
aws lambda put-function-concurrency \
    --function-name kinesis-analytics-processor \
    --reserved-concurrent-executions 100

# Configure provisioned concurrency (for lower latency)
aws lambda put-provisioned-concurrency-config \
    --function-name kinesis-analytics-processor \
    --provisioned-concurrent-executions 10 \
    --qualifier LATEST
```

#### DynamoDB Scaling

```bash
# Switch to provisioned capacity mode
aws dynamodb update-table \
    --table-name analytics-data \
    --billing-mode PROVISIONED \
    --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
    --service-namespace dynamodb \
    --resource-id "table/analytics-data" \
    --scalable-dimension "dynamodb:table:WriteCapacityUnits" \
    --min-capacity 5 \
    --max-capacity 100
```

### Monitoring & Logging

#### Enable Enhanced CloudWatch Monitoring

```bash
# Lambda insights
aws lambda update-function-configuration \
    --function-name kinesis-analytics-processor \
    --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:14
```

#### Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
    --dashboard-name RealTimeAnalytics \
    --dashboard-body file://cloudwatch-dashboard.json
```

### Backup & Disaster Recovery

#### Enable Automated Backups

```bash
# DynamoDB continuous backups
aws dynamodb update-continuous-backups \
    --table-name analytics-data \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Create on-demand backup
aws dynamodb create-backup \
    --table-name analytics-data \
    --backup-name analytics-data-backup-$(date +%Y%m%d)
```

## Multi-Region Deployment

### Deploy to Additional Regions

```bash
# Set target region
export AWS_REGION=eu-west-1

# Deploy infrastructure
./deploy-all.sh
```

### Global Table Setup (DynamoDB)

```bash
# Create global table
aws dynamodb create-global-table \
    --global-table-name analytics-data-global \
    --replication-group RegionName=us-east-1 RegionName=eu-west-1
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Analytics Dashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy infrastructure
        run: |
          cd aws-infrastructure
          ./deploy-all.sh
```

## Cleanup

To remove all resources:

```bash
cd aws-infrastructure
./cleanup.sh
```

**⚠️ WARNING:** This will permanently delete all data!

## Cost Optimization

### Estimated Monthly Costs (Low Traffic)

| Service | Usage | Cost |
|---------|-------|------|
| Kinesis | 1 shard × 730 hours | $11 |
| Lambda | 1M requests, 256MB, 5s avg | $1.50 |
| DynamoDB | On-demand, 1M writes | $1.25 |
| CloudWatch | Standard logs | $2 |
| **Total** | | **~$16/month** |

### Cost Reduction Tips

1. **Use On-Demand Pricing for DynamoDB** (for low/variable traffic)
2. **Reduce Kinesis Retention** (default: 24 hours)
   ```bash
   aws kinesis decrease-stream-retention-period \
       --stream-name real-time-analytics-stream \
       --retention-period-hours 24
   ```

3. **Set CloudWatch Log Retention**
   ```bash
   aws logs put-retention-policy \
       --log-group-name /aws/lambda/kinesis-analytics-processor \
       --retention-in-days 7
   ```

4. **Use Lambda SnapStart** (for Java/Node.js performance optimization)

## Troubleshooting

### Deployment Fails

1. **Check IAM Permissions**
   ```bash
   aws iam get-user
   ```

2. **Verify AWS CLI Configuration**
   ```bash
   aws configure list
   ```

3. **Check Resource Limits**
   ```bash
   aws service-quotas list-service-quotas --service-code lambda
   ```

### Lambda Not Processing Records

1. **Check Event Source Mapping**
   ```bash
   aws lambda list-event-source-mappings \
       --function-name kinesis-analytics-processor
   ```

2. **Check Lambda Logs**
   ```bash
   aws logs tail /aws/lambda/kinesis-analytics-processor --follow
   ```

3. **Verify IAM Permissions**
   ```bash
   aws lambda get-function --function-name kinesis-analytics-processor
   ```

## Next Steps

- ✅ Set up CloudWatch alarms
- ✅ Configure auto-scaling
- ✅ Implement data retention policies
- ✅ Add custom metrics
- ✅ Set up CI/CD pipeline

---

**Questions?** Check the [Setup Guide](SETUP.md) or open an issue.
