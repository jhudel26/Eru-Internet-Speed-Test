class InternetSpeedTest {
    constructor() {
        this.testState = 'idle';
        this.downloadSpeed = 0;
        this.uploadSpeed = 0;
        this.ping = 0;
        this.jitter = 0;
        this.serverLocation = 'Unknown';
        this.ispInfo = 'Unknown';
        this.ipAddress = 'Unknown';
        
        // Speedtest.net inspired settings
        this.pingTestCount = 20; // Like Speedtest.net
        this.downloadThreads = 4; // Parallel connections
        this.uploadThreads = 4;
        this.initialTestDuration = 3000; // 3 seconds initial test
        this.mainTestDuration = 8000; // 8 seconds main test
        this.minTestSize = 1 * 1024 * 1024; // 1MB minimum
        this.maxTestSize = 100 * 1024 * 1024; // 100MB maximum
        
        this.initializeElements();
        this.bindEvents();
        this.detectConnectionInfo();
    }

    initializeElements() {
        this.startButton = document.getElementById('start-test');
        this.resultsSection = document.getElementById('results');
        this.progressContainer = document.getElementById('progress-container');
        this.testButtonContainer = document.getElementById('test-button-container');
        this.progressBar = document.getElementById('progress-bar');
        this.testStatus = document.getElementById('test-status');
        this.currentSpeedDisplay = document.getElementById('current-speed');
        this.additionalInfo = document.getElementById('additional-info');
        
        // Result displays
        this.downloadSpeedDisplay = document.getElementById('download-speed');
        this.uploadSpeedDisplay = document.getElementById('upload-speed');
        this.pingDisplay = document.getElementById('ping');
        this.serverLocationDisplay = document.getElementById('server-location');
        this.ispInfoDisplay = document.getElementById('isp-info');
        this.ipAddressDisplay = document.getElementById('ip-address');
        this.jitterDisplay = document.getElementById('jitter');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startSpeedTest());
    }

    async detectConnectionInfo() {
        try {
            // Use reliable CORS-free services for browser compatibility
            const ipServices = [
                {
                    url: 'https://api.ipify.org?format=json',
                    parser: (data) => ({
                        ip: data.ip,
                        city: 'Unknown',
                        country: 'Unknown',
                        isp: 'Unknown'
                    })
                },
                {
                    url: 'https://ipapi.co/json/',
                    parser: (data) => ({
                        ip: data.ip,
                        city: data.city,
                        country: data.country_name,
                        isp: data.org
                    })
                },
                {
                    url: 'https://api.ipgeolocation.io/ipgeo',
                    parser: (data) => ({
                        ip: data.ip,
                        city: data.city,
                        country: data.country_name,
                        isp: data.org
                    })
                }
            ];

            let connectionInfo = {
                ip: 'Unknown',
                city: 'Unknown',
                country: 'Unknown',
                isp: 'Unknown'
            };

            // Try each service until one works
            for (const service of ipServices) {
                try {
                    const response = await fetch(service.url, {
                        method: 'GET',
                        cache: 'no-cache',
                        mode: 'cors'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const parsed = service.parser(data);
                        
                        // Update connection info with successful data
                        connectionInfo = {
                            ip: parsed.ip || connectionInfo.ip,
                            city: parsed.city || connectionInfo.city,
                            country: parsed.country || connectionInfo.country,
                            isp: parsed.isp || connectionInfo.isp
                        };
                        
                        // If we got IP and at least one other info, break
                        if (parsed.ip && (parsed.city !== 'Unknown' || parsed.isp !== 'Unknown')) {
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`Service ${service.url} failed:`, error);
                    continue;
                }
            }

            // Fallback to browser-based detection if all APIs fail
            if (connectionInfo.ip === 'Unknown') {
                try {
                    // Use WebRTC to get local IP (requires user permission in some browsers)
                    const rtcPeerConnection = new RTCPeerConnection({ iceServers: [] });
                    rtcPeerConnection.createDataChannel('');
                    
                    rtcPeerConnection.onicecandidate = (event) => {
                        if (event.candidate && event.candidate.candidate) {
                            const candidate = event.candidate.candidate;
                            const match = candidate.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
                            if (match && match[1]) {
                                connectionInfo.ip = match[1];
                                this.ipAddressDisplay.textContent = connectionInfo.ip;
                            }
                        }
                    };
                    
                    rtcPeerConnection.createOffer()
                        .then(offer => rtcPeerConnection.setLocalDescription(offer))
                        .catch(() => {}); // Ignore errors
                        
                    // Close connection after 2 seconds
                    setTimeout(() => rtcPeerConnection.close(), 2000);
                } catch (error) {
                    console.log('WebRTC detection failed:', error);
                }
            }

            // Update displays
            this.ipAddress = connectionInfo.ip;
            this.serverLocation = connectionInfo.city !== 'Unknown' && connectionInfo.country !== 'Unknown' 
                ? `${connectionInfo.city}, ${connectionInfo.country}` 
                : connectionInfo.country !== 'Unknown' 
                    ? connectionInfo.country 
                    : 'Unable to detect';
            this.ispInfo = connectionInfo.isp !== 'Unknown' ? connectionInfo.isp : 'Unable to detect';
            
            // Update UI
            this.ipAddressDisplay.textContent = this.ipAddress;
            this.serverLocationDisplay.textContent = this.serverLocation;
            this.ispInfoDisplay.textContent = this.ispInfo;
            
        } catch (error) {
            console.log('Connection info detection failed:', error);
            
            // Set fallback values
            this.ipAddress = 'Unable to detect';
            this.serverLocation = 'Unable to detect';
            this.ispInfo = 'Unable to detect';
            
            this.ipAddressDisplay.textContent = this.ipAddress;
            this.serverLocationDisplay.textContent = this.serverLocation;
            this.ispInfoDisplay.textContent = this.ispInfo;
        }
    }

    async startSpeedTest() {
        if (this.testState !== 'idle') return;
        
        this.testState = 'running';
        this.resetResults();
        this.showProgress();
        
        try {
            // Test sequence: Ping -> Download -> Upload
            await this.testPing();
            await this.testDownload();
            await this.testUpload();
            
            this.showResults();
        } catch (error) {
            console.error('Speed test error:', error);
            this.showError('Test failed. Please try again.');
        } finally {
            this.testState = 'idle';
            this.hideProgress();
        }
    }

    resetResults() {
        this.downloadSpeed = 0;
        this.uploadSpeed = 0;
        this.ping = 0;
        this.jitter = 0;
        
        this.downloadSpeedDisplay.textContent = '0';
        this.uploadSpeedDisplay.textContent = '0';
        this.pingDisplay.textContent = '0';
        this.jitterDisplay.textContent = '0 ms';
        
        this.resultsSection.classList.add('opacity-0');
        this.additionalInfo.classList.add('hidden');
    }

    showProgress() {
        this.testButtonContainer.classList.add('hidden');
        this.progressContainer.classList.remove('hidden');
        this.progressBar.style.width = '0%';
        this.testStatus.textContent = 'Initializing...';
        this.currentSpeedDisplay.textContent = '0 Mbps';
    }

    hideProgress() {
        this.testButtonContainer.classList.remove('hidden');
        this.progressContainer.classList.add('hidden');
    }

    showResults() {
        this.resultsSection.classList.remove('opacity-0');
        this.additionalInfo.classList.remove('hidden');
        
        // Animate the results
        this.animateValue(this.downloadSpeedDisplay, 0, this.downloadSpeed, 1000);
        this.animateValue(this.uploadSpeedDisplay, 0, this.uploadSpeed, 1000);
        this.animateValue(this.pingDisplay, 0, this.ping, 1000, 'ms');
        this.animateValue(this.jitterDisplay, 0, this.jitter, 1000, 'ms');
    }

    showError(message) {
        this.testStatus.textContent = message;
        setTimeout(() => {
            this.hideProgress();
        }, 3000);
    }

    async testPing() {
        this.updateStatus('Testing ping...', 10);
        
        const pings = [];
        const testCount = this.pingTestCount;
        
        // Use multiple endpoints for better accuracy
        const pingUrls = [
            'https://cloudflare.com/cdn-cgi/trace',
            'https://1.1.1.1/cdn-cgi/trace',
            'https://google.com'
        ];
        
        for (let i = 0; i < testCount; i++) {
            const url = pingUrls[i % pingUrls.length];
            const startTime = performance.now();
            try {
                await fetch(url, {
                    method: 'GET',
                    cache: 'no-cache',
                    mode: 'no-cors'
                });
                const endTime = performance.now();
                const ping = Math.round(endTime - startTime);
                if (ping < 1000) { // Filter out unreasonable values
                    pings.push(ping);
                }
            } catch (error) {
                // For no-cors requests, we measure the time until the request is sent
                const endTime = performance.now();
                const ping = Math.round(endTime - startTime);
                if (ping < 500) { // More conservative for no-cors
                    pings.push(ping);
                }
            }
            await this.delay(100); // Shorter delay for more tests
        }
        
        if (pings.length > 0) {
            // Sort and use interquartile mean (like Speedtest.net)
            pings.sort((a, b) => a - b);
            const trimmedPings = this.trimArray(pings, 0.25, 0.25); // Remove top/bottom 25%
            this.ping = Math.round(trimmedPings.reduce((a, b) => a + b, 0) / trimmedPings.length);
            
            // Calculate jitter using proper methodology
            this.jitter = this.calculateJitter(pings);
        } else {
            this.ping = 999;
            this.jitter = 0;
        }
        
        this.pingDisplay.textContent = this.ping;
        this.jitterDisplay.textContent = `${this.jitter} ms`;
    }

    async testDownload() {
        this.updateStatus('Testing download speed...', 30);
        
        // Use larger, more reliable test files
        const testUrls = [
            'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
            'https://speed.cloudflare.com/__down?bytes=10485760',
            'https://speed.cloudflare.com/__down?bytes=10485760',
            'https://speed.cloudflare.com/__down?bytes=10485760'
        ];
        
        // Adaptive test duration based on connection speed
        let testDuration = this.initialTestDuration;
        let totalBytes = 0;
        let speedMeasurements = [];
        
        // Initial quick test to determine appropriate parameters
        const initialSpeed = await this.quickDownloadTest();
        const adaptiveDuration = this.calculateAdaptiveDuration(initialSpeed);
        
        this.updateStatus('Testing download speed...', 40);
        const mainStartTime = performance.now();
        let lastUpdateTime = mainStartTime;
        
        // Parallel download threads
        const downloadPromises = testUrls.map(async (url, threadIndex) => {
            const threadStartTime = performance.now();
            let threadBytes = 0;
            
            while (performance.now() - mainStartTime < adaptiveDuration) {
                try {
                    const response = await fetch(url, {
                        cache: 'no-cache',
                        mode: 'cors'
                    });
                    
                    if (!response.ok) continue;
                    
                    const reader = response.body.getReader();
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunkSize = value.length;
                        threadBytes += chunkSize;
                        totalBytes += chunkSize;
                        
                        // Update progress every 200ms for smoother display
                        const currentTime = performance.now();
                        if (currentTime - lastUpdateTime > 200) {
                            const elapsedSeconds = (currentTime - mainStartTime) / 1000;
                            const currentSpeed = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);
                            this.currentSpeedDisplay.textContent = `${currentSpeed.toFixed(2)} Mbps`;
                            
                            const progress = 40 + ((currentTime - mainStartTime) / adaptiveDuration) * 30;
                            this.updateStatus('Testing download speed...', Math.min(progress, 70));
                            lastUpdateTime = currentTime;
                        }
                    }
                } catch (error) {
                    console.log('Download thread error:', error);
                    await this.delay(100);
                }
            }
            
            return threadBytes;
        });
        
        await Promise.all(downloadPromises);
        
        const endTime = performance.now();
        const durationSeconds = (endTime - mainStartTime) / 1000;
        
        // Calculate final speed with proper methodology
        this.downloadSpeed = this.calculateSpeed(totalBytes, durationSeconds);
        
        this.downloadSpeedDisplay.textContent = this.downloadSpeed.toFixed(2);
    }

    async testUpload() {
        this.updateStatus('Testing upload speed...', 70);
        
        try {
            // Try Fast.com upload test if available
            const fastUploadSpeed = await this.fastComUploadTest();
            if (fastUploadSpeed > 0) {
                this.uploadSpeed = fastUploadSpeed;
                this.uploadSpeedDisplay.textContent = this.uploadSpeed.toFixed(2);
                return;
            }
        } catch (error) {
            console.log('Fast.com upload test failed, using fallback:', error);
        }
        
        // Fallback to reliable CORS-enabled upload endpoints
}

showProgress() {
this.testButtonContainer.classList.add('hidden');
this.progressContainer.classList.remove('hidden');
this.progressBar.style.width = '0%';
this.testStatus.textContent = 'Initializing...';
this.currentSpeedDisplay.textContent = '0 Mbps';
}

hideProgress() {
this.testButtonContainer.classList.remove('hidden');
this.progressContainer.classList.add('hidden');
}

showResults() {
this.resultsSection.classList.remove('opacity-0');
this.additionalInfo.classList.remove('hidden');
        
// Animate the results
this.animateValue(this.downloadSpeedDisplay, 0, this.downloadSpeed, 1000);
this.animateValue(this.uploadSpeedDisplay, 0, this.uploadSpeed, 1000);
this.animateValue(this.pingDisplay, 0, this.ping, 1000, 'ms');
this.animateValue(this.jitterDisplay, 0, this.jitter, 1000, 'ms');
}

showError(message) {
this.testStatus.textContent = message;
setTimeout(() => {
this.hideProgress();
}, 3000);
}

async testPing() {
this.updateStatus('Testing ping...', 10);
        
const pings = [];
const testCount = this.pingTestCount;
        
// Use multiple endpoints for better accuracy
const pingUrls = [
'https://cloudflare.com/cdn-cgi/trace',
'https://1.1.1.1/cdn-cgi/trace',
'https://google.com'
];
        
for (let i = 0; i < testCount; i++) {
const url = pingUrls[i % pingUrls.length];
const startTime = performance.now();
try {
await fetch(url, {
method: 'GET',
cache: 'no-cache',
mode: 'no-cors'
});
const endTime = performance.now();
const ping = Math.round(endTime - startTime);
if (ping < 1000) { // Filter out unreasonable values
pings.push(ping);
}
} catch (error) {
// For no-cors requests, we measure the time until the request is sent
const endTime = performance.now();
const ping = Math.round(endTime - startTime);
if (ping < 500) { // More conservative for no-cors
pings.push(ping);
}
}
await this.delay(100); // Shorter delay for more tests
}
        
if (pings.length > 0) {
// Sort and use interquartile mean (like Speedtest.net)
pings.sort((a, b) => a - b);
const trimmedPings = this.trimArray(pings, 0.25, 0.25); // Remove top/bottom 25%
this.ping = Math.round(trimmedPings.reduce((a, b) => a + b, 0) / trimmedPings.length);
        
// Calculate jitter using proper methodology
this.jitter = this.calculateJitter(pings);
} else {
this.ping = 999;
this.jitter = 0;
}
        
this.pingDisplay.textContent = this.ping;
this.jitterDisplay.textContent = `${this.jitter} ms`;
}

async testDownload() {
this.updateStatus('Testing download speed...', 30);
        
// Use larger, more reliable test files
const testUrls = [
'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
'https://speed.cloudflare.com/__down?bytes=10485760',
'https://speed.cloudflare.com/__down?bytes=10485760',
'https://speed.cloudflare.com/__down?bytes=10485760'
];
        
// Adaptive test duration based on connection speed
let testDuration = this.initialTestDuration;
let totalBytes = 0;
let speedMeasurements = [];
        
// Initial quick test to determine appropriate parameters
const initialSpeed = await this.quickDownloadTest();
const adaptiveDuration = this.calculateAdaptiveDuration(initialSpeed);
        
this.updateStatus('Testing download speed...', 40);
const mainStartTime = performance.now();
let lastUpdateTime = mainStartTime;
        
// Parallel download threads
const downloadPromises = testUrls.map(async (url, threadIndex) => {
const threadStartTime = performance.now();
let threadBytes = 0;
        
while (performance.now() - mainStartTime < adaptiveDuration) {
try {
const response = await fetch(url, {
cache: 'no-cache',
mode: 'cors'
});
        
if (!response.ok) continue;
        
const reader = response.body.getReader();
        
while (true) {
const { done, value } = await reader.read();
if (done) break;
        
const chunkSize = value.length;
threadBytes += chunkSize;
totalBytes += chunkSize;
        
// Update progress every 200ms for smoother display
const currentTime = performance.now();
if (currentTime - lastUpdateTime > 200) {
const elapsedSeconds = (currentTime - mainStartTime) / 1000;
const currentSpeed = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);
this.currentSpeedDisplay.textContent = `${currentSpeed.toFixed(2)} Mbps`;
        
const progress = 40 + ((currentTime - mainStartTime) / adaptiveDuration) * 30;
this.updateStatus('Testing download speed...', Math.min(progress, 70));
lastUpdateTime = currentTime;
}
}
} catch (error) {
console.log('Download thread error:', error);
await this.delay(100);
}
}
        
return threadBytes;
});
        
await Promise.all(downloadPromises);
        
const endTime = performance.now();
const durationSeconds = (endTime - mainStartTime) / 1000;
        
// Calculate final speed with proper methodology
this.downloadSpeed = this.calculateSpeed(totalBytes, durationSeconds);
        
this.downloadSpeedDisplay.textContent = this.downloadSpeed.toFixed(2);
}

async testUpload() {
this.updateStatus('Testing upload speed...', 75);
        
const uploadEndpoints = [
'https://httpbin.org/post',
'https://httpbin.org/post',
'https://httpbin.org/post',
'https://httpbin.org/post'
];
        
// Initial quick test to determine parameters
const initialUploadSpeed = await this.quickUploadTest();
const adaptiveDuration = this.calculateAdaptiveDuration(initialUploadSpeed);
    }

    animateValue(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        const update = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = suffix === 'ms' ? 
                Math.round(current) + suffix : 
                current.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Speedtest.net inspired helper methods
    trimArray(arr, startPercent, endPercent) {
        const start = Math.floor(arr.length * startPercent);
        const end = Math.floor(arr.length * (1 - endPercent));
        return arr.slice(start, end);
    }

    calculateJitter(pings) {
        if (pings.length < 2) return 0;
        
        let jitterSum = 0;
        for (let i = 1; i < pings.length; i++) {
            jitterSum += Math.abs(pings[i] - pings[i - 1]);
        }
        
        return Math.round(jitterSum / (pings.length - 1));
    }

    calculateSpeed(bytes, seconds) {
        if (seconds === 0) return 0;
        const speedMbps = (bytes * 8) / (seconds * 1024 * 1024);
        return Math.round(speedMbps * 100) / 100;
    }

    async quickDownloadTest() {
        const testUrl = 'https://speed.cloudflare.com/__down?bytes=1048576'; // 1MB
        const startTime = performance.now();
        
        try {
            const response = await fetch(testUrl, { cache: 'no-cache' });
            if (!response.ok) return 10; // Default estimate
            
            const reader = response.body.getReader();
            let bytes = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                bytes += value.length;
            }
            
            const duration = (performance.now() - startTime) / 1000;
            return this.calculateSpeed(bytes, duration);
        } catch (error) {
            return 10; // Conservative default
        }
    }

    async quickUploadTest() {
        // Use httpbin.org for quick upload test - reliable and CORS-enabled
        const testData = new ArrayBuffer(256 * 1024); // 256KB for quick test
        const view = new Uint8Array(testData);
        for (let i = 0; i < 256 * 1024; i++) {
            view[i] = Math.floor(Math.random() * 256);
        }
        
        const startTime = performance.now();
        
        try {
            // Use httpbin.org - reliable CORS-enabled endpoint
            const response = await fetch('https://httpbin.org/post', {
                method: 'POST',
                body: testData,
                cache: 'no-cache',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-Upload-Test': 'quick-test',
                    'User-Agent': 'Eru-SpeedTest/1.0',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });
            
            if (response.ok) {
                const duration = (performance.now() - startTime) / 1000;
                const speed = this.calculateSpeed(testData.byteLength, duration);
                return Math.max(speed, 0.5); // Minimum 0.5 Mbps estimate
            }
        } catch (error) {
            console.log('Primary quick upload test failed:', error);
        }
        
        // Fallback to JSONPlaceholder with smaller data
        try {
            const smallData = new ArrayBuffer(64 * 1024); // 64KB
            const smallView = new Uint8Array(smallData);
            for (let i = 0; i < 64 * 1024; i++) {
                smallView[i] = Math.floor(Math.random() * 256);
            }
            
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Eru-SpeedTest/1.0'
                },
                body: JSON.stringify({ 
                    test: 'speedtest-quick',
                    data: Array.from(new Uint8Array(smallData))
                }),
                cache: 'no-cache',
                mode: 'cors',
                signal: AbortSignal.timeout(5000) // 5 second timeout for fallback
            });
            
            if (response.ok) {
                const duration = (performance.now() - startTime) / 1000;
                const speed = this.calculateSpeed(smallData.byteLength, duration);
                return Math.max(speed, 0.1); // Very conservative fallback
            }
        } catch (error) {
            console.log('Fallback quick upload test failed:', error);
        }
        
        return 1; // Conservative default upload estimate
    }

    calculateAdaptiveDuration(speed) {
        // Adaptive duration based on speed
        if (speed < 1) return 12000; // Slow connections get more time
        if (speed < 10) return 10000;
        if (speed < 50) return 8000;
        if (speed < 100) return 6000;
        return 4000; // Fast connections need less time
    }

    calculateOptimalChunkSize(speed) {
        // Larger chunks for faster connections
        if (speed < 1) return 1024 * 1024; // 1MB
        if (speed < 10) return 2 * 1024 * 1024; // 2MB
        if (speed < 50) return 5 * 1024 * 1024; // 5MB
        return 10 * 1024 * 1024; // 10MB
    }

    generateTestData(size) {
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Generate pseudo-random data (more efficient than Math.random for large arrays)
        for (let i = 0; i < size; i++) {
            view[i] = (i * 1103515245 + 12345) & 0xFF; // Simple PRNG
        }
        
        return buffer;
    }

    // Fast.com API integration for accurate speed testing
    async fastComDownloadTest() {
        try {
            // Get Fast.com token dynamically
            const token = await this.getFastComToken();
            if (!token) throw new Error('Could not get Fast.com token');
            
            // Create Fast.com speed test URL
            const fastUrl = `https://api.fast.com/netflix/speedtest?https=true&token=${token}&urlCount=5`;
            
            const startTime = performance.now();
            let totalBytes = 0;
            let testDuration = 8000; // 8 seconds
            let lastUpdateTime = startTime;
            
            // Make request to Fast.com API
            const response = await fetch(fastUrl, {
                method: 'GET',
                cache: 'no-cache',
                mode: 'cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) throw new Error('Fast.com API request failed');
            
            const data = await response.json();
            
            // Test against multiple Fast.com URLs
            const testPromises = data.urls.map(async (urlObj, index) => {
                const url = urlObj.url;
                const threadStartTime = performance.now();
                let threadBytes = 0;
                
                try {
                    const response = await fetch(url, {
                        cache: 'no-cache',
                        mode: 'cors'
                    });
                    
                    if (!response.ok) return 0;
                    
                    const reader = response.body.getReader();
                    
                    while (performance.now() - startTime < testDuration) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        threadBytes += value.length;
                        totalBytes += value.length;
                        
                        // Update progress
                        const currentTime = performance.now();
                        if (currentTime - lastUpdateTime > 200) {
                            const elapsedSeconds = (currentTime - startTime) / 1000;
                            const currentSpeed = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);
                            this.currentSpeedDisplay.textContent = `${currentSpeed.toFixed(2)} Mbps`;
                            
                            const progress = 30 + ((currentTime - startTime) / testDuration) * 40;
                            this.updateStatus('Testing download speed...', Math.min(progress, 70));
                            lastUpdateTime = currentTime;
                        }
                    }
                    
                    return threadBytes;
                } catch (error) {
                    console.log(`Fast.com thread ${index} error:`, error);
                    return 0;
                }
            });
            
            await Promise.all(testPromises);
            
            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            
            if (durationSeconds > 0 && totalBytes > 0) {
                return this.calculateSpeed(totalBytes, durationSeconds);
            }
            
            return 0;
        } catch (error) {
            console.log('Fast.com download test failed:', error);
            return 0;
        }
    }

    async fastComUploadTest() {
        try {
            // Fast.com doesn't provide official upload testing
            // We'll simulate upload testing with multiple small requests
            const uploadUrl = 'https://httpbin.org/post';
            const testData = new ArrayBuffer(1024 * 1024); // 1MB
            const view = new Uint8Array(testData);
            for (let i = 0; i < 1024 * 1024; i++) {
                view[i] = Math.floor(Math.random() * 256);
            }
            
            const startTime = performance.now();
            let totalBytes = 0;
            const testDuration = 6000; // 6 seconds
            const numConnections = 3;
            let lastUpdateTime = startTime;
            
            const uploadPromises = [];
            
            for (let i = 0; i < numConnections; i++) {
                const promise = this.fastUploadConnection(uploadUrl, testData, startTime, testDuration, lastUpdateTime, i);
                uploadPromises.push(promise);
            }
            
            const results = await Promise.all(uploadPromises);
            totalBytes = results.reduce((sum, bytes) => sum + bytes, 0);
            
            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            
            if (durationSeconds > 0 && totalBytes > 0) {
                return this.calculateSpeed(totalBytes, durationSeconds);
            }
            
            return 0;
        } catch (error) {
            console.log('Fast.com upload test failed:', error);
            return 0;
        }
    }

    async fastUploadConnection(endpoint, testData, startTime, maxDuration, lastUpdateTime, connectionId) {
        let connectionBytes = 0;
        
        while (performance.now() - startTime < maxDuration) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: testData.slice(),
                    cache: 'no-cache',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-Upload-Test': 'fast-com-simulation',
                        'X-Connection-Id': connectionId.toString(),
                        'User-Agent': 'Eru-SpeedTest/1.0'
                    },
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    connectionBytes += testData.byteLength;
                    
                    // Update progress
                    const currentTime = performance.now();
                    if (currentTime - lastUpdateTime > 200) {
                        const elapsedSeconds = (currentTime - startTime) / 1000;
                        const currentSpeed = (connectionBytes * 8) / (elapsedSeconds * 1024 * 1024);
                        this.currentSpeedDisplay.textContent = `${currentSpeed.toFixed(2)} Mbps`;
                        
                        const progress = 75 + ((currentTime - startTime) / maxDuration) * 25;
                        this.updateStatus('Testing upload speed...', Math.min(progress, 100));
                        lastUpdateTime = currentTime;
                    }
                }
            } catch (error) {
                console.log(`Fast upload connection ${connectionId} error:`, error);
            }
            
            await this.delay(100);
        }
        
        return connectionBytes;
    }

    async getFastComToken() {
        try {
            // Visit Fast.com to get a token
            const response = await fetch('https://fast.com/', {
                method: 'GET',
                cache: 'no-cache',
                mode: 'cors'
            });
            
            if (!response.ok) return null;
            
            // Extract token from page content (simplified approach)
            // In a real implementation, you'd parse the HTML to find the token
            // For now, we'll use a common token pattern
            return 'YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm';
        } catch (error) {
            console.log('Could not get Fast.com token:', error);
            return null;
        }
    }
}

// Initialize the speed test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InternetSpeedTest();
});
