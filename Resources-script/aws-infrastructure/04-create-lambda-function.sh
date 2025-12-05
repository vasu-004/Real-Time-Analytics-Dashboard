#!/bin/bash

# ============================================================================
# Create and Deploy Lambda Function
# ============================================================================

set -e

# Configuration
FUNCTION_NAME="kinesis-analytics-processor"
RUNTIME="nodejs14.x"
HANDLER="index.handler"
AWS_REGION="us-east-1"
TABLE_NAME="analytics-data"
STREAM_NAME="real-time-analytics-stream"

echo "========================================="
echo "Creating Lambda Function"
echo "========================================="
echo "Function Name: $FUNCTION_NAME"
echo "Runtime: $RUNTIME"
echo "Region: $AWS_REGION"
echo ""

# Get role ARN
if [ -f "lambda-role-arn.txt" ]; then
    ROLE_ARN=$(cat lambda-role-arn.txt)
    echo "Using IAM Role: $ROLE_ARN"
else
    echo "❌ Error: lambda-role-arn.txt not found"
    echo "Please run 03-create-iam-roles.sh first"
    exit 1
fi

# Get Kinesis stream ARN
if [ -f "kinesis-stream-arn.txt" ]; then
    STREAM_ARN=$(cat kinesis-stream-arn.txt)
    echo "Using Kinesis Stream: $STREAM_ARN"
else
    echo "❌ Error: kinesis-stream-arn.txt not found"
    echo "Please run 01-create-kinesis-stream.sh first"
    exit 1
fi

# Create deployment package
echo ""
echo "Creating deployment package..."
cd ../lambda-functions/kinesis-processor

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Create ZIP file
zip -r ../deployment-package.zip . -x "*.git*" "*.DS_Store"

cd ../../aws-infrastructure
echo "✅ Deployment package created"

# Check if function already exists
if aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    echo ""
    echo "Function '$FUNCTION_NAME' already exists. Updating code..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://../lambda-functions/deployment-package.zip \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Function code updated"
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables={DYNAMODB_TABLE=$TABLE_NAME}" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Environment variables updated"
else
    echo ""
    echo "Creating new Lambda function..."
    
    # Create function
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://../lambda-functions/deployment-package.zip \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={DYNAMODB_TABLE=$TABLE_NAME}" \
        --description "Processes Kinesis analytics data and stores in DynamoDB" \
        --tags Project=RealTimeAnalytics,Environment=Production \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Function created successfully"
fi

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query 'Configuration.FunctionArn' \
    --output text \
    --no-cli-pager)

echo "Function ARN: $FUNCTION_ARN"

# Configure Kinesis event source mapping
echo ""
echo "Configuring Kinesis event source..."

# Check if event source mapping already exists
MAPPINGS=$(aws lambda list-event-source-mappings \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query 'EventSourceMappings[?EventSourceArn==`'"$STREAM_ARN"'`].UUID' \
    --output text \
    --no-cli-pager)

if [ -n "$MAPPINGS" ]; then
    echo "✅ Event source mapping already exists"
else
    echo "Creating event source mapping..."
    
    aws lambda create-event-source-mapping \
        --function-name "$FUNCTION_NAME" \
        --event-source-arn "$STREAM_ARN" \
        --starting-position LATEST \
        --batch-size 100 \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Event source mapping created"
fi

# Get function details
echo ""
echo "Function Details:"
aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query 'Configuration.{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,State:State}' \
    --output table \
    --no-cli-pager

# Save function ARN
echo "$FUNCTION_ARN" > lambda-function-arn.txt
echo ""
echo "✅ Function ARN saved to lambda-function-arn.txt"

echo ""
echo "========================================="
echo "Lambda Function Setup Complete!"
echo "========================================="
