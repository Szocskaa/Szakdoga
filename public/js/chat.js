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
    const chatInput = document.activeElement.id === 'chatSidebarInput' 
      ? document.getElementById('chatSidebarInput') 
      : document.getElementById('chatInput');
    
    const chatMessages = document.activeElement.id === 'chatSidebarInput'
      ? document.getElementById('chatSidebarMessages')
      : document.getElementById('chatMessages');
    
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    chatMessages.innerHTML += `
      <div class="message user-message">
        ${window.escapeHtml(message)}
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
      
      // Send to backend
      const response = await fetch('http://localhost:5000/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${window.escapeHtml(data.response)}
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
          Sorry, I couldn't process your message. Please try again.
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Function to handle 3D print image analysis
  async function analyzeImage(file) {
    const chatMessages = document.activeElement.id === 'chatSidebarInput'
      ? document.getElementById('chatSidebarMessages')
      : document.getElementById('chatMessages');
      
    if (!chatMessages) return;
    
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
      
      // Send to backend
      const response = await fetch('http://localhost:5000/api/gemini/analyze-print', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response
      chatMessages.innerHTML += `
        <div class="message ai-message">
          ${window.escapeHtml(data.response)}
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Show error message
      chatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. Please try again.
        </div>
      `;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Export the analyzeImage function to the global scope
  window.analyzeImage = analyzeImage;
}); 