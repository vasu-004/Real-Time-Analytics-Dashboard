/**
 * Real-Time Analytics Dashboard
 * Fetches data from DynamoDB and updates charts in real-time
 */

class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.data = {
            cpu: [],
            memory: [],
            requests: [],
            response: []
        };
        this.previousMetrics = {};

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Analytics Dashboard...');

        // Initialize AWS SDK if not in demo mode
        if (!CONFIG.demoMode) {
            this.initAWS();
        }

        // Initialize charts
        this.initCharts();

        // Start data refresh
        this.startDataRefresh();

        // Setup event listeners
        this.setupEventListeners();

        // Update connection status
        this.updateConnectionStatus('connected');

        console.log('✅ Dashboard initialized successfully!');
    }

    initAWS() {
        // Configure AWS SDK
        AWS.config.update({
            region: CONFIG.aws.region,
            credentials: new AWS.Credentials({
                accessKeyId: CONFIG.aws.credentials.accessKeyId,
                secretAccessKey: CONFIG.aws.credentials.secretAccessKey
            })
        });

        // Initialize DynamoDB client
        this.dynamodb = new AWS.DynamoDB.DocumentClient();

        console.log('AWS SDK configured');
    }

    initCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0b8',
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0b8',
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            },
            animation: {
                duration: CONFIG.dashboard.animationDuration
            }
        };

        // CPU Chart
        this.charts.cpu = new Chart(document.getElementById('cpu-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage %',
                    data: [],
                    borderColor: CONFIG.colors.cpu,
                    backgroundColor: this.createGradient('cpu-chart', CONFIG.colors.cpuGradient),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    ...chartOptions.scales,
                    y: {
                        ...chartOptions.scales.y,
                        max: 100
                    }
                }
            }
        });

        // Memory Chart
        this.charts.memory = new Chart(document.getElementById('memory-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Memory Usage %',
                    data: [],
                    borderColor: CONFIG.colors.memory,
                    backgroundColor: this.createGradient('memory-chart', CONFIG.colors.memoryGradient),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    ...chartOptions.scales,
                    y: {
                        ...chartOptions.scales.y,
                        max: 100
                    }
                }
            }
        });

        // Requests Chart
        this.charts.requests = new Chart(document.getElementById('requests-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Requests/sec',
                    data: [],
                    borderColor: CONFIG.colors.requests,
                    backgroundColor: this.createGradient('requests-chart', CONFIG.colors.requestsGradient),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: chartOptions
        });

        // Response Time Chart
        this.charts.response = new Chart(document.getElementById('response-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [],
                    borderColor: CONFIG.colors.response,
                    backgroundColor: this.createGradient('response-chart', CONFIG.colors.responseGradient),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: chartOptions
        });

        console.log('Charts initialized');
    }

    createGradient(canvasId, colors) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        return gradient;
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.fetchData();
        });
    }

    startDataRefresh() {
        // Initial fetch
        this.fetchData();

        // Set up periodic refresh
        setInterval(() => {
            this.fetchData();
        }, CONFIG.dashboard.refreshInterval);
    }

    async fetchData() {
        if (CONFIG.demoMode) {
            this.fetchDemoData();
        } else {
            await this.fetchRealData();
        }
    }

    async fetchRealData() {
        try {
            // Query DynamoDB for latest records
            const params = {
                TableName: CONFIG.aws.dynamodbTable,
                Limit: 10,
                ScanIndexForward: false // Sort by timestamp descending
            };

            const result = await this.dynamodb.scan(params).promise();

            if (result.Items && result.Items.length > 0) {
                // Process VM metrics
                const vmMetrics = result.Items.filter(item => item.type === 'vm-metrics')[0];
                const webappMetrics = result.Items.filter(item => item.type === 'webapp-metrics')[0];

                if (vmMetrics) {
                    this.updateDashboard(vmMetrics, webappMetrics);
                }
            }
        } catch (error) {
            console.error('Error fetching data from DynamoDB:', error);
            this.updateConnectionStatus('error');
        }
    }

    fetchDemoData() {
        // Generate simulated data
        const vmMetrics = {
            timestamp: Date.now(),
            type: 'vm-metrics',
            system_info: {
                hostname: 'web-server-01',
                platform: 'Windows',
                uptime_hours: 72.5
            },
            cpu: {
                usage_percent: 45 + Math.random() * 30
            },
            memory: {
                usage_percent: 60 + Math.random() * 20,
                used_gb: 6.4,
                total_gb: 16
            },
            disk: {
                usage_percent: 45,
                used_gb: 225,
                total_gb: 500
            }
        };

        const webappMetrics = {
            timestamp: Date.now(),
            type: 'webapp-metrics',
            usage: {
                active_users: Math.floor(50 + Math.random() * 30),
                requests_per_second: Math.floor(20 + Math.random() * 20),
                error_rate_percent: (Math.random() * 2).toFixed(2),
                avg_page_load_ms: 300 + Math.random() * 400,
                traffic_sources: {
                    direct: Math.floor(20 + Math.random() * 20),
                    organic: Math.floor(15 + Math.random() * 20),
                    referral: Math.floor(10 + Math.random() * 15),
                    social: Math.floor(5 + Math.random() * 10)
                }
            },
            performance: {
                current_response_time_ms: 150 + Math.random() * 200
            }
        };

        this.updateDashboard(vmMetrics, webappMetrics);
    }

    updateDashboard(vmMetrics, webappMetrics) {
        if (!vmMetrics || !webappMetrics) return;

        const timestamp = new Date().toLocaleTimeString();

        // Update metric cards
        this.updateMetricCard('active-users', webappMetrics.usage.active_users, 'users');
        this.updateMetricCard('requests', webappMetrics.usage.requests_per_second, 'req/s');
        this.updateMetricCard('cpu', vmMetrics.cpu.usage_percent.toFixed(1), '%');
        this.updateMetricCard('memory', vmMetrics.memory.usage_percent.toFixed(1), '%');

        // Update charts
        this.updateChart('cpu', timestamp, vmMetrics.cpu.usage_percent);
        this.updateChart('memory', timestamp, vmMetrics.memory.usage_percent);
        this.updateChart('requests', timestamp, webappMetrics.usage.requests_per_second);
        this.updateChart('response', timestamp, webappMetrics.performance.current_response_time_ms);

        // Update system info
        this.updateSystemInfo(vmMetrics);

        // Update traffic sources
        this.updateTrafficSources(webappMetrics.usage.traffic_sources);

        // Update last update time
        document.getElementById('last-update').textContent = new Date().toLocaleString();
    }

    updateMetricCard(id, value, unit) {
        const valueElement = document.getElementById(`${id}-value`);
        const changeElement = document.getElementById(`${id}-change`);

        if (!valueElement) return;

        // Format value based on type
        let displayValue = value;
        if (unit === '%') {
            displayValue = `${value}${unit}`;
        } else if (unit === 'users' || unit === 'req/s') {
            displayValue = Math.round(value);
        }

        valueElement.textContent = displayValue;

        // Calculate change
        const previous = this.previousMetrics[id] || value;
        const change = ((value - previous) / previous * 100).toFixed(1);

        if (changeElement) {
            const changeValue = changeElement.querySelector('.change-value');
            const changeIcon = changeElement.querySelector('.change-icon');

            if (Math.abs(change) < 1) {
                changeElement.className = 'metric-change neutral';
                changeIcon.textContent = '—';
                changeValue.textContent = 'Stable';
            } else if (change > 0) {
                changeElement.className = 'metric-change positive';
                changeIcon.textContent = '↑';
                changeValue.textContent = `${change}%`;
            } else {
                changeElement.className = 'metric-change negative';
                changeIcon.textContent = '↓';
                changeValue.textContent = `${Math.abs(change)}%`;
            }
        }

        this.previousMetrics[id] = value;
    }

    updateChart(chartName, label, value) {
        const chart = this.charts[chartName];
        if (!chart) return;

        // Add new data point
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(value);

        // Remove old data points if exceeds max
        if (chart.data.labels.length > CONFIG.dashboard.maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        // Update chart
        chart.update();
    }

    updateSystemInfo(metrics) {
        if (!metrics.system_info) return;

        document.getElementById('hostname').textContent = metrics.system_info.hostname || '—';
        document.getElementById('platform').textContent = metrics.system_info.platform || '—';
        document.getElementById('uptime').textContent =
            metrics.system_info.uptime_hours ?
                `${metrics.system_info.uptime_hours.toFixed(1)} hours` : '—';
    }

    updateTrafficSources(sources) {
        if (!sources) return;

        const total = Object.values(sources).reduce((a, b) => a + b, 0);

        Object.keys(sources).forEach(source => {
            const percentage = total > 0 ? (sources[source] / total * 100).toFixed(1) : 0;
            const fillElement = document.getElementById(`traffic-${source}`);
            const valueElement = document.getElementById(`traffic-${source}-value`);

            if (fillElement) {
                fillElement.style.width = `${percentage}%`;
            }
            if (valueElement) {
                valueElement.textContent = `${percentage}%`;
            }
        });
    }

    updateConnectionStatus(status) {
        const statusIndicator = document.getElementById('connection-status');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        switch (status) {
            case 'connected':
                statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
                statusIndicator.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                statusDot.style.background = '#10b981';
                statusText.style.color = '#10b981';
                statusText.textContent = CONFIG.demoMode ? 'Demo Mode' : 'Connected';
                break;
            case 'error':
                statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
                statusIndicator.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                statusDot.style.background = '#ef4444';
                statusText.style.color = '#ef4444';
                statusText.textContent = 'Error';
                break;
            default:
                statusIndicator.style.background = 'rgba(245, 158, 11, 0.1)';
                statusIndicator.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                statusDot.style.background = '#f59e0b';
                statusText.style.color = '#f59e0b';
                statusText.textContent = 'Connecting...';
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AnalyticsDashboard();
});
