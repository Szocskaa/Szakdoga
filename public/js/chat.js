document.addEventListener('DOMContentLoaded', function() {
  // Chat functionality
  const chatSidebarInput = document.getElementById('chatSidebarInput');
  const chatSidebarMessages = document.getElementById('chatSidebarMessages');
  const sendSidebarButton = document.getElementById('sendSidebarButton');
  
  // Add event listeners for chat functionality  
  sendSidebarButton.addEventListener('click', () => sendChatMessage());
  
  chatSidebarInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  // Chat message sending function
  async function sendChatMessage() {
    console.log('sendChatMessage function called');
    
    // Get the chat input element - only use chatSidebarInput as that's what exists in the HTML
    const chatInput = document.getElementById('chatSidebarInput');
    
    // Get the chat messages container - only use chatSidebarMessages as that's what exists in the HTML
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
    
    // Add user message
    chatMessages.innerHTML += `
      <div class="message user-message">
        ${window.escapeHtml ? window.escapeHtml(message) : message}
      </div>
    `;
    
    // Clear input
    chatInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
      // Show loading indicator
      chatMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading">
          Thinking...
        </div>
      `;
      
      console.log('Sending API request to Gemini');
      
      // Send to backend
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
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response with markdown formatting but not the table style (false param)
      const formattedResponse = formatMarkdown(data.response || '', false);
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Show error message
      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't process your message. Please try again. Error: ${error.message}
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Helper function to format markdown-like text
  function formatMarkdown(text, isImageAnalysis = false) {
    if (!text) return '';
    
    // For image analysis responses, use a special structured format
    if (isImageAnalysis) {
      return formatImageAnalysis(text);
    }
    
    // Regular formatting for normal chat messages
    text = text.replace(/^#\s+(.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s+(.*?)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s+(.*?)$/gm, '<h5>$1</h5>');
    
    // Format bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Format italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Format bullet points - capture and remove the dash/hyphen completely
    text = text.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    text = text.replace(/^\s*•\s+(.*?)$/gm, '<li>$1</li>');
    text = text.replace(/^([0-9]+)\.\s+(.*?)$/gm, '<li>$1. $2</li>');
    
    // Replace line breaks with <br>
    text = text.replace(/\n\n/g, '<br>');
    
    // Enclose any sequence of <li> elements with <ul>
    text = text.replace(/(<li>.*?<\/li>)+/g, function(match) {
      return '<ul>' + match + '</ul>';
    });
    
    return text;
  }
  
  // Function to format image analysis into a structured visual layout
  function formatImageAnalysis(text) {
    console.log('Raw analysis text:', text);
    
    // Determine if it's a failure, success, or uncertain result
    let status = 'uncertain';
    let statusColor = 'var(--warning-color)';
    let statusText = 'Analysis Uncertain';
    
    // Check for confirmation section first
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
      // Fallback to general text scanning if no confirmation section
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
    
    // Extract failure type or quality assessment from the issue type section
    let failureType = '';
    const issueTypeMatch = text.match(/issue\s+type\s*:\s*([^\n]+)/i);
    if (issueTypeMatch && issueTypeMatch[1]) {
      failureType = issueTypeMatch[1].trim();
    } else {
      // Fallbacks if issue type isn't clearly marked
      const failureTypeRegex = /(?:failure|issue|problem)(?:\s+type)?(?:\s*:)?\s*([^\n.]+)/i;
      const failureMatch = text.match(failureTypeRegex);
      if (failureMatch && failureMatch[1]) {
        failureType = failureMatch[1].trim();
      } else {
        // If no explicit failure type, try to find a quality description
        const qualityRegex = /quality(?:\s+is)?(?:\s*:)?\s*([^\n.]+)/i;
        const qualityMatch = text.match(qualityRegex);
        if (qualityMatch && qualityMatch[1]) {
          failureType = qualityMatch[1].trim();
        } else {
          failureType = status === 'failure' ? 'Unspecified Issue' : 'Overall Good Quality';
        }
      }
    }
    
    // Map common 3D printing issues to reference guide categories
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
    
    // Determine the relevant issue category from our reference guide
    let issueCategory = null;
    const lowerFailureType = failureType.toLowerCase();
    for (const [key, value] of Object.entries(issueMap)) {
      if (lowerFailureType.includes(key)) {
        issueCategory = value;
        break;
      }
    }
    
    // Extract potential causes
    let causes = [];
    // Look for the exact "Potential Causes:" section first
    const causesStartMatch = text.match(/potential\s+causes\s*:\s*\n/i);
    if (causesStartMatch) {
      // Find where the causes section starts
      const startIndex = causesStartMatch.index + causesStartMatch[0].length;
      
      // Find where the causes section might end (next section or end of text)
      let endIndex = text.indexOf('Recommended Fixes', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('Severity', startIndex);
      if (endIndex === -1) endIndex = text.length;
      
      // Extract the causes section
      const causesSection = text.substring(startIndex, endIndex).trim();
      
      // Split by bullet points or numbers
      causes = causesSection.split(/\n\s*-\s*|\n\s*\d+\.\s*/)
        .map(cause => cause.trim())
        .filter(cause => cause.length > 0);
    } else {
      // Fallback to look for different patterns of cause descriptions
      let causesSection = text.match(/(?:causes|potential causes|reasons|why this happened)(?:\s*:)?\s*([\s\S]*?)(?=\n\s*\n|recommended fixes|severity|fix|suggest|action|$)/i);
      if (causesSection && causesSection[1]) {
        // Split by bullet points or numbers
        let causesList = causesSection[1].split(/\n\s*[-*•]|\n\s*\d+\.\s+/);
        causes = causesList.filter(cause => cause.trim()).map(cause => cause.trim());
      }
    }
    
    // Extract fixes/suggestions
    let fixes = [];
    // Look for the exact "Recommended Fixes:" section first
    const fixesStartMatch = text.match(/recommended\s+fixes\s*:\s*\n/i);
    if (fixesStartMatch) {
      // Find where the fixes section starts
      const startIndex = fixesStartMatch.index + fixesStartMatch[0].length;
      
      // Find where the fixes section might end (next section or end of text)
      let endIndex = text.indexOf('Severity', startIndex);
      if (endIndex === -1) endIndex = text.length;
      
      // Extract the fixes section
      const fixesSection = text.substring(startIndex, endIndex).trim();
      
      // Split by bullet points or numbers
      fixes = fixesSection.split(/\n\s*-\s*|\n\s*\d+\.\s*/)
        .map(fix => fix.trim())
        .filter(fix => fix.length > 0);
    } else {
      // Fallback to look for different patterns of fix descriptions
      let fixesSection = text.match(/(?:solutions|fixes|recommendations|how to fix|action|suggested)(?:\s*:)?\s*([\s\S]*?)(?=\n\s*\n|severity|causes|$)/i);
      if (fixesSection && fixesSection[1]) {
        let fixesList = fixesSection[1].split(/\n\s*[-*•]|\n\s*\d+\.\s+/);
        fixes = fixesList.filter(fix => fix.trim()).map(fix => fix.trim());
      }
    }
    
    // Extract severity (if available)
    let severity = '';
    let severityScore = '';
    
    // Look for the exact "Severity:" section first
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
    
    // Build the HTML structure for the analysis
    let html = `
      <div class="analysis-container">
        <div class="analysis-header" style="background-color: ${statusColor}">
          <h3>${statusText}</h3>
        </div>
        
        <div class="analysis-content">
          <div class="analysis-section">
            <h4>Issue Assessment</h4>
            <p class="assessment-text">${failureType}</p>`;
            
    // Add reference information if we have a matching issue category
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
  
  // Function to handle 3D print image analysis
  async function analyzeImage(file, predictionData = null) {
    console.log('analyzeImage function called with file:', file);
    if (predictionData) {
      console.log('Prediction data provided:', predictionData);
    }
    
    // Only use chatSidebarMessages as that's what exists in the HTML
    const chatMessages = document.getElementById('chatSidebarMessages');
      
    if (!chatMessages) {
      console.error('Chat messages element not found');
      return;
    }
    
    // Check if there's already an analysis in progress
    if (document.getElementById('ai-loading')) {
      console.log('Analysis already in progress, not starting a new one');
      return;
    }
    
    // Show the image in chat
    const imagePreview = URL.createObjectURL(file);
    chatMessages.innerHTML += `
      <div class="message user-message">
        <img src="${imagePreview}" alt="3D Print" class="image-preview">
        <div>Analyzing this 3D print${predictionData ? ' with Roboflow predictions' : ''}...</div>
      </div>
    `;
    
    // Show loading indicator
    chatMessages.innerHTML += `
      <div class="message ai-message" id="ai-loading">
        <div class="loading-text">Analyzing your 3D print failure...</div>
      </div>
    `;
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add prediction data if available
      if (predictionData) {
        formData.append('predictions', JSON.stringify(predictionData));
      }
      
      console.log('Sending 3D print image for analysis to Gemini');
      
      // Send to backend
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
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response with advanced formatting for image analysis
      const formattedResponse = formatMarkdown(data.response || '', true);
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;
      
      // Trigger animation for severity bar
      setTimeout(() => {
        const severityFills = document.querySelectorAll('.severity-fill');
        severityFills.forEach(fill => {
          fill.style.animation = 'none';
          fill.offsetHeight; // Force reflow
          fill.style.animation = null;
        });
      }, 100);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Show error message
      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. Please try again. Error: ${error.message}
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Export the formatMarkdown function to the global scope
  window.formatMarkdown = formatMarkdown;
  
  // Export the analyzeImage function to the global scope
  window.analyzeImage = analyzeImage;
  
  // Ensure escapeHtml function exists
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