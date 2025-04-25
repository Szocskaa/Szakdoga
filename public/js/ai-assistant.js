document.addEventListener('DOMContentLoaded', function() {

  const aiAssistantButton = document.getElementById('aiAssistantButton');
  const fullscreenChatOverlay = document.getElementById('fullscreenChatOverlay');
  const fullscreenChatContainer = document.getElementById('fullscreenChatContainer');
  const minimizeChatButton = document.getElementById('minimizeChatButton');
  const fullscreenChatInput = document.getElementById('fullscreenChatInput');
  const fullscreenSendButton = document.getElementById('fullscreenSendButton');
  const fullscreenChatMessages = document.getElementById('fullscreenChatMessages');
  const fullscreenUploadBtn = document.getElementById('fullscreenUploadBtn');
  const fullscreenFileInput = document.getElementById('fullscreenFileInput');

  let originalBodyOverflow;

  let chatHistory = [];

  function syncThemeWithFullscreen() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    if (fullscreenChatOverlay) {
      fullscreenChatOverlay.setAttribute('data-theme', currentTheme);
    }

    if (fullscreenChatContainer) {
      fullscreenChatContainer.setAttribute('data-theme', currentTheme);
    }

    const fullscreenElements = document.querySelectorAll('.fullscreen-chat-container *');
    fullscreenElements.forEach(element => {
      element.setAttribute('data-theme', currentTheme);
    });

    if (currentTheme === 'light') {
      if (fullscreenChatOverlay) {
        fullscreenChatOverlay.style.background = 'rgba(240, 240, 245, 0.7)';
      }
      if (fullscreenChatContainer) {
        fullscreenChatContainer.style.background = 'rgba(240, 240, 245, 0.5)';
      }
    } else { 
      if (fullscreenChatOverlay) {
        fullscreenChatOverlay.style.background = 'rgba(0, 0, 0, 0.7)';
      }
      if (fullscreenChatContainer) {
        fullscreenChatContainer.style.background = 'rgba(20, 20, 30, 0.5)';
      }
    }
  }

  window.syncThemeWithFullscreen = syncThemeWithFullscreen;

  const htmlElement = document.documentElement;
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        syncThemeWithFullscreen();
      }
    }
  });
  observer.observe(htmlElement, { attributes: true });

  if (!document.body.getAttribute('data-theme')) {
    document.body.setAttribute('data-theme', 'dark');

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.classList.add('dark');
    }
  }

  function handleOverlayClick(e) {

    if (e.target !== minimizeChatButton && !minimizeChatButton.contains(e.target)) {
      e.stopPropagation();
    }
  }

  function showAIAssistant() {

    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    aiAssistantButton.style.display = 'none';
    fullscreenChatOverlay.style.display = 'block';

    syncThemeWithFullscreen();

    setupFullscreenChatEventListeners();

    fullscreenChatOverlay.addEventListener('click', handleOverlayClick);

    syncChatHistory();

    setTimeout(() => {
      fullscreenChatInput.focus();
    }, 300);
  }

  function hideAIAssistant() {

    document.body.style.overflow = originalBodyOverflow || '';

    fullscreenChatOverlay.style.display = 'none';
    aiAssistantButton.style.display = 'flex';

    cleanupFullscreenChatEventListeners();

    fullscreenChatOverlay.removeEventListener('click', handleOverlayClick);
  }

  function syncChatHistory() {

    const sidebarMessages = document.getElementById('chatSidebarMessages');

    if (sidebarMessages) {
      fullscreenChatMessages.innerHTML = sidebarMessages.innerHTML;

      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }

  function setupFullscreenChatEventListeners() {

    fullscreenChatContainer.addEventListener('click', stopPropagation);

    minimizeChatButton.addEventListener('click', hideAIAssistant);

    fullscreenSendButton.addEventListener('click', sendFullscreenChatMessage);

    fullscreenChatInput.addEventListener('keypress', handleEnterKey);

    fullscreenUploadBtn.addEventListener('click', triggerFullscreenFileUpload);
    fullscreenFileInput.addEventListener('change', handleFullscreenFileUpload);

    setupChatSyncObserver();
  }

  function handleEnterKey(e) {
    if (e.key === 'Enter') {
      sendFullscreenChatMessage();
    }
  }

  function cleanupFullscreenChatEventListeners() {
    fullscreenChatContainer.removeEventListener('click', stopPropagation);
    minimizeChatButton.removeEventListener('click', hideAIAssistant);
    fullscreenSendButton.removeEventListener('click', sendFullscreenChatMessage);
    fullscreenChatInput.removeEventListener('keypress', handleEnterKey);
    fullscreenUploadBtn.removeEventListener('click', triggerFullscreenFileUpload);
    fullscreenFileInput.removeEventListener('change', handleFullscreenFileUpload);
  }

  function stopPropagation(e) {
    e.stopPropagation();
  }

  async function sendFullscreenChatMessage() {
    const message = fullscreenChatInput.value.trim();

    if (!message) {
      return;
    }

    fullscreenChatMessages.innerHTML += `
      <div class="message user-message">
        ${window.escapeHtml ? window.escapeHtml(message) : message}
      </div>
    `;

    fullscreenChatInput.value = '';

    fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;

    try {

      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message" id="ai-loading-fullscreen">
          <div class="loading-text">Thinking...</div>
        </div>
      `;

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

      const loadingMessage = document.getElementById('ai-loading-fullscreen');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      const formattedResponse = window.formatMarkdown ? window.formatMarkdown(data.response || '', false) : data.response;
      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message">
          ${formattedResponse}
        </div>
      `;

      syncFullscreenToSidebar();

      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);

      const loadingMessage = document.getElementById('ai-loading-fullscreen');
      if (loadingMessage) {
        loadingMessage.remove();
      }

      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't process your message. Please try again. Error: ${error.message}
        </div>
      `;

      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }

  function syncFullscreenToSidebar() {
    const sidebarMessages = document.getElementById('chatSidebarMessages');

    if (sidebarMessages) {
      sidebarMessages.innerHTML = fullscreenChatMessages.innerHTML;
      sidebarMessages.scrollTop = sidebarMessages.scrollHeight;
    }
  }

  function triggerFullscreenFileUpload() {
    fullscreenFileInput.click();
  }

  function handleFullscreenFileUpload(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    fullscreenFileInput.value = '';

    if (window.analyzeImage) {
      window.analyzeImage(file);

      setTimeout(syncChatHistory, 500);
    } else {
      console.error('analyzeImage function not available');

      fullscreenChatMessages.innerHTML += `
        <div class="message ai-message error">
          Sorry, I couldn't analyze the image. The image analysis function is not available.
        </div>
      `;

      fullscreenChatMessages.scrollTop = fullscreenChatMessages.scrollHeight;
    }
  }

  function maintainEventHandlers() {

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

    const testElement = fullscreenChatContainer;
    if (testElement && !testElement._hasEventHandlers) {
      setupFullscreenChatEventListeners();
      testElement._hasEventHandlers = true;
    }
  }

  function setupChatSyncObserver() {
    const sidebarMessages = document.getElementById('chatSidebarMessages');

    if (sidebarMessages) {

      const observer = new MutationObserver((mutations) => {

        if (fullscreenChatOverlay.style.display === 'block') {
          syncChatHistory();
        }
      });

      observer.observe(sidebarMessages, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });

      window._chatSyncObserver = observer;
    }
  }

  aiAssistantButton.addEventListener('click', showAIAssistant);

  setInterval(maintainEventHandlers, 2000);

  setupChatSyncObserver();
});