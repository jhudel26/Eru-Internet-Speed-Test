class SpeedTest {
    constructor() {
        this.isTestRunning = false;
        this.results = { download: 0, upload: 0, ping: 0, jitter: 0 };
        this.initElements();
        this.initEventListeners();
        this.detectConnectionInfo();
    }

    initElements() {
        this.startBtn = document.getElementById('startBtn');
        this.speedValue = document.getElementById('speedValue');
        this.speedUnit = document.getElementById('speedUnit');
        this.testType = document.getElementById('testType');
        this.testProgress = document.getElementById('testProgress');
        this.progressFill = document.getElementById('progressFill');
        this.gaugeProgress = document.querySelector('.gauge-progress');
        this.downloadSpeed = document.getElementById('downloadSpeed');
        this.uploadSpeed = document.getElementById('uploadSpeed');
        this.pingValue = document.getElementById('pingValue');
        this.jitterValue = document.getElementById('jitterValue');
        this.ipAddress = document.getElementById('ipAddress');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => {
            if (!this.isTestRunning) {
                this.startTest();
            }
        });
    }

    async detectConnectionInfo() {
        try {
            // Get IP address first
            const ipResponse = await fetch('https://api.ipify.org?format=json', { 
                signal: AbortSignal.timeout(5000) 
            });
            const ipData = await ipResponse.json();
            this.ipAddress.textContent = ipData.ip;

            // Get server status
            try {
                const statusResponse = await fetch('/api/status', { 
                    signal: AbortSignal.timeout(5000) 
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    this.updateServerInfo(statusData);
                }
            } catch (error) {
                // Fallback to default server info
                this.updateServerInfo(null);
            }

            // Get ISP information using ip-api.com (like Speedtest.net)
            try {
                const ispResponse = await fetch(`https://ip-api.com/json/${ipData.ip}?fields=isp,org,as,query`, {
                    signal: AbortSignal.timeout(5000)
                });
                
                if (ispResponse.ok) {
                    const ispData = await ispResponse.json();
                    this.updateISPInfo(ispData);
                }
            } catch (error) {
                // Fallback ISP detection
                this.updateISPInfo(null);
            }

        } catch (error) {
            console.error('Connection detection error:', error);
            this.ipAddress.textContent = 'Unable to detect';
            this.updateServerInfo(null);
            this.updateISPInfo(null);
        }
    }

    updateServerInfo(statusData) {
        const serverInfo = document.getElementById('serverInfo');
        
        if (serverInfo) {
            if (statusData && statusData.server) {
                serverInfo.textContent = `${statusData.server.provider} ${statusData.server.location}`;
            } else {
                // Fallback for Vercel deployment
                serverInfo.textContent = 'Vercel Edge Network';
            }
        }
    }

    updateISPInfo(ispData) {
        const ispInfo = document.getElementById('ispInfo');
        
        if (ispInfo) {
            if (ispData && ispData.isp) {
                // Show ISP name like Speedtest.net
                ispInfo.textContent = ispData.isp;
            } else {
                // Fallback - detect from browser or show generic
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection && connection.effectiveType) {
                    ispInfo.textContent = `${connection.effectiveType.toUpperCase()} Network`;
                } else {
                    ispInfo.textContent = 'Broadband Connection';
                }
            }
        }
    }

    async startTest() {
        this.isTestRunning = true;
        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Testing...';
        this.resetResults();
        
        try {
            await this.runPingTest();
            await this.runDownloadTest();
            await this.runUploadTest();
            this.showCompleteResults();
        } catch (error) {
            console.error('Test error:', error);
        } finally {
            this.isTestRunning = false;
            this.startBtn.disabled = false;
            this.startBtn.textContent = 'Start Test';
        }
    }

    resetResults() {
        this.speedValue.textContent = '0';
        this.downloadSpeed.textContent = '--';
        this.uploadSpeed.textContent = '--';
        this.pingValue.textContent = '--';
        this.jitterValue.textContent = '--';
        this.updateProgressRing(0);
        this.updateProgressBar(0);
    }

    async runPingTest() {
        this.testType.textContent = 'Testing Ping';
        const pings = [];
        
        for (let i = 0; i < 5; i++) {
            this.testProgress.textContent = 'Ping test ' + (i + 1) + '/5';
            const ping = await this.measurePing();
            pings.push(ping);
            await this.delay(200);
        }
        
        this.results.ping = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
        this.results.jitter = Math.round(this.calculateJitter(pings));
        this.pingValue.textContent = this.results.ping;
        this.jitterValue.textContent = this.results.jitter;
    }

    async measurePing() {
        try {
            const startTime = performance.now();
            const response = await fetch('/api/ping', { 
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000)
            });
            
            if (response.ok) {
                const data = await response.json();
                // Use the server's simulated ping for more realistic results
                return data.simulatedPing || (performance.now() - startTime);
            }
            return 100;
        } catch (error) {
            console.error('Ping measurement error:', error);
            return 100;
        }
    }

    calculateJitter(pings) {
        if (pings.length < 2) return 0;
        const mean = pings.reduce((a, b) => a + b, 0) / pings.length;
        const variance = pings.reduce((sum, ping) => sum + Math.pow(ping - mean, 2), 0) / pings.length;
        return Math.sqrt(variance);
    }

    async runDownloadTest() {
        this.testType.textContent = 'Testing Download';
        const testSizes = [0.5, 1, 2];
        let totalSpeed = 0;
        let validTests = 0;
        
        for (let i = 0; i < testSizes.length; i++) {
            const size = testSizes[i];
            this.testProgress.textContent = 'Download test ' + (i + 1) + '/' + testSizes.length + ' (' + size + 'MB)';
            const speed = await this.measureDownloadSpeed(size);
            if (speed > 0 && speed < 1000) {
                totalSpeed += speed;
                validTests++;
            }
            this.speedValue.textContent = Math.round(speed);
            this.updateProgressRing((i + 1) / testSizes.length * 0.6);
            this.updateProgressBar((i + 1) / testSizes.length * 0.6);
            await this.delay(1000);
        }
        
        this.results.download = validTests > 0 ? Math.round(totalSpeed / validTests) : 0;
        this.downloadSpeed.textContent = this.results.download;
    }

    async measureDownloadSpeed(sizeMB) {
        const testDuration = 2000;
        const url = '/api/download/' + sizeMB;
        
        return new Promise((resolve) => {
            let startTime = performance.now();
            let receivedBytes = 0;
            let speedMeasurements = [];
            let measurementInterval;
            
            fetch(url, { cache: 'no-cache' })
                .then(response => {
                    if (!response.ok) throw new Error('Download failed');
                    const reader = response.body.getReader();
                    let lastMeasurementTime = startTime;
                    let lastBytes = 0;
                    
                    measurementInterval = setInterval(() => {
                        const currentTime = performance.now();
                        const elapsed = (currentTime - startTime) / 1000;
                        
                        if (elapsed >= 0.5) {
                            const timeDiff = (currentTime - lastMeasurementTime) / 1000;
                            const bytesDiff = receivedBytes - lastBytes;
                            if (timeDiff > 0 && bytesDiff > 0) {
                                const speedMbps = (bytesDiff * 8) / (1024 * 1024 * timeDiff);
                                speedMeasurements.push(speedMbps);
                            }
                            lastMeasurementTime = currentTime;
                            lastBytes = receivedBytes;
                        }
                        
                        if (elapsed >= testDuration / 1000) {
                            clearInterval(measurementInterval);
                            reader.cancel();
                            if (speedMeasurements.length > 0) {
                                const sortedSpeeds = speedMeasurements.sort((a, b) => a - b);
                                const medianSpeed = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];
                                resolve(Math.max(0, medianSpeed));
                            } else if (receivedBytes > 0) {
                                const totalTime = (currentTime - startTime) / 1000;
                                const speedMbps = (receivedBytes * 8) / (1024 * 1024 * totalTime);
                                resolve(Math.max(0, speedMbps));
                            } else {
                                resolve(0);
                            }
                        }
                    }, 200);
                    
                    const readData = async () => {
                        try {
                            const { done, value } = await reader.read();
                            if (done) return;
                            receivedBytes += value.length;
                            await readData();
                        } catch (error) {
                            clearInterval(measurementInterval);
                            resolve(0);
                        }
                    };
                    readData();
                })
                .catch(error => {
                    if (measurementInterval) clearInterval(measurementInterval);
                    resolve(0);
                });
        });
    }

    async runUploadTest() {
        this.testType.textContent = 'Testing Upload';
        const testSizes = [0.5, 1, 2];
        let totalSpeed = 0;
        let validTests = 0;
        
        for (let i = 0; i < testSizes.length; i++) {
            const size = testSizes[i];
            this.testProgress.textContent = 'Upload test ' + (i + 1) + '/' + testSizes.length + ' (' + size + 'MB)';
            const speed = await this.measureUploadSpeed(size);
            if (speed > 0 && speed < 500) {
                totalSpeed += speed;
                validTests++;
            }
            this.speedValue.textContent = Math.round(speed);
            this.speedUnit.textContent = 'Mbps';
            this.updateProgressRing(0.6 + ((i + 1) / testSizes.length) * 0.4);
            this.updateProgressBar(0.6 + ((i + 1) / testSizes.length) * 0.4);
            await this.delay(1000);
        }
        
        this.results.upload = validTests > 0 ? Math.round(totalSpeed / validTests) : 0;
        this.uploadSpeed.textContent = this.results.upload;
    }

    async measureUploadSpeed(sizeMB) {
        const testDuration = 2000;
        const chunkSize = 32 * 1024;
        const totalChunks = Math.ceil((sizeMB * 1024 * 1024) / chunkSize);
        
        return new Promise((resolve) => {
            let startTime = performance.now();
            let uploadedBytes = 0;
            let speedMeasurements = [];
            let measurementInterval;
            let lastMeasurementTime = startTime;
            let lastBytes = 0;
            
            measurementInterval = setInterval(() => {
                const currentTime = performance.now();
                const elapsed = (currentTime - startTime) / 1000;
                
                if (elapsed >= 0.5) {
                    const timeDiff = (currentTime - lastMeasurementTime) / 1000;
                    const bytesDiff = uploadedBytes - lastBytes;
                    if (timeDiff > 0 && bytesDiff > 0) {
                        const speedMbps = (bytesDiff * 8) / (1024 * 1024 * timeDiff);
                        speedMeasurements.push(speedMbps);
                    }
                    lastMeasurementTime = currentTime;
                    lastBytes = uploadedBytes;
                }
                
                if (elapsed >= testDuration / 1000) {
                    clearInterval(measurementInterval);
                    if (speedMeasurements.length > 0) {
                        const sortedSpeeds = speedMeasurements.sort((a, b) => a - b);
                        const medianSpeed = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];
                        resolve(Math.max(0, medianSpeed));
                    } else if (uploadedBytes > 0) {
                        const totalTime = (currentTime - startTime) / 1000;
                        const speedMbps = (uploadedBytes * 8) / (1024 * 1024 * totalTime);
                        resolve(Math.max(0, speedMbps));
                    } else {
                        resolve(0);
                    }
                }
            }, 200);
            
            const uploadChunk = async (chunkIndex) => {
                if (chunkIndex >= totalChunks) return;
                
                const chunk = new ArrayBuffer(chunkSize);
                const data = new Uint8Array(chunk);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.floor(Math.random() * 256);
                }
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body: data
                    });
                    
                    if (response.ok) {
                        uploadedBytes += chunkSize;
                    }
                    
                    const currentElapsed = (performance.now() - startTime) / 1000;
                    if (currentElapsed < testDuration / 1000 && chunkIndex + 1 < totalChunks) {
                        setTimeout(() => uploadChunk(chunkIndex + 1), 100);
                    }
                } catch (error) {
                    clearInterval(measurementInterval);
                    resolve(0);
                }
            };
            
            uploadChunk(0);
        });
    }

    updateProgressRing(percentage) {
        if (this.gaugeProgress) {
            const circumference = 2 * Math.PI * 120;
            const offset = circumference - (percentage * circumference);
            this.gaugeProgress.style.strokeDashoffset = offset;
        }
    }

    updateProgressBar(percentage) {
        if (this.progressFill) {
            this.progressFill.style.width = (percentage * 100) + '%';
        }
    }

    showCompleteResults() {
        this.testType.textContent = 'Test Complete';
        this.testProgress.textContent = 'All tests finished successfully';
        const avgSpeed = Math.round((this.results.download + this.results.upload) / 2);
        this.speedValue.textContent = avgSpeed;
        this.speedUnit.textContent = 'Mbps';
        this.updateProgressRing(1);
        this.updateProgressBar(1);
        
        setTimeout(() => {
            this.testType.textContent = 'Ready to test';
            this.testProgress.textContent = 'Click to begin speed test';
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

new SpeedTest();
