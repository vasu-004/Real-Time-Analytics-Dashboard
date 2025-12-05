const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to process Kinesis records and store in DynamoDB
 * Triggered by Kinesis stream for real-time analytics processing
 */
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const tableName = process.env.DYNAMODB_TABLE || 'analytics-data';
    const processedRecords = [];
    const failedRecords = [];

    for (const record of event.Records) {
        try {
            // Decode base64 Kinesis data
            const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
            const data = JSON.parse(payload);

            console.log('Processing record:', data);

            // Prepare DynamoDB item
            const item = {
                id: data.id || `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: data.timestamp || Date.now(),
                type: data.type,
                source: data.source || 'unknown',
                ...data
            };

            // Store in DynamoDB
            await dynamodb.put({
                TableName: tableName,
                Item: item
            }).promise();

            processedRecords.push({
                recordId: record.kinesis.sequenceNumber,
                status: 'success',
                data: item
            });

            console.log('Successfully processed record:', item.id);

        } catch (error) {
            console.error('Error processing record:', error);

            failedRecords.push({
                recordId: record.kinesis.sequenceNumber,
                status: 'failed',
                error: error.message
            });
        }
    }

    // Return processing results
    const response = {
        statusCode: 200,
        body: {
            message: 'Processing complete',
            processed: processedRecords.length,
            failed: failedRecords.length,
            totalRecords: event.Records.length,
            processedRecords: processedRecords,
            failedRecords: failedRecords
        }
    };

    console.log('Processing summary:', response.body);

    return response;
};
