document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  const aiAssistantButton = document.getElementById('aiAssistantButton');
  const fullscreenChatOverlay = document.getElementById('fullscreenChatOverlay');
  const fullscreenChatContainer = document.getElementById('fullscreenChatContainer');
  const minimizeChatButton = document.getElementById('minimizeChatButton');
  const fullscreenChatInput = document.getElementById('fullscreenChatInput');
  const fullscreenSendButton = document.getElementById('fullscreenSendButton');
  const fullscreenChatMessages = document.getElementById('fullscreenChatMessages');
  const fullscreenUploadBtn = document.getElementById('fullscreenUploadBtn');
  const fullscreenFileInput = document.getElementById('fullscreenFileInput');
  
  // Store original body overflow state
  let originalBodyOverflow;
  
  // Store chat history for persistence between sidebar and fullscreen modes
  let chatHistory = [];
  
  // Ensure the theme is dark by default
  if (!document.body.getAttribute('data-theme')) {
    document.body.setAttribute('data-theme', 'dark');
    
    // Also update the theme toggle if it exists
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.classList.add('dark');
    }
  }
  
  // Function to handle overlay clicks
  function handleOverlayClick(e) {
    // Only allow clicks on the minimize button to close
    if (e.target !== minimizeChatButton && !minimizeChatButton.contains(e.target)) {
      e.stopPropagation();
    }
  }
  
  // Function to show the AI Assistant chat in fullscreen
  function showAIAssistant() {
    // Store original overflow and prevent page scrolling
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    aiAssistantButton.style.display = 'none';
    fullscreenChatOverlay.style.display = 'block';
    
    // Apply event listeners for the fullscreen chat
    setupFullscreenChatEventListeners();
    
    // Prevent overlay clicks from closing (only the minimize button should close)
    fullscreenChatOverlay.addEventListener('click', handleOverlayClick);
    
    // Sync chat history from sidebar if available
    syncChatHistory();
    
    // Focus the input field
    setTimeout(() => {
      fullscreenChatInput.focus();
    }, 300);
  }
  
  // Function to hide the AI Assistant chat
  function hideAIAssistant() {
    // Restore original body overflow
    document.body.style.overflow = originalBodyOverflow || '';
    
    fullscreenChatOverlay.style.display = 'none';
    aiAssistantButton.style.display = 'flex';
    
    // Clean up event listeners to prevent memory leaks
    cleanupFullscreenChatEventListeners();
    
    // Remove the overlay click handler
    fullscreenChatOverlay.removeEventListener('click', handleOverlayClick);
  }
  
  // Sync chat history between sidebar and fullscreen modes
  function syncChatHistory() {
    // Get messages from sidebar if they exist
    const sidebarMessages = document.getElementById('chatSidebarMessages');
    
    if (sidebarMessages) {
      fullscreenChatMessages.innerHTML = sidebarMessages.innerHTML;
      
      // Scroll to the bottom of the messages
      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }
  
  // Set up all event listeners for the fullscreen chat
  function setupFullscreenChatEventListeners() {
    // Prevent clicks inside the chat container from closing the chat
    fullscreenChatContainer.addEventListener('click', stopPropagation);
    
    // Minimize button closes the chat
    minimizeChatButton.addEventListener('click', hideAIAssistant);
    
    // Send message on button click
    fullscreenSendButton.addEventListener('click', sendFullscreenChatMessage);
    
    // Send message on Enter key
    fullscreenChatInput.addEventListener('keypress', handleEnterKey);
    
    // Upload image functionality
    fullscreenUploadBtn.addEventListener('click', triggerFullscreenFileUpload);
    fullscreenFileInput.addEventListener('change', handleFullscreenFileUpload);
    
    // Set up a MutationObserver to watch for changes in the sidebar chat
    setupChatSyncObserver();
  }
  
  // Function for handling Enter key press
  function handleEnterKey(e) {
    if (e.key === 'Enter') {
      sendFullscreenChatMessage();
    }
  }
  
  // Clean up event listeners when closing the chat
  function cleanupFullscreenChatEventListeners() {
    fullscreenChatContainer.removeEventListener('click', stopPropagation);
    minimizeChatButton.removeEventListener('click', hideAIAssistant);
    fullscreenSendButton.removeEventListener('click', sendFullscreenChatMessage);
    fullscreenChatInput.removeEventListener('keypress', handleEnterKey);
    fullscreenUploadBtn.removeEventListener('click', triggerFullscreenFileUpload);
    fullscreenFileInput.removeEventListener('change', handleFullscreenFileUpload);
  }
  
  // Helper function to stop event propagation
  function stopPropagation(e) {
    e.stopPropagation();
  }
  
  // Send a chat message from the fullscreen interface
  async function sendFullscreenChatMessage() {
    const message = fullscreenChatInput.value.trim();
    
    if (!message) {
      return;
    }
    
    // Add user message to chat
    fullscreenChatMessages.innerHTML += `
      <div class="message user-message">
        ${window.escapeHtml ? window.escapeHtml(message) : message}
      </div>
    `;
    
    // Clear input
    fullscreenChatInput.value = '';
    
    // Scroll to bottom
    fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    
    try {
      // Show loading indicator
      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading-fullscreen">
          <div class="loading-text">Thinking...</div>
        </div>
      `;
      
      // Send to backend
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get response from AI: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading-fullscreen');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response
      const formattedResponse = window.formatMarkdown ? window.formatMarkdown(data.response || '', false) : data.response;
      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;
      
      // Also update sidebar chat if it exists
      syncFullscreenToSidebar();
      
      // Scroll to bottom
      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove loading indicator
      const loadingMessage = document.getElementById('ai-loading-fullscreen');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Show error message
      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't process your message. Please try again. Error: ${error.message}
        </div>
      `;
      
      // Scroll to bottom
      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }
  
  // Update sidebar chat with fullscreen chat content
  function syncFullscreenToSidebar() {
    const sidebarMessages = document.getElementById('chatSidebarMessages');
    
    if (sidebarMessages) {
      sidebarMessages.innerHTML = fullscreenChatMessages.innerHTML;
      sidebarMessages.scrollTop = sidebarMessages.scrollHeight;
    }
  }
  
  // Trigger file input click for uploading images
  function triggerFullscreenFileUpload() {
    fullscreenFileInput.click();
  }
  
  // Handle file upload from fullscreen interface
  function handleFullscreenFileUpload(e) {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Reset file input
    fullscreenFileInput.value = '';
    
    // Use window.analyzeImage if available (from chat.js)
    if (window.analyzeImage) {
      window.analyzeImage(file);
      
      // Sync after a small delay to allow analyzeImage to update DOM
      setTimeout(syncChatHistory, 500);
    } else {
      console.error('analyzeImage function not available');
      
      // Show error message
      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. The image analysis function is not available.
        </div>
      `;
      
      // Scroll to bottom
      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }
  
  // Set up a maintenance function to ensure proper event handling
  function maintainEventHandlers() {
    // Clone nodes and replace them to remove any unknown event handlers
    const cloneAndReplace = (element) => {
      if (element) {
        const clone = element.cloneNode(true);
        if (element.parentNode) {
          element.parentNode.replaceChild(clone, element);
        }
        return clone;
      }
      return null;
    };
    
    // Only clone and replace if elements lost their event handlers
    // This is a safety measure and should rarely be needed
    const testElement = fullscreenChatContainer;
    if (testElement && !testElement._hasEventHandlers) {
      setupFullscreenChatEventListeners();
      testElement._hasEventHandlers = true;
    }
  }
  
  // Set up a MutationObserver to watch for changes in the sidebar chat
  function setupChatSyncObserver() {
    const sidebarMessages = document.getElementById('chatSidebarMessages');
    
    if (sidebarMessages) {
      // Create an observer instance
      const observer = new MutationObserver((mutations) => {
        // If the sidebar messages change while fullscreen is open, sync them
        if (fullscreenChatOverlay.style.display === 'block') {
          syncChatHistory();
        }
      });
      
      // Start observing the sidebar messages for changes
      observer.observe(sidebarMessages, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });
      
      // Store the observer for cleanup
      window._chatSyncObserver = observer;
    }
  }
  
  // Add click event listener to the AI Assistant button
  aiAssistantButton.addEventListener('click', showAIAssistant);

  // Set up an interval to maintain event handlers
  setInterval(maintainEventHandlers, 2000);

  // Call the setup function after DOM content loaded
  setupChatSyncObserver();
}); 