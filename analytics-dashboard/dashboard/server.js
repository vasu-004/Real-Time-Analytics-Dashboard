
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const AWS = require('aws-sdk');
const path = require('path');

// Configuration
const REGION = 'ap-south-1';
const TABLE_NAME = 'analytics-data';

// Initialize AWS DynamoDB Client
AWS.config.update({ region: REGION });
const docClient = new AWS.DynamoDB.DocumentClient();

// Setup Express and Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Helper to fetch latest data
async function getLatestData(partitionKey, limit = 1) {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'id = :pk',
        ExpressionAttributeValues: {
            ':pk': partitionKey
        },
        ScanIndexForward: false, // Descending order (newest first)
        Limit: limit
    };

    try {
        const data = await docClient.query(params).promise();
        return data.Items;
    } catch (err) {
        console.error(`Error fetching data for ${partitionKey}:`, err);
        return [];
    }
}

io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Send data every 2 seconds
    const interval = setInterval(async () => {
        const vmStats = await getLatestData('vm-server-01', 1);
        const appEvents = await getLatestData('global-app-events', 10);
        
        socket.emit('analytics_update', {
            vm: vmStats[0] || {},
            events: appEvents || []
        });
    }, 2000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Dashboard Server running on http://localhost:${PORT}`);
});
