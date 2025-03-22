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
      
      // Add AI response
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${window.escapeHtml ? window.escapeHtml(data.response) : data.response}
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
  
  // Function to handle 3D print image analysis
  async function analyzeImage(file) {
    console.log('analyzeImage function called with file:', file);
    
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
        <div>Analyzing this 3D print...</div>
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
      
      // Add AI response
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${window.escapeHtml ? window.escapeHtml(data.response) : data.response}
        </div>
      `;
      
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