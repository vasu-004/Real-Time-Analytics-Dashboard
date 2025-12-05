#!/bin/bash

# ============================================================================
# Create IAM Roles for Lambda Function
# ============================================================================

set -e

# Configuration
ROLE_NAME="lambda-kinesis-analytics-role"
AWS_REGION="us-east-1"

echo "========================================="
echo "Creating IAM Role for Lambda"
echo "========================================="
echo "Role Name: $ROLE_NAME"
echo "Region: $AWS_REGION"
echo ""

# Create trust policy document
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

echo "Created trust policy document"

# Check if role already exists
if aws iam get-role \
    --role-name "$ROLE_NAME" \
    --no-cli-pager 2>/dev/null; then
    
    echo "✅ Role '$ROLE_NAME' already exists"
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role \
        --role-name "$ROLE_NAME" \
        --query 'Role.Arn' \
        --output text \
        --no-cli-pager)
    
    echo "Role ARN: $ROLE_ARN"
else
    echo "Creating new IAM role..."
    
    # Create role
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://trust-policy.json \
        --description "Lambda execution role for Kinesis analytics processing" \
        --query 'Role.Arn' \
        --output text \
        --no-cli-pager)
    
    echo "✅ Role created successfully!"
    echo "Role ARN: $ROLE_ARN"
fi

# Create inline policy for Kinesis, DynamoDB, and CloudWatch Logs
cat > lambda-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kinesis:DescribeStream",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator",
        "kinesis:ListShards",
        "kinesis:ListStreams"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

echo ""
echo "Attaching inline policy to role..."

# Attach inline policy
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "LambdaKinesisAnalyticsPolicy" \
    --policy-document file://lambda-policy.json \
    --no-cli-pager

echo "✅ Inline policy attached"

# Attach AWS managed policy for Lambda basic execution
echo ""
echo "Attaching AWS managed policies..."

aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    --no-cli-pager

echo "✅ AWSLambdaBasicExecutionRole attached"

aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole" \
    --no-cli-pager

echo "✅ AWSLambdaKinesisExecutionRole attached"

# Wait for role to be available
echo ""
echo "⏳ Waiting for role to propagate (10 seconds)..."
sleep 10

# Save role ARN to file
echo "$ROLE_ARN" > lambda-role-arn.txt
echo ""
echo "✅ Role ARN saved to lambda-role-arn.txt"

# Clean up temporary files
rm -f trust-policy.json lambda-policy.json
echo "✅ Cleaned up temporary files"

echo ""
echo "========================================="
echo "IAM Role Setup Complete!"
echo "========================================="
