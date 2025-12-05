#!/bin/bash

# ============================================================================
# Master Deployment Script for Real-Time Analytics Infrastructure
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║        Real-Time Analytics Dashboard Deployment                ║"
echo "║        AWS Kinesis + Lambda + DynamoDB                         ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
AWS_REGION="us-east-1"

echo "Deployment Configuration:"
echo "  Region: $AWS_REGION"
echo ""

# Step 1: Create Kinesis Stream
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/5: Creating Kinesis Stream"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
chmod +x 01-create-kinesis-stream.sh
./01-create-kinesis-stream.sh
echo ""

# Step 2: Create DynamoDB Table
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/5: Creating DynamoDB Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
chmod +x 02-create-dynamodb-table.sh
./02-create-dynamodb-table.sh
echo ""

# Step 3: Create IAM Roles
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/5: Creating IAM Roles and Policies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
chmod +x 03-create-iam-roles.sh
./03-create-iam-roles.sh
echo ""

# Step 4: Create Lambda Function
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4/5: Creating and Deploying Lambda Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
chmod +x 04-create-lambda-function.sh
./04-create-lambda-function.sh
echo ""

# Step 5: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5/5: Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ AWS Infrastructure Deployed Successfully!"
echo ""
echo "Resources Created:"
echo "  ✓ Kinesis Stream: real-time-analytics-stream"
echo "  ✓ DynamoDB Table: analytics-data"
echo "  ✓ IAM Role: lambda-kinesis-analytics-role"
echo "  ✓ Lambda Function: kinesis-analytics-processor"
echo ""
echo "Resource ARNs saved to:"
echo "  • kinesis-stream-arn.txt"
echo "  • dynamodb-table-arn.txt"
echo "  • lambda-role-arn.txt"
echo "  • lambda-function-arn.txt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Install Python dependencies:"
echo "   cd ../data-collectors"
echo "   pip install -r requirements.txt"
echo ""
echo "2. Start data collectors:"
echo "   python vm-metrics-collector.py"
echo "   python webapp-metrics-collector.py"
echo ""
echo "3. Open the dashboard:"
echo "   cd ../dashboard"
echo "   python -m http.server 8080"
echo "   # Then open http://localhost:8080 in your browser"
echo ""
echo "4. Monitor Lambda logs:"
echo "   aws logs tail /aws/lambda/kinesis-analytics-processor --follow"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               Deployment Complete! 🚀                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
