document.addEventListener('DOMContentLoaded', function() {

  const chatSidebarInput = document.getElementById('chatSidebarInput');
  const chatSidebarMessages = document.getElementById('chatSidebarMessages');
  const sendSidebarButton = document.getElementById('sendSidebarButton');

  sendSidebarButton.addEventListener('click', () => sendChatMessage());

  chatSidebarInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  async function sendChatMessage() {
    console.log('sendChatMessage function called');

    const chatInput = document.getElementById('chatSidebarInput');

    const chatMessages = document.getElementById('chatSidebarMessages');

    console.log('chatInput:', chatInput);
    console.log('chatMessages:', chatMessages);

    if (!chatInput || !chatMessages) {
      console.error('Chat input or messages element not found');
      return;
    }

    const message = chatInput.value.trim();
    console.log('Message to send:', message);

    if (!message) {
      console.log('Empty message, not sending');
      return;
    }

    chatMessages.innerHTML += `
      <div class="message user-message">
        ${window.escapeHtml ? window.escapeHtml(message) : message}
      </div>
    `;

    chatInput.value = '';

    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {

      chatMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading">
          Thinking...
        </div>
      `;

      console.log('Sending API request to Gemini');

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', errorText);
        throw new Error(`Failed to get response from AI: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      const formattedResponse = formatMarkdown(data.response || '', false);
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't process your message. Please try again. Error: ${error.message}
        </div>
      `;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function formatMarkdown(text, isImageAnalysis = false) {
    if (!text) return '';

    if (isImageAnalysis) {
      return formatImageAnalysis(text);
    }

    text = text.replace(/^#\s+(.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s+(.*?)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s+(.*?)$/gm, '<h5>$1</h5>');

    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    text = text.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    text = text.replace(/^\s*•\s+(.*?)$/gm, '<li>$1</li>');
    text = text.replace(/^([0-9]+)\.\s+(.*?)$/gm, '<li>$1. $2</li>');

    text = text.replace(/\n\n/g, '<br>');

    text = text.replace(/(<li>.*?<\/li>)+/g, function(match) {
      return '<ul>' + match + '</ul>';
    });

    return text;
  }

  function formatImageAnalysis(text) {
    console.log('Raw analysis text:', text);

    let status = 'uncertain';
    let statusColor = 'var(--warning-color)';
    let statusText = 'Analysis Uncertain';

    const confirmationMatch = text.match(/confirmation\s*:\s*([^\n]+)/i);
    if (confirmationMatch && confirmationMatch[1]) {
      const confirmationText = confirmationMatch[1].trim().toLowerCase();

      if (confirmationText.includes('failed') || 
          confirmationText.includes('failure') || 
          confirmationText.includes('not acceptable')) {
        status = 'failure';
        statusColor = 'var(--error-color)';
        statusText = 'Print Failure Detected';
      } else if (confirmationText.includes('success') || 
                 confirmationText.includes('acceptable') || 
                 confirmationText.includes('good')) {
        status = 'success';
        statusColor = 'var(--success-color)';
        statusText = 'Print Quality Acceptable';
      }
    } else {

      if (text.toLowerCase().includes('failed') || 
          text.toLowerCase().includes('failure') || 
          text.toLowerCase().includes('issue') || 
          text.toLowerCase().includes('poor quality')) {
        status = 'failure';
        statusColor = 'var(--error-color)';
        statusText = 'Print Failure Detected';
      } else if (text.toLowerCase().includes('success') || 
                 text.toLowerCase().includes('acceptable') || 
                 text.toLowerCase().includes('good quality') || 
                 text.toLowerCase().includes('no issues')) {
        status = 'success';
        statusColor = 'var(--success-color)';
        statusText = 'Print Quality Acceptable';
      }
    }

    let failureType = '';
    const issueTypeMatch = text.match(/issue\s+type\s*:\s*([^\n]+)/i);
    if (issueTypeMatch && issueTypeMatch[1]) {
      failureType = issueTypeMatch[1].trim();
    } else {

      const failureTypeRegex = /(?:failure|issue|problem)(?:\s+type)?(?:\s*:)?\s*([^\n.]+)/i;
      const failureMatch = text.match(failureTypeRegex);
      if (failureMatch && failureMatch[1]) {
        failureType = failureMatch[1].trim();
      } else {

        const qualityRegex = /quality(?:\s+is)?(?:\s*:)?\s*([^\n.]+)/i;
        const qualityMatch = text.match(qualityRegex);
        if (qualityMatch && qualityMatch[1]) {
          failureType = qualityMatch[1].trim();
        } else {
          failureType = status === 'failure' ? 'Unspecified Issue' : 'Overall Good Quality';
        }
      }
    }

    const issueMap = {
      'stringing': { name: 'Stringing', index: 12 },
      'oozing': { name: 'Stringing', index: 12 },
      'layer shift': { name: 'Shift in layers', index: 11 },
      'layer separation': { name: 'Separated layers', index: 2 },
      'warping': { name: 'Edges lifting off from the plate', index: 5 },
      'curling': { name: 'Edges lifting off from the plate', index: 5 },
      'lifting': { name: 'Edges lifting off from the plate', index: 5 },
      'adhesion': { name: 'Print doesn\'t stick on the plate', index: 6 },
      'sticking': { name: 'Print doesn\'t stick on the plate', index: 6 },
      'no extrusion': { name: 'No filament coming out', index: 8 },
      'inconsistent': { name: 'Inconsistent extrusion', index: 3 },
      'under extrusion': { name: 'Inconsistent extrusion', index: 3 },
      'over extrusion': { name: 'Inconsistent extrusion', index: 3 },
      'melted': { name: 'Melted points on the print', index: 9 },
      'air': { name: 'Printing in the air', index: 10 },
      'messy': { name: 'Spider nets, messy surfaces', index: 1 },
      'spider web': { name: 'Spider nets, messy surfaces', index: 1 },
      'webbing': { name: 'Spider nets, messy surfaces', index: 1 },
      'mid-air': { name: 'Beginning mid-air', index: 4 },
      'offset': { name: 'Shift in layers', index: 11 }
    };

    let issueCategory = null;
    const lowerFailureType = failureType.toLowerCase();
    for (const [key, value] of Object.entries(issueMap)) {
      if (lowerFailureType.includes(key)) {
        issueCategory = value;
        break;
      }
    }

    let causes = [];

    const causesStartMatch = text.match(/potential\s+causes\s*:\s*\n/i);
    if (causesStartMatch) {

      const startIndex = causesStartMatch.index + causesStartMatch[0].length;

      let endIndex = text.indexOf('Recommended Fixes', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('Severity', startIndex);
      if (endIndex === -1) endIndex = text.length;

      const causesSection = text.substring(startIndex, endIndex).trim();

      causes = causesSection.split(/\n\s*-\s*|\n\s*\d+\.\s*/)
        .map(cause => cause.trim())
        .filter(cause => cause.length > 0);
    } else {

      let causesSection = text.match(/(?:causes|potential causes|reasons|why this happened)(?:\s*:)?\s*([\s\S]*?)(?=\n\s*\n|recommended fixes|severity|fix|suggest|action|$)/i);
      if (causesSection && causesSection[1]) {

        let causesList = causesSection[1].split(/\n\s*[-*•]|\n\s*\d+\.\s+/);
        causes = causesList.filter(cause => cause.trim()).map(cause => cause.trim());
      }
    }

    let fixes = [];

    const fixesStartMatch = text.match(/recommended\s+fixes\s*:\s*\n/i);
    if (fixesStartMatch) {

      const startIndex = fixesStartMatch.index + fixesStartMatch[0].length;

      let endIndex = text.indexOf('Severity', startIndex);
      if (endIndex === -1) endIndex = text.length;

      const fixesSection = text.substring(startIndex, endIndex).trim();

      fixes = fixesSection.split(/\n\s*-\s*|\n\s*\d+\.\s*/)
        .map(fix => fix.trim())
        .filter(fix => fix.length > 0);
    } else {

      let fixesSection = text.match(/(?:solutions|fixes|recommendations|how to fix|action|suggested)(?:\s*:)?\s*([\s\S]*?)(?=\n\s*\n|severity|causes|$)/i);
      if (fixesSection && fixesSection[1]) {
        let fixesList = fixesSection[1].split(/\n\s*[-*•]|\n\s*\d+\.\s+/);
        fixes = fixesList.filter(fix => fix.trim()).map(fix => fix.trim());
      }
    }

    let severity = '';
    let severityScore = '';

    const severityMatch = text.match(/severity\s*:\s*(\d+)(?:\s*\/\s*10)?/i);
    if (severityMatch && severityMatch[1]) {
      severityScore = parseInt(severityMatch[1]);

      if (severityScore >= 8) {
        severity = 'High';
      } else if (severityScore >= 4) {
        severity = 'Medium';
      } else {
        severity = 'Low';
      }
    } else if (status === 'failure') {
      severity = 'Unknown';
      severityScore = 'N/A';
    } else {
      severity = 'None';
      severityScore = '0';
    }

    let html = `
      <div class="analysis-container">
        <div class="analysis-header" style="background-color: ${statusColor}">
          <h3>${statusText}</h3>
        </div>

        <div class="analysis-content">
          <div class="analysis-section">
            <h4>Issue Assessment</h4>
            <p class="assessment-text">${failureType}</p>`;

    if (issueCategory) {
      html += `
            <div class="reference-link">
              <div class="category-badge">${issueCategory.name}</div>
              <a href="https://realvisiononline.com/blog/the-12-most-common-problems-in-3d-printing-and-how-to-fix-them#${issueCategory.index}" target="_blank">
                View details about this specific issue
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>`;
    }

    html += `
            <div class="info-link">
              <a href="https://realvisiononline.com/blog/the-12-most-common-problems-in-3d-printing-and-how-to-fix-them" target="_blank">
                Learn more about common 3D printing issues
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          <div class="analysis-section">
            <h4>Potential Causes</h4>
            <ul class="analysis-list">
              ${causes.length > 0 ? 
                causes.map(cause => `<li>${cause}</li>`).join('') : 
                '<li>No specific causes identified</li>'}
            </ul>
          </div>

          <div class="analysis-section">
            <h4>Recommended Fixes</h4>
            <ul class="analysis-list">
              ${fixes.length > 0 ? 
                fixes.map(fix => `<li>${fix}</li>`).join('') : 
                '<li>No specific fixes suggested</li>'}
            </ul>
          </div>

          <div class="analysis-section severity-section">
            <h4>Severity Assessment</h4>
            <div class="severity-display">
              <div class="severity-label">${severity}</div>
              ${severityScore !== 'N/A' ? 
                `<div class="severity-meter">
                  <div class="severity-bar">
                    <div class="severity-fill" style="width: ${severityScore * 10}%"></div>
                  </div>
                  <span class="severity-score">${severityScore}/10</span>
                </div>` :
                `<div class="severity-unknown">Unable to determine severity</div>`}
            </div>
          </div>
        </div>

        <div class="analysis-footer">
          <div class="analysis-note">
            <p>For a detailed explanation, ask follow-up questions in the chat</p>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  async function analyzeImage(file, predictionData = null) {
    console.log('analyzeImage function called with file:', file);
    if (predictionData) {
      console.log('Prediction data provided:', predictionData);
    }

    const chatMessages = document.getElementById('chatSidebarMessages');

    if (!chatMessages) {
      console.error('Chat messages element not found');
      return;
    }

    if (document.getElementById('ai-loading')) {
      console.log('Analysis already in progress, not starting a new one');
      return;
    }

    const imagePreview = URL.createObjectURL(file);
    chatMessages.innerHTML += `
      <div class="message user-message">
        <img src="${imagePreview}" alt="3D Print" class="image-preview">
        <div>Analyzing this 3D print${predictionData ? ' with Roboflow predictions' : ''}...</div>
      </div>
    `;

    chatMessages.innerHTML += `
      <div class="message ai-message" id="ai-loading">
        <div class="loading-text">Analyzing your 3D print failure...</div>
      </div>
    `;

    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const formData = new FormData();
      formData.append('image', file);

      if (predictionData) {
        formData.append('predictions', JSON.stringify(predictionData));
      }

      console.log('Sending 3D print image for analysis to Gemini');

      const response = await fetch('/api/gemini/analyze-print', {
        method: 'POST',
        body: formData,
      });

      console.log('Gemini analyze print response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error analyzing image with Gemini:', errorText);
        throw new Error(`Failed to analyze image: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini analysis response data:', data);

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      const formattedResponse = formatMarkdown(data.response || '', true);
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;

      setTimeout(() => {
        const severityFills = document.querySelectorAll('.severity-fill');
        severityFills.forEach(fill => {
          fill.style.animation = 'none';
          fill.offsetHeight; 
          fill.style.animation = null;
        });
      }, 100);

      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. Please try again. Error: ${error.message}
        </div>
      `;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  window.formatMarkdown = formatMarkdown;

  window.analyzeImage = analyzeImage;

  window.analyzeImageWithoutDuplicatingImage = async function(file, predictionData = null) {
    console.log('analyzeImageWithoutDuplicatingImage called - preventing duplicate image display');

    const chatMessages = document.getElementById('chatSidebarMessages');

    if (!chatMessages) {
      console.error('Chat messages element not found');
      return;
    }

    if (document.getElementById('ai-loading')) {
      console.log('Analysis already in progress, not starting a new one');
      return;
    }

    chatMessages.innerHTML += `
      <div class="message ai-message" id="ai-loading">
        <div class="loading-text">Analyzing your 3D print failure...</div>
      </div>
    `;

    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {

      const formData = new FormData();
      formData.append('image', file);

      if (predictionData) {
        formData.append('predictions', JSON.stringify(predictionData));
      }

      const response = await fetch('/api/gemini/analyze-print', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      const formattedAnalysis = formatImageAnalysis(data.response);

      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedAnalysis}
        </div>
      `;

      chatMessages.scrollTop = chatMessages.scrollHeight;

      return data;
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);

      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. Please try again. Error: ${error.message}
        </div>
      `;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  window.analyzeWithGemini = async function(imageFile) {
    console.log('analyzeWithGemini called from detection-manager');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/gemini/analyze-print', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze image: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini analysis completed successfully');

      return {
        analysis: data.response,
        imageUrl: data.imageUrl,
        time: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in analyzeWithGemini:', error);

      return {
        analysis: 'Analysis failed: ' + error.message,
        time: new Date().toISOString()
      };
    }
  };

  if (!window.escapeHtml) {
    window.escapeHtml = function(unsafe) {
      if (!unsafe) return '';
      return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
  }
});