class DetectionManager {
  constructor() {
    this.detectionQueue = [];
    this.isProcessing = false;
    
    // Detection intervals (in seconds)
    this.roboflowInterval = 60; // Match default profile
    this.geminiMultiplier = 15; // Match default profile
    
    // Print profiles
    this.printProfiles = {
      default: {
        name: 'Default',
        roboflowInterval: 60,
        geminiMultiplier: 15,
        detectionThreshold: 80
      },
      cautious: {
        name: 'Cautious',
        roboflowInterval: 30,
        geminiMultiplier: 10,
        detectionThreshold: 60
      },
      efficient: {
        name: 'Efficient',
        roboflowInterval: 120,
        geminiMultiplier: 20,
        detectionThreshold: 90
      }
    };
    
    this.currentProfile = 'default';
    
    // Initialize settings from default profile
    const defaultProfile = this.printProfiles[this.currentProfile];
    this.roboflowInterval = defaultProfile.roboflowInterval;
    this.geminiMultiplier = defaultProfile.geminiMultiplier;
    
    this.cameras = [];
    this.selectedCamera = null;
    this.roboflowCounter = 0; // Counter for Roboflow detections
    
    // Initialize UI elements
    this.initializeUI();
    
    // Add settings toggle functionality
    this.initializeSettingsToggle();
    
    // Initialize camera list
    this.initializeCameraSelection();
  }
  
  async initializeCameraSelection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (this.cameras.length > 0) {
        this.selectedCamera = this.cameras[0].deviceId;
      }
      
      // Update the camera select in settings if available
      const cameraSelect = document.getElementById('cameraSelect');
      if (cameraSelect) {
        // Clear existing options
        cameraSelect.innerHTML = '';
        
        // Add camera options
        this.cameras.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Camera ${index + 1}`;
          cameraSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error enumerating video devices:', error);
    }
  }
  
  initializeUI() {
    // Create settings panel
    this.createSettingsPanel();
  }
  
  createSettingsPanel() {
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
      <div class="settings-header">
        <h3>Print Monitoring Settings</h3>
        <button class="settings-close" id="closeSettings">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="settings-content">
        <div class="settings-section">
          <div class="section-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <h4>Preset Profiles</h4>
          </div>
          <p class="setting-description">Choose a preset configuration for your print monitoring needs</p>
          <div class="profile-selector">
            <div class="profile-cards">
              ${Object.keys(this.printProfiles).map((profile, index) => `
                <div class="profile-card ${profile === this.currentProfile ? 'active' : ''}" data-profile="${profile}">
                  <h4>${this.printProfiles[profile].name}</h4>
                  <div class="profile-details">
                    <span>Scan every ${this.printProfiles[profile].roboflowInterval}s</span>
                    <span>Gemini every ${this.printProfiles[profile].geminiMultiplier} scans</span>
                    <span>Threshold: ${this.printProfiles[profile].detectionThreshold}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <div class="section-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <h4>Camera Settings</h4>
          </div>
          <div class="setting-item with-slider">
            <label for="cameraSelect">Select Camera</label>
            <select id="cameraSelect" class="styled-select"></select>
          </div>
        </div>
        
        <div class="settings-section collapsible">
          <div class="section-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <h4>Detection Settings</h4>
            <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div class="collapsible-content">
            <div class="setting-item with-slider">
              <label for="captureInterval">
                <span>Capture Interval</span>
                <span class="value-display">${this.roboflowInterval} seconds</span>
              </label>
              <input type="range" id="captureInterval" min="10" max="180" value="${this.roboflowInterval}" class="slider">
              <div class="range-labels">
                <span>30 sec</span>
                <span>1 min</span>
                <span>3 min</span>
              </div>
            </div>
            
            <div class="setting-item with-slider">
              <label for="geminiMultiplier">
                <span>Gemini Analysis Frequency</span>
                <span class="value-display">Every ${this.geminiMultiplier} scans</span>
              </label>
              <input type="range" id="geminiMultiplier" min="5" max="30" value="${this.geminiMultiplier}" class="slider">
              <div class="range-labels">
                <span>5 scans</span>
                <span>15 scans</span>
                <span>30 scans</span>
              </div>
            </div>
            
            <div class="setting-item with-slider">
              <label for="detectionThreshold">
                <span>Detection Sensitivity</span>
                <span class="value-display">${100 - this.printProfiles[this.currentProfile].detectionThreshold}%</span>
              </label>
              <input type="range" id="detectionThreshold" min="0" max="100" value="${100 - this.printProfiles[this.currentProfile].detectionThreshold}" class="slider">
              <div class="range-labels">
                <span>High</span>
                <span>Medium</span>
                <span>Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(settingsPanel);
    
    // Add event listeners
    this.addSettingsEventListeners(settingsPanel);
  }
  
  addSettingsEventListeners(settingsPanel) {
    // Close button
    settingsPanel.querySelector('#closeSettings').addEventListener('click', () => {
      settingsPanel.classList.remove('visible');
    });
    
    // Profile selection
    const profileCards = settingsPanel.querySelectorAll('.profile-card');
    profileCards.forEach(card => {
      card.addEventListener('click', () => {
        const profileName = card.getAttribute('data-profile');
        this.loadProfile(profileName);
        
        // Update active state
        profileCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
    
    // Camera selection
    const cameraSelect = settingsPanel.querySelector('#cameraSelect');
    cameraSelect.addEventListener('change', () => {
      this.selectedCamera = cameraSelect.value;
      if (window.printMonitor) {
        window.printMonitor.updateCamera(this.selectedCamera);
      }
    });
    
    // Capture interval slider
    const captureIntervalSlider = settingsPanel.querySelector('#captureInterval');
    const captureIntervalDisplay = captureIntervalSlider.parentElement.querySelector('.value-display');
    
    captureIntervalSlider.addEventListener('input', () => {
      const value = parseInt(captureIntervalSlider.value);
      this.roboflowInterval = value;
      captureIntervalDisplay.textContent = `${value} seconds`;
      this.updateDetectionIntervals();
    });
    
    // Gemini multiplier slider
    const geminiMultiplierSlider = settingsPanel.querySelector('#geminiMultiplier');
    const geminiMultiplierDisplay = geminiMultiplierSlider.parentElement.querySelector('.value-display');
    
    geminiMultiplierSlider.addEventListener('input', () => {
      const value = parseInt(geminiMultiplierSlider.value);
      this.geminiMultiplier = value;
      geminiMultiplierDisplay.textContent = `Every ${value} scans`;
      this.updateDetectionIntervals();
    });
    
    // Detection threshold slider
    const thresholdSlider = settingsPanel.querySelector('#detectionThreshold');
    const thresholdDisplay = thresholdSlider.parentElement.querySelector('.value-display');
    
    thresholdSlider.addEventListener('input', () => {
      const value = parseInt(thresholdSlider.value);
      const actualThreshold = 100 - value; // Invert for UI (higher on slider = more sensitive = lower threshold)
      this.printProfiles[this.currentProfile].detectionThreshold = actualThreshold;
      thresholdDisplay.textContent = `${value}%`;
    });

    // Collapsible sections toggle
    const collapsibles = settingsPanel.querySelectorAll('.settings-section.collapsible');
    collapsibles.forEach(section => {
      const header = section.querySelector('.section-header');
      const content = section.querySelector('.collapsible-content');

      // Initialize collapsible state - start collapsed
      content.style.display = 'none';
      
      header.addEventListener('click', () => {
        // Toggle collapsible content
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        
        // Toggle arrow direction and header active state
        const arrow = header.querySelector('.dropdown-arrow');
        arrow.style.transform = isExpanded ? 'translateY(-50%)' : 'translateY(-50%) rotate(180deg)';
        
        // Toggle header active state
        if (isExpanded) {
          header.classList.remove('active');
        } else {
          header.classList.add('active');
        }
      });
    });
  }
  
  initializeSettingsToggle() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.querySelector('.settings-panel');
    
    settingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.toggle('visible');
    });
    
    // Close settings panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('visible');
      }
    });
  }
  
  async addToDetectionQueue(imageBlob, type = 'roboflow') {
    this.detectionQueue.push({ imageBlob, type });
    
    // Show feedback that we've queued a detection
    if (window.printMonitor) {
      window.printMonitor.logActivity(`Queued ${type} detection task`, 'info');
    }
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.isProcessing || this.detectionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const nextItem = this.detectionQueue.shift();

    try {
      let results = null;
      
      if (nextItem.type === 'roboflow') {
        // Log that we're processing a Roboflow detection
        if (window.printMonitor) {
          window.printMonitor.logActivity('Processing with Roboflow...', 'processing');
        }
        
        results = await this.runRoboflowDetection(nextItem.imageBlob);
      } else if (nextItem.type === 'gemini') {
        // Log that we're processing a Gemini detection
        if (window.printMonitor) {
          window.printMonitor.logActivity('Processing with Gemini...', 'processing');
        }
        
        results = await this.runGeminiDetection(nextItem.imageBlob);
      }
      
      // Ensure we have a valid results object
      if (!results) {
        results = { 
          predictions: [],
          time: new Date().toISOString()
        };
      }
      
      // Handle the detection results
      this.handleDetectionResults(results, nextItem.type);
    } catch (error) {
      console.error(`Error processing ${nextItem?.type || 'unknown'} detection:`, error);
      
      if (window.printMonitor) {
        window.printMonitor.logActivity(`Error processing ${nextItem?.type || 'unknown'} detection`, 'error');
        
        // Also call handleDetectionResult with empty results so monitoring can continue
        window.printMonitor.handleDetectionResult({
          predictions: [],
          time: new Date().toISOString()
        }, nextItem?.type || 'unknown');
      }
    } finally {
      this.isProcessing = false;
      // Process next item in queue if any
      if (this.detectionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100); // Small delay before processing next item
      }
    }
  }
  
  async runRoboflowDetection(imageBlob) {
    try {
      // Create a file from the blob for analyzeImage function
      const imageFile = new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' });
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Make the request directly to the backend API
      const response = await fetch('http://localhost:7070/api/roboflow/detect', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      // Return the parsed data
      return data;
    } catch (error) {
      console.error('Error in Roboflow detection:', error);
      
      // Return a fallback empty result structure so monitoring can continue
      return {
        predictions: [],
        time: new Date().toISOString()
      };
    }
  }
  
  async runGeminiDetection(imageBlob) {
    // Implement Gemini detection
    // This should use your existing Gemini API integration
    return await window.analyzeWithGemini(new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' }));
  }
  
  handleDetectionResults(results, type) {
    // Pass results to PrintMonitor for visual feedback
    if (window.printMonitor) {
      window.printMonitor.handleDetectionResult(results, type);
    }
    
    if (type === 'roboflow') {
      // Update the UI with Roboflow results, but don't automatically trigger Gemini
      this.updateResultsUI({ roboflow: results });
      
      // Only increment the counter if we're specifically configured to use Gemini
      // This counter is used in the Manual Analysis flow, but not for automatic scans
      this.roboflowCounter++;
      
      // NOTE: We've removed the automatic Gemini detection that was here
      // Gemini analysis should only be triggered manually through the UI
    } else if (type === 'gemini') {
      this.updateResultsUI({ gemini: results });
    }
  }
  
  combineResults(roboflowResults, geminiResults) {
    // Custom logic to combine results from both systems
    const combined = {
      summary: {},
      details: {},
      confidence: 0
    };
    
    if (roboflowResults && roboflowResults.detected) {
      combined.summary.failureDetected = roboflowResults.detected;
      combined.details.roboflow = roboflowResults;
      combined.confidence += 50; // Base confidence from Roboflow
    }
    
    if (geminiResults && geminiResults.analysis) {
      if (geminiResults.analysis.includes('failure') || 
          geminiResults.analysis.includes('problem') ||
          geminiResults.analysis.includes('issue')) {
        combined.summary.failureConfirmed = true;
        combined.confidence += 50; // Additional confidence from Gemini
      }
      combined.details.gemini = geminiResults;
    }
    
    // Define primary failure message
    if (combined.summary.failureDetected && combined.summary.failureConfirmed) {
      combined.message = 'Print failure detected and confirmed';
      console.log('Both systems confirmed failure - alerting user');
    } else if (combined.summary.failureDetected) {
      combined.message = 'Potential print issue detected';
      console.log('Gemini did not confirm Roboflow detection - no alert');
    } else {
      combined.message = 'No issues detected';
    }
    
    return combined;
  }
  
  updateResultsUI(results) {
    const resultsDisplay = document.getElementById('detectionResults');
    if (!resultsDisplay) return;
    
    // Clear previous results
    resultsDisplay.innerHTML = '';
    
    if (results.roboflow) {
      // Create Roboflow results section
      const roboflowSection = document.createElement('div');
      roboflowSection.className = 'result-section';
      
      const header = document.createElement('h4');
      header.textContent = 'Computer Vision Analysis';
      roboflowSection.appendChild(header);
      
      const content = document.createElement('div');
      content.className = 'result-content';
      
      if (results.roboflow.detected) {
        content.innerHTML = `
          <div class="result-label warning">Issue Detected</div>
          <div class="result-detail">
            <div class="result-item">
              <span>Confidence:</span>
              <span>${Math.round(results.roboflow.confidence * 100)}%</span>
            </div>
            <div class="result-item">
              <span>Type:</span>
              <span>${results.roboflow.class || 'General failure'}</span>
            </div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="result-label success">No Issues</div>
          <div class="result-detail">
            <div class="result-item">
              <span>Status:</span>
              <span>Print appears normal</span>
            </div>
          </div>
        `;
      }
      
      roboflowSection.appendChild(content);
      resultsDisplay.appendChild(roboflowSection);
    }
    
    if (results.gemini) {
      // Create Gemini results section
      const geminiSection = document.createElement('div');
      geminiSection.className = 'result-section';
      
      const header = document.createElement('h4');
      header.textContent = 'AI Analysis';
      geminiSection.appendChild(header);
      
      const content = document.createElement('div');
      content.className = 'result-content';
      
      content.innerHTML = `
        <div class="result-detail">
          <div class="result-item analysis">
            <span>${results.gemini.analysis || 'No analysis available'}</span>
          </div>
        </div>
      `;
      
      geminiSection.appendChild(content);
      resultsDisplay.appendChild(geminiSection);
    }
  }
  
  updateDetectionIntervals() {
    // Update detection intervals based on current settings
    if (window.printMonitor) {
      window.printMonitor.updateCaptureInterval(this.roboflowInterval);
    }
  }
  
  loadProfile(profileName) {
    if (this.printProfiles[profileName]) {
      this.currentProfile = profileName;
      const profile = this.printProfiles[profileName];
      
      // Update settings from profile
      this.roboflowInterval = profile.roboflowInterval;
      this.geminiMultiplier = profile.geminiMultiplier;
      
      // Update UI to reflect the profile
      this.updateUIFromProfile();
      
      // Update detection intervals
      this.updateDetectionIntervals();
    }
  }
  
  updateUIFromProfile() {
    // Update sliders and displays to match the current profile
    const captureInterval = document.getElementById('captureInterval');
    const geminiMultiplier = document.getElementById('geminiMultiplier');
    const detectionThreshold = document.getElementById('detectionThreshold');
    
    if (captureInterval) captureInterval.value = this.roboflowInterval;
    if (geminiMultiplier) geminiMultiplier.value = this.geminiMultiplier;
    if (detectionThreshold) detectionThreshold.value = 100 - this.printProfiles[this.currentProfile].detectionThreshold;
    
    // Update displays
    const captureIntervalDisplay = captureInterval?.parentElement.querySelector('.value-display');
    const geminiMultiplierDisplay = geminiMultiplier?.parentElement.querySelector('.value-display');
    const thresholdDisplay = detectionThreshold?.parentElement.querySelector('.value-display');
    
    if (captureIntervalDisplay) captureIntervalDisplay.textContent = `${this.roboflowInterval} seconds`;
    if (geminiMultiplierDisplay) geminiMultiplierDisplay.textContent = `Every ${this.geminiMultiplier} scans`;
    if (thresholdDisplay) thresholdDisplay.textContent = `${100 - this.printProfiles[this.currentProfile].detectionThreshold}%`;
  }
  
  handleVerifiedDetection(combinedResults) {
    // Update the UI to show the combined results
    this.updateResultsUI(combinedResults);
    
    // Take any necessary actions based on the detection
    if (combinedResults.summary && combinedResults.summary.failureDetected) {
      // Pause the print monitoring
      if (window.printMonitor && !window.printMonitor.isPaused) {
        window.printMonitor.togglePause();
      }
    }
  }
}

// Initialize the detection manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.detectionManager = new DetectionManager();
  
  // Make sure UI is updated to match default profile values
  setTimeout(() => {
    window.detectionManager.updateUIFromProfile();
  }, 100);
}); 