class PrintMonitor {
  constructor() {
    this.stream = null;
    this.monitoringInterval = null;
    this.isMonitoring = false;
    this.isPaused = false;
    this.captureInterval = 5;
    this.detectionThreshold = 80;
    this.selectedCamera = null;
    this.lastCaptureTime = 0;
    this.countdownTimer = null;
    this.nextCaptureTime = 0;
    
    // DOM Elements
    this.monitoringFeed = document.getElementById('monitoringFeed');
    this.startBtn = document.getElementById('startMonitoringBtn');
    this.pauseBtn = document.getElementById('pauseMonitoringBtn');
    this.stopBtn = document.getElementById('stopMonitoringBtn');
    this.captureIntervalInput = document.getElementById('captureInterval');
    this.detectionThresholdInput = document.getElementById('detectionThreshold');
    this.cameraSelect = document.getElementById('cameraSelect');
    
    this.createStatusElements();
    
    // Bind event listeners
    this.startBtn.addEventListener('click', () => this.startMonitoring());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.stopBtn.addEventListener('click', () => this.stopMonitoring());
    this.captureIntervalInput?.addEventListener('change', () => this.updateCaptureInterval());
    this.detectionThresholdInput?.addEventListener('change', () => this.updateDetectionThreshold());
    
    this.initializeCameraSelection();
    
    if (this.pauseBtn) {
      this.pauseBtn.textContent = 'Pause';
    }
  }
  
  createStatusElements() {
    this.statusPill = document.createElement('div');
    this.statusPill.className = 'monitoring-status-pill';
    this.statusPill.innerHTML = `
      <div class="status-section">
        <div class="status-pill-indicator"></div>
        <div class="status-pill-text">Ready</div>
      </div>
      <div class="info-section">System ready</div>
      
      <div class="counters-container">
        <div class="counter-section">
          <div class="counter-label">Next scan:</div>
          <div class="counter-progress">
            <div class="counter-progress-bar"></div>
            <div class="counter-text">--</div>
          </div>
        </div>
        
        <div class="counter-section">
          <div class="counter-label">Gemini AI:</div>
          <div class="counter-progress gemini-counter-progress">
            <div class="counter-progress-bar gemini-counter-progress-bar"></div>
            <div class="counter-text gemini-counter-text">0 / ?</div>
          </div>
        </div>
      </div>
    `;
    
    // Add styles for the counters
    if (!document.getElementById('counter-styles')) {
      const style = document.createElement('style');
      style.id = 'counter-styles';
      style.textContent = `
        .counters-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }
        
        .counter-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .counter-label {
          font-size: 12px;
          color: var(--text-secondary-color, #a0a0a0);
          width: 75px;
        }
        
        .counter-progress {
          position: relative;
          width: 100px;
          height: 14px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 7px;
          overflow: hidden;
          flex-grow: 1;
        }
        
        .counter-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(to right, #4CAF50, #8BC34A);
          width: 0%;
          transition: width 0.5s ease;
        }
        
        .gemini-counter-progress-bar {
          background: linear-gradient(to right, #8a2be2, #4169e1);
        }
        
        .counter-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes pulse-bright {
          0% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.7; filter: brightness(1.5); }
          100% { opacity: 1; filter: brightness(1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'capture-flash-overlay';
    
    const monitoringContainer = document.querySelector('.monitoring-container');
    const monitoringCard = document.querySelector('.monitoring-card');
    
    if (monitoringContainer && monitoringCard) {
      monitoringCard.insertBefore(this.statusPill, monitoringContainer);
      
      const monitoringPreview = document.querySelector('.monitoring-preview');
      if (monitoringPreview) {
        monitoringPreview.appendChild(this.flashOverlay);
      }
    }
  }
  
  async initializeCameraSelection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (this.cameraSelect) {
        this.cameraSelect.innerHTML = '';
        
        videoDevices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Camera ${index + 1}`;
          this.cameraSelect.appendChild(option);
        });
        
        if (videoDevices.length > 0) {
          this.selectedCamera = videoDevices[0].deviceId;
          this.cameraSelect.value = this.selectedCamera;
        }
        
        this.cameraSelect.addEventListener('change', () => {
          this.selectedCamera = this.cameraSelect.value;
          if (this.isMonitoring) {
            this.restartMonitoring();
          }
        });
      }
    } catch (error) {
      console.error('Error initializing camera selection:', error);
    }
  }
  
  async startMonitoring() {
    try {
      if (window.detectionManager && window.detectionManager.selectedCamera) {
        this.selectedCamera = window.detectionManager.selectedCamera;
      }
      
      const constraints = {
        video: {
          deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.monitoringFeed.srcObject = this.stream;
      
      this.isMonitoring = true;
      this.isPaused = false;
      this.updateUIState();
      
      if (window.detectionManager) {
        this.captureInterval = window.detectionManager.roboflowInterval;
      }
      
      // Reset roboflow counter in detection manager
      if (window.detectionManager) {
        window.detectionManager.roboflowCounter = 0;
        console.log('Reset Roboflow counter to 0');
        
        // Also initialize the Gemini counter display
        const geminiMultiplier = window.detectionManager.geminiMultiplier;
        this.updateGeminiCounter(0, geminiMultiplier, geminiMultiplier);
      }
      
      // Check if Gemini analysis is properly configured
      const isGeminiConfigured = typeof window.analyzeWithGemini === 'function';
      
      this.startPeriodicCaptures();
      
      // Show the AI assistant sidebar when monitoring starts
      const chatColumn = document.getElementById('chatColumn');
      if (chatColumn) {
        chatColumn.style.display = 'block';
        
        // Add a message to the chat about monitoring starting
        const chatSidebarMessages = document.getElementById('chatSidebarMessages');
        if (chatSidebarMessages) {
          // Add a clear message about Gemini configuration status
          let geminiStatusMessage = isGeminiConfigured 
            ? `Gemini AI analysis will run every ${window.detectionManager ? window.detectionManager.geminiMultiplier : '?'} Roboflow scans.`
            : '<span style="color: #ff6b6b; font-weight: bold;">Warning: Gemini AI analysis is not properly configured. Check console for errors.</span>';
          
          chatSidebarMessages.innerHTML += `
            <div class="message ai-message">
              <div class="system-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Print monitoring has started. Roboflow scans will run every ${this.captureInterval} seconds. ${geminiStatusMessage}
              </div>
            </div>
          `;
          chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
        }
      }
      
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Failed to start monitoring. Please check camera permissions.');
    }
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.pauseBtn) {
      this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    this.updateUIState();
    
    if (this.isPaused) {
      this.stopPeriodicCaptures();
    } else {
      this.startPeriodicCaptures();
    }
  }
  
  stopMonitoring() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.monitoringFeed.srcObject = null;
    }
    
    this.stopPeriodicCaptures();
    
    this.isMonitoring = false;
    this.isPaused = false;
    this.updateUIState();
    
    this.updateCountdown(null);
    
    // Hide the AI assistant sidebar when monitoring stops
    const chatColumn = document.getElementById('chatColumn');
    if (chatColumn) {
      // Add a message to the chat about monitoring stopping first
      const chatSidebarMessages = document.getElementById('chatSidebarMessages');
      if (chatSidebarMessages) {
        chatSidebarMessages.innerHTML += `
          <div class="message ai-message">
            <div class="system-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Print monitoring has stopped.
            </div>
          </div>
        `;
        chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
      }
      
      // Allow a moment for the message to be seen, then hide the chat column
      setTimeout(() => {
        chatColumn.style.display = 'none';
      }, 3000);
    }
  }
  
  startPeriodicCaptures() {
    this.stopPeriodicCaptures();
    
    if (window.detectionManager) {
      this.captureInterval = window.detectionManager.roboflowInterval;
    }
    
    this.nextCaptureTime = Date.now() + (this.captureInterval * 1000);
    this.updateCountdownTimer();
    
    this.monitoringInterval = setInterval(() => {
      if (!this.isPaused) {
        const now = Date.now();
        if (now >= this.nextCaptureTime) {
          this.captureAndAnalyze('roboflow');
          this.nextCaptureTime = now + (this.captureInterval * 1000);
        }
        this.updateCountdownTimer();
      }
    }, 1000);
  }
  
  updateCountdownTimer() {
    if (!this.isMonitoring || this.isPaused) {
      this.updateCountdown(null);
      this.updateGeminiCounter(null);
      return;
    }
    
    const now = Date.now();
    const timeLeft = Math.max(0, Math.ceil((this.nextCaptureTime - now) / 1000));
    this.updateCountdown(timeLeft);
    
    // Update the Gemini counter if detectionManager is available
    if (window.detectionManager) {
      const currentCount = window.detectionManager.roboflowCounter;
      const geminiMultiplier = window.detectionManager.geminiMultiplier;
      const nextGeminiAt = geminiMultiplier - (currentCount % geminiMultiplier);
      
      this.updateGeminiCounter(currentCount, nextGeminiAt, geminiMultiplier);
    }
  }
  
  updateCountdown(seconds) {
    const counterProgressBar = this.statusPill?.querySelector('.counter-progress-bar');
    const counterText = this.statusPill?.querySelector('.counter-text');
    
    if (!counterProgressBar || !counterText) return;
    
    if (seconds === null) {
      counterProgressBar.style.width = '0';
      counterText.textContent = '--';
      return;
    }
    
    counterText.textContent = `${seconds}s`;
    const percentage = (seconds / this.captureInterval) * 100;
    counterProgressBar.style.width = `${percentage}%`;
  }
  
  updateGeminiCounter(currentCount, nextGeminiAt, geminiMultiplier) {
    const progressBar = this.statusPill?.querySelector('.gemini-counter-progress-bar');
    const counterText = this.statusPill?.querySelector('.gemini-counter-text');
    
    if (!progressBar || !counterText) return;
    
    if (currentCount === null) {
      progressBar.style.width = '0%';
      counterText.textContent = '0 / ?';
      progressBar.style.animation = 'none';
      return;
    }
    
    const currentPosition = geminiMultiplier - nextGeminiAt;
    const percentage = (currentPosition / geminiMultiplier) * 100;
    
    // Update the progress bar and text
    progressBar.style.width = `${percentage}%`;
    counterText.textContent = `${currentPosition} / ${geminiMultiplier}`;
    
    // Add pulsing animation when we're close to the next Gemini scan
    if (nextGeminiAt <= 1) {
      // Use a faster, more noticeable pulse animation when we're at the trigger point
      progressBar.style.animation = 'pulse-bright 1s infinite';
      progressBar.style.background = 'linear-gradient(to right, #ff00ff, #4169e1)';
    } else if (nextGeminiAt <= 2) {
      // Slow pulse for approaching the trigger point
      progressBar.style.animation = 'pulse 2s infinite';
      progressBar.style.background = 'linear-gradient(to right, #9932cc, #4169e1)';
    } else {
      progressBar.style.animation = 'none';
      progressBar.style.background = 'linear-gradient(to right, #8a2be2, #4169e1)';
    }
    
    console.log(`Updated Gemini counter: ${currentPosition}/${geminiMultiplier}, next in: ${nextGeminiAt}, pulse: ${nextGeminiAt <= 2}`);
  }
  
  stopPeriodicCaptures() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  async captureAndAnalyze(type) {
    try {
      const detectionType = 'roboflow';
      
      this.triggerCaptureFlash();
      this.isPaused = true;
      this.updateStatusPill('processing', 'Processing', 'Capturing image...');
      
      const canvas = document.createElement('canvas');
      canvas.width = this.monitoringFeed.videoWidth;
      canvas.height = this.monitoringFeed.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.monitoringFeed, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      if (window.detectionManager) {
        this.updateStatusPill('processing', 'Processing', 'Analyzing with Roboflow...');
        
        try {
          const results = await window.detectionManager.runRoboflowDetection(blob);
          
          // Increment roboflow counter after successful detection
          if (window.detectionManager) {
            window.detectionManager.roboflowCounter++;
            const currentCount = window.detectionManager.roboflowCounter;
            const geminiMultiplier = window.detectionManager.geminiMultiplier;
            const nextGeminiAt = geminiMultiplier - (currentCount % geminiMultiplier);
            
            console.log(`Roboflow scan #${currentCount} completed. Next Gemini scan in ${nextGeminiAt} scans.`);
            this.updateGeminiCounter(currentCount, nextGeminiAt, geminiMultiplier);
          }
          
          // Log the results
          if (results.predictions && results.predictions.length > 0) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FF4D4D';
            ctx.fillStyle = '#FF4D4D';
            ctx.font = 'bold 20px Arial';
            
            results.predictions.forEach(prediction => {
              const x = prediction.x - (prediction.width / 2);
              const y = prediction.y - (prediction.height / 2);
              const width = prediction.width;
              const height = prediction.height;
              
              ctx.fillStyle = 'rgba(255, 77, 77, 0.2)';
              ctx.fillRect(x, y, width, height);
              
              ctx.strokeStyle = '#FF4D4D';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, width, height);
              
              const label = `${prediction.class} (${Math.round(prediction.confidence * 100)}%)`;
              const labelWidth = ctx.measureText(label).width + 10;
              const labelHeight = 28;
              ctx.fillStyle = '#FF4D4D';
              ctx.fillRect(x - 1, y - labelHeight, labelWidth, labelHeight);
              
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 20px Arial';
              ctx.fillText(label, x + 5, y - 6);
            });
          }
          
          this.capturedImage = canvas.toDataURL('image/jpeg');
          this.handleDetectionResult(results, detectionType);
          this.nextCaptureTime = Date.now() + (this.captureInterval * 1000);
          
          // Check if we should trigger Gemini analysis
          if (window.detectionManager && window.detectionManager.roboflowCounter % window.detectionManager.geminiMultiplier === 0) {
            console.log(`Triggering Gemini analysis after scan #${window.detectionManager.roboflowCounter}`);
            window.detectionManager.handleDetectionResults(results, 'roboflow');
          }
        } catch (error) {
          console.error('Error in Roboflow detection:', error);
          this.updateStatusPill('error', 'Error', 'Analysis failed');
          
          setTimeout(() => {
            if (this.isMonitoring) {
              this.isPaused = false;
              if (this.pauseBtn) {
                this.pauseBtn.textContent = 'Pause';
              }
              this.updateUIState();
              this.nextCaptureTime = Date.now() + (this.captureInterval * 1000);
              this.updateCountdownTimer();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error capturing and analyzing image:', error);
      this.updateStatusPill('error', 'Error', 'Analysis failed');
      
      setTimeout(() => {
        if (this.isMonitoring) {
          this.isPaused = false;
          if (this.pauseBtn) {
            this.pauseBtn.textContent = 'Pause';
          }
          this.updateUIState();
          this.nextCaptureTime = Date.now() + (this.captureInterval * 1000);
          this.updateCountdownTimer();
        }
      }, 3000);
    }
  }
  
  triggerCaptureFlash() {
    this.flashOverlay.classList.add('flash-active');
    setTimeout(() => {
      this.flashOverlay.classList.remove('flash-active');
    }, 500);
  }
  
  updateStatusPill(status, text, infoText = null) {
    if (!this.statusPill) return;
    
    const pillText = this.statusPill.querySelector('.status-pill-text');
    if (pillText) pillText.textContent = text;
    
    const pillIndicator = this.statusPill.querySelector('.status-pill-indicator');
    if (pillIndicator) {
      pillIndicator.classList.remove('status-active', 'status-paused', 'status-processing', 'status-error');
      
      switch (status) {
        case 'active':
          pillIndicator.classList.add('status-active');
          break;
        case 'paused':
          pillIndicator.classList.add('status-paused');
          break;
        case 'processing':
          pillIndicator.classList.add('status-processing');
          break;
        case 'error':
          pillIndicator.classList.add('status-error');
          break;
      }
    }
    
    if (infoText !== null) {
      const infoSection = this.statusPill.querySelector('.info-section');
      if (infoSection) {
        infoSection.textContent = infoText;
        
        infoSection.classList.remove('processing', 'error', 'success');
        
        switch (status) {
          case 'processing':
            infoSection.classList.add('processing');
            break;
          case 'error':
            infoSection.classList.add('error');
            break;
          case 'active':
            infoSection.classList.add('success');
            break;
        }
      }
    }
  }
  
  updateCaptureInterval() {
    if (!this.captureIntervalInput) return;
    
    this.captureInterval = parseInt(this.captureIntervalInput.value);
    if (this.isMonitoring && !this.isPaused) {
      this.restartMonitoring();
    }
  }
  
  updateDetectionThreshold() {
    if (!this.detectionThresholdInput) return;
    
    this.detectionThreshold = parseInt(this.detectionThresholdInput.value);
    if (window.detectionManager) {
      window.detectionManager.updateDetectionThreshold(this.detectionThreshold);
    }
  }
  
  updateIntervals(roboflowInterval) {
    this.captureInterval = roboflowInterval;
    if (this.isMonitoring && !this.isPaused) {
      this.restartMonitoring();
    }
  }
  
  updateCamera(cameraId) {
    this.selectedCamera = cameraId;
    if (this.isMonitoring) {
      this.restartMonitoring();
    }
  }
  
  restartMonitoring() {
    this.stopMonitoring();
    this.startMonitoring();
  }
  
  updateUIState() {
    if (this.startBtn) this.startBtn.disabled = this.isMonitoring;
    if (this.pauseBtn) this.pauseBtn.disabled = !this.isMonitoring;
    if (this.stopBtn) this.stopBtn.disabled = !this.isMonitoring;
    
    if (this.isMonitoring) {
      if (this.isPaused) {
        this.updateStatusPill('paused', 'Paused', 'Monitoring paused');
      } else {
        this.updateStatusPill('active', 'Active', 'Monitoring active');
      }
    } else {
      this.updateStatusPill('inactive', 'Stopped', 'System ready');
    }
    
    const statusText = document.querySelector('.status-text');
    if (statusText) {
      if (this.isMonitoring) {
        statusText.textContent = this.isPaused ? 'Monitoring Paused' : 'Monitoring Active';
      } else {
        statusText.textContent = 'Monitoring Stopped';
      }
    }
    
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      if (this.isMonitoring) {
        statusIndicator.style.background = this.isPaused ? '#FFA500' : '#4CAF50';
        statusIndicator.style.animation = this.isPaused ? 'none' : 'pulse 2s infinite';
      } else {
        statusIndicator.style.background = '#666';
        statusIndicator.style.animation = 'none';
      }
    }
  }
  
  handleDetectionResult(results, type) {
    if (!results) return;
    
    let resultPercentage = null;
    
    if (type === 'roboflow') {
      const count = results.predictions ? results.predictions.length : 0;
      
      if (count > 0) {
        const sortedPredictions = [...results.predictions].sort((a, b) => 
          (b.confidence || 0) - (a.confidence || 0)
        );
        
        const highestPrediction = sortedPredictions[0];
        const highestConfidence = highestPrediction.confidence || 0;
        const detectedClass = highestPrediction.class || 'Unknown';
        
        resultPercentage = `${Math.round(highestConfidence * 100)}%`;
        
        this.displayDetectionOverlay(results);
        this.updateStatusPill('active', 'Active', `${detectedClass}: ${resultPercentage}`);
      } else {
        this.updateStatusPill('active', 'Active', 'No issues detected');
        this.removeDetectionOverlay();
      }
      
      setTimeout(() => {
        if (this.isMonitoring) {
          this.isPaused = false;
          this.updateUIState();
          this.removeDetectionOverlay();
          this.updateCountdownTimer();
        }
      }, 3000);
    } else if (type === 'gemini') {
      this.updateStatusPill('active', 'Active', 'Gemini analysis complete');
      
      setTimeout(() => {
        if (this.isMonitoring) {
          this.isPaused = false;
          this.updateUIState();
          this.removeDetectionOverlay();
          this.updateCountdownTimer();
        }
      }, 3000);
    }
  }
  
  displayDetectionOverlay(results) {
    this.removeDetectionOverlay();
    
    const overlay = document.createElement('div');
    overlay.className = 'detection-result-overlay';
    
    const img = document.createElement('img');
    img.src = this.capturedImage;
    img.className = 'detection-result-image';
    overlay.appendChild(img);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'detection-overlay-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => this.removeDetectionOverlay());
    overlay.appendChild(closeButton);
    
    const monitoringPreview = document.querySelector('.monitoring-preview');
    if (monitoringPreview) {
      monitoringPreview.appendChild(overlay);
    }
  }
  
  removeDetectionOverlay() {
    const existingOverlay = document.querySelector('.detection-result-overlay');
    if (existingOverlay && existingOverlay.parentNode) {
      existingOverlay.parentNode.removeChild(existingOverlay);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.printMonitor = new PrintMonitor();
  
  if (window.detectionManager) {
    const originalUpdateResultsUI = window.detectionManager.updateResultsUI;
    window.detectionManager.updateResultsUI = function(results) {
      originalUpdateResultsUI.call(window.detectionManager, results);
      
      if (window.printMonitor) {
        if (results.roboflow) {
          window.printMonitor.handleDetectionResult(results.roboflow, 'roboflow');
        }
        if (results.gemini) {
          window.printMonitor.handleDetectionResult(results.gemini, 'gemini');
        }
      }
    };
  }
}); 