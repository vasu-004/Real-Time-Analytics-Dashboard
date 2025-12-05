# 🎯 DASHBOARD PROMPT

## Project Description

Create a **Real-Time Analytics Dashboard** that collects data from a web application and VM, processes it through AWS Kinesis and Lambda, and visualizes it in a beautiful web dashboard.

---

## 📋 Requirements

### Functional Requirements

1. **Data Collection**
   - Collect VM metrics (CPU, Memory, Disk, Network) every 10 seconds
   - Collect web application metrics (Users, Requests, Response Time) every 10 seconds
   - Send data to AWS Kinesis stream

2. **Data Processing**
   - AWS Lambda function triggered by Kinesis events
   - Process and transform incoming data
   - Store processed data in DynamoDB

3. **Data Visualization**
   - Real-time web dashboard
   - Display metrics in cards (Active Users, Requests/sec, CPU, Memory)
   - Show live charts (CPU, Memory, Requests, Response Time)
   - Auto-refresh every 5 seconds

### Non-Functional Requirements

1. **Performance**
   - End-to-end latency < 3 seconds
   - Handle 1000 records/sec (per Kinesis shard)
   - Dashboard updates every 5 seconds

2. **Scalability**
   - Support horizontal scaling (add Kinesis shards)
   - Lambda auto-scaling
   - DynamoDB on-demand pricing

3. **Availability**
   - Multi-AZ deployment for all AWS services
   - Point-in-time recovery for DynamoDB
   - CloudWatch monitoring and alarms

4. **Security**
   - IAM role-based access
   - TLS encryption in transit
   - AWS managed encryption at rest

---

## 🎨 Design Requirements

### Dashboard Aesthetics

**Theme:** Modern, Premium, Dark Mode

**Design Style:**
- **Glassmorphism** - Frosted glass effect on cards
- **Gradients** - Vibrant purple, pink, blue, orange
- **Animations** - Smooth transitions and micro-interactions
- **Typography** - Inter font family
- **Colors:**
  - Background: Very dark navy (#0f0f23)
  - Cards: Dark with transparency and blur
  - Accents: Gradient colors (see below)

**Color Palette:**
```css
Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Secondary Gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
Tertiary Gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
Quaternary Gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%)
```

**Layout:**
1. Header with logo, title, connection status
2. 4 metric cards in a row
3. 4 charts in 2×2 grid
4. 2 info cards at bottom (System Info, Traffic Sources)

---

## 🏗️ Technical Specifications

### AWS Infrastructure

**1. Kinesis Stream**
- Name: `real-time-analytics-stream`
- Shards: 1 (scalable)
- Retention: 24 hours
- Region: us-east-1

**2. Lambda Function**
- Name: `kinesis-analytics-processor`
- Runtime: Node.js 14.x
- Memory: 256 MB
- Timeout: 30 seconds
- Trigger: Kinesis stream

**3. DynamoDB Table**
- Name: `analytics-data`
- Partition Key: `id` (String)
- Sort Key: `timestamp` (Number)
- Billing: On-demand
- Features: PITR, Streams enabled

**4. IAM Role**
- Name: `lambda-kinesis-analytics-role`
- Permissions:
  - Kinesis: Read
  - DynamoDB: Write
  - CloudWatch Logs: Write

### Data Collectors (Python)

**vm-metrics-collector.py**
- Collect CPU, Memory, Disk, Network metrics
- Use `psutil` library
- Send to Kinesis every 10 seconds
- Format as JSON

**webapp-metrics-collector.py**
- Collect Users, Requests, Response Time
- Check application health
- Send to Kinesis every 10 seconds
- Include simulated metrics for demo

### Web Dashboard

**Technologies:**
- HTML5 + CSS3 + Vanilla JavaScript
- Chart.js for visualization
- AWS SDK for JavaScript
- No frameworks (pure vanilla)

**Features:**
- Real-time metric cards with change indicators
- Live updating line charts
- System information display
- Traffic source breakdown
- Demo mode (no AWS required)
- Responsive design

---

## 📦 Deliverables

### 1. AWS Infrastructure Scripts
- `01-create-kinesis-stream.sh` - Create Kinesis stream
- `02-create-dynamodb-table.sh` - Create DynamoDB table
- `03-create-iam-roles.sh` - Create IAM roles
- `04-create-lambda-function.sh` - Deploy Lambda function
- `deploy-all.sh` - Master deployment script
- `cleanup.sh` - Remove all resources

### 2. Lambda Function
- `lambda-functions/kinesis-processor/index.js` - Main handler
- `lambda-functions/kinesis-processor/package.json` - Dependencies

### 3. Data Collectors
- `data-collectors/vm-metrics-collector.py` - VM metrics
- `data-collectors/webapp-metrics-collector.py` - Web app metrics
- `data-collectors/requirements.txt` - Python dependencies

### 4. Web Dashboard
- `dashboard/index.html` - Main page
- `dashboard/styles.css` - Premium styling
- `dashboard/dashboard.js` - Dashboard logic
- `dashboard/config.js` - AWS configuration

### 5. Documentation
- `README.md` - Project overview
- `QUICKSTART.md` - Quick start guide
- `docs/SETUP.md` - Detailed setup
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/ARCHITECTURE.md` - Architecture docs
- `PROJECT_SUMMARY.md` - Complete summary

### 6. Helper Scripts
- `quick-start.bat` - Windows quick start

---

## 🚀 Implementation Steps

### Phase 1: AWS Infrastructure (Scripts)
1. Create Kinesis stream with AWS CLI
2. Create DynamoDB table with on-demand billing
3. Create IAM roles with least privilege
4. Deploy Lambda function with event source mapping

### Phase 2: Data Collection (Python)
1. Implement VM metrics collector using psutil
2. Implement web app metrics collector
3. Add Kinesis integration with boto3
4. Test data flow to Kinesis

### Phase 3: Data Processing (Lambda)
1. Write Lambda function to process Kinesis records
2. Decode and parse JSON data
3. Store in DynamoDB
4. Add error handling and logging

### Phase 4: Dashboard (Web)
1. Create HTML structure with semantic elements
2. Design premium CSS with glassmorphism
3. Implement JavaScript for Chart.js integration
4. Add AWS SDK for DynamoDB queries
5. Implement real-time updates
6. Add demo mode for testing

### Phase 5: Documentation
1. Write comprehensive README
2. Create setup guide
3. Document deployment process
4. Add architecture diagrams
5. Include troubleshooting section

---

## 🎯 Success Criteria

The project is successful when:

✅ AWS infrastructure deploys without errors  
✅ Data collectors send metrics to Kinesis  
✅ Lambda function processes all records  
✅ DynamoDB stores data correctly  
✅ Dashboard displays real-time metrics  
✅ Charts update every 5 seconds  
✅ Design is premium and visually stunning  
✅ Demo mode works without AWS  
✅ Documentation is comprehensive  
✅ Project is production-ready  

---

## 💰 Cost Considerations

**Target:** < $20/month for low traffic

**Optimization:**
- Use 1 Kinesis shard initially
- On-demand DynamoDB billing
- 256 MB Lambda memory
- 7-day log retention

**Monitoring:**
- Set AWS budget alerts
- Monitor CloudWatch metrics
- Review costs weekly

---

## 🔒 Security Requirements

1. **Never hardcode AWS credentials**
2. Use IAM roles whenever possible
3. Enable encryption at rest and in transit
4. Implement least privilege access
5. Rotate access keys regularly
6. Use environment variables for secrets
7. Enable CloudWatch logging
8. Set up security alarms

---

## 📊 Data Model

### VM Metrics Record
```json
{
  "id": "uuid",
  "timestamp": 1234567890123,
  "type": "vm-metrics",
  "source": "hostname",
  "cpu": {
    "usage_percent": 45.2,
    "per_core": [40, 50, 45, 48]
  },
  "memory": {
    "usage_percent": 72.1,
    "used_gb": 11.5,
    "total_gb": 16.0
  },
  "disk": {
    "usage_percent": 45.0,
    "used_gb": 225,
    "total_gb": 500
  },
  "network": {
    "bytes_sent": 1234567,
    "bytes_recv": 7654321
  }
}
```

### Web App Metrics Record
```json
{
  "id": "uuid",
  "timestamp": 1234567890123,
  "type": "webapp-metrics",
  "source": "http://localhost:8000",
  "usage": {
    "active_users": 65,
    "requests_per_second": 32,
    "error_rate_percent": 0.5
  },
  "performance": {
    "response_time_ms": 245
  },
  "traffic_sources": {
    "direct": 35,
    "organic": 28,
    "referral": 22,
    "social": 15
  }
}
```

---

## 🎨 Dashboard Components

### Metric Cards (4)
1. **Active Users** - Purple gradient icon
2. **Requests/sec** - Pink gradient icon
3. **CPU Usage** - Blue gradient icon
4. **Memory Usage** - Orange gradient icon

Each card shows:
- Icon with gradient background
- Metric label
- Large value display
- Change indicator (↑/↓/—)
- Percentage/absolute change

### Charts (4)
1. **CPU Utilization** - Purple line chart (0-100%)
2. **Memory Utilization** - Pink line chart (0-100%)
3. **Request Rate** - Blue line chart (dynamic scale)
4. **Response Time** - Orange line chart (milliseconds)

Chart features:
- Gradient fill below line
- Smooth animations
- Last 20 data points
- Responsive sizing
- Tooltip on hover

### Info Cards (2)
1. **System Information**
   - Hostname
   - Platform
   - Uptime
   - Last update

2. **Traffic Sources**
   - Horizontal bar charts
   - Color-coded by source
   - Percentage display

---

## 📝 Additional Notes

### Demo Mode
- Dashboard works without AWS setup
- Generates simulated real-time data
- Perfect for testing and demos
- Enable via config: `demoMode: true`

### Production Considerations
- Use Cognito for dashboard auth
- Implement API Gateway + Lambda backend
- Enable VPC for Lambda (optional)
- Set up CloudWatch alarms
- Configure auto-scaling
- Implement data retention policies

### Performance Targets
- Dashboard load time: < 2 seconds
- Chart update latency: < 500ms
- Data ingestion latency: < 1 second
- End-to-end latency: < 3 seconds

---

## ✅ Final Checklist

Before deployment:

- [ ] AWS CLI configured
- [ ] IAM permissions verified
- [ ] Python dependencies installed
- [ ] Node.js installed for Lambda
- [ ] Git Bash available (Windows)
- [ ] AWS region configured
- [ ] Budget alerts set up
- [ ] Documentation reviewed

---

**This is a complete, production-ready real-time analytics dashboard project!**

**Use this prompt to recreate or understand the entire project.**
