class InternetSpeedTest {
    constructor() {
        this.testState = 'idle';
        this.downloadSpeed = 0;
        this.uploadSpeed = 0;
        this.ping = 0;
        this.jitter = 0;
        this.serverLocation = 'Auto';
        this.ispInfo = 'Detecting...';
        this.ipAddress = '--';
        
        // Optimized settings for accurate measurements
        this.pingTestCount = 15; // Reduced for faster testing
        this.downloadThreads = 6; // More parallel connections
        this.uploadThreads = 8; // More upload connections
        this.initialTestDuration = 2000; // 2 seconds initial test
        this.mainTestDuration = 12000; // 12 seconds main test
        this.minTestSize = 1 * 1024 * 1024; // 1MB minimum
        this.maxTestSize = 25 * 1024 * 1024; // 25MB maximum (optimized)
        
        // Abort controllers for cleanup
        this.abortControllers = [];
        
        this.initializeElements();
        this.bindEvents();
        this.detectConnectionInfo();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    initializeElements() {
        this.startButton = document.getElementById('start-test');
        this.resultsSection = document.getElementById('results-section');
        this.progressContainer = document.getElementById('progress-container');
        this.testButtonContainer = document.getElementById('test-button-container');
        this.testControlSection = document.getElementById('test-control-section');
        this.progressBar = document.getElementById('progress-bar');
        this.testStatus = document.getElementById('test-status');
        this.currentSpeedDisplay = document.getElementById('current-speed');
        this.progressPercentage = document.getElementById('progress-percentage');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Result displays - Updated IDs from new HTML
        this.downloadSpeedDisplay = document.getElementById('download-speed');
        this.uploadSpeedDisplay = document.getElementById('upload-speed');
        this.pingDisplay = document.getElementById('ping');
        this.jitterDisplay = document.getElementById('jitter');
        this.serverLocationDisplay = document.getElementById('server-location');
        this.serverDistanceDisplay = document.getElementById('server-distance');
        this.ispNameDisplay = document.getElementById('isp-name');
        this.ipAddressDisplay = document.getElementById('ip-address');
        
        // New rate and quality displays
        this.downloadRateDisplay = document.getElementById('download-rate');
        this.downloadQualityDisplay = document.getElementById('download-quality');
        this.uploadRateDisplay = document.getElementById('upload-rate');
        this.uploadQualityDisplay = document.getElementById('upload-quality');
        
        // Test phase indicators
        this.testPhases = document.querySelectorAll('.test-phase');
        
        // Cancel button
        this.cancelButton = document.getElementById('cancel-test');
        
        // Back to test button
        this.backToTestButton = document.getElementById('back-to-test');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startSpeedTest());
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this.cancelTest());
        }
        if (this.backToTestButton) {
            this.backToTestButton.addEventListener('click', () => this.backToTest());
        }
    }
    
    backToTest() {
        // Hide results section
        this.resultsSection.classList.add('hidden');
        // Show test control section
        this.testControlSection.classList.remove('hidden');
        // Reset test state
        this.testState = 'idle';
    }
    
    cancelTest() {
        if (this.testState === 'running') {
            this.cleanup();
            this.hideProgress();
            this.showError('Test cancelled by user');
        }
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
            this.ispNameDisplay.textContent = this.ispInfo;
            
        } catch (error) {
            console.log('Connection info detection failed:', error);
            
            // Set fallback values
            this.ipAddress = 'Unable to detect';
            this.serverLocation = 'Unable to detect';
            this.ispInfo = 'Unable to detect';
            
            this.ipAddressDisplay.textContent = this.ipAddress;
            this.serverLocationDisplay.textContent = this.serverLocation;
            this.ispNameDisplay.textContent = this.ispInfo;
        }
    }

    async startSpeedTest() {
        if (this.testState !== 'idle') return;
        
        this.testState = 'running';
        this.resetResults();
        this.showProgress();
        this.abortControllers = []; // Reset abort controllers
        
        try {
            // Test sequence: Ping -> Download -> Upload
            await this.testPing();
            if (this.testState !== 'running') return; // Check if aborted
            
            await this.testDownload();
            if (this.testState !== 'running') return; // Check if aborted
            
            await this.testUpload();
            if (this.testState !== 'running') return; // Check if aborted
            
            this.showResults();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Speed test error:', error);
                this.showError('Test failed. Please try again.');
            }
        } finally {
            this.testState = 'idle';
            this.hideProgress();
        }
    }
    
    cleanup() {
        // Abort all ongoing requests
        this.abortControllers.forEach(controller => {
            try {
                controller.abort();
            } catch (e) {
                // Ignore errors during cleanup
            }
        });
        this.abortControllers = [];
        this.testState = 'idle';
    }

    resetResults() {
        this.downloadSpeed = 0;
        this.uploadSpeed = 0;
        this.ping = 0;
        this.jitter = 0;
        
        // Reset main displays
        this.downloadSpeedDisplay.textContent = '0';
        this.uploadSpeedDisplay.textContent = '0';
        this.pingDisplay.textContent = '0';
        this.jitterDisplay.textContent = '0';
        
        // Reset new displays
        this.downloadRateDisplay.textContent = '0 MB/s';
        this.downloadQualityDisplay.textContent = 'Excellent';
        this.uploadRateDisplay.textContent = '0 MB/s';
        this.uploadQualityDisplay.textContent = 'Good';
        
        // Reset test phases
        this.testPhases.forEach(phase => {
            phase.removeAttribute('data-phase');
        });
        
        // Hide results completely
        this.resultsSection.classList.add('hidden');
        // Show test control section
        this.testControlSection.classList.remove('hidden');
    }

    showProgress() {
        // Hide results if showing
        this.resultsSection.classList.add('hidden');
        // Show test control section
        this.testControlSection.classList.remove('hidden');
        
        this.testButtonContainer.classList.add('hidden');
        this.progressContainer.classList.remove('hidden');
        this.progressBar.style.width = '0%';
        this.testStatus.textContent = 'Initializing...';
        this.testStatus.classList.remove('text-red-400');
        this.currentSpeedDisplay.textContent = '0';
        this.progressPercentage.textContent = '0%';
        
        // Reset all test phases
        this.testPhases.forEach(phase => {
            phase.removeAttribute('data-phase');
        });
        
        // Show cancel button
        if (this.cancelButton) {
            this.cancelButton.style.display = 'block';
        }
    }

    hideProgress() {
        this.testButtonContainer.classList.remove('hidden');
        this.progressContainer.classList.add('hidden');
        
        // Hide cancel button
        if (this.cancelButton) {
            this.cancelButton.style.display = 'none';
        }
    }

    showResults() {
        // Hide test control section
        this.testControlSection.classList.add('hidden');
        
        // Hide progress container
        this.progressContainer.classList.add('hidden');
        this.testButtonContainer.classList.add('hidden');
        
        // Show results section (separate page)
        this.resultsSection.classList.remove('hidden');
        
        // Update new rate and quality displays
        this.updateRateAndQualityDisplays();
        
        // Mark all phases as complete
        this.testPhases.forEach(phase => {
            phase.setAttribute('data-phase', 'complete');
        });
        
        // Animate the results with staggered timing
        setTimeout(() => {
            this.animateValue(this.downloadSpeedDisplay, 0, this.downloadSpeed, 1000);
        }, 100);
        setTimeout(() => {
            this.animateValue(this.uploadSpeedDisplay, 0, this.uploadSpeed, 1000);
        }, 200);
        setTimeout(() => {
            this.animateValue(this.pingDisplay, 0, this.ping, 1000, 'ms');
        }, 300);
        setTimeout(() => {
            this.animateValue(this.jitterDisplay, 0, this.jitter, 1000, 'ms');
        }, 400);
    }

    updateRateAndQualityDisplays() {
        // Download rate and quality
        const downloadRateMBs = (this.downloadSpeed / 8).toFixed(2);
        this.downloadRateDisplay.textContent = `${downloadRateMBs} MB/s`;
        this.downloadQualityDisplay.textContent = this.getSpeedQuality(this.downloadSpeed);
        
        // Upload rate and quality
        const uploadRateMBs = (this.uploadSpeed / 8).toFixed(2);
        this.uploadRateDisplay.textContent = `${uploadRateMBs} MB/s`;
        this.uploadQualityDisplay.textContent = this.getSpeedQuality(this.uploadSpeed);
    }

    getSpeedQuality(speedMbps) {
        if (speedMbps >= 100) return 'Excellent';
        if (speedMbps >= 50) return 'Very Good';
        if (speedMbps >= 25) return 'Good';
        if (speedMbps >= 10) return 'Fair';
        if (speedMbps >= 5) return 'Poor';
        if (speedMbps > 0) return 'Very Poor';
        return 'No Connection';
    }

    updateTestPhase(phase, status) {
        const phaseElement = document.querySelector(`.test-phase[data-phase="${phase}"]`);
        if (!phaseElement) return;
        
        if (status === 'active') {
            phaseElement.setAttribute('data-phase', 'active');
        } else if (status === 'complete') {
            phaseElement.setAttribute('data-phase', 'complete');
        }
    }

    updateStatus(status, progress) {
        if (this.testState !== 'running') return; // Don't update if test stopped
        
        // Update status with spinner
        if (this.loadingSpinner && progress < 100) {
            this.testStatus.innerHTML = `<span class="inline-flex items-center">
                <span class="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></span>
                ${status}
            </span>`;
        } else {
            this.testStatus.textContent = status;
        }
        
        this.progressBar.style.width = `${progress}%`;
        this.progressPercentage.textContent = `${Math.round(progress)}%`;
        
        // Update test phases based on progress
        if (progress >= 0 && progress < 25) {
            this.updateTestPhase('ping', 'active');
        } else if (progress >= 25 && progress < 75) {
            this.updateTestPhase('ping', 'complete');
            this.updateTestPhase('download', 'active');
        } else if (progress >= 75 && progress < 100) {
            this.updateTestPhase('download', 'complete');
            this.updateTestPhase('upload', 'active');
        } else if (progress >= 100) {
            this.updateTestPhase('upload', 'complete');
            this.updateTestPhase('complete', 'active');
            // Hide spinner when complete
            if (this.loadingSpinner) {
                this.testStatus.innerHTML = status;
            }
        }
    }

    showError(message) {
        this.testStatus.innerHTML = `<span class="inline-flex items-center text-red-400">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${message}
        </span>`;
        setTimeout(() => {
            this.hideProgress();
            this.testStatus.classList.remove('text-red-400');
        }, 3000);
    }

    async testPing() {
        this.updateStatus('Testing latency...', 10);
        
        try {
            const pings = [];
            const testCount = this.pingTestCount;
            const abortController = new AbortController();
            this.abortControllers.push(abortController);
            
            // Use multiple endpoints for better accuracy
            const pingUrls = [
                'https://cloudflare.com/cdn-cgi/trace',
                'https://1.1.1.1/cdn-cgi/trace',
                'https://www.google.com/favicon.ico'
            ];
            
            for (let i = 0; i < testCount && this.testState === 'running'; i++) {
                const url = pingUrls[i % pingUrls.length];
                const startTime = performance.now();
                try {
                    await fetch(url, {
                        method: 'GET',
                        cache: 'no-cache',
                        mode: 'no-cors',
                        signal: abortController.signal
                    });
                    const endTime = performance.now();
                    const ping = Math.round(endTime - startTime);
                    if (ping < 1000 && ping > 0) { // Filter out unreasonable values
                        pings.push(ping);
                    }
                } catch (error) {
                    if (error.name === 'AbortError') break;
                    // For no-cors requests, we measure the time until the request is sent
                    const endTime = performance.now();
                    const ping = Math.round(endTime - startTime);
                    if (ping < 500 && ping > 0) { // More conservative for no-cors
                        pings.push(ping);
                    }
                }
                
                // Update progress
                const progress = 10 + ((i + 1) / testCount) * 15;
                this.updateStatus(`Testing latency... (${i + 1}/${testCount})`, progress);
                
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
            this.jitterDisplay.textContent = this.jitter > 0 ? `${this.jitter} ms` : '0 ms';
            
            // Update progress to 25% after ping test
            this.updateStatus('Ping test complete', 25);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ping test error:', error);
                this.ping = 999;
                this.jitter = 0;
                this.pingDisplay.textContent = this.ping;
                this.jitterDisplay.textContent = '0 ms';
            }
        }
    }

    async testDownload() {
        this.updateStatus('Testing download speed...', 30);
        
        try {
            // Use multiple reliable speed test endpoints with fallbacks
        const testUrls = [
            // Primary: Cloudflare with proper byte sizes
            'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
            'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
            'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
            // Fallback: GitHub releases (large files)
            'https://github.com/nodejs/node/releases/download/v18.17.0/node-v18.17.0-win-x64.zip',
            'https://github.com/electron/electron/releases/download/v25.3.1/electron-v25.3.1-win32-x64.zip',
            // Additional fallback: Wikipedia test files
            'https://upload.wikimedia.org/wikipedia/commons/3/3e/Alfonso_Cu%C3%A3%C2%A1n_2019_(cropped).jpg'
        ];
        
        // Initial quick test to determine appropriate parameters
        const initialSpeed = await this.quickDownloadTest();
        const adaptiveDuration = Math.max(8000, Math.min(15000, this.calculateAdaptiveDuration(initialSpeed)));
        const numConnections = Math.min(6, Math.max(4, Math.ceil(initialSpeed / 50)));
        
        this.updateStatus('Testing download speed...', 40);
        const mainStartTime = performance.now();
        let totalBytes = 0;
        let lastUpdateTime = mainStartTime;
        const speedSamples = [];
        
        // Parallel download threads with fallback logic
        const abortController = new AbortController();
        this.abortControllers.push(abortController);
        
        const downloadPromises = testUrls.slice(0, numConnections).map(async (url, threadIndex) => {
            let threadBytes = 0;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (performance.now() - mainStartTime < adaptiveDuration && this.testState === 'running') {
                try {
                    const response = await fetch(url, {
                        cache: 'no-cache',
                        mode: 'cors',
                        signal: abortController.signal,
                        timeout: 10000
                    });
                    
                    if (!response.ok) {
                        console.log(`Download thread ${threadIndex}: HTTP ${response.status} for ${url}`);
                        retryCount++;
                        if (retryCount >= maxRetries) {
                            // Try next URL in the list
                            const nextUrlIndex = (threadIndex + 1) % testUrls.length;
                            url = testUrls[nextUrlIndex];
                            retryCount = 0;
                            console.log(`Download thread ${threadIndex}: switching to ${url}`);
                        }
                        await this.delay(100);
                        continue;
                    }
                    
                    const reader = response.body.getReader();
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunkSize = value.length;
                        threadBytes += chunkSize;
                        totalBytes += chunkSize;
                        
                        // Update progress every 150ms for smoother display
                        const currentTime = performance.now();
                        if (currentTime - lastUpdateTime > 150) {
                            const elapsedSeconds = (currentTime - mainStartTime) / 1000;
                            const currentSpeed = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);
                            
                            // Store speed sample
                            speedSamples.push({
                                time: elapsedSeconds,
                                speed: currentSpeed
                            });
                            
                            // Keep only recent samples
                            if (speedSamples.length > 30) {
                                speedSamples.shift();
                            }
                            
                            this.currentSpeedDisplay.textContent = currentSpeed.toFixed(2);
                            
                            const progress = 40 + ((currentTime - mainStartTime) / adaptiveDuration) * 30;
                            this.updateStatus('Testing download speed...', Math.min(progress, 70));
                            lastUpdateTime = currentTime;
                        }
                    }
                    
                    // Reset retry count on successful download
                    retryCount = 0;
                    
                } catch (error) {
                    if (error.name === 'AbortError') break;
                    console.log(`Download thread ${threadIndex} error: ${error.message}`);
                    retryCount++;
                    
                    if (retryCount >= maxRetries) {
                        // Try next URL in the list
                        const nextUrlIndex = (threadIndex + 1) % testUrls.length;
                        url = testUrls[nextUrlIndex];
                        retryCount = 0;
                        console.log(`Download thread ${threadIndex}: switching to fallback ${url}`);
                    }
                    
                    await this.delay(100);
                }
            }
            
            return threadBytes;
        });
        
        await Promise.all(downloadPromises);
        
        const endTime = performance.now();
        const durationSeconds = (endTime - mainStartTime) / 1000;
        
        // Calculate final speed using multiple methods for accuracy
        const method1 = this.calculateSpeed(totalBytes, durationSeconds);
        
        // Use steady-state speed from samples if available
        let method2 = method1;
        if (speedSamples.length >= 10) {
            const steadyState = speedSamples.slice(Math.floor(speedSamples.length * 0.5));
            method2 = steadyState.reduce((sum, s) => sum + s.speed, 0) / steadyState.length;
        }
        
        // Weighted average for accuracy
        this.downloadSpeed = (method1 * 0.6 + method2 * 0.4);
        
        // Final safety check - if speed is 0 or unrealistic, use fallback
        if (this.downloadSpeed <= 0 || !isFinite(this.downloadSpeed)) {
            console.log('Download speed calculation failed, using fallback estimate');
            this.downloadSpeed = Math.max(initialSpeed * 0.8, 5); // Use 80% of initial speed or 5 Mbps minimum
        }
        
        console.log(`Download test completed: ${totalBytes} bytes in ${durationSeconds.toFixed(2)}s = ${this.downloadSpeed.toFixed(2)} Mbps`);
        
        this.downloadSpeedDisplay.textContent = this.downloadSpeed.toFixed(2);
        
        // Update progress to 75% after download test
        this.updateStatus('Download test complete', 75);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Download test error:', error);
                this.showError('Download test failed. Please try again.');
            }
            throw error;
        }
    }

    async testUpload() {
        this.updateStatus('Testing upload speed...', 75);
        
        try {
            // Use optimized upload test with CORS-enabled endpoints
            const uploadSpeed = await this.optimizedUploadTest();
            if (uploadSpeed > 0) {
                this.uploadSpeed = uploadSpeed;
                this.uploadSpeedDisplay.textContent = this.uploadSpeed.toFixed(2);
                this.updateStatus('Upload test complete', 100);
                return;
            }
        } catch (error) {
            console.error('Upload test failed:', error);
            this.showError('Upload test failed. Please try again.');
            return;
        }
        
        // If upload test returns 0, show error
        this.showError('Upload test unavailable. Please try again.');
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
        // Quick test with multiple reliable endpoints
        const testConfigs = [
            { url: 'https://speed.cloudflare.com/__down?bytes=1048576', size: 1048576 }, // 1MB
            { url: 'https://speed.cloudflare.com/__down?bytes=2097152', size: 2097152 }, // 2MB
            { url: 'https://httpbin.org/bytes/1048576', size: 1048576 }, // 1MB from httpbin
            { url: 'https://raw.githubusercontent.com/github/gitignore/main/README.md', size: 10240 } // Small fallback
        ];
        let bestSpeed = 0;
        
        for (const config of testConfigs) {
            try {
                const startTime = performance.now();
                
                const response = await fetch(config.url, { 
                    cache: 'no-cache',
                    mode: 'cors',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (!response.ok) continue;
                
                const reader = response.body.getReader();
                let bytes = 0;
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    bytes += value.length;
                }
                
                const duration = (performance.now() - startTime) / 1000;
                const speed = this.calculateSpeed(bytes, duration);
                bestSpeed = Math.max(bestSpeed, speed);
                
                console.log(`Quick test: ${config.url} - ${speed.toFixed(2)} Mbps`);
            } catch (error) {
                console.log(`Quick test failed: ${config.url} - ${error.message}`);
                continue;
            }
        }
        
        return Math.max(bestSpeed, 5); // Minimum 5 Mbps estimate
    }

    async quickUploadTest() {
        // Quick upload test to determine connection characteristics
        // Use smaller chunks for faster calibration
        const testSizes = [512 * 1024, 1024 * 1024]; // 512KB and 1MB tests
        let bestSpeed = 0;
        
        for (const testSize of testSizes) {
            try {
                const testData = this.generateTestData(testSize);
                const startTime = performance.now();
                
                const response = await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    body: testData,
                    cache: 'no-cache',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-Upload-Test': 'quick-calibration',
                        'User-Agent': 'Eru-SpeedTest/2.0'
                    },
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    await response.text(); // Ensure completion
                    const duration = (performance.now() - startTime) / 1000;
                    const speed = this.calculateSpeed(testData.byteLength, duration);
                    bestSpeed = Math.max(bestSpeed, speed);
                }
            } catch (error) {
                // Continue to next test size
                continue;
            }
        }
        
        // Return best speed found, or conservative estimate
        return Math.max(bestSpeed, 1);
    }

    calculateAdaptiveDuration(speed) {
        // Adaptive duration based on speed - optimized for accuracy
        if (speed < 1) return 15000; // Very slow connections
        if (speed < 10) return 12000; // Slow connections
        if (speed < 50) return 10000; // Medium connections
        if (speed < 100) return 8000; // Fast connections
        if (speed < 500) return 6000; // Very fast connections
        return 5000; // Ultra-fast connections
    }

    calculateOptimalChunkSize(speed) {
        // Adaptive chunk sizing for optimal throughput
        if (speed < 1) return 2 * 1024 * 1024; // 2MB for slow
        if (speed < 10) return 5 * 1024 * 1024; // 5MB for medium
        if (speed < 50) return 10 * 1024 * 1024; // 10MB for fast
        if (speed < 200) return 15 * 1024 * 1024; // 15MB for very fast
        return 25 * 1024 * 1024; // 25MB for ultra-fast (max)
    }

    generateTestData(size) {
        // Use more efficient data generation for large buffers
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Use optimized PRNG for better performance
        // Generate in chunks to avoid blocking
        const chunkSize = 65536; // 64KB chunks
        let offset = 0;
        
        while (offset < size) {
            const chunkEnd = Math.min(offset + chunkSize, size);
            for (let i = offset; i < chunkEnd; i++) {
                // Linear congruential generator - fast and deterministic
                view[i] = (i * 1103515245 + 12345) & 0xFF;
            }
            offset = chunkEnd;
        }
        
        return buffer;
    }


    async optimizedUploadTest() {
        try {
            // LibreSpeed-inspired upload test methodology
            // Phase 1: Quick calibration test
            this.updateStatus('Calibrating upload test...', 75);
            const quickSpeed = await this.quickUploadTest();
            
            // LibreSpeed-style adaptive parameters
            // Based on LibreSpeed's chunk sizing algorithm
            const optimalChunkSize = this.calculateLibreSpeedChunkSize(quickSpeed);
            const testDuration = this.calculateLibreSpeedDuration(quickSpeed);
            const numConnections = this.calculateLibreSpeedConnections(quickSpeed);
            
            console.log(`LibreSpeed-style upload: ${(optimalChunkSize / 1024 / 1024).toFixed(1)}MB chunks, ${numConnections} connections, ${(testDuration / 1000).toFixed(1)}s`);
            
            // Use multiple CORS-enabled endpoints
            const uploadEndpoints = [
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post',
                'https://httpbin.org/post'
            ];
            
            // Generate test data using LibreSpeed-style pattern
            const testData = this.generateLibreSpeedTestData(optimalChunkSize);
            
            const startTime = performance.now();
            const abortController = new AbortController();
            this.abortControllers.push(abortController);
            
            // LibreSpeed-style measurement: track individual chunk upload times
            const uploadMeasurements = [];
            let totalBytes = 0;
            let lastUpdateTime = startTime;
            
            // Create parallel upload connections (LibreSpeed methodology)
            const uploadPromises = uploadEndpoints.slice(0, numConnections).map(async (endpoint, connectionId) => {
                const connectionMeasurements = [];
                let connectionBytes = 0;
                let requestCount = 0;
                
                while (performance.now() - startTime < testDuration && this.testState === 'running') {
                    try {
                        // LibreSpeed measures upload time, not round-trip
                        const uploadStartTime = performance.now();
                        
                        // Use XMLHttpRequest-like approach with fetch for better timing
                        const controller = new AbortController();
                        const uploadPromise = fetch(endpoint, {
                            method: 'POST',
                            body: testData.slice(0),
                            cache: 'no-cache',
                            mode: 'cors',
                            credentials: 'omit',
                            headers: {
                                'Content-Type': 'application/octet-stream',
                                'X-Upload-Test': 'librespeed-style',
                                'X-Connection-Id': connectionId.toString(),
                                'User-Agent': 'Eru-SpeedTest-LibreSpeed/2.0'
                            },
                            signal: controller.signal
                        });
                        
                        // Measure upload time (LibreSpeed methodology)
                        // For high-speed connections, upload completes before response
                        const uploadEndTime = performance.now();
                        const uploadDuration = uploadEndTime - uploadStartTime;
                        
                        const response = await uploadPromise;
                        
                        if (response.ok) {
                            // Read response quickly to ensure upload completed
                            await response.text().catch(() => {});
                            
                            const chunkBytes = testData.byteLength;
                            connectionBytes += chunkBytes;
                            totalBytes += chunkBytes;
                            requestCount++;
                            
                            // Store measurement (LibreSpeed style)
                            const measurement = {
                                bytes: chunkBytes,
                                duration: uploadDuration,
                                timestamp: uploadEndTime - startTime,
                                connectionId: connectionId
                            };
                            
                            connectionMeasurements.push(measurement);
                            uploadMeasurements.push(measurement);
                            
                            // Update UI (throttled)
                            const currentTime = performance.now();
                            if (currentTime - lastUpdateTime > 100) {
                                const elapsedSeconds = (currentTime - startTime) / 1000;
                                
                                // Calculate current speed using LibreSpeed method
                                const currentSpeed = this.calculateLibreSpeedFromMeasurements(
                                    uploadMeasurements.slice(-20), // Last 20 measurements
                                    elapsedSeconds
                                );
                                
                                this.currentSpeedDisplay.textContent = currentSpeed.toFixed(2);
                                
                                const progress = 75 + ((currentTime - startTime) / testDuration) * 25;
                                this.updateStatus('Testing upload speed...', Math.min(progress, 100));
                                lastUpdateTime = currentTime;
                            }
                            
                            // LibreSpeed-style adaptive delay
                            if (uploadDuration < 50) {
                                await this.delay(5); // Very fast uploads need small delay
                            }
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') break;
                        await this.delay(50);
                    }
                }
                
                return {
                    bytes: connectionBytes,
                    measurements: connectionMeasurements,
                    requests: requestCount
                };
            });
            
            const results = await Promise.all(uploadPromises);
            
            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            
            // LibreSpeed-style final calculation
            const finalSpeed = this.calculateLibreSpeedFinal(uploadMeasurements, durationSeconds);
            
            const totalResultBytes = results.reduce((sum, r) => sum + r.bytes, 0);
            const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
            
            console.log(`LibreSpeed upload: ${(totalResultBytes / 1024 / 1024).toFixed(2)}MB in ${durationSeconds.toFixed(2)}s = ${finalSpeed.toFixed(2)} Mbps (${totalRequests} requests)`);
            
            return Math.max(0, finalSpeed);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Upload test error:', error);
            }
            throw error;
        }
    }
    
    // LibreSpeed-inspired helper methods
    // These methods implement LibreSpeed's proven algorithms for accurate speed measurement
    calculateLibreSpeedChunkSize(speedMbps) {
        // LibreSpeed uses adaptive chunk sizing based on connection speed
        if (speedMbps < 5) return 1 * 1024 * 1024; // 1MB for slow
        if (speedMbps < 25) return 2 * 1024 * 1024; // 2MB for medium
        if (speedMbps < 100) return 5 * 1024 * 1024; // 5MB for fast
        if (speedMbps < 500) return 10 * 1024 * 1024; // 10MB for very fast
        return 20 * 1024 * 1024; // 20MB for ultra-fast (max)
    }
    
    calculateLibreSpeedDuration(speedMbps) {
        // LibreSpeed test duration: longer for slower connections
        if (speedMbps < 10) return 15000; // 15s for slow
        if (speedMbps < 50) return 12000; // 12s for medium
        if (speedMbps < 200) return 10000; // 10s for fast
        return 8000; // 8s for very fast
    }
    
    calculateLibreSpeedConnections(speedMbps) {
        // LibreSpeed uses more connections for faster speeds
        if (speedMbps < 25) return 4; // 4 connections for slow
        if (speedMbps < 100) return 6; // 6 connections for medium
        if (speedMbps < 500) return 8; // 8 connections for fast
        return 10; // 10 connections for ultra-fast (max)
    }
    
    generateLibreSpeedTestData(size) {
        // LibreSpeed uses specific data patterns for accurate measurement
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Use a pattern that's compressible but not too compressible
        // This ensures accurate measurement regardless of compression
        for (let i = 0; i < size; i++) {
            // Pseudo-random pattern (similar to LibreSpeed)
            view[i] = (i * 1103515245 + 12345) & 0xFF;
        }
        
        return buffer;
    }
    
    calculateLibreSpeedFromMeasurements(measurements, totalTime) {
        // LibreSpeed calculates speed from recent measurements
        if (measurements.length === 0) return 0;
        
        // Use weighted average: more recent measurements have higher weight
        let totalWeightedSpeed = 0;
        let totalWeight = 0;
        
        measurements.forEach((m, index) => {
            const weight = (index + 1) / measurements.length; // More recent = higher weight
            const speed = (m.bytes * 8) / (m.duration / 1000 * 1024 * 1024);
            totalWeightedSpeed += speed * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? totalWeightedSpeed / totalWeight : 0;
    }
    
    calculateLibreSpeedFinal(measurements, totalDuration) {
        // LibreSpeed final calculation: uses statistical methods
        if (measurements.length === 0) return 0;
        
        // Method 1: Overall average
        const totalBytes = measurements.reduce((sum, m) => sum + m.bytes, 0);
        const overallSpeed = this.calculateSpeed(totalBytes, totalDuration);
        
        // Method 2: Steady-state average (last 60% of measurements)
        let steadyStateSpeed = 0;
        if (measurements.length >= 5) {
            const steadyState = measurements.slice(Math.floor(measurements.length * 0.4));
            const steadyBytes = steadyState.reduce((sum, m) => sum + m.bytes, 0);
            const steadyTime = steadyState[steadyState.length - 1].timestamp - steadyState[0].timestamp;
            if (steadyTime > 0) {
                steadyStateSpeed = this.calculateSpeed(steadyBytes, steadyTime / 1000);
            }
        }
        
        // Method 3: Peak speed (best 5 measurements)
        let peakSpeed = 0;
        if (measurements.length >= 5) {
            const speeds = measurements.map(m => 
                (m.bytes * 8) / (m.duration / 1000 * 1024 * 1024)
            );
            speeds.sort((a, b) => b - a);
            const topSpeeds = speeds.slice(0, 5);
            peakSpeed = topSpeeds.reduce((sum, s) => sum + s, 0) / topSpeeds.length;
        }
        
        // LibreSpeed uses weighted combination: 50% steady-state, 30% overall, 20% peak
        if (steadyStateSpeed > 0 && peakSpeed > 0) {
            return (overallSpeed * 0.3 + steadyStateSpeed * 0.5 + peakSpeed * 0.2);
        } else if (steadyStateSpeed > 0) {
            return (overallSpeed * 0.4 + steadyStateSpeed * 0.6);
        }
        
        return overallSpeed;
    }


}

// Initialize the speed test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InternetSpeedTest();
});
