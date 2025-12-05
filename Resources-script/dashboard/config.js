/**
 * Configuration for Real-Time Analytics Dashboard
 * AWS SDK and API endpoints
 */

const CONFIG = {
    // AWS Configuration
    aws: {
        region: 'us-east-1',
        dynamodbTable: 'analytics-data',

        // Credentials - Replace with your AWS credentials
        // For production, use Cognito or IAM role-based authentication
        credentials: {
            accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
            secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY'
        }
    },

    // Dashboard Configuration
    dashboard: {
        refreshInterval: 5000, // 5 seconds
        maxDataPoints: 20, // Maximum points to show in charts
        animationDuration: 300 // Chart animation duration (ms)
    },

    // Chart Colors
    colors: {
        cpu: '#667eea',
        memory: '#f093fb',
        requests: '#4facfe',
        response: '#fa709a',

        // Gradients
        cpuGradient: ['rgba(102, 126, 234, 0.8)', 'rgba(102, 126, 234, 0.2)'],
        memoryGradient: ['rgba(240, 147, 251, 0.8)', 'rgba(240, 147, 251, 0.2)'],
        requestsGradient: ['rgba(79, 172, 254, 0.8)', 'rgba(79, 172, 254, 0.2)'],
        responseGradient: ['rgba(250, 112, 154, 0.8)', 'rgba(250, 112, 154, 0.2)']
    },

    // Demo Mode (set to true to use simulated data without AWS)
    demoMode: true
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
