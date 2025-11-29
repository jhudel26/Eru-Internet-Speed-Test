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
        
        // Rate and quality displays
        this.downloadRateDisplay = document.getElementById('download-rate');
        this.downloadQualityDisplay = document.getElementById('download-quality');
        this.uploadRateDisplay = document.getElementById('upload-rate');
        this.uploadQualityDisplay = document.getElementById('upload-quality');
        
        // Quality assessment displays
        this.browsingQualityScore = document.getElementById('browsing-quality-score');
        this.browsingQualityBar = document.getElementById('browsing-quality-bar');
        this.pageLoadTime = document.getElementById('page-load-time');
        this.videoCallQuality = document.getElementById('video-call-quality');
        this.multiTabPerformance = document.getElementById('multi-tab-performance');
        
        this.gamingQualityScore = document.getElementById('gaming-quality-score');
        this.gamingQualityBar = document.getElementById('gaming-quality-bar');
        this.gamingResponse = document.getElementById('gaming-response');
        this.gamingStability = document.getElementById('gaming-stability');
        this.bestGames = document.getElementById('best-games');
        this.gameCompatibilityList = document.getElementById('game-compatibility-list');
        
        this.streamingQualityScore = document.getElementById('streaming-quality-score');
        this.streamingQualityBar = document.getElementById('streaming-quality-bar');
        this.maxStreamingQuality = document.getElementById('max-streaming-quality');
        this.fourkSupport = document.getElementById('fourk-support');
        this.bufferFreeExperience = document.getElementById('buffer-free-experience');
        this.streamingServices = document.getElementById('streaming-services');
        
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
        
        // Reset test phases - restore original phase names from HTML
        this.testPhases.forEach(phase => {
            phase.classList.remove('phase-complete');
            // Get current data-phase and extract just the phase name
            const currentPhase = phase.getAttribute('data-phase');
            if (currentPhase) {
                const phaseName = currentPhase.split(' ')[0];
                if (['ping', 'download', 'upload', 'complete'].includes(phaseName)) {
                    phase.setAttribute('data-phase', phaseName);
                }
            }
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
        
        // Reset all test phases - restore original phase names
        this.testPhases.forEach(phase => {
            phase.classList.remove('phase-complete');
            // Restore original phase name (ping, download, upload, or complete)
            const currentPhase = phase.getAttribute('data-phase');
            if (currentPhase) {
                const phaseName = currentPhase.split(' ')[0];
                if (['ping', 'download', 'upload', 'complete'].includes(phaseName)) {
                    phase.setAttribute('data-phase', phaseName);
                }
            } else {
                // Fallback: try to determine from the element structure
                const phaseText = phase.textContent.toLowerCase();
                if (phaseText.includes('ping')) phase.setAttribute('data-phase', 'ping');
                else if (phaseText.includes('download')) phase.setAttribute('data-phase', 'download');
                else if (phaseText.includes('upload')) phase.setAttribute('data-phase', 'upload');
                else if (phaseText.includes('complete')) phase.setAttribute('data-phase', 'complete');
            }
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
        
        // Update rate and quality displays
        this.updateRateAndQualityDisplays();
        
        // Calculate and display quality assessments
        this.calculateAndDisplayQualityAssessments();
        
        // Mark all phases as complete
        this.testPhases.forEach(phase => {
            const originalPhase = phase.getAttribute('data-phase')?.split(' ')[0] || 'complete';
            phase.setAttribute('data-phase', `${originalPhase} complete`);
            phase.classList.add('phase-complete');
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
        
        // Animate quality scores
        setTimeout(() => {
            this.animateQualityScores();
        }, 500);
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
            // Set both the phase name and complete status for proper styling
            phaseElement.setAttribute('data-phase', `${phase} complete`);
            // Also add a class for easier targeting
            phaseElement.classList.add('phase-complete');
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
            // Mark ping phase as complete
            this.updateTestPhase('ping', 'complete');
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
        // Mark download phase as complete
        this.updateTestPhase('download', 'complete');
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
                // Mark upload phase as complete
                this.updateTestPhase('upload', 'complete');
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
        // Quick test with multiple reliable endpoints - remove GitHub (CORS issues)
        const testConfigs = [
            { url: 'https://speed.cloudflare.com/__down?bytes=1048576', size: 1048576 }, // 1MB
            { url: 'https://speed.cloudflare.com/__down?bytes=2097152', size: 2097152 }, // 2MB
            { url: 'https://httpbin.org/bytes/1048576', size: 1048576 }, // 1MB from httpbin
            { url: 'https://speed.cloudflare.com/__down?bytes=5242880', size: 5242880 }, // 5MB
            { url: 'https://httpbin.org/bytes/2097152', size: 2097152 } // 2MB from httpbin
        ];
        let bestSpeed = 0;
        
        for (const config of testConfigs) {
            try {
                const startTime = performance.now();
                
                const response = await fetch(config.url, { 
                    cache: 'no-cache',
                    mode: 'cors',
                    signal: AbortSignal.timeout(8000) // Increased timeout
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
        
        return Math.max(bestSpeed, 10); // Increased minimum to 10 Mbps
    }

    async quickUploadTest() {
        // Enhanced quick upload test optimized for high-speed connections
        console.log('Starting enhanced upload speed test...');
        
        // Method 1: XMLHttpRequest with progress tracking (most accurate)
        const xhrResults = await this.testUploadWithXHR();
        
        // Method 2: Fetch with timing estimation (as backup)
        const fetchResults = await this.testUploadWithFetch();
        
        // Method 3: Simple baseline test
        const baselineResults = await this.testUploadBaseline();
        
        // Combine results for accuracy
        const allResults = [
            ...xhrResults,
            ...fetchResults,
            ...baselineResults
        ].filter(result => result.speed > 0);
        
        if (allResults.length === 0) {
            console.log('All upload tests failed, using fallback');
            return 10; // Conservative fallback
        }
        
        // Use 90th percentile for high-speed connections (more accurate for fast connections)
        allResults.sort((a, b) => a.speed - b.speed);
        const percentile90Index = Math.floor(allResults.length * 0.9);
        const highSpeedEstimate = allResults[percentile90Index]?.speed || allResults[allResults.length - 1]?.speed;
        const medianSpeed = allResults[Math.floor(allResults.length / 2)].speed;
        
        // For very fast connections, use the higher estimate
        const estimatedSpeed = highSpeedEstimate > 100 ? highSpeedEstimate : medianSpeed;
        
        console.log(`Upload test results: ${allResults.length} measurements, median: ${medianSpeed.toFixed(2)} Mbps, 90th percentile: ${highSpeedEstimate.toFixed(2)} Mbps`);
        console.log('All results:', allResults.map(r => `${r.method}: ${r.speed.toFixed(2)} Mbps`));
        
        return Math.max(estimatedSpeed, 5); // Minimum 5 Mbps
    }
    
    async testUploadWithXHR() {
        // Optimized test sizes - smaller for faster calibration, adaptive for high speeds
        const testSizes = [
            2 * 1024 * 1024,   // 2MB - quick baseline
            4 * 1024 * 1024,   // 4MB - medium speed
            8 * 1024 * 1024    // 8MB - high speed detection (reduced from 30MB)
        ];
        // Use only most reliable endpoints
        const endpoints = [
            'https://httpbin.org/post',
            'https://jsonplaceholder.typicode.com/posts'
        ];
        const results = [];
        let bestSpeed = 0;
        
        // Test with smaller sizes first, then adapt
        for (const endpoint of endpoints) {
            for (const testSize of testSizes) {
                // Skip larger tests if we already have a good estimate
                if (testSize > 4 * 1024 * 1024 && bestSpeed > 0 && bestSpeed < 50) {
                    continue; // Don't test large files on slow connections
                }
                
                try {
                    const testData = this.generateTestData(testSize);
                    const uploadResult = await this.performQuickUpload(endpoint, testData);
                    
                    if (uploadResult.success) {
                        const speed = this.calculateSpeed(testData.byteLength, uploadResult.uploadDuration / 1000);
                        bestSpeed = Math.max(bestSpeed, speed);
                        results.push({
                            method: `XHR-${endpoint.split('/')[2]}`,
                            speed: speed,
                            size: testSize,
                            duration: uploadResult.uploadDuration,
                            timing: uploadResult.method
                        });
                        console.log(`XHR upload success: ${endpoint} (${testSize/1024/1024}MB) - ${speed.toFixed(2)} Mbps`);
                        
                        // Early exit if we get a very high speed (likely accurate)
                        if (speed > 200 && results.length >= 2) {
                            console.log('High speed detected, skipping remaining quick tests');
                            break;
                        }
                    } else {
                        console.log(`XHR upload failed: ${endpoint} - Status ${uploadResult.status}`);
                    }
                } catch (error) {
                    console.log(`XHR test failed: ${endpoint} - ${error.message}`);
                }
            }
            
            // Break early if we have enough results
            if (results.length >= 4 && bestSpeed > 50) {
                break;
            }
        }
        
        return results;
    }
    
    async testUploadWithFetch() {
        const testSize = 3 * 1024 * 1024; // 3MB - reduced for faster testing
        const endpoints = [
            'https://httpbin.org/post'
        ];
        const results = [];
        
        // Only test one endpoint to save time
        for (const endpoint of endpoints) {
            try {
                const testData = this.generateTestData(testSize);
                const startTime = performance.now();
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: testData,
                    cache: 'no-cache',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-Upload-Test': 'fetch-backup',
                        'Cache-Control': 'no-cache'
                    },
                    signal: AbortSignal.timeout(8000) // Reduced timeout to 8 seconds
                });
                
                if (response.ok) {
                    await response.text(); // Ensure completion
                    const endTime = performance.now();
                    const totalTime = endTime - startTime;
                    
                    // For uploads, upload is ~85% of total time
                    const estimatedUploadTime = totalTime * 0.85;
                    const speed = this.calculateSpeed(testData.byteLength, estimatedUploadTime / 1000);
                    
                    results.push({
                        method: `Fetch-${endpoint.split('/')[2]}`,
                        speed: speed,
                        size: testSize,
                        duration: estimatedUploadTime,
                        timing: 'estimated'
                    });
                    console.log(`Fetch upload success: ${endpoint} - ${speed.toFixed(2)} Mbps`);
                }
            } catch (error) {
                console.log(`Fetch test failed: ${endpoint} - ${error.message}`);
            }
        }
        
        return results;
    }
    
    async testUploadBaseline() {
        // Simple baseline test with smaller data for faster testing
        const testSize = 4 * 1024 * 1024; // 4MB - reduced from 10MB
        const results = [];
        
        try {
            const testData = this.generateTestData(testSize);
            const startTime = performance.now();
            
            // Use a reliable endpoint
            const response = await fetch('https://httpbin.org/anything', {
                method: 'POST',
                body: testData,
                cache: 'no-cache',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-Upload-Test': 'baseline',
                    'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(10000) // Reduced timeout to 10 seconds
            });
            
            if (response.ok) {
                await response.text();
                const endTime = performance.now();
                const totalTime = endTime - startTime;
                
                // For baseline, use 90% as upload estimate
                const estimatedUploadTime = totalTime * 0.9;
                const speed = this.calculateSpeed(testData.byteLength, estimatedUploadTime / 1000);
                
                results.push({
                    method: 'Baseline',
                    speed: speed,
                    size: testSize,
                    duration: estimatedUploadTime,
                    timing: 'conservative-estimate'
                });
                console.log(`Baseline upload success: ${speed.toFixed(2)} Mbps`);
            }
        } catch (error) {
            console.log(`Baseline test failed: ${error.message}`);
        }
        
        return results;
    }
    
    async performQuickUpload(endpoint, testData) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const requestStartTime = performance.now();
            let uploadStartTime = null;
            let uploadCompleteTime = null;
            let uploadStarted = false;
            let lastProgressTime = null;
            let lastProgressLoaded = 0;
            const progressSamples = [];
            
            // Track upload start
            xhr.upload.addEventListener('loadstart', () => {
                uploadStartTime = performance.now();
                uploadStarted = true;
            });
            
            // Track upload progress for accurate speed calculation
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const currentTime = performance.now();
                    if (lastProgressTime && lastProgressLoaded < event.loaded) {
                        const timeDelta = (currentTime - lastProgressTime) / 1000; // seconds
                        const bytesDelta = event.loaded - lastProgressLoaded;
                        if (timeDelta > 0) {
                            const instantSpeed = (bytesDelta * 8) / (timeDelta * 1024 * 1024); // Mbps
                            progressSamples.push(instantSpeed);
                        }
                    }
                    lastProgressTime = currentTime;
                    lastProgressLoaded = event.loaded;
                    
                    if (event.loaded === event.total) {
                        uploadCompleteTime = performance.now();
                    }
                }
            });
            
            xhr.upload.addEventListener('loadend', () => {
                if (!uploadCompleteTime) {
                    uploadCompleteTime = performance.now();
                }
            });
            
            xhr.addEventListener('load', () => {
                const requestEndTime = performance.now();
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Calculate upload duration using the most accurate method
                    let uploadDuration = 0;
                    
                    if (uploadStarted && uploadStartTime && uploadCompleteTime) {
                        // Method 1: Use upload start to upload end (most accurate)
                        uploadDuration = uploadCompleteTime - uploadStartTime;
                    } else if (uploadCompleteTime) {
                        // Method 2: Use request start to upload completion
                        uploadDuration = uploadCompleteTime - requestStartTime;
                    } else {
                        // Method 3: Estimate based on total request time (fallback)
                        const totalRequestTime = requestEndTime - requestStartTime;
                        uploadDuration = totalRequestTime * 0.85; // 85% for very fast connections
                    }
                    
                    // Use progress samples if available for more accurate speed
                    let calculatedSpeed = 0;
                    if (progressSamples.length > 0) {
                        // Use 90th percentile of progress samples for high-speed connections
                        progressSamples.sort((a, b) => a - b);
                        const percentile90Index = Math.floor(progressSamples.length * 0.9);
                        calculatedSpeed = progressSamples[percentile90Index] || progressSamples[progressSamples.length - 1];
                    }
                    
                    console.log(`Upload timing: Method=${uploadStarted && uploadStartTime ? 'direct' : 'estimated'}, Duration=${uploadDuration.toFixed(2)}ms, ProgressSamples=${progressSamples.length}, Status=${xhr.status}`);
                    
                    resolve({
                        success: true,
                        uploadDuration: Math.max(1, uploadDuration), // Minimum 1ms
                        status: xhr.status,
                        method: uploadStarted && uploadStartTime ? 'direct' : 'estimated',
                        progressSpeed: calculatedSpeed
                    });
                } else {
                    console.log(`Upload failed: Status=${xhr.status}`);
                    resolve({ success: false, uploadDuration: 0, status: xhr.status });
                }
            });
            
            xhr.addEventListener('error', (error) => {
                console.log('Upload XHR error:', error);
                resolve({ success: false, uploadDuration: 0 });
            });
            
            xhr.addEventListener('timeout', () => {
                console.log('Upload XHR timeout');
                resolve({ success: false, uploadDuration: 0 });
            });
            
            // Configure XHR for optimal upload testing with reasonable timeout
            xhr.timeout = 15000; // 15 second timeout (reduced from 30s for faster testing)
            xhr.open('POST', endpoint);
            
            // Set headers to prevent caching and ensure proper handling
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.setRequestHeader('X-Upload-Test', 'quick-calibration-enhanced');
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
            xhr.setRequestHeader('Pragma', 'no-cache');
            
            // Send the test data
            try {
                xhr.send(testData);
            } catch (error) {
                console.log('Send error:', error);
                resolve({ success: false, uploadDuration: 0 });
            }
        });
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
            // Enhanced upload test with multiple endpoints and better accuracy
            this.updateStatus('Calibrating upload test...', 75);
            const quickSpeed = await this.quickUploadTest();
            
            // Improved adaptive parameters based on connection analysis
            const optimalChunkSize = this.calculateOptimalUploadChunkSize(quickSpeed);
            const testDuration = this.calculateOptimalUploadDuration(quickSpeed);
            const numConnections = this.calculateOptimalUploadConnections(quickSpeed);
            
            console.log(`Enhanced upload: ${(optimalChunkSize / 1024 / 1024).toFixed(1)}MB chunks, ${numConnections} connections, ${(testDuration / 1000).toFixed(1)}s`);
            
            // Multiple diverse endpoints for reliability and accuracy
            const uploadEndpoints = [
                'https://httpbin.org/post',
                'https://httpbin.org/put', 
                'https://jsonplaceholder.typicode.com/posts',
                'https://reqres.in/api/users',
                'https://api.publicapis.org/entries',
                'https://httpbin.org/status/200',
                'https://httpbin.org/anything',
                'https://jsonblob.com/api/jsonBlob'
            ];
            
            // Generate optimized test data with better entropy
            const testData = this.generateOptimizedTestData(optimalChunkSize);
            
            const startTime = performance.now();
            const abortController = new AbortController();
            this.abortControllers.push(abortController);
            
            // Enhanced measurement system with better timing accuracy
            const uploadMeasurements = [];
            let totalBytes = 0;
            let lastUpdateTime = startTime;
            let consecutiveFailures = {};
            
            // Create parallel upload connections with enhanced error handling
            const uploadPromises = uploadEndpoints.slice(0, numConnections).map(async (endpoint, connectionId) => {
                const connectionMeasurements = [];
                let connectionBytes = 0;
                let requestCount = 0;
                let currentEndpoint = endpoint;
                let endpointIndex = connectionId;
                
                while (performance.now() - startTime < testDuration && this.testState === 'running') {
                    try {
                        // Use XMLHttpRequest for more accurate upload timing
                        const uploadResult = await this.performAccurateUpload(
                            uploadEndpoints[endpointIndex], 
                            testData, 
                            connectionId,
                            abortController.signal
                        );
                        
                        if (uploadResult.success) {
                            const chunkBytes = testData.byteLength;
                            connectionBytes += chunkBytes;
                            totalBytes += chunkBytes;
                            requestCount++;
                            
                            // Use progress-based speed if available (more accurate for high speeds)
                            const effectiveDuration = uploadResult.progressSpeed > 0 && uploadResult.progressSpeed > (chunkBytes * 8) / (uploadResult.uploadDuration / 1000 * 1024 * 1024) * 1.1
                                ? (chunkBytes * 8) / (uploadResult.progressSpeed * 1024 * 1024) * 1000
                                : uploadResult.uploadDuration;
                            
                            // Store enhanced measurement
                            const measurement = {
                                bytes: chunkBytes,
                                duration: effectiveDuration,
                                timestamp: uploadResult.endTime - startTime,
                                connectionId: connectionId,
                                endpoint: uploadEndpoints[endpointIndex],
                                serverLatency: uploadResult.serverLatency,
                                progressSpeed: uploadResult.progressSpeed || 0
                            };
                            
                            connectionMeasurements.push(measurement);
                            uploadMeasurements.push(measurement);
                            
                            // Reset failure counter on success
                            consecutiveFailures[endpointIndex] = 0;
                            
                            // Update UI (throttled for performance)
                            const currentTime = performance.now();
                            if (currentTime - lastUpdateTime > 150) {
                                const elapsedSeconds = (currentTime - startTime) / 1000;
                                const currentSpeed = this.calculateEnhancedUploadSpeed(
                                    uploadMeasurements.slice(-30), // Last 30 measurements
                                    elapsedSeconds
                                );
                                
                                this.currentSpeedDisplay.textContent = currentSpeed.toFixed(2);
                                
                                const progress = 75 + ((currentTime - startTime) / testDuration) * 25;
                                this.updateStatus('Testing upload speed...', Math.min(progress, 100));
                                lastUpdateTime = currentTime;
                            }
                            
                            // Adaptive delay based on upload performance
                            await this.adaptiveUploadDelay(uploadResult.uploadDuration, quickSpeed);
                        } else {
                            // Handle failure with endpoint rotation
                            consecutiveFailures[endpointIndex] = (consecutiveFailures[endpointIndex] || 0) + 1;
                            if (consecutiveFailures[endpointIndex] >= 3) {
                                // Switch to next endpoint
                                endpointIndex = (endpointIndex + 1) % uploadEndpoints.length;
                                consecutiveFailures[endpointIndex] = 0;
                                console.log(`Connection ${connectionId}: switching to endpoint ${uploadEndpoints[endpointIndex]}`);
                            }
                            await this.delay(100); // Brief delay before retry
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') break;
                        console.log(`Upload connection ${connectionId} error: ${error.message}`);
                        await this.delay(200);
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
            
            // Enhanced final calculation with multiple methods
            const finalSpeed = this.calculateEnhancedFinalSpeed(uploadMeasurements, durationSeconds);
            
            const totalResultBytes = results.reduce((sum, r) => sum + r.bytes, 0);
            const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
            
            console.log(`Enhanced upload: ${(totalResultBytes / 1024 / 1024).toFixed(2)}MB in ${durationSeconds.toFixed(2)}s = ${finalSpeed.toFixed(2)} Mbps (${totalRequests} requests)`);
            
            return Math.max(1, finalSpeed); // Minimum 1 Mbps to show some result
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Upload test error:', error);
            }
            throw error;
        }
    }
    
    // Enhanced upload calculation methods optimized for high-speed connections (400+ Mbps)
    calculateOptimalUploadChunkSize(speedMbps) {
        // Significantly increased chunk sizes for high-speed connections
        if (speedMbps < 2) return 512 * 1024; // 512KB for very slow
        if (speedMbps < 5) return 1 * 1024 * 1024; // 1MB for slow
        if (speedMbps < 10) return 2 * 1024 * 1024; // 2MB for medium
        if (speedMbps < 25) return 5 * 1024 * 1024; // 5MB for fast
        if (speedMbps < 50) return 10 * 1024 * 1024; // 10MB for very fast
        if (speedMbps < 100) return 20 * 1024 * 1024; // 20MB for ultra-fast
        if (speedMbps < 200) return 30 * 1024 * 1024; // 30MB for gigabit
        if (speedMbps < 400) return 40 * 1024 * 1024; // 40MB for multi-gigabit
        return 50 * 1024 * 1024; // 50MB for extreme speeds (max)
    }
    
    calculateOptimalUploadDuration(speedMbps) {
        // Longer duration for more accurate measurements, especially for high speeds
        if (speedMbps < 5) return 15000; // 15s for slow connections
        if (speedMbps < 25) return 12000; // 12s for medium
        if (speedMbps < 100) return 10000; // 10s for fast
        if (speedMbps < 200) return 12000; // 12s for very fast (need more time to saturate)
        if (speedMbps < 400) return 15000; // 15s for gigabit (need even more time)
        return 18000; // 18s for multi-gigabit (maximum accuracy)
    }
    
    calculateOptimalUploadConnections(speedMbps) {
        // More connections for high-speed connections to saturate bandwidth
        if (speedMbps < 5) return 2; // 2 connections for slow
        if (speedMbps < 25) return 3; // 3 connections for medium
        if (speedMbps < 50) return 4; // 4 connections for fast
        if (speedMbps < 100) return 6; // 6 connections for very fast
        if (speedMbps < 200) return 8; // 8 connections for ultra-fast
        if (speedMbps < 400) return 10; // 10 connections for gigabit
        return 12; // 12 connections for multi-gigabit (max)
    }
    
    generateOptimizedTestData(size) {
        // Generate data with better entropy for accurate measurement
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Use multiple patterns to prevent compression optimization
        const patterns = [
            // Pseudo-random pattern
            (i) => (i * 1103515245 + 12345) & 0xFF,
            // Alternating pattern
            (i) => (i % 2 === 0) ? 0xAA : 0x55,
            // Sequential pattern with wrap-around
            (i) => i & 0xFF,
            // Inverse pattern
            (i) => 0xFF - (i & 0xFF)
        ];
        
        const patternIndex = size % patterns.length;
        const pattern = patterns[patternIndex];
        
        for (let i = 0; i < size; i++) {
            view[i] = pattern(i);
        }
        
        return buffer;
    }
    
    async performAccurateUpload(endpoint, testData, connectionId, signal) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const startTime = performance.now();
            let uploadStartTime = null;
            let uploadEndTime = null;
            let lastProgressTime = null;
            let lastProgressLoaded = 0;
            const progressSamples = [];
            
            // Track upload start for accurate timing
            xhr.upload.addEventListener('loadstart', () => {
                uploadStartTime = performance.now();
            });
            
            // Track upload progress for real-time speed calculation
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const currentTime = performance.now();
                    if (lastProgressTime && lastProgressLoaded < event.loaded) {
                        const timeDelta = (currentTime - lastProgressTime) / 1000; // seconds
                        const bytesDelta = event.loaded - lastProgressLoaded;
                        if (timeDelta > 0.01) { // Only sample if meaningful time has passed
                            const instantSpeed = (bytesDelta * 8) / (timeDelta * 1024 * 1024); // Mbps
                            progressSamples.push(instantSpeed);
                        }
                    }
                    lastProgressTime = currentTime;
                    lastProgressLoaded = event.loaded;
                }
            });
            
            xhr.upload.addEventListener('loadend', () => {
                uploadEndTime = performance.now();
            });
            
            xhr.addEventListener('load', () => {
                const endTime = performance.now();
                const uploadDuration = (uploadEndTime || endTime) - (uploadStartTime || startTime);
                const serverLatency = endTime - (uploadEndTime || uploadStartTime || startTime);
                
                // Use progress samples for more accurate speed if available
                let progressBasedSpeed = 0;
                if (progressSamples.length > 5) {
                    // Use 90th percentile for high-speed connections
                    progressSamples.sort((a, b) => a - b);
                    const percentile90Index = Math.floor(progressSamples.length * 0.9);
                    progressBasedSpeed = progressSamples[percentile90Index] || progressSamples[progressSamples.length - 1];
                }
                
                resolve({
                    success: xhr.status >= 200 && xhr.status < 300,
                    uploadDuration: Math.max(1, uploadDuration), // Minimum 1ms
                    serverLatency: serverLatency,
                    endTime: endTime,
                    status: xhr.status,
                    progressSpeed: progressBasedSpeed
                });
            });
            
            xhr.addEventListener('error', () => {
                resolve({ success: false, uploadDuration: 0 });
            });
            
            xhr.addEventListener('timeout', () => {
                resolve({ success: false, uploadDuration: 0 });
            });
            
            // Configure XHR for upload testing with reasonable timeout
            xhr.timeout = 15000; // 15 second timeout (reduced from 30s for faster testing)
            xhr.open('POST', endpoint);
            
            // Set appropriate headers
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.setRequestHeader('X-Upload-Test', 'enhanced-accuracy');
            xhr.setRequestHeader('X-Connection-Id', connectionId.toString());
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('Pragma', 'no-cache');
            
            // Send the test data
            xhr.send(testData);
            
            // Handle abort signal
            if (signal) {
                signal.addEventListener('abort', () => {
                    xhr.abort();
                    resolve({ success: false, uploadDuration: 0 });
                });
            }
        });
    }
    
    calculateEnhancedUploadSpeed(measurements, totalTime) {
        if (measurements.length === 0) return 0;
        
        // Use median to reduce impact of outliers
        const speeds = measurements.map(m => 
            (m.bytes * 8) / (m.duration / 1000 * 1024 * 1024)
        ).sort((a, b) => a - b);
        
        const medianIndex = Math.floor(speeds.length / 2);
        return speeds[medianIndex] || 0;
    }
    
    calculateEnhancedFinalSpeed(measurements, totalDuration) {
        if (measurements.length === 0) return 0;
        
        // Use progress-based speeds if available (most accurate for high-speed connections)
        const progressSpeeds = measurements
            .filter(m => m.progressSpeed > 0)
            .map(m => m.progressSpeed)
            .sort((a, b) => a - b);
        
        // Method 1: Overall average
        const totalBytes = measurements.reduce((sum, m) => sum + m.bytes, 0);
        const overallSpeed = this.calculateSpeed(totalBytes, totalDuration);
        
        // Method 2: Median of individual measurements (more stable)
        const individualSpeeds = measurements.map(m => 
            (m.bytes * 8) / (m.duration / 1000 * 1024 * 1024)
        ).sort((a, b) => a - b);
        const medianSpeed = individualSpeeds[Math.floor(individualSpeeds.length / 2)] || 0;
        
        // Method 3: Steady-state (last 70% of measurements)
        let steadyStateSpeed = 0;
        if (measurements.length >= 10) {
            const steadyState = measurements.slice(Math.floor(measurements.length * 0.3));
            const steadyBytes = steadyState.reduce((sum, m) => sum + m.bytes, 0);
            const steadyTime = steadyState[steadyState.length - 1].timestamp - steadyState[0].timestamp;
            if (steadyTime > 0) {
                steadyStateSpeed = this.calculateSpeed(steadyBytes, steadyTime / 1000);
            }
        }
        
        // Method 4: Progress-based speed (most accurate for high speeds)
        let progressBasedSpeed = 0;
        if (progressSpeeds.length > 0) {
            // Use 90th percentile of progress speeds for high-speed connections
            const percentile90Index = Math.floor(progressSpeeds.length * 0.9);
            progressBasedSpeed = progressSpeeds[percentile90Index] || progressSpeeds[progressSpeeds.length - 1];
        }
        
        // Enhanced weighted combination - prioritize progress-based speed for high-speed connections
        if (progressBasedSpeed > 0 && progressBasedSpeed > overallSpeed * 0.8) {
            // If progress speed is significantly higher, it's more accurate
            return (progressBasedSpeed * 0.5 + steadyStateSpeed * 0.3 + medianSpeed * 0.2);
        } else if (steadyStateSpeed > 0 && medianSpeed > 0) {
            return (overallSpeed * 0.2 + steadyStateSpeed * 0.6 + medianSpeed * 0.2);
        } else if (medianSpeed > 0) {
            return (overallSpeed * 0.4 + medianSpeed * 0.6);
        }
        
        return overallSpeed;
    }
    
    async adaptiveUploadDelay(uploadDuration, estimatedSpeed) {
        // Adaptive delay based on actual upload performance
        if (uploadDuration < 100) {
            // Very fast upload - small delay to prevent server overload
            await this.delay(10);
        } else if (uploadDuration < 500) {
            // Fast upload - moderate delay
            await this.delay(25);
        } else if (uploadDuration < 2000) {
            // Medium upload - larger delay
            await this.delay(50);
        } else {
            // Slow upload - minimal delay as connection is already bottlenecked
            await this.delay(5);
        }
    }

    // Quality Assessment Methods
    calculateAndDisplayQualityAssessments() {
        this.calculateBrowsingQuality();
        this.calculateGamingQuality();
        this.calculateStreamingQuality();
    }

    calculateBrowsingQuality() {
        // Browsing quality based on download speed, ping, and jitter
        const speedScore = Math.min(100, (this.downloadSpeed / 100) * 100); // 100 Mbps = 100%
        const pingScore = Math.max(0, 100 - (this.ping / 2)); // 200ms = 0%
        const jitterScore = Math.max(0, 100 - (this.jitter * 2)); // 50ms = 0%
        
        const browsingScore = Math.round((speedScore * 0.5 + pingScore * 0.3 + jitterScore * 0.2));
        
        // Update browsing quality displays
        this.browsingQualityScore.textContent = browsingScore;
        this.browsingQualityBar.style.width = `${browsingScore}%`;
        
        // Add percentage sign if not present
        if (!this.browsingQualityScore.textContent.includes('/')) {
            // Already handled in HTML
        }
        
        // Calculate page load time estimate
        const pageLoadMs = Math.max(500, 2000 - (this.downloadSpeed * 10) + (this.ping * 2));
        this.pageLoadTime.textContent = pageLoadMs < 1000 ? `${Math.round(pageLoadMs)}ms` : `${(pageLoadMs/1000).toFixed(1)}s`;
        
        // Video call quality
        if (this.ping < 50 && this.jitter < 10) {
            this.videoCallQuality.textContent = 'Excellent';
        } else if (this.ping < 100 && this.jitter < 20) {
            this.videoCallQuality.textContent = 'Good';
        } else if (this.ping < 150 && this.jitter < 30) {
            this.videoCallQuality.textContent = 'Fair';
        } else {
            this.videoCallQuality.textContent = 'Poor';
        }
        
        // Multi-tab performance
        if (this.downloadSpeed >= 50) {
            this.multiTabPerformance.textContent = 'Excellent';
        } else if (this.downloadSpeed >= 25) {
            this.multiTabPerformance.textContent = 'Good';
        } else if (this.downloadSpeed >= 10) {
            this.multiTabPerformance.textContent = 'Fair';
        } else {
            this.multiTabPerformance.textContent = 'Slow';
        }
    }

    calculateGamingQuality() {
        // Gaming quality heavily weighted towards ping and jitter
        const pingScore = Math.max(0, 100 - (this.ping / 1.5)); // 150ms = 0%
        const jitterScore = Math.max(0, 100 - (this.jitter * 3)); // 33ms = 0%
        const speedScore = Math.min(100, (this.downloadSpeed / 50) * 100); // 50 Mbps = 100%
        
        const gamingScore = Math.round((pingScore * 0.5 + jitterScore * 0.3 + speedScore * 0.2));
        
        // Update gaming quality displays
        this.gamingQualityScore.textContent = gamingScore;
        this.gamingQualityBar.style.width = `${gamingScore}%`;
        
        // Response time classification
        if (this.ping < 20) {
            this.gamingResponse.textContent = 'Instant';
        } else if (this.ping < 50) {
            this.gamingResponse.textContent = 'Excellent';
        } else if (this.ping < 100) {
            this.gamingResponse.textContent = 'Good';
        } else if (this.ping < 150) {
            this.gamingResponse.textContent = 'Fair';
        } else {
            this.gamingResponse.textContent = 'Poor';
        }
        
        // Stability assessment
        if (this.jitter < 5) {
            this.gamingStability.textContent = 'Very Stable';
        } else if (this.jitter < 15) {
            this.gamingStability.textContent = 'Stable';
        } else if (this.jitter < 25) {
            this.gamingStability.textContent = 'Moderate';
        } else {
            this.gamingStability.textContent = 'Unstable';
        }
        
        // Game compatibility and recommendations
        this.updateGameCompatibility(gamingScore);
    }

    updateGameCompatibility(gamingScore) {
        const games = [
            { name: 'CS:GO/Valorant', ping: '<30ms', speed: '5 Mbps', compatible: this.ping < 30 && this.jitter < 10 },
            { name: 'League of Legends', ping: '<50ms', speed: '3 Mbps', compatible: this.ping < 50 && this.jitter < 15 },
            { name: 'Fortnite/Apex', ping: '<50ms', speed: '10 Mbps', compatible: this.ping < 50 && this.jitter < 15 },
            { name: 'Call of Duty', ping: '<60ms', speed: '15 Mbps', compatible: this.ping < 60 && this.jitter < 20 },
            { name: 'FIFA/EA Sports', ping: '<80ms', speed: '10 Mbps', compatible: this.ping < 80 && this.jitter < 25 },
            { name: 'World of Warcraft', ping: '<150ms', speed: '25 Mbps', compatible: this.ping < 150 && this.downloadSpeed > 25 },
            { name: 'Genshin Impact', ping: '<100ms', speed: '20 Mbps', compatible: this.ping < 100 && this.downloadSpeed > 20 }
        ];
        
        // Update best games for this connection
        const compatibleGames = games.filter(game => game.compatible);
        if (compatibleGames.length > 0) {
            this.bestGames.textContent = compatibleGames.slice(0, 2).map(g => g.name.split('/')[0]).join(', ');
        } else {
            this.bestGames.textContent = 'None suitable';
        }
        
        // Populate game compatibility list with enhanced UI
        this.gameCompatibilityList.innerHTML = games.map(game => `
            <div class="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 ${game.compatible ? 'bg-green-500/10 border border-green-500/20 hover:border-green-500/40 hover:bg-green-500/15' : 'bg-red-500/10 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/15'}">
                <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div class="w-2.5 h-2.5 rounded-full ${game.compatible ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400'} flex-shrink-0"></div>
                    <span class="text-xs sm:text-sm text-white font-medium truncate">${game.name}</span>
                </div>
                <div class="flex items-center space-x-2 text-xs text-gray-400 ml-2 flex-shrink-0">
                    <span class="font-mono">${game.ping}</span>
                    <span class="text-gray-600">•</span>
                    <span class="font-mono">${game.speed}</span>
                </div>
            </div>
        `).join('');
    }

    calculateStreamingQuality() {
        // Streaming quality primarily based on download speed
        const speedScore = Math.min(100, (this.downloadSpeed / 25) * 100); // 25 Mbps = 100%
        const stabilityScore = Math.max(0, 100 - (this.jitter * 2)); // 50ms jitter = 0%
        
        const streamingScore = Math.round((speedScore * 0.8 + stabilityScore * 0.2));
        
        // Update streaming quality displays
        this.streamingQualityScore.textContent = streamingScore;
        this.streamingQualityBar.style.width = `${streamingScore}%`;
        
        // Maximum streaming quality
        if (this.downloadSpeed >= 50) {
            this.maxStreamingQuality.textContent = '4K HDR';
        } else if (this.downloadSpeed >= 25) {
            this.maxStreamingQuality.textContent = '4K';
        } else if (this.downloadSpeed >= 15) {
            this.maxStreamingQuality.textContent = '1440p';
        } else if (this.downloadSpeed >= 8) {
            this.maxStreamingQuality.textContent = '1080p';
        } else if (this.downloadSpeed >= 3) {
            this.maxStreamingQuality.textContent = '720p';
        } else {
            this.maxStreamingQuality.textContent = '480p';
        }
        
        // 4K support
        this.fourkSupport.textContent = this.downloadSpeed >= 25 ? 'Yes' : 'No';
        
        // Buffer-free experience
        if (this.downloadSpeed >= 50 && this.jitter < 10) {
            this.bufferFreeExperience.textContent = 'Excellent';
        } else if (this.downloadSpeed >= 25 && this.jitter < 20) {
            this.bufferFreeExperience.textContent = 'Good';
        } else if (this.downloadSpeed >= 15 && this.jitter < 30) {
            this.bufferFreeExperience.textContent = 'Fair';
        } else {
            this.bufferFreeExperience.textContent = 'Poor';
        }
        
        // Streaming service support
        this.updateStreamingServices();
    }

    updateStreamingServices() {
        const services = [
            { name: 'Netflix', minSpeed: 15, recommended: 25, has4K: this.downloadSpeed >= 25 },
            { name: 'YouTube', minSpeed: 8, recommended: 20, has4K: this.downloadSpeed >= 20 },
            { name: 'Disney+', minSpeed: 10, recommended: 25, has4K: this.downloadSpeed >= 25 },
            { name: 'Prime Video', minSpeed: 5, recommended: 15, has4K: this.downloadSpeed >= 15 },
            { name: 'HBO Max', minSpeed: 10, recommended: 20, has4K: this.downloadSpeed >= 20 },
            { name: 'Apple TV+', minSpeed: 8, recommended: 15, has4K: this.downloadSpeed >= 15 }
        ];
        
        this.streamingServices.innerHTML = services.map(service => {
            const supported = this.downloadSpeed >= service.minSpeed;
            const quality = supported ? 
                (service.has4K ? '4K' : 'HD') : 
                'Not supported';
            
            return `
                <div class="text-center p-2 rounded-lg ${supported ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-gray-500/10 border border-gray-500/20'}">
                    <div class="text-xs text-white font-medium">${service.name}</div>
                    <div class="text-xs ${supported ? 'text-purple-400' : 'text-gray-500'} font-mono">${quality}</div>
                </div>
            `;
        }).join('');
    }

    animateQualityScores() {
        // Animate quality bars with smooth transitions
        const qualityBars = [
            { bar: this.browsingQualityBar, score: parseInt(this.browsingQualityScore.textContent) || 0 },
            { bar: this.gamingQualityBar, score: parseInt(this.gamingQualityScore.textContent) || 0 },
            { bar: this.streamingQualityBar, score: parseInt(this.streamingQualityScore.textContent) || 0 }
        ];
        
        qualityBars.forEach(({ bar, score }) => {
            if (bar && score > 0) {
                bar.style.transition = 'width 1.5s ease-out';
                bar.style.width = `${score}%`;
            }
        });
    }


}

// Initialize the speed test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InternetSpeedTest();
});
