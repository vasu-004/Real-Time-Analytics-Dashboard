# 🎯 QUICK START GUIDE

## Try Demo Mode First (No AWS Required!)

The fastest way to see the dashboard in action:

### Windows Users

```powershell
cd e:\dhri-aws-project\Resources-script
.\quick-start.bat
```

### Linux/Mac Users

```bash
cd dashboard
python3 -m http.server 8080
```

Then open: **http://localhost:8080**

The dashboard will run in **DEMO MODE** with simulated real-time data!

---

## Deploy to AWS (Full Setup)

### Prerequisites Checklist

- [ ] AWS Account
- [ ] AWS CLI installed and configured
- [ ] Python 3.8+ installed
- [ ] Node.js 14+ installed
- [ ] Git Bash (Windows users)

### 3-Step Deployment

#### Step 1: Deploy AWS Infrastructure (3-5 minutes)

```bash
cd aws-infrastructure
./deploy-all.sh
```

#### Step 2: Start Data Collectors

```bash
# Terminal 1
cd data-collectors
pip install -r requirements.txt
python vm-metrics-collector.py

# Terminal 2 (new terminal)
python webapp-metrics-collector.py
```

#### Step 3: View Dashboard

```bash
cd dashboard
python -m http.server 8080
```

Open: **http://localhost:8080**

---

## 📊 What You'll See

### Dashboard Features

✨ **Real-Time Metrics**
- Active users count
- Requests per second
- CPU utilization %
- Memory usage %

📈 **Live Charts**
- CPU utilization trend
- Memory usage history
- Request rate visualization
- Response time tracking

📍 **System Information**
- VM hostname and platform
- System uptime
- Last update timestamp

🌐 **Traffic Analytics**
- Direct traffic
- Organic search
- Referral links
- Social media

---

## 🔧 Configuration

### Change AWS Region

Edit these files and update `AWS_REGION`:
- `aws-infrastructure/*.sh`
- `data-collectors/*.py`
- `dashboard/config.js`

### Adjust Collection Frequency

```python
# In data-collectors/*-collector.py
COLLECTION_INTERVAL = 10  # seconds
```

### Modify Dashboard Refresh Rate

```javascript
// In dashboard/config.js
refreshInterval: 5000  // milliseconds
```

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed installation instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment & scaling
- **[README](README.md)** - Project overview & architecture

---

## 💰 Cost Estimate

### Low Traffic (~1000 users/day)

| Service | Monthly Cost |
|---------|--------------|
| Kinesis (1 shard) | $11 |
| Lambda (1M requests) | $1.50 |
| DynamoDB (on-demand) | $1.25 |
| CloudWatch Logs | $2 |
| **Total** | **~$16/month** |

---

## 🆘 Troubleshooting

### Dashboard Shows No Data

**Solution:**
1. Enable demo mode in `dashboard/config.js`
2. Check that data collectors are running
3. Verify DynamoDB has data: `aws dynamodb scan --table-name analytics-data --max-items 5`

### AWS Permission Errors

**Solution:**
```bash
# Verify AWS configuration
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Scripts Won't Run on Windows

**Solution:**
- Use Git Bash or WSL
- Or manually run commands in PowerShell

---

## 🚀 Next Steps

After deployment:

1. ✅ Monitor CloudWatch logs
2. ✅ Set up CloudWatch alarms
3. ✅ Customize metrics for your app
4. ✅ Configure auto-scaling
5. ✅ Implement production security

---

## 🎓 Learn More

- **Kinesis:** [AWS Kinesis Docs](https://docs.aws.amazon.com/kinesis/)
- **Lambda:** [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- **DynamoDB:** [AWS DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)

---

## 💡 Pro Tips

- **Start with Demo Mode** before deploying to AWS
- **Monitor AWS Costs** using Cost Explorer
- **Use CloudWatch Alarms** for critical metrics
- **Never commit** AWS credentials to Git
- **Enable encryption** for production data

---

**Ready to deploy?** Run `quick-start.bat` (Windows) or open the dashboard directly!

**Need help?** Check the full [Setup Guide](docs/SETUP.md)
