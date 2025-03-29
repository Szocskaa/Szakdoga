class DetectionManager {
  constructor() {
    this.detectionQueue = [];
    this.isProcessing = false;
    this.alertSound = new Audio('/sounds/alert.mp3');
    this.alertSound.volume = 0.5;
    
    // Detection intervals (in seconds)
    this.roboflowInterval = 5;
    this.geminiInterval = 30;
    
    // Alert settings
    this.alerts = [];
    this.alertPreferences = {
      soundEnabled: true,
      severityLevels: {
        critical: true,
        warning: true,
        info: false
      }
    };
    
    // Print profiles
    this.printProfiles = {
      default: {
        name: 'Default',
        roboflowInterval: 5,
        geminiInterval: 30,
        detectionThreshold: 80,
        alertPreferences: this.alertPreferences
      }
    };
    
    this.currentProfile = 'default';
    
    // Initialize UI elements
    this.initializeUI();
    
    // Add settings toggle functionality
    this.initializeSettingsToggle();
  }
  
  initializeUI() {
    // Create alert container
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    document.body.appendChild(alertContainer);
    
    // Create settings panel
    this.createSettingsPanel();
  }
  
  createSettingsPanel() {
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
      <h3>Detection Settings</h3>
      <div class="settings-section">
        <h4>Detection Intervals</h4>
        <div class="setting-item">
          <label for="roboflowInterval">Roboflow Interval (seconds)</label>
          <input type="number" id="roboflowInterval" min="1" max="60" value="${this.roboflowInterval}">
        </div>
        <div class="setting-item">
          <label for="geminiInterval">Gemini Interval (seconds)</label>
          <input type="number" id="geminiInterval" min="10" max="300" value="${this.geminiInterval}">
        </div>
      </div>
      
      <div class="settings-section">
        <h4>Alert Preferences</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="soundEnabled" ${this.alertPreferences.soundEnabled ? 'checked' : ''}>
            Enable Sound Alerts
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="criticalAlerts" ${this.alertPreferences.severityLevels.critical ? 'checked' : ''}>
            Critical Alerts
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="warningAlerts" ${this.alertPreferences.severityLevels.warning ? 'checked' : ''}>
            Warning Alerts
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" id="infoAlerts" ${this.alertPreferences.severityLevels.info ? 'checked' : ''}>
            Info Alerts
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h4>Print Profiles</h4>
        <div class="setting-item">
          <select id="printProfile">
            ${Object.keys(this.printProfiles).map(profile => 
              `<option value="${profile}" ${profile === this.currentProfile ? 'selected' : ''}>
                ${this.printProfiles[profile].name}
              </option>`
            ).join('')}
          </select>
        </div>
        <button id="saveProfile" class="btn btn-primary">Save Current as Profile</button>
      </div>
    `;
    
    // Add event listeners
    settingsPanel.querySelector('#roboflowInterval').addEventListener('change', (e) => {
      this.roboflowInterval = parseInt(e.target.value);
      this.updateDetectionIntervals();
    });
    
    settingsPanel.querySelector('#geminiInterval').addEventListener('change', (e) => {
      this.geminiInterval = parseInt(e.target.value);
      this.updateDetectionIntervals();
    });
    
    settingsPanel.querySelector('#soundEnabled').addEventListener('change', (e) => {
      this.alertPreferences.soundEnabled = e.target.checked;
    });
    
    settingsPanel.querySelector('#criticalAlerts').addEventListener('change', (e) => {
      this.alertPreferences.severityLevels.critical = e.target.checked;
    });
    
    settingsPanel.querySelector('#warningAlerts').addEventListener('change', (e) => {
      this.alertPreferences.severityLevels.warning = e.target.checked;
    });
    
    settingsPanel.querySelector('#infoAlerts').addEventListener('change', (e) => {
      this.alertPreferences.severityLevels.info = e.target.checked;
    });
    
    settingsPanel.querySelector('#printProfile').addEventListener('change', (e) => {
      this.loadProfile(e.target.value);
    });
    
    settingsPanel.querySelector('#saveProfile').addEventListener('click', () => {
      this.saveCurrentAsProfile();
    });
    
    document.body.appendChild(settingsPanel);
  }
  
  initializeSettingsToggle() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.querySelector('.settings-panel');
    
    settingsToggle.addEventListener('click', () => {
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
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.detectionQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const { imageBlob, type } = this.detectionQueue.shift();
    
    try {
      let results;
      if (type === 'roboflow') {
        results = await this.runRoboflowDetection(imageBlob);
      } else {
        results = await this.runGeminiDetection(imageBlob);
      }
      
      this.handleDetectionResults(results, type);
    } catch (error) {
      console.error('Error processing detection:', error);
    }
    
    await this.processQueue();
  }
  
  async runRoboflowDetection(imageBlob) {
    // Implement Roboflow detection
    // This should use your existing Roboflow API integration
    return await window.analyzeImage(new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' }));
  }
  
  async runGeminiDetection(imageBlob) {
    // Implement Gemini detection
    // This should use your existing Gemini API integration
    return await window.analyzeWithGemini(new File([imageBlob], 'capture.jpg', { type: 'image/jpeg' }));
  }
  
  handleDetectionResults(results, type) {
    // Combine results from both systems
    const combinedResults = this.combineResults(results);
    
    // Check for alerts
    if (this.shouldAlert(combinedResults)) {
      this.createAlert(combinedResults);
    }
    
    // Update UI with results
    this.updateResultsUI(combinedResults);
  }
  
  combineResults(results) {
    // Implement result combination logic
    // This should merge results from both detection systems
    return results;
  }
  
  shouldAlert(results) {
    // Implement alert threshold logic
    return results.severity >= this.printProfiles[this.currentProfile].detectionThreshold;
  }
  
  createAlert(results) {
    const alert = {
      id: Date.now(),
      timestamp: new Date(),
      severity: results.severity,
      message: results.message,
      acknowledged: false
    };
    
    this.alerts.push(alert);
    this.showAlert(alert);
    
    if (this.alertPreferences.soundEnabled) {
      this.playAlertSound(alert.severity);
    }
  }
  
  showAlert(alert) {
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${alert.severity}`;
    alertElement.innerHTML = `
      <div class="alert-content">
        <span class="alert-severity">${alert.severity.toUpperCase()}</span>
        <p class="alert-message">${alert.message}</p>
        <span class="alert-time">${alert.timestamp.toLocaleTimeString()}</span>
      </div>
      <button class="alert-acknowledge">Acknowledge</button>
    `;
    
    alertElement.querySelector('.alert-acknowledge').addEventListener('click', () => {
      this.acknowledgeAlert(alert.id);
    });
    
    document.querySelector('.alert-container').appendChild(alertElement);
  }
  
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      const alertElement = document.querySelector(`.alert[data-id="${alertId}"]`);
      if (alertElement) {
        alertElement.classList.add('acknowledged');
      }
    }
  }
  
  playAlertSound(severity) {
    if (this.alertPreferences.severityLevels[severity]) {
      this.alertSound.play().catch(error => console.error('Error playing alert sound:', error));
    }
  }
  
  updateResultsUI(results) {
    // Implement UI update logic for detection results
    // This should update the results container with the latest detection data
  }
  
  updateDetectionIntervals() {
    // Update intervals for both detection systems
    if (window.printMonitor) {
      window.printMonitor.updateIntervals(this.roboflowInterval, this.geminiInterval);
    }
  }
  
  loadProfile(profileName) {
    const profile = this.printProfiles[profileName];
    if (profile) {
      this.currentProfile = profileName;
      this.roboflowInterval = profile.roboflowInterval;
      this.geminiInterval = profile.geminiInterval;
      this.alertPreferences = profile.alertPreferences;
      this.updateUIFromProfile();
    }
  }
  
  saveCurrentAsProfile() {
    const name = prompt('Enter profile name:');
    if (name) {
      this.printProfiles[name] = {
        name,
        roboflowInterval: this.roboflowInterval,
        geminiInterval: this.geminiInterval,
        detectionThreshold: this.printProfiles[this.currentProfile].detectionThreshold,
        alertPreferences: { ...this.alertPreferences }
      };
      this.updateProfileSelect();
    }
  }
  
  updateProfileSelect() {
    const select = document.getElementById('printProfile');
    select.innerHTML = Object.keys(this.printProfiles).map(profile => 
      `<option value="${profile}" ${profile === this.currentProfile ? 'selected' : ''}>
        ${this.printProfiles[profile].name}
      </option>`
    ).join('');
  }
  
  updateUIFromProfile() {
    // Update UI elements with current profile settings
    document.getElementById('roboflowInterval').value = this.roboflowInterval;
    document.getElementById('geminiInterval').value = this.geminiInterval;
    document.getElementById('soundEnabled').checked = this.alertPreferences.soundEnabled;
    document.getElementById('criticalAlerts').checked = this.alertPreferences.severityLevels.critical;
    document.getElementById('warningAlerts').checked = this.alertPreferences.severityLevels.warning;
    document.getElementById('infoAlerts').checked = this.alertPreferences.severityLevels.info;
  }
}

// Initialize the detection manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.detectionManager = new DetectionManager();
}); 