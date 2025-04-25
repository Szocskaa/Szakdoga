class DetectionManager {
  constructor() {
    this.detectionQueue = [];
    this.isProcessing = false;

    this.roboflowInterval = 60; 
    this.geminiMultiplier = 15; 

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

    const defaultProfile = this.printProfiles[this.currentProfile];
    this.roboflowInterval = defaultProfile.roboflowInterval;
    this.geminiMultiplier = defaultProfile.geminiMultiplier;

    this.cameras = [];
    this.selectedCamera = null;
    this.roboflowCounter = 0; 

    this.initializeUI();

    this.initializeSettingsToggle();

    this.initializeCameraSelection();
  }

  async initializeCameraSelection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras = devices.filter(device => device.kind === 'videoinput');

      if (this.cameras.length > 0) {
        this.selectedCamera = this.cameras[0].deviceId;
      }

      const cameraSelect = document.getElementById('cameraSelect');
      if (cameraSelect) {

        cameraSelect.innerHTML = '';

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
                <span>10 sec</span>
                <span>95 sec</span>
                <span>180 sec</span>
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
                <span>18 scans</span>
                <span>30 scans</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(settingsPanel);

    this.addSettingsEventListeners(settingsPanel);
  }

  addSettingsEventListeners(settingsPanel) {

    settingsPanel.querySelector('#closeSettings').addEventListener('click', () => {
      settingsPanel.classList.remove('visible');
    });

    const profileCards = settingsPanel.querySelectorAll('.profile-card');
    profileCards.forEach(card => {
      card.addEventListener('click', () => {
        const profileName = card.getAttribute('data-profile');
        this.loadProfile(profileName);

        profileCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    const cameraSelect = settingsPanel.querySelector('#cameraSelect');
    cameraSelect.addEventListener('change', () => {
      this.selectedCamera = cameraSelect.value;
      if (window.printMonitor) {
        window.printMonitor.updateCamera(this.selectedCamera);
      }
    });

    const captureIntervalSlider = settingsPanel.querySelector('#captureInterval');
    const captureIntervalDisplay = captureIntervalSlider.parentElement.querySelector('.value-display');

    captureIntervalSlider.addEventListener('input', () => {
      const value = parseInt(captureIntervalSlider.value);
      this.roboflowInterval = value;
      captureIntervalDisplay.textContent = `${value} seconds`;
      this.updateDetectionIntervals();
    });

    const geminiMultiplierSlider = settingsPanel.querySelector('#geminiMultiplier');
    const geminiMultiplierDisplay = geminiMultiplierSlider.parentElement.querySelector('.value-display');

    geminiMultiplierSlider.addEventListener('input', () => {
      const value = parseInt(geminiMultiplierSlider.value);
      this.geminiMultiplier = value;
      geminiMultiplierDisplay.textContent = `Every ${value} scans`;
      this.updateDetectionIntervals();
    });

    const collapsibles = settingsPanel.querySelectorAll('.settings-section.collapsible');
    collapsibles.forEach(section => {
      const header = section.querySelector('.section-header');
      const content = section.querySelector('.collapsible-content');

      content.style.display = 'none';

      header.addEventListener('click', () => {

        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';

        const arrow = header.querySelector('.dropdown-arrow');
        arrow.style.transform = isExpanded ? 'translateY(-50%)' : 'translateY(-50%) rotate(180deg)';

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

    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('visible');
      }
    });
  }

  async addToDetectionQueue(imageBlob, type = 'roboflow') {
    this.detectionQueue.push({ imageBlob, type });

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

        if (window.printMonitor) {
          console.log('Processing with Roboflow...');
        }

        results = await this.runRoboflowDetection(nextItem.imageBlob);
      } else if (nextItem.type === 'gemini') {

        if (window.printMonitor) {
          console.log('Processing with Gemini...');
        }

        results = await this.runGeminiDetection(nextItem.imageBlob);
      }

      if (!results) {
        results = { 
          predictions: [],
          time: new Date().toISOString()
        };
      }

      this.handleDetectionResults(results, nextItem.type);
    } catch (error) {
      console.error(`Error processing ${nextItem?.type || 'unknown'} detection:`, error);

      if (window.printMonitor) {
        console.error(`Error processing ${nextItem?.type || 'unknown'} detection`);

        window.printMonitor.handleDetectionResult({
          predictions: [],
          time: new Date().toISOString()
        }, nextItem?.type || 'unknown');
      }
    } finally {
      this.isProcessing = false;

      if (this.detectionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100); 
      }
    }
  }

  async runRoboflowDetection(imageBlob) {
    try {

      const imageFile = new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('http://localhost:7070/api/roboflow/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Error in Roboflow detection:', error);

      return {
        predictions: [],
        time: new Date().toISOString()
      };
    }
  }

  async runGeminiDetection(imageBlob) {
    try {
      console.log('RunGeminiDetection: Starting Gemini detection with blob size:', imageBlob.size);

      if (typeof window.analyzeWithGemini !== 'function') {
        console.error('RunGeminiDetection: window.analyzeWithGemini is not a function');
        throw new Error('Gemini analysis function not available');
      }

      const imageFile = new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' });

      console.log('RunGeminiDetection: Calling analyzeWithGemini with image file');

      const result = await window.analyzeWithGemini(imageFile);

      console.log('RunGeminiDetection: Received result from Gemini:', result);
      return result;
    } catch (error) {
      console.error('RunGeminiDetection: Error in Gemini detection:', error);
      throw error; 
    }
  }

  handleDetectionResults(results, type) {

    if (window.printMonitor) {
      window.printMonitor.handleDetectionResult(results, type);
    }

    if (type === 'roboflow') {

      this.updateResultsUI({ roboflow: results });

      console.log(`Roboflow detection #${this.roboflowCounter} complete. Checking if Gemini scan needed...`);

      if (this.roboflowCounter % this.geminiMultiplier === 0) {

        console.log(`Running scheduled Gemini analysis (every ${this.geminiMultiplier} scans)`);

        this.runScheduledGeminiAnalysis(results);
      }
    } else if (type === 'gemini') {
      this.updateResultsUI({ gemini: results });
    }
  }

  async runScheduledGeminiAnalysis(roboflowResults) {

    const chatColumn = document.getElementById('chatColumn');
    if (chatColumn && chatColumn.style.display !== 'block') {
      chatColumn.style.display = 'block';
    }

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

      chatSidebarMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading">
          <div class="loading-text">Analyzing 3D print image...</div>
        </div>
      `;

      chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
    }

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

    if (window.printMonitor && window.printMonitor.monitoringFeed) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = window.printMonitor.monitoringFeed.videoWidth;
        canvas.height = window.printMonitor.monitoringFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(window.printMonitor.monitoringFeed, 0, 0);

        if (window.printMonitor) {
          window.printMonitor.updateStatusPill('processing', 'Processing', 'Running Gemini analysis...');
          console.log('Starting Gemini AI analysis...');
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

        const file = new File([blob], 'monitoring-capture.jpg', { type: 'image/jpeg' });

        if (typeof window.analyzeImage === 'function') {

          const imagePreview = URL.createObjectURL(file);
          if (chatSidebarMessages) {

            const loadingElement = document.getElementById('ai-loading');
            if (loadingElement) {
              loadingElement.remove();
            }

            chatSidebarMessages.innerHTML += `
              <div class="message user-message">
                <img src="${imagePreview}" alt="3D Print" class="image-preview">
                <div>Automated scan #${this.roboflowCounter} - analyzing this print...</div>
              </div>
            `;
            chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;
          }

          console.log('Calling analyzeImage with captured frame and Roboflow predictions');
          await window.analyzeImageWithoutDuplicatingImage(file, roboflowResults.predictions || null);
        } else {

          console.log('analyzeImage function not available, using fallback method');
          const geminiResults = await this.runGeminiDetection(blob);
          console.log('Gemini analysis results:', geminiResults);

          this.updateResultsUI({ gemini: geminiResults });
        }

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

        if (chatSidebarMessages) {

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

    const combined = {
      summary: {},
      details: {},
      confidence: 0
    };

    if (roboflowResults && roboflowResults.detected) {
      combined.summary.failureDetected = roboflowResults.detected;
      combined.details.roboflow = roboflowResults;
      combined.confidence += 50; 
    }

    if (geminiResults && geminiResults.analysis) {
      if (geminiResults.analysis.includes('failure') || 
          geminiResults.analysis.includes('problem') ||
          geminiResults.analysis.includes('issue')) {
        combined.summary.failureConfirmed = true;
        combined.confidence += 50; 
      }
      combined.details.gemini = geminiResults;
    }

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

    resultsDisplay.innerHTML = '';

    if (results.roboflow) {

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

      this.updateAIAssistantWithGeminiResults(results.gemini);
    }
  }

  updateAIAssistantWithGeminiResults(geminiResults) {

    if (!geminiResults || !window.printMonitor || !window.printMonitor.isMonitoring) {
      return;
    }

    const chatSidebarMessages = document.getElementById('chatSidebarMessages');
    if (!chatSidebarMessages) return;

    console.log('UpdateAIAssistantWithGeminiResults: Updating AI Assistant with Gemini results');

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

    let confirmationText = 'Analysis not available';
    let issueType = '';
    let severity = '';

    const confirmationMatch = geminiResults.analysis.match(/Confirmation:\s*([^\n]+)/i);
    if (confirmationMatch && confirmationMatch[1]) {
      confirmationText = confirmationMatch[1].trim();
    }

    const issueTypeMatch = geminiResults.analysis.match(/Issue Type:\s*([^\n]+)/i);
    if (issueTypeMatch && issueTypeMatch[1]) {
      issueType = issueTypeMatch[1].trim();
    }

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

    const isFailure = confirmationText.toLowerCase().includes('fail') || 
                       confirmationText.toLowerCase().includes('issue') ||
                       confirmationText.toLowerCase().includes('problem');

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

    chatSidebarMessages.innerHTML += messageHTML;

    chatSidebarMessages.scrollTop = chatSidebarMessages.scrollHeight;

    if (isFailure && window.printMonitor) {
      console.log(`Gemini detected a print failure: ${issueType || confirmationText}`);
    }

    if (!window.showFullAnalysis) {
      window.showFullAnalysis = function(encodedAnalysis) {
        const analysis = decodeURIComponent(encodedAnalysis);

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

        document.body.appendChild(modal);

        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
          document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        });
      };

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

    if (window.printMonitor) {
      window.printMonitor.updateCaptureInterval(this.roboflowInterval);
    }
  }

  loadProfile(profileName) {
    if (this.printProfiles[profileName]) {
      this.currentProfile = profileName;
      const profile = this.printProfiles[profileName];

      this.roboflowInterval = profile.roboflowInterval;
      this.geminiMultiplier = profile.geminiMultiplier;

      this.updateUIFromProfile();

      this.updateDetectionIntervals();
    }
  }

  updateUIFromProfile() {

    const captureInterval = document.getElementById('captureInterval');
    const geminiMultiplier = document.getElementById('geminiMultiplier');

    if (captureInterval) captureInterval.value = this.roboflowInterval;
    if (geminiMultiplier) geminiMultiplier.value = this.geminiMultiplier;

    const captureIntervalDisplay = captureInterval?.parentElement.querySelector('.value-display');
    const geminiMultiplierDisplay = geminiMultiplier?.parentElement.querySelector('.value-display');

    if (captureIntervalDisplay) captureIntervalDisplay.textContent = `${this.roboflowInterval} seconds`;
    if (geminiMultiplierDisplay) geminiMultiplierDisplay.textContent = `Every ${this.geminiMultiplier} scans`;
  }

  handleVerifiedDetection(combinedResults) {

    this.updateResultsUI(combinedResults);

    if (combinedResults.summary && combinedResults.summary.failureDetected) {

      if (window.printMonitor && !window.printMonitor.isPaused) {
        window.printMonitor.togglePause();
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.detectionManager = new DetectionManager();

  setTimeout(() => {
    window.detectionManager.updateUIFromProfile();
  }, 100);
});