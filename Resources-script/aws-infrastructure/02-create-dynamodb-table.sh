#!/bin/bash

# ============================================================================
# Create DynamoDB Table for Analytics Data Storage
# ============================================================================

set -e

# Configuration
TABLE_NAME="analytics-data"
AWS_REGION="us-east-1"

echo "========================================="
echo "Creating DynamoDB Table"
echo "========================================="
echo "Table Name: $TABLE_NAME"
echo "Region: $AWS_REGION"
echo ""

# Check if table already exists
if aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    echo "✅ Table '$TABLE_NAME' already exists"
    
    # Get table ARN
    TABLE_ARN=$(aws dynamodb describe-table \
        --table-name "$TABLE_NAME" \
        --region "$AWS_REGION" \
        --query 'Table.TableArn' \
        --output text \
        --no-cli-pager)
    
    echo "Table ARN: $TABLE_ARN"
else
    echo "Creating new DynamoDB table..."
    
    # Create table with on-demand billing
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=timestamp,AttributeType=N \
        --key-schema \
            AttributeName=id,KeyType=HASH \
            AttributeName=timestamp,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
        --tags \
            Key=Project,Value=RealTimeAnalytics \
            Key=Environment,Value=Production \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "⏳ Waiting for table to be active..."
    
    # Wait for table to be active
    aws dynamodb wait table-exists \
        --table-name "$TABLE_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    # Get table ARN
    TABLE_ARN=$(aws dynamodb describe-table \
        --table-name "$TABLE_NAME" \
        --region "$AWS_REGION" \
        --query 'Table.TableArn' \
        --output text \
        --no-cli-pager)
    
    echo "✅ Table created successfully!"
    echo "Table ARN: $TABLE_ARN"
fi

# Get table details
echo ""
echo "Table Details:"
aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount,BillingMode:BillingModeSummary.BillingMode}' \
    --output table \
    --no-cli-pager

# Enable Point-in-Time Recovery (PITR) for data protection
echo ""
echo "Enabling Point-in-Time Recovery..."
aws dynamodb update-continuous-backups \
    --table-name "$TABLE_NAME" \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

echo "✅ Point-in-Time Recovery enabled"

# Save table ARN to file
echo "$TABLE_ARN" > dynamodb-table-arn.txt
echo ""
echo "✅ Table ARN saved to dynamodb-table-arn.txt"
echo ""
echo "========================================="
echo "DynamoDB Table Setup Complete!"
echo "========================================="
