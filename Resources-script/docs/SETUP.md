# 📖 Setup Guide - Real-Time Analytics Dashboard

## Prerequisites

Before starting, ensure you have:

### Required Software
- ✅ **AWS CLI** (v2.0 or higher)
- ✅ **Python** (v3.8 or higher)
- ✅ **Node.js** (v14 or higher) - for Lambda function
- ✅ **Git Bash** or **WSL** (for Windows users to run bash scripts)

### AWS Account Requirements
- ✅ AWS Account with admin access
- ✅ AWS CLI configured with credentials
- ✅ Permissions for:
  - Kinesis
  - Lambda
  - DynamoDB
  - IAM
  - CloudWatch Logs

## ⚙️ AWS CLI Configuration

### 1. Install AWS CLI

**Windows (PowerShell):**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**
```bash
aws --version
```

### 2. Configure AWS Credentials

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your AWS access key
- **AWS Secret Access Key**: Your AWS secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

### 3. Verify Configuration

```bash
# Test AWS CLI
aws sts get-caller-identity

# This should return your AWS account details
```

## 🚀 Quick Setup (5 Minutes)

### Step 1: Navigate to Project Directory

```bash
cd e:/dhri-aws-project/Resources-script
```

### Step 2: Deploy AWS Infrastructure

```bash
cd aws-infrastructure
chmod +x deploy-all.sh
./deploy-all.sh
```

This script will:
1. ✅ Create Kinesis stream
2. ✅ Create DynamoDB table
3. ✅ Create IAM roles
4. ✅ Deploy Lambda function

**Expected time:** ~3-5 minutes

### Step 3: Install Python Dependencies

```bash
cd ../data-collectors
pip install -r requirements.txt
```

### Step 4: Start Data Collectors

**Terminal 1 - VM Metrics:**
```bash
python vm-metrics-collector.py
```

**Terminal 2 - Web App Metrics:**
```bash
python webapp-metrics-collector.py
```

### Step 5: Open Dashboard

```bash
cd ../dashboard

# Option 1: Open directly in browser
start index.html

# Option 2: Use Python HTTP server
python -m http.server 8080
# Then open: http://localhost:8080
```

## 🔧 Detailed Setup

### Configure AWS Region

If you want to use a different AWS region, edit these files:

**1. AWS Infrastructure Scripts:**
```bash
# Edit all scripts in aws-infrastructure/
# Change: AWS_REGION="us-east-1"
# To:     AWS_REGION="your-preferred-region"
```

**2. Data Collectors:**
```python
# Edit data-collectors/vm-metrics-collector.py
# Edit data-collectors/webapp-metrics-collector.py
# Change: AWS_REGION = "us-east-1"
# To:     AWS_REGION = "your-preferred-region"
```

**3. Dashboard Configuration:**
```javascript
// Edit dashboard/config.js
// Change: region: 'us-east-1'
// To:     region: 'your-preferred-region'
```

### Configure Collection Interval

Edit the collection interval in data collectors:

```python
# In vm-metrics-collector.py and webapp-metrics-collector.py
COLLECTION_INTERVAL = 10  # seconds (change to your preferred interval)
```

### Configure Dashboard Refresh

Edit dashboard refresh interval:

```javascript
// In dashboard/config.js
dashboard: {
    refreshInterval: 5000, // milliseconds (change to your preference)
    maxDataPoints: 20,     // number of points to show in charts
}
```

## 🔐 AWS Credentials for Dashboard

The dashboard needs AWS credentials to query DynamoDB. You have two options:

### Option 1: Demo Mode (Recommended for Testing)

No AWS credentials needed. The dashboard generates simulated data.

```javascript
// In dashboard/config.js
demoMode: true  // Use simulated data
```

### Option 2: Real AWS Data

**⚠️ SECURITY WARNING:** Never expose AWS credentials in client-side code in production!

For development/testing only:

```javascript
// In dashboard/config.js
demoMode: false,
credentials: {
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY'
}
```

**Production Solution:**
- Use **AWS Cognito** for user authentication
- Use **IAM roles** for temporary credentials
- Use **API Gateway + Lambda** as a backend proxy

## 📊 Verify Installation

### Check Kinesis Stream

```bash
aws kinesis describe-stream --stream-name real-time-analytics-stream
```

Expected output: Stream status should be `ACTIVE`

### Check DynamoDB Table

```bash
aws dynamodb describe-table --table-name analytics-data
```

Expected output: Table status should be `ACTIVE`

### Check Lambda Function

```bash
aws lambda get-function --function-name kinesis-analytics-processor
```

Expected output: Function state should be `Active`

### Check Data Flow

1. **Verify data collectors are sending data:**
   - Check console output for "✅ Data sent to Kinesis"

2. **Verify Lambda is processing data:**
   ```bash
   aws logs tail /aws/lambda/kinesis-analytics-processor --follow
   ```

3. **Verify data in DynamoDB:**
   ```bash
   aws dynamodb scan --table-name analytics-data --max-items 5
   ```

## 🔍 Troubleshooting

### AWS CLI Not Found

**Problem:** `aws: command not found`

**Solution:**
1. Install AWS CLI (see step 1)
2. Restart terminal
3. Add AWS CLI to PATH

### Permission Denied on Scripts

**Problem:** `Permission denied` when running scripts

**Solution:**
```bash
chmod +x aws-infrastructure/*.sh
```

### Kinesis Stream Creation Failed

**Problem:** `ResourceInUseException`

**Solution:** Stream already exists. Continue to next step.

### Lambda Function Error

**Problem:** Lambda logs show errors

**Solution:**
1. Check IAM role permissions
2. Verify DynamoDB table exists
3. Check Lambda function code

### Data Collectors Connection Error

**Problem:** `Unable to locate credentials`

**Solution:**
1. Run `aws configure`
2. Verify credentials with `aws sts get-caller-identity`
3. Ensure credentials have proper permissions

### Dashboard Shows No Data

**Solutions:**
1. **Enable Demo Mode:**
   ```javascript
   // In dashboard/config.js
   demoMode: true
   ```

2. **Check AWS Credentials:**
   - Verify credentials in `config.js`
   - Check browser console for errors

3. **Verify Data Flow:**
   - Ensure data collectors are running
   - Check DynamoDB has data

## 📦 Dependencies

### Python Dependencies
```
boto3>=1.26.0        # AWS SDK for Python
psutil>=5.9.0        # System metrics
requests>=2.28.0     # HTTP library
```

### Node.js Dependencies (Lambda)
```
aws-sdk@^2.1000.0    # AWS SDK for Node.js
```

### Browser Dependencies (Dashboard)
- Chart.js 4.4.0 (loaded via CDN)
- AWS SDK for JavaScript (loaded via CDN)

## 🎯 Next Steps

After setup is complete:

1. ✅ **Monitor the dashboard** - Open dashboard and verify real-time updates
2. ✅ **Check CloudWatch Logs** - Monitor Lambda function logs
3. ✅ **Customize metrics** - Edit collectors to add your own metrics
4. ✅ **Configure alerts** - Set up CloudWatch alarms
5. ✅ **Scale as needed** - Adjust Kinesis shards based on load

## 📚 Additional Resources

- [AWS Kinesis Documentation](https://docs.aws.amazon.com/kinesis/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

## 💡 Tips

- **Start with Demo Mode** - Test dashboard without AWS setup
- **Monitor Costs** - Use AWS Cost Explorer to track expenses
- **Implement Alerts** - Set up CloudWatch alarms for anomalies
- **Backup Data** - Enable DynamoDB Point-in-Time Recovery
- **Security First** - Never commit AWS credentials to Git

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or create an issue.
