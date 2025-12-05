#!/bin/bash

# ============================================================================
# Cleanup Script - Remove All AWS Resources
# ============================================================================

set -e

# Configuration
FUNCTION_NAME="kinesis-analytics-processor"
STREAM_NAME="real-time-analytics-stream"
TABLE_NAME="analytics-data"
ROLE_NAME="lambda-kinesis-analytics-role"
AWS_REGION="us-east-1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║             AWS Resources Cleanup                              ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

read -p "⚠️  This will DELETE all resources. Are you sure? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# 1. Delete Lambda Event Source Mappings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1/5: Removing Lambda Event Source Mappings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
MAPPINGS=$(aws lambda list-event-source-mappings \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query 'EventSourceMappings[].UUID' \
    --output text \
    --no-cli-pager 2>/dev/null || echo "")

if [ -n "$MAPPINGS" ]; then
    for uuid in $MAPPINGS; do
        echo "Deleting event source mapping: $uuid"
        aws lambda delete-event-source-mapping \
            --uuid "$uuid" \
            --region "$AWS_REGION" \
            --no-cli-pager || true
    done
    echo "✅ Event source mappings deleted"
else
    echo "No event source mappings found"
fi
echo ""

# 2. Delete Lambda Function
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2/5: Deleting Lambda Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    aws lambda delete-function \
        --function-name "$FUNCTION_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "✅ Lambda function deleted"
else
    echo "Lambda function not found"
fi
echo ""

# 3. Delete Kinesis Stream
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3/5: Deleting Kinesis Stream"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if aws kinesis describe-stream \
    --stream-name "$STREAM_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    aws kinesis delete-stream \
        --stream-name "$STREAM_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "✅ Kinesis stream deleted"
else
    echo "Kinesis stream not found"
fi
echo ""

# 4. Delete DynamoDB Table
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4/5: Deleting DynamoDB Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    aws dynamodb delete-table \
        --table-name "$TABLE_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "⏳ Waiting for table deletion..."
    aws dynamodb wait table-not-exists \
        --table-name "$TABLE_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "✅ DynamoDB table deleted"
else
    echo "DynamoDB table not found"
fi
echo ""

# 5. Delete IAM Role
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5/5: Deleting IAM Role"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if aws iam get-role \
    --role-name "$ROLE_NAME" \
    --no-cli-pager 2>/dev/null; then
    
    # Detach managed policies
    echo "Detaching managed policies..."
    aws iam detach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
        --no-cli-pager || true
    
    aws iam detach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole" \
        --no-cli-pager || true
    
    # Delete inline policies
    echo "Deleting inline policies..."
    aws iam delete-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "LambdaKinesisAnalyticsPolicy" \
        --no-cli-pager || true
    
    # Delete role
    aws iam delete-role \
        --role-name "$ROLE_NAME" \
        --no-cli-pager
    
    echo "✅ IAM role deleted"
else
    echo "IAM role not found"
fi
echo ""

# Clean up ARN files
echo "Cleaning up local files..."
rm -f kinesis-stream-arn.txt
rm -f dynamodb-table-arn.txt
rm -f lambda-role-arn.txt
rm -f lambda-function-arn.txt
echo "✅ Local files cleaned up"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               Cleanup Complete! ✅                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
