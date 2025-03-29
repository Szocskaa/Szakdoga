class PrintMonitor {
  constructor() {
    this.stream = null;
    this.monitoringInterval = null;
    this.geminiInterval = null;
    this.isMonitoring = false;
    this.isPaused = false;
    this.captureInterval = 5; // Default 5 seconds
    this.detectionThreshold = 80; // Default 80%
    this.selectedCamera = null;
    
    // DOM Elements
    this.monitoringFeed = document.getElementById('monitoringFeed');
    this.startBtn = document.getElementById('startMonitoringBtn');
    this.pauseBtn = document.getElementById('pauseMonitoringBtn');
    this.stopBtn = document.getElementById('stopMonitoringBtn');
    this.captureIntervalInput = document.getElementById('captureInterval');
    this.detectionThresholdInput = document.getElementById('detectionThreshold');
    this.cameraSelect = document.getElementById('cameraSelect');
    
    // Bind event listeners
    this.startBtn.addEventListener('click', () => this.startMonitoring());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.stopBtn.addEventListener('click', () => this.stopMonitoring());
    this.captureIntervalInput.addEventListener('change', () => this.updateCaptureInterval());
    this.detectionThresholdInput.addEventListener('change', () => this.updateDetectionThreshold());
    
    // Initialize camera selection
    this.initializeCameraSelection();
  }
  
  async initializeCameraSelection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Clear existing options
      this.cameraSelect.innerHTML = '';
      
      // Add camera options
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        this.cameraSelect.appendChild(option);
      });
      
      // Set default camera if available
      if (videoDevices.length > 0) {
        this.selectedCamera = videoDevices[0].deviceId;
        this.cameraSelect.value = this.selectedCamera;
      }
      
      // Add change event listener
      this.cameraSelect.addEventListener('change', () => {
        this.selectedCamera = this.cameraSelect.value;
        if (this.isMonitoring) {
          this.restartMonitoring();
        }
      });
    } catch (error) {
      console.error('Error initializing camera selection:', error);
    }
  }
  
  async startMonitoring() {
    try {
      // Request camera access
      const constraints = {
        video: {
          deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.monitoringFeed.srcObject = this.stream;
      
      // Update UI state
      this.isMonitoring = true;
      this.isPaused = false;
      this.updateUIState();
      
      // Start periodic captures
      this.startPeriodicCaptures();
      
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Failed to start monitoring. Please check camera permissions.');
    }
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    this.updateUIState();
    
    if (this.isPaused) {
      this.stopPeriodicCaptures();
    } else {
      this.startPeriodicCaptures();
    }
  }
  
  stopMonitoring() {
    // Stop the video stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.monitoringFeed.srcObject = null;
    }
    
    // Clear monitoring intervals
    this.stopPeriodicCaptures();
    
    // Reset state
    this.isMonitoring = false;
    this.isPaused = false;
    this.updateUIState();
  }
  
  startPeriodicCaptures() {
    this.stopPeriodicCaptures(); // Clear any existing intervals
    
    // Start Roboflow captures
    this.monitoringInterval = setInterval(() => {
      if (!this.isPaused) {
        this.captureAndAnalyze('roboflow');
      }
    }, this.captureInterval * 1000);
    
    // Start Gemini captures
    this.geminiInterval = setInterval(() => {
      if (!this.isPaused) {
        this.captureAndAnalyze('gemini');
      }
    }, (this.captureInterval * 6) * 1000); // Gemini runs every 6x the Roboflow interval
  }
  
  stopPeriodicCaptures() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.geminiInterval) {
      clearInterval(this.geminiInterval);
      this.geminiInterval = null;
    }
  }
  
  async captureAndAnalyze(type) {
    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      canvas.width = this.monitoringFeed.videoWidth;
      canvas.height = this.monitoringFeed.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.monitoringFeed, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      // Add to detection queue
      if (window.detectionManager) {
        await window.detectionManager.addToDetectionQueue(blob, type);
      }
      
    } catch (error) {
      console.error('Error capturing and analyzing image:', error);
    }
  }
  
  updateCaptureInterval() {
    this.captureInterval = parseInt(this.captureIntervalInput.value);
    if (this.isMonitoring && !this.isPaused) {
      this.restartMonitoring();
    }
  }
  
  updateDetectionThreshold() {
    this.detectionThreshold = parseInt(this.detectionThresholdInput.value);
    if (window.detectionManager) {
      window.detectionManager.updateDetectionThreshold(this.detectionThreshold);
    }
  }
  
  updateIntervals(roboflowInterval, geminiInterval) {
    this.captureInterval = roboflowInterval;
    if (this.isMonitoring && !this.isPaused) {
      this.restartMonitoring();
    }
  }
  
  restartMonitoring() {
    this.stopMonitoring();
    this.startMonitoring();
  }
  
  updateUIState() {
    // Update button states
    this.startBtn.disabled = this.isMonitoring;
    this.pauseBtn.disabled = !this.isMonitoring;
    this.stopBtn.disabled = !this.isMonitoring;
    
    // Update status text
    const statusText = document.querySelector('.status-text');
    if (this.isMonitoring) {
      statusText.textContent = this.isPaused ? 'Monitoring Paused' : 'Monitoring Active';
    } else {
      statusText.textContent = 'Monitoring Stopped';
    }
    
    // Update status indicator
    const statusIndicator = document.querySelector('.status-indicator');
    if (this.isMonitoring) {
      statusIndicator.style.background = this.isPaused ? '#FFA500' : '#4CAF50';
    } else {
      statusIndicator.style.background = '#666';
    }
  }
}

// Initialize the monitor when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.printMonitor = new PrintMonitor();
}); 