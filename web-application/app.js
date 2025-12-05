// ========================================
// APP STATE
// ========================================
const app = {
    currentUser: null,
    ipInfo: null,
    locationInfo: null,
    loginAttempts: 0,
    activityLog: []
};

// ========================================
// LOGGING SYSTEM
// ========================================
function log(action, details = {}, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        action,
        user: app.currentUser || 'anonymous',
        details,
        userAgent: navigator.userAgent
    };

    app.activityLog.push(logEntry);

    // Console logging with styling
    const styles = {
        info: 'color: #0ea5e9; font-weight: bold',
        success: 'color: #22c55e; font-weight: bold',
        warning: 'color: #f59e0b; font-weight: bold',
        error: 'color: #ef4444; font-weight: bold'
    };

    console.log(`%c[${level.toUpperCase()}] ${timestamp}`, styles[level] || styles.info);
    console.log(`Action: ${action}`);
    if (Object.keys(details).length > 0) {
        console.log('Details:', details);
    }
    console.log('---');

    // Save to localStorage
    try {
        localStorage.setItem('networkHub_logs', JSON.stringify(app.activityLog.slice(-100))); // Keep last 100 logs
    } catch (e) {
        console.warn('Unable to save logs to localStorage');
    }
}

// Load existing logs
function loadLogs() {
    try {
        const savedLogs = localStorage.getItem('networkHub_logs');
        if (savedLogs) {
            app.activityLog = JSON.parse(savedLogs);
            log('System Started', { logsLoaded: app.activityLog.length }, 'info');
        }
    } catch (e) {
        console.warn('Unable to load logs from localStorage');
    }
}

// Export logs function
function exportLogs() {
    const logsText = JSON.stringify(app.activityLog, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `networkhub_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log('Logs Exported', { count: app.activityLog.length }, 'info');
}

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
    // Pages
    loginPage: document.getElementById('loginPage'),
    dashboardPage: document.getElementById('dashboardPage'),

    // Login Form
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('loginError'),

    // Dashboard
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Speed Test
    startSpeedTest: document.getElementById('startSpeedTest'),
    downloadSpeed: document.getElementById('downloadSpeed'),
    uploadSpeed: document.getElementById('uploadSpeed'),
    pingSpeed: document.getElementById('pingSpeed'),

    // IP Info
    ipv4: document.getElementById('ipv4'),
    isp: document.getElementById('isp'),
    refreshIP: document.getElementById('refreshIP'),

    // Location
    city: document.getElementById('city'),
    country: document.getElementById('country'),
    coordinates: document.getElementById('coordinates'),

    // DNS Lookup
    dnsInput: document.getElementById('dnsInput'),
    lookupDNS: document.getElementById('lookupDNS'),
    dnsResult: document.getElementById('dnsResult'),
    dnsIP: document.getElementById('dnsIP'),

    // Network Info
    connectionType: document.getElementById('connectionType'),
    browser: document.getElementById('browser'),
    platform: document.getElementById('platform'),

    // Port Checker
    checkPorts: document.getElementById('checkPorts'),
    port80: document.getElementById('port80'),
    port443: document.getElementById('port443'),
    port21: document.getElementById('port21'),
    port22: document.getElementById('port22')
};

// ========================================
// LOGIN FUNCTIONALITY WITH FILE-BASED AUTH
// ========================================
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;

    log('Login Attempt', { username }, 'info');

    try {
        // Load users from users.json file
        const response = await fetch('users.json');
        const data = await response.json();

        // Find matching user
        const user = data.users.find(u => u.username === username && u.password === password);

        if (user) {
            app.currentUser = username;
            app.loginAttempts = 0;
            log('Login Successful', { username, role: user.role }, 'success');
            showDashboard();

            // Clear password field for security
            elements.passwordInput.value = '';

            // Hide error if shown
            if (elements.loginError) {
                elements.loginError.style.display = 'none';
            }
        } else {
            app.loginAttempts++;
            log('Login Failed', { username, attempts: app.loginAttempts }, 'warning');

            // Show error message
            showLoginError('Invalid username or password');

            if (app.loginAttempts >= 3) {
                log('Multiple Failed Login Attempts', { username, attempts: app.loginAttempts }, 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        log('Login Error', { error: error.message }, 'error');
        showLoginError('Unable to verify credentials. Please check the server.');
    }
});

function showLoginError(message) {
    if (!elements.loginError) {
        // Create error element if it doesn't exist
        const errorDiv = document.createElement('div');
        errorDiv.id = 'loginError';
        errorDiv.className = 'login-error';
        errorDiv.textContent = message;
        elements.loginForm.insertBefore(errorDiv, elements.loginForm.firstChild);
        elements.loginError = errorDiv;
    } else {
        elements.loginError.textContent = message;
        elements.loginError.style.display = 'block';
    }
}

function showDashboard() {
    elements.loginPage.classList.remove('active');
    elements.dashboardPage.classList.add('active');
    elements.userName.textContent = app.currentUser;

    // Load initial data
    log('Dashboard Loaded', { user: app.currentUser }, 'info');
    loadIPInfo();
    loadNetworkInfo();
}

// ========================================
// LOGOUT FUNCTIONALITY
// ========================================
elements.logoutBtn.addEventListener('click', () => {
    log('User Logged Out', { user: app.currentUser }, 'info');

    app.currentUser = null;
    elements.dashboardPage.classList.remove('active');
    elements.loginPage.classList.add('active');

    // Reset form
    elements.loginForm.reset();

    // Hide error if shown
    if (elements.loginError) {
        elements.loginError.style.display = 'none';
    }
});

// ========================================
// SPEED TEST
// ========================================
elements.startSpeedTest.addEventListener('click', async () => {
    const button = elements.startSpeedTest;
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>';

    log('Speed Test Started', {}, 'info');

    // Reset displays
    elements.downloadSpeed.textContent = '--';
    elements.uploadSpeed.textContent = '--';
    elements.pingSpeed.textContent = '--';

    try {
        // Test ping
        const pingResult = await testPing();
        elements.pingSpeed.textContent = pingResult;
        log('Ping Test Completed', { ping: pingResult + ' ms' }, 'success');

        // Download speed test
        const downloadResult = await testDownloadSpeed();
        elements.downloadSpeed.textContent = downloadResult.toFixed(2);
        log('Download Test Completed', { speed: downloadResult.toFixed(2) + ' Mbps' }, 'success');

        // Upload speed test
        const uploadResult = await testUploadSpeed();
        elements.uploadSpeed.textContent = uploadResult.toFixed(2);
        log('Upload Test Completed', { speed: uploadResult.toFixed(2) + ' Mbps' }, 'success');

        log('Speed Test Completed', {
            download: downloadResult.toFixed(2) + ' Mbps',
            upload: uploadResult.toFixed(2) + ' Mbps',
            ping: pingResult + ' ms'
        }, 'success');

    } catch (error) {
        console.error('Speed test error:', error);
        log('Speed Test Failed', { error: error.message }, 'error');
        showNotification('Speed test failed. Please try again.', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<span>Start Test</span>';
    }
});

async function testPing() {
    const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        'https://www.github.com/favicon.ico'
    ];

    const pings = [];

    for (const endpoint of endpoints) {
        const startTime = performance.now();
        try {
            await fetch(endpoint, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });
            const endTime = performance.now();
            pings.push(endTime - startTime);
        } catch (error) {
            console.error('Ping test error:', error);
        }
    }

    if (pings.length > 0) {
        return Math.round(pings.reduce((a, b) => a + b) / pings.length);
    }

    try {
        const startTime = performance.now();
        await fetch('http://ip-api.com/json/');
        const endTime = performance.now();
        return Math.round(endTime - startTime);
    } catch {
        return 0;
    }
}

async function testDownloadSpeed() {
    const testSizes = [500000, 1000000, 1500000]; // 500KB, 1MB, 1.5MB
    const speeds = [];

    for (const size of testSizes) {
        const startTime = performance.now();

        try {
            const response = await fetch(`https://httpbin.org/bytes/${size}`, {
                cache: 'no-store'
            });
            const blob = await response.blob();
            const endTime = performance.now();

            const fileSizeBytes = blob.size;
            const durationSeconds = (endTime - startTime) / 1000;
            const bitsLoaded = fileSizeBytes * 8;
            const speedMbps = (bitsLoaded / (1024 * 1024)) / durationSeconds;

            speeds.push(speedMbps);
            console.log(`✅ Download test ${speeds.length}: ${speedMbps.toFixed(2)} Mbps`);
        } catch (error) {
            console.error('Download test error:', error);
        }
    }

    if (speeds.length > 0) {
        const avgSpeed = speeds.reduce((a, b) => a + b) / speeds.length;
        console.log(`📊 Average download speed: ${avgSpeed.toFixed(2)} Mbps`);
        return avgSpeed;
    }

    console.warn('⚠️ All download tests failed');
    return 0;
}

async function testUploadSpeed() {
    const uploadData = new Blob([new ArrayBuffer(500000)]); // 500KB of data
    const startTime = performance.now();

    try {
        await fetch('https://httpbin.org/post', {
            method: 'POST',
            body: uploadData,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        const endTime = performance.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const uploadSizeBytes = uploadData.size;
        const bitsUploaded = uploadSizeBytes * 8;
        const speedMbps = (bitsUploaded / (1024 * 1024)) / durationSeconds;

        console.log(`✅ Upload test: ${speedMbps.toFixed(2)} Mbps`);
        return speedMbps;
    } catch (error) {
        console.error('Upload test error:', error);

        try {
            const smallData = new Blob([new ArrayBuffer(100000)]); // 100KB
            const startTime2 = performance.now();

            await fetch('https://httpbin.org/post', {
                method: 'POST',
                body: smallData
            });

            const endTime2 = performance.now();
            const duration2 = (endTime2 - startTime2) / 1000;
            const bitsUploaded2 = smallData.size * 8;
            const speedMbps2 = (bitsUploaded2 / (1024 * 1024)) / duration2;

            console.log(`✅ Upload test (fallback): ${speedMbps2.toFixed(2)} Mbps`);
            return speedMbps2;
        } catch {
            console.warn('⚠️ Upload test failed');
            return 0;
        }
    }
}

// ========================================
// IP & LOCATION INFO
// ========================================
async function loadIPInfo() {
    log('Loading IP Information', {}, 'info');

    try {
        const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query');
        const data = await response.json();

        if (data.status === 'success') {
            app.ipInfo = data;
            app.locationInfo = data;

            elements.ipv4.textContent = data.query || 'Unable to detect';
            elements.isp.textContent = data.isp || data.org || 'Unknown ISP';
            elements.city.textContent = data.city || 'Unknown';
            elements.country.textContent = `${data.country || 'Unknown'} (${data.countryCode || ''})`;
            elements.coordinates.textContent = `${data.lat || 0}, ${data.lon || 0}`;

            log('IP Information Loaded', {
                ip: data.query,
                location: `${data.city}, ${data.country}`,
                isp: data.isp
            }, 'success');
        } else {
            throw new Error(data.message || 'Failed to get IP info');
        }

    } catch (error) {
        console.error('IP info error:', error);
        log('IP Information Load Failed', { error: error.message }, 'error');

        try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();

            elements.ipv4.textContent = ipData.ip || 'Unable to detect';
            elements.isp.textContent = ipData.org || 'Unknown ISP';
            elements.city.textContent = ipData.city || 'Unknown';
            elements.country.textContent = `${ipData.country_name || 'Unknown'} (${ipData.country_code || ''})`;
            elements.coordinates.textContent = `${ipData.latitude || 0}, ${ipData.longitude || 0}`;

            log('IP Information Loaded (Fallback)', {
                ip: ipData.ip,
                location: `${ipData.city}, ${ipData.country_name}`
            }, 'success');
        } catch (fallbackError) {
            console.error('Fallback API also failed:', fallbackError);
            log('All IP APIs Failed', { error: fallbackError.message }, 'error');

            elements.ipv4.textContent = 'API Error';
            elements.isp.textContent = 'Check internet connection';
            elements.city.textContent = 'API Error';
            elements.country.textContent = 'Check console';
            elements.coordinates.textContent = 'N/A';
        }
    }
}

elements.refreshIP.addEventListener('click', () => {
    log('IP Refresh Requested', {}, 'info');
    elements.ipv4.textContent = 'Loading...';
    elements.isp.textContent = 'Loading...';
    loadIPInfo();
});

// ========================================
// DNS LOOKUP
// ========================================
elements.lookupDNS.addEventListener('click', async () => {
    const domain = elements.dnsInput.value.trim();

    if (!domain) {
        showNotification('Please enter a domain name', 'error');
        return;
    }

    log('DNS Lookup Started', { domain }, 'info');

    const button = elements.lookupDNS;
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>';

    try {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
            headers: {
                'Accept': 'application/dns-json'
            }
        });

        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            const ip = data.Answer[0].data;
            elements.dnsIP.textContent = ip;
            elements.dnsResult.style.display = 'block';
            log('DNS Lookup Successful', { domain, ip }, 'success');
        } else {
            showNotification('No DNS records found', 'error');
            elements.dnsResult.style.display = 'none';
            log('DNS Lookup Failed', { domain, reason: 'No records found' }, 'warning');
        }

    } catch (error) {
        console.error('DNS lookup error:', error);
        log('DNS Lookup Error', { domain, error: error.message }, 'error');
        showNotification('DNS lookup failed. Please try again.', 'error');
        elements.dnsResult.style.display = 'none';
    } finally {
        button.disabled = false;
        button.innerHTML = '<span>Lookup</span>';
    }
});

elements.dnsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.lookupDNS.click();
    }
});

// ========================================
// NETWORK INFO
// ========================================
function loadNetworkInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';

    if (userAgent.includes('Firefox')) {
        browser = 'Mozilla Firefox';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Google Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
        browser = 'Microsoft Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
    }

    elements.browser.textContent = browser;
    elements.platform.textContent = navigator.platform || 'Unknown';

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
        const type = connection.effectiveType || connection.type || 'Unknown';
        elements.connectionType.textContent = type.toUpperCase();
    } else {
        elements.connectionType.textContent = 'Not available';
    }

    log('Network Info Loaded', {
        browser,
        platform: navigator.platform,
        connection: connection ? connection.effectiveType : 'N/A'
    }, 'info');
}

// ========================================
// PORT CHECKER
// ========================================
elements.checkPorts.addEventListener('click', async () => {
    const button = elements.checkPorts;
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>';

    log('Port Check Started', {}, 'info');

    [elements.port80, elements.port443, elements.port21, elements.port22].forEach(el => {
        el.textContent = '--';
        el.className = 'port-status';
    });

    try {
        checkPort('http://portquiz.net:80/', elements.port80);
        checkPort('https://portquiz.net:443/', elements.port443);

        setTimeout(() => {
            elements.port21.textContent = 'N/A';
            elements.port21.className = 'port-status';
        }, 1000);

        setTimeout(() => {
            elements.port22.textContent = 'N/A';
            elements.port22.className = 'port-status';
        }, 1500);

        log('Port Check Completed', {}, 'success');

    } catch (error) {
        console.error('Port check error:', error);
        log('Port Check Error', { error: error.message }, 'error');
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = '<span>Check Ports</span>';
        }, 2000);
    }
});

async function checkPort(url, element) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        element.textContent = 'Open';
        element.className = 'port-status open';

    } catch (error) {
        if (error.name === 'AbortError') {
            element.textContent = 'Timeout';
            element.className = 'port-status closed';
        } else {
            element.textContent = 'Unknown';
            element.className = 'port-status';
        }
    }
}

// ========================================
// NOTIFICATIONS
// ========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(14, 165, 233, 0.9)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .login-error {
        padding: 12px;
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid #ef4444;
        border-radius: 8px;
        color: #dc2626;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .instruction-text {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
        padding: 8px 12px;
        background: rgba(14, 165, 233, 0.1);
        border-radius: 6px;
        border: 1px solid var(--border-sky);
    }
`;
document.head.appendChild(style);

// ========================================
// INITIALIZE
// ========================================
loadLogs();
log('NetworkHub Application Started', {
    version: '1.0.0',
    timestamp: new Date().toISOString()
}, 'info');

console.log('🌐 NetworkHub initialized');
console.log('📝 Default users:');
console.log('   - admin / admin123');
console.log('   - demo / demo123');
console.log('   - test / test123');
console.log('📊 Activity logging enabled');
console.log('💾 Logs saved to localStorage');

// Make exportLogs available globally
window.exportLogs = exportLogs;
console.log('💡 Tip: Run exportLogs() in console to download activity logs');
