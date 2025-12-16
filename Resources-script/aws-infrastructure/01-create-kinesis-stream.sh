#!/bin/bash

# ============================================================================
# Create AWS Kinesis Stream for Real-Time Analytics
# ============================================================================

set -e

# Configuration
STREAM_NAME="real-time-analytics-stream"
SHARD_COUNT=1
AWS_REGION="ap-south-1"

echo "========================================="
echo "Creating Kinesis Stream"
echo "========================================="
echo "Stream Name: $STREAM_NAME"
echo "Shard Count: $SHARD_COUNT"
echo "Region: $AWS_REGION"
echo ""

# Check if stream already exists
if aws kinesis describe-stream \
    --stream-name "$STREAM_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null; then
    
    echo "✅ Stream '$STREAM_NAME' already exists"
    
    # Get stream ARN
    STREAM_ARN=$(aws kinesis describe-stream \
        --stream-name "$STREAM_NAME" \
        --region "$AWS_REGION" \
        --query 'StreamDescription.StreamARN' \
        --output text \
        --no-cli-pager)
    
    echo "Stream ARN: $STREAM_ARN"
else
    echo "Creating new Kinesis stream..."
    
    # Create stream
    aws kinesis create-stream \
        --stream-name "$STREAM_NAME" \
        --shard-count "$SHARD_COUNT" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "⏳ Waiting for stream to become active..."
    
    # Wait for stream to be active
    aws kinesis wait stream-exists \
        --stream-name "$STREAM_NAME" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    # Get stream ARN
    STREAM_ARN=$(aws kinesis describe-stream \
        --stream-name "$STREAM_NAME" \
        --region "$AWS_REGION" \
        --query 'StreamDescription.StreamARN' \
        --output text \
        --no-cli-pager)
    
    echo "✅ Stream created successfully!"
    echo "Stream ARN: $STREAM_ARN"
fi

# Get stream details
echo ""
echo "Stream Details:"
aws kinesis describe-stream \
    --stream-name "$STREAM_NAME" \
    --region "$AWS_REGION" \
    --query 'StreamDescription.{Name:StreamName,Status:StreamStatus,ShardCount:Shards|length(@),RetentionHours:RetentionPeriodHours}' \
    --output table \
    --no-cli-pager

# Save stream ARN to file for other scripts
echo "$STREAM_ARN" > kinesis-stream-arn.txt
echo ""
echo "✅ Stream ARN saved to kinesis-stream-arn.txt"
echo ""
echo "========================================="
echo "Kinesis Stream Setup Complete!"
echo "========================================="
