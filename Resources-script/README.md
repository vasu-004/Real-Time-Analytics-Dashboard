# 🚀 Real-Time Analytics Dashboard with AWS Kinesis & Lambda

## 📋 Overview

This project implements a real-time analytics dashboard that collects data from your web application and VM, processes it through AWS Kinesis and Lambda, and visualizes it in a beautiful web dashboard.

## 🏗️ Architecture

```
Web App + VM → Data Collectors → Kinesis Stream → Lambda Function → DynamoDB → Web Dashboard
```

## 🎯 Components

### 1. AWS Infrastructure (AWS CLI)
- **Kinesis Stream**: Ingests real-time data
- **Lambda Function**: Processes and stores data
- **DynamoDB Table**: Stores analytics data
- **IAM Roles**: Manages permissions

### 2. Data Collectors
- **VM Metrics Collector**: CPU, Memory, Disk, Network
- **Web Application Collector**: Requests, Users, Performance

### 3. Web Dashboard
- Real-time data visualization
- Interactive charts and metrics
- Modern, premium design

## 📦 Project Structure

```
Resources-script/
├── aws-infrastructure/
│   ├── 01-create-kinesis-stream.sh       # Create Kinesis stream
│   ├── 02-create-dynamodb-table.sh       # Create DynamoDB table
│   ├── 03-create-iam-roles.sh            # Create IAM roles
│   ├── 04-create-lambda-function.sh      # Create Lambda function
│   ├── deploy-all.sh                     # Master deployment script
│   └── cleanup.sh                        # Cleanup resources
├── lambda-functions/
│   ├── kinesis-processor/
│   │   ├── index.js                      # Lambda function code
│   │   └── package.json
│   └── deployment-package.zip
├── data-collectors/
│   ├── vm-metrics-collector.py           # Collects VM metrics
│   ├── webapp-metrics-collector.py       # Collects web app metrics
│   └── requirements.txt
├── dashboard/
│   ├── index.html                        # Main dashboard
│   ├── styles.css                        # Premium styling
│   ├── dashboard.js                      # Dashboard logic
│   └── config.js                         # Configuration
├── docs/
│   ├── SETUP.md                          # Setup instructions
│   ├── DEPLOYMENT.md                     # Deployment guide
│   └── API.md                            # API documentation
└── README.md                             # This file
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI installed and configured
- AWS Account with appropriate permissions
- Python 3.8+ installed
- Node.js 14+ installed (for Lambda)
- boto3 library for Python

### 1. Deploy AWS Infrastructure

```bash
cd aws-infrastructure
chmod +x deploy-all.sh
./deploy-all.sh
```

### 2. Deploy Lambda Function

The Lambda function is automatically deployed by the `deploy-all.sh` script.

### 3. Start Data Collectors

```bash
cd data-collectors
pip install -r requirements.txt

# Start VM metrics collector
python vm-metrics-collector.py

# Start web app metrics collector (in another terminal)
python webapp-metrics-collector.py
```

### 4. Open Dashboard

```bash
cd dashboard
# Open index.html in your browser
# Or use a local server:
python -m http.server 8080
```

Then navigate to `http://localhost:8080`

## 🔧 Configuration

### AWS Region

Edit the region in all scripts (default: `us-east-1`):
```bash
AWS_REGION="us-east-1"
```

### Kinesis Stream Name

Default: `real-time-analytics-stream`

### DynamoDB Table Name

Default: `analytics-data`

### Data Collection Interval

Edit in collector scripts (default: 10 seconds)

## 📊 Dashboard Features

- 📈 Real-time CPU usage charts
- 💾 Memory utilization metrics
- 💽 Disk usage statistics
- 🌐 Network traffic monitoring
- 👥 Active users tracking
- 🔄 Request rate visualization
- ⚡ Application performance metrics
- 🎨 Modern, glassmorphic design
- 🌙 Dark mode by default
- ✨ Smooth animations

## 🔍 Monitoring

### Check Kinesis Stream Status

```bash
aws kinesis describe-stream --stream-name real-time-analytics-stream
```

### Check Lambda Function Logs

```bash
aws logs tail /aws/lambda/kinesis-analytics-processor --follow
```

### Query DynamoDB Data

```bash
aws dynamodb scan --table-name analytics-data --max-items 10
```

## 🧹 Cleanup

To remove all AWS resources:

```bash
cd aws-infrastructure
chmod +x cleanup.sh
./cleanup.sh
```

## 💰 Cost Estimation

- **Kinesis Stream**: ~$0.015 per shard-hour (~$11/month for 1 shard)
- **Lambda**: First 1M requests free, then $0.20 per 1M requests
- **DynamoDB**: On-demand pricing ~$1.25 per million write requests
- **Estimated Total**: ~$15-30/month for moderate usage

## 🛠️ Troubleshooting

### Data not appearing in dashboard

1. Check Kinesis stream is active
2. Verify Lambda function is triggered
3. Check CloudWatch logs for errors
4. Ensure data collectors are running

### Lambda function errors

1. Check IAM role permissions
2. Verify DynamoDB table exists
3. Review CloudWatch logs

### High costs

1. Reduce data collection frequency
2. Use DynamoDB provisioned capacity
3. Implement data retention policies

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License
