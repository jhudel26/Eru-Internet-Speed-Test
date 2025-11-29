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
        
        // Speedtest.net inspired settings
        this.pingTestCount = 20; // Like Speedtest.net
        this.downloadThreads = 4; // Parallel connections
        this.uploadThreads = 4;
        this.initialTestDuration = 3000; // 3 seconds initial test
        this.mainTestDuration = 8000; // 8 seconds main test
        this.minTestSize = 1 * 1024 * 1024; // 1MB minimum
        this.maxTestSize = 100 * 1024 * 1024; // 100MB maximum
        
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
    }

    async testDownload() {
        this.updateStatus('Testing download speed...', 30);
        
        try {
            // Try Fast.com download test if available
            const fastDownloadSpeed = await this.fastComDownloadTest();
            if (fastDownloadSpeed > 0) {
                this.downloadSpeed = fastDownloadSpeed;
                this.downloadSpeedDisplay.textContent = this.downloadSpeed.toFixed(2);
                return;
            }
        } catch (error) {
            console.log('Fast.com download test failed, using fallback:', error);
        }
        
        // Fallback to reliable download endpoints
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
        const abortController = new AbortController();
        this.abortControllers.push(abortController);
        
        const downloadPromises = testUrls.map(async (url, threadIndex) => {
            const threadStartTime = performance.now();
            let threadBytes = 0;
            
            while (performance.now() - mainStartTime < adaptiveDuration && this.testState === 'running') {
                try {
                    const response = await fetch(url, {
                        cache: 'no-cache',
                        mode: 'cors',
                        signal: abortController.signal
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
                            this.currentSpeedDisplay.textContent = currentSpeed.toFixed(2);
                            
                            const progress = 40 + ((currentTime - mainStartTime) / adaptiveDuration) * 30;
                            this.updateStatus('Testing download speed...', Math.min(progress, 70));
                            lastUpdateTime = currentTime;
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') break;
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
        
        // Update progress to 75% after download test
        this.updateStatus('Download test complete', 75);
    }

    async testUpload() {
        this.updateStatus('Testing upload speed...', 75);
        
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
        const uploadEndpoints = [
            'https://httpbin.org/post',
            'https://httpbin.org/post',
            'https://httpbin.org/post',
            'https://httpbin.org/post'
        ];
        
        // Initial quick test to determine parameters
        const initialUploadSpeed = await this.quickUploadTest();
        const adaptiveDuration = this.calculateAdaptiveDuration(initialUploadSpeed);
        
        this.updateStatus('Testing upload speed...', 75);
        
        // Speedtest.net uses multiple concurrent connections
        const numConnections = Math.min(4, Math.max(2, Math.ceil(initialUploadSpeed / 10)));
        const chunkSize = this.calculateOptimalChunkSize(initialUploadSpeed);
        
        // Generate test data once and reuse
        const testData = this.generateTestData(chunkSize);
        
        let totalBytes = 0;
        const mainStartTime = performance.now();
        let lastUpdateTime = mainStartTime;
        
        // Create multiple upload connections (like Speedtest.net)
        const uploadPromises = [];
        
        for (let i = 0; i < numConnections; i++) {
            const endpoint = uploadEndpoints[i % uploadEndpoints.length];
            const promise = this.uploadConnection(endpoint, testData, mainStartTime, adaptiveDuration, lastUpdateTime, i);
            uploadPromises.push(promise);
        }
        
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        totalBytes = results.reduce((sum, bytes) => sum + bytes, 0);
        
        const endTime = performance.now();
        const durationSeconds = (endTime - mainStartTime) / 1000;
        
        // Calculate final speed using Speedtest.net methodology
        this.uploadSpeed = this.calculateSpeed(totalBytes, durationSeconds);
        
        this.uploadSpeedDisplay.textContent = this.uploadSpeed.toFixed(2);
        
        // Update progress to 100% after upload test
        this.updateStatus('Upload test complete', 100);
    }

    uploadConnection(endpoint, testData, startTime, maxDuration, lastUpdateTime, connectionId) {
        return new Promise(async (resolve) => {
            let connectionBytes = 0;
            const abortController = new AbortController();
            
            while (performance.now() - startTime < maxDuration) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        body: testData.slice(),
                        cache: 'no-cache',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'X-Upload-Test': 'speedtest',
                            'X-Connection-Id': connectionId.toString(),
                            'User-Agent': 'Eru-SpeedTest/1.0'
                        },
                        signal: abortController.signal
                    });
                    
                    if (response.ok) {
                        connectionBytes += testData.byteLength;
                        
                        // Update progress
                        const currentTime = performance.now();
                        if (currentTime - lastUpdateTime > 200) {
                            const elapsedSeconds = (currentTime - startTime) / 1000;
                            const currentSpeed = (connectionBytes * 8) / (elapsedSeconds * 1024 * 1024);
                            this.currentSpeedDisplay.textContent = currentSpeed.toFixed(2);
                            
                            const progress = 75 + ((currentTime - startTime) / maxDuration) * 25;
                            this.updateStatus('Testing upload speed...', Math.min(progress, 100));
                            lastUpdateTime = currentTime;
                        }
                    }
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.log(`Upload connection ${connectionId} error:`, error);
                    }
                    break;
                }
                
                await this.delay(50);
            }
            
            resolve(connectionBytes);
        });
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
            // Fast.com API is not publicly available, so we'll skip this
            // and use the fallback method instead
            return 0;
            
            // Note: The original implementation attempted to use Fast.com API
            // but it requires proper authentication and token management
            // which is not available in a client-side implementation
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
        // Fast.com token extraction is not reliable in client-side JavaScript
        // due to CORS and authentication requirements
        // This method is kept for compatibility but returns null
        return null;
    }
}

// Initialize the speed test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InternetSpeedTest();
});
