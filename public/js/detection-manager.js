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
      console.log(`Queued ${type} detection task`);
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
          console.log('Processing with Roboflow...');
        }
        
        results = await this.runRoboflowDetection(nextItem.imageBlob);
      } else if (nextItem.type === 'gemini') {
        // Log that we're processing a Gemini detection
        if (window.printMonitor) {
          console.log('Processing with Gemini...');
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
        console.error(`Error processing ${nextItem?.type || 'unknown'} detection`);
        
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
    try {
      console.log('RunGeminiDetection: Starting Gemini detection with blob size:', imageBlob.size);
      
      // Make sure window.analyzeWithGemini exists
      if (typeof window.analyzeWithGemini !== 'function') {
        console.error('RunGeminiDetection: window.analyzeWithGemini is not a function');
        throw new Error('Gemini analysis function not available');
      }
      
      // Convert blob to File for analyzeWithGemini function
      const imageFile = new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' });
      
      console.log('RunGeminiDetection: Calling analyzeWithGemini with image file');
      // Call the Gemini API integration function
      const result = await window.analyzeWithGemini(imageFile);
      
      console.log('RunGeminiDetection: Received result from Gemini:', result);
      return result;
    } catch (error) {
      console.error('RunGeminiDetection: Error in Gemini detection:', error);
      throw error; // Rethrow to be handled by the caller
    }
  }
  
  handleDetectionResults(results, type) {
    // Pass results to PrintMonitor for visual feedback
    if (window.printMonitor) {
      window.printMonitor.handleDetectionResult(results, type);
    }
    
    if (type === 'roboflow') {
      // Update the UI with Roboflow results
      this.updateResultsUI({ roboflow: results });
      
      // Note: roboflowCounter is now incremented in monitoring.js
      // We're just checking if we need to run Gemini analysis
      
      console.log(`Roboflow detection #${this.roboflowCounter} complete. Checking if Gemini scan needed...`);
      
      // Check if we should run Gemini detection based on the configured multiplier
      if (this.roboflowCounter % this.geminiMultiplier === 0) {
        // Log that we're doing a Gemini scan due to the configured frequency
        console.log(`Running scheduled Gemini analysis (every ${this.geminiMultiplier} scans)`);
        
        // Run Gemini analysis with the latest frame
        this.runScheduledGeminiAnalysis(results);
      }
    } else if (type === 'gemini') {
      this.updateResultsUI({ gemini: results });
    }
  }
  
  async runScheduledGeminiAnalysis(roboflowResults) {
    // Make sure the AI assistant sidebar is visible
    const chatColumn = document.getElementById('chatColumn');
    if (chatColumn && chatColumn.style.display !== 'block') {
      chatColumn.style.display = 'block';
    }
    
    // Add a message to the chat about running Gemini analysis
    const chatSidebarMessages = document.getElementById('chatSidebarMessages');
    if (chatSidebarMessages) {
      chatSidebarMessages.innerHTML += `
        <div class="message ai-message">
          <div class="system-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
            Starting scheduled Gemini AI analysis (scan ${this.roboflowCounter})...
          </div>
        </div>
      `;
      
      // Add loading indicator
      chatSidebarMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading">
          <div class="loading-text">Analyzing 3D print image...</div>
        </div>
      `;
      
      chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
    }
    
    // Add style for error messages if not already present
    if (!document.getElementById('error-message-style')) {
      const style = document.createElement('style');
      style.id = 'error-message-style';
      style.textContent = `
        .system-message.error {
          background-color: rgba(255, 0, 0, 0.1);
          color: #ff4d4d;
          border-left: 3px solid #ff4d4d;
          padding: 10px;
          margin: 10px 0;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Capture the latest image from the monitoring feed for Gemini analysis
    if (window.printMonitor && window.printMonitor.monitoringFeed) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = window.printMonitor.monitoringFeed.videoWidth;
        canvas.height = window.printMonitor.monitoringFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(window.printMonitor.monitoringFeed, 0, 0);
        
        // Update status to show Gemini processing
        if (window.printMonitor) {
          window.printMonitor.updateStatusPill('processing', 'Processing', 'Running Gemini analysis...');
          console.log('Starting Gemini AI analysis...');
        }
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        
        // Create a File object from the blob for the analyzeImage function
        const file = new File([blob], 'monitoring-capture.jpg', { type: 'image/jpeg' });
        
        // Use the same approach as the image upload section - use the window.analyzeImage function
        // which is already set up to display results in the AI assistant tab
        if (typeof window.analyzeImage === 'function') {
          // First, show the captured image in the chat
          const imagePreview = URL.createObjectURL(file);
          if (chatSidebarMessages) {
            // Remove the standard loading indicator since analyzeImage will add its own
            const loadingElement = document.getElementById('ai-loading');
            if (loadingElement) {
              loadingElement.remove();
            }
            
            // Show the image we're analyzing
            chatSidebarMessages.innerHTML += `
              <div class="message user-message">
                <img src="${imagePreview}" alt="3D Print" class="image-preview">
                <div>Automated scan #${this.roboflowCounter} - analyzing this print...</div>
              </div>
            `;
            chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
          }
          
          // Now analyze the image with the roboflow results, but set a flag to prevent duplicate image display
          console.log('Calling analyzeImage with captured frame and Roboflow predictions');
          await window.analyzeImageWithoutDuplicatingImage(file, roboflowResults.predictions || null);
        } else {
          // Fallback to the old method if analyzeImage is not available
          console.log('analyzeImage function not available, using fallback method');
          const geminiResults = await this.runGeminiDetection(blob);
          console.log('Gemini analysis results:', geminiResults);
          
          // Update the UI with the results
          this.updateResultsUI({ gemini: geminiResults });
        }
        
        // Show a completion message and restore monitoring state
        if (window.printMonitor) {
          window.printMonitor.updateStatusPill('active', 'Active', 'Gemini analysis complete');
          console.log('Gemini analysis complete');
        }
      } catch (error) {
        console.error('Error in scheduled Gemini analysis:', error);
        
        if (window.printMonitor) {
          window.printMonitor.updateStatusPill('error', 'Error', 'Gemini analysis failed');
          console.error('Gemini analysis failed: ' + error.message);
        }
        
        // Add error message to chat
        if (chatSidebarMessages) {
          // Remove loading indicator if it exists
          const loadingElement = document.getElementById('ai-loading');
          if (loadingElement) {
            loadingElement.remove();
          }
          
          chatSidebarMessages.innerHTML += `
            <div class="message ai-message">
              <div class="system-message error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Gemini analysis failed: ${error.message}
              </div>
            </div>
          `;
          chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
        }
      }
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
      
      // Also update the AI assistant chat with Gemini results if available
      this.updateAIAssistantWithGeminiResults(results.gemini);
    }
  }
  
  updateAIAssistantWithGeminiResults(geminiResults) {
    // Only proceed if we have valid results and are in monitoring mode
    if (!geminiResults || !window.printMonitor || !window.printMonitor.isMonitoring) {
      return;
    }
    
    const chatSidebarMessages = document.getElementById('chatSidebarMessages');
    if (!chatSidebarMessages) return;
    
    console.log('UpdateAIAssistantWithGeminiResults: Updating AI Assistant with Gemini results');
    
    // If we don't have proper analysis, show an error message
    if (!geminiResults.analysis || geminiResults.analysis.includes('Analysis failed')) {
      chatSidebarMessages.innerHTML += `
        <div class="message ai-message">
          <div class="system-message error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Failed to get Gemini analysis: ${geminiResults.analysis || 'Unknown error'}
          </div>
        </div>
      `;
      chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
      return;
    }
    
    // Extract the main parts from the analysis
    let confirmationText = 'Analysis not available';
    let issueType = '';
    let severity = '';
    
    // Extract confirmation
    const confirmationMatch = geminiResults.analysis.match(/Confirmation:\s*([^\n]+)/i);
    if (confirmationMatch && confirmationMatch[1]) {
      confirmationText = confirmationMatch[1].trim();
    }
    
    // Extract issue type
    const issueTypeMatch = geminiResults.analysis.match(/Issue Type:\s*([^\n]+)/i);
    if (issueTypeMatch && issueTypeMatch[1]) {
      issueType = issueTypeMatch[1].trim();
    }
    
    // Extract severity
    const severityMatch = geminiResults.analysis.match(/Severity:\s*(\d+)/i);
    if (severityMatch && severityMatch[1]) {
      const severityScore = parseInt(severityMatch[1].trim());
      
      if (severityScore >= 8) {
        severity = 'High';
      } else if (severityScore >= 4) {
        severity = 'Medium';
      } else {
        severity = 'Low';
      }
    }
    
    // Determine if it's a failure or success based on the confirmation text
    const isFailure = confirmationText.toLowerCase().includes('fail') || 
                       confirmationText.toLowerCase().includes('issue') ||
                       confirmationText.toLowerCase().includes('problem');
    
    // Create the message HTML
    let messageHTML = `
      <div class="message ai-message">
        <div class="system-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          Gemini analysis completed for scan #${this.roboflowCounter}
        </div>
      </div>
      <div class="message ai-message">
        <div class="gemini-update">
          <div class="update-header ${isFailure ? 'error' : 'success'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
            Gemini Analysis Update
          </div>
          <div class="update-content">
            <div class="update-item"><strong>Status:</strong> ${confirmationText}</div>
            ${issueType ? `<div class="update-item"><strong>Issue:</strong> ${issueType}</div>` : ''}
            ${severity ? `<div class="update-item"><strong>Severity:</strong> ${severity}</div>` : ''}
          </div>
          <div class="update-footer">
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            <button class="view-details-btn" onclick="window.showFullAnalysis('${encodeURIComponent(geminiResults.analysis.replace(/'/g, "\\'"))}')">View Full Analysis</button>
          </div>
        </div>
      </div>
    `;
    
    // Add the message to the chat
    chatSidebarMessages.innerHTML += messageHTML;
    
    // Scroll to the bottom of the chat
    chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
    
    // If this is a failure, make sure it's prominent
    if (isFailure && window.printMonitor) {
      console.log(`Gemini detected a print failure: ${issueType || confirmationText}`);
    }
    
    // Implement the showFullAnalysis function globally if it doesn't exist
    if (!window.showFullAnalysis) {
      window.showFullAnalysis = function(encodedAnalysis) {
        const analysis = decodeURIComponent(encodedAnalysis);
        
        // Create a modal to show the full analysis
        const modal = document.createElement('div');
        modal.className = 'analysis-modal';
        modal.innerHTML = `
          <div class="analysis-modal-content">
            <div class="analysis-modal-header">
              <h3>Full Gemini Analysis</h3>
              <button class="close-modal-btn">&times;</button>
            </div>
            <div class="analysis-modal-body">
              <pre>${analysis}</pre>
            </div>
          </div>
        `;
        
        // Add the modal to the body
        document.body.appendChild(modal);
        
        // Add event listener to close the modal
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        });
      };
      
      // Add modal styles if they don't exist
      if (!document.getElementById('analysis-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'analysis-modal-styles';
        style.textContent = `
          .analysis-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          }
          
          .analysis-modal-content {
            background-color: var(--card-bg-color);
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 90%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          
          .analysis-modal-header {
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
          }
          
          .analysis-modal-header h3 {
            margin: 0;
            color: var(--text-color);
          }
          
          .close-modal-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-color);
          }
          
          .analysis-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
          }
          
          .analysis-modal-body pre {
            white-space: pre-wrap;
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-color);
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add styles for the Gemini updates in chat if they don't exist
      if (!document.getElementById('gemini-update-styles')) {
        const style = document.createElement('style');
        style.id = 'gemini-update-styles';
        style.textContent = `
          .gemini-update {
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            margin-bottom: 8px;
          }
          
          .update-header {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
          }
          
          .update-header.error {
            background-color: rgba(255, 77, 77, 0.15);
            color: rgb(255, 77, 77);
          }
          
          .update-header.success {
            background-color: rgba(75, 181, 67, 0.15);
            color: rgb(75, 181, 67);
          }
          
          .update-content {
            padding: 12px;
            background-color: var(--card-bg-color);
          }
          
          .update-item {
            margin-bottom: 4px;
          }
          
          .update-footer {
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.05);
            border-top: 1px solid var(--border-color);
            font-size: 12px;
          }
          
          .timestamp {
            color: var(--text-secondary-color);
          }
          
          .view-details-btn {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
            padding: 0;
          }
          
          .system-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            font-size: 14px;
            color: var(--text-secondary-color);
          }
        `;
        document.head.appendChild(style);
      }
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