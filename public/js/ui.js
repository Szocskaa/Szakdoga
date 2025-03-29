0// UI functionality
document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;
  
  themeToggle.addEventListener('click', function() {
    const isLightTheme = htmlElement.getAttribute('data-theme') === 'light';
    const newTheme = isLightTheme ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    
    // Update shader uniform for theme
    if (window.themeMesh) {
      window.themeMesh.updateTheme(!isLightTheme);
    }
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // If the fullscreen AI assistant is open, sync the theme
    if (window.syncThemeWithFullscreen && document.getElementById('fullscreenChatOverlay') && 
        document.getElementById('fullscreenChatOverlay').style.display === 'block') {
      window.syncThemeWithFullscreen();
    }
  });
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  } else {
    // Set dark theme as default if not saved
    htmlElement.setAttribute('data-theme', 'dark');
  }
  
  // Chromatic aberration title effect
  const titleEffect = document.getElementById('titleEffect');
  const subtitleEffect = document.getElementById('subtitleEffect');
  const titleLayers = document.querySelectorAll('.title-layer');
  const subtitleLayers = document.querySelectorAll('.subtitle-layer');
  const maxOffset = 12;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseVelocity = { x: 0, y: 0 };
  
  // Function to update the chromatic aberration effect based on cursor position
  function updateChromaticEffect(e) {
    if (!titleEffect || !subtitleEffect) return;
    
    // Get the center of the viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Get the center of the title for more localized effect
    const titleRect = titleEffect.getBoundingClientRect();
    const titleCenterX = titleRect.left + titleRect.width / 2;
    const titleCenterY = titleRect.top + titleRect.height / 2;
    
    // Calculate mouse velocity
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    mouseVelocity = {
      x: deltaX * 0.5,
      y: deltaY * 0.5
    };
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    // Calculate the distance from the cursor to the title (normalized)
    const distanceX = (e.clientX - titleCenterX) / (window.innerWidth / 2);
    const distanceY = (e.clientY - titleCenterY) / (window.innerHeight / 2);
    
    // Apply a falloff effect based on distance (closer = stronger effect)
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const falloff = Math.max(0, 1 - Math.min(1, distance / 2));
    
    // Get current time for animations
    const time = Date.now() / 1000;
    
    // Apply transformations to the title layers with different intensities for each color
    // Red moves the most, blue moves the least
    titleLayers.forEach(layer => {
      // Add some smooth noise to make the effect more organic
      const noiseX = Math.sin(time * 1.5) * 3;
      const noiseY = Math.cos(time * 1.2) * 2;
      
      // Additional wave effect
      const waveX = Math.sin(time * 0.8 + titleCenterY * 0.01) * 2;
      
      // Add velocity-based movement
      const velocityX = mouseVelocity.x * 0.5;
      const velocityY = mouseVelocity.y * 0.3;
      
      if (layer.classList.contains('title-layer-red')) {
        layer.style.transform = `translate(${distanceX * maxOffset * falloff + noiseX * 1.2 + waveX + velocityX}px, ${distanceY * maxOffset * 0.5 * falloff + noiseY * 0.7 + velocityY}px)`;
      } else if (layer.classList.contains('title-layer-green')) {
        layer.style.transform = `translate(${distanceX * maxOffset * 0.7 * falloff + noiseX * 0.8 + waveX * 0.7 + velocityX * 0.7}px, ${distanceY * maxOffset * 0.3 * falloff + noiseY * 0.5 + velocityY * 0.7}px)`;
      } else if (layer.classList.contains('title-layer-blue')) {
        layer.style.transform = `translate(${distanceX * maxOffset * 0.4 * falloff + noiseX * 0.5 + waveX * 0.4 + velocityX * 0.4}px, ${distanceY * maxOffset * 0.2 * falloff + noiseY * 0.3 + velocityY * 0.4}px)`;
      }
    });
    
    // Apply the same effect to subtitle but with reduced intensity
    subtitleLayers.forEach(layer => {
      // Add some smooth noise to make the effect more organic
      const noiseX = Math.sin(time * 1.7) * 2;
      const noiseY = Math.cos(time * 1.3) * 1.5;
      
      // Additional wave effect
      const waveX = Math.sin(time * 0.9 + titleCenterY * 0.012) * 1.5;
      
      // Add velocity-based movement
      const velocityX = mouseVelocity.x * 0.3;
      const velocityY = mouseVelocity.y * 0.2;
      
      if (layer.classList.contains('subtitle-layer-red')) {
        layer.style.transform = `translate(${distanceX * maxOffset * 0.6 * falloff + noiseX + waveX + velocityX}px, ${distanceY * maxOffset * 0.25 * falloff + noiseY * 0.5 + velocityY}px)`;
      } else if (layer.classList.contains('subtitle-layer-green')) {
        layer.style.transform = `translate(${distanceX * maxOffset * 0.4 * falloff + noiseX * 0.7 + waveX * 0.7 + velocityX * 0.7}px, ${distanceY * maxOffset * 0.15 * falloff + noiseY * 0.3 + velocityY * 0.7}px)`;
      } else if (layer.classList.contains('subtitle-layer-blue')) {
        layer.style.transform = `translate(${distanceX * maxOffset * 0.2 * falloff + noiseX * 0.4 + waveX * 0.4 + velocityX * 0.4}px, ${distanceY * maxOffset * 0.1 * falloff + noiseY * 0.2 + velocityY * 0.4}px)`;
      }
    });
  }
  
  // Add mouse move event listener to the document
  document.addEventListener('mousemove', updateChromaticEffect);
  
  // For touch devices, use touch move events
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      updateChromaticEffect({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      });
    }
  });
  
  // Add subtle animation even when cursor isn't moving
  let animationFrame;
  function subtleAnimation() {
    const time = Date.now() / 1000;
    // More dynamic motion pattern
    const amplitude = Math.sin(time * 0.5) * 100 + 150; // Varies between 50 and 250
    const x = Math.sin(time) * amplitude + window.innerWidth / 2;
    const y = Math.cos(time * 0.7) * (amplitude * 0.5) + window.innerHeight / 2;
    
    // Add some random movement
    const randomX = Math.sin(time * 0.3) * 50;
    const randomY = Math.cos(time * 0.4) * 30;
    
    updateChromaticEffect({
      clientX: x + randomX,
      clientY: y + randomY
    });
    
    animationFrame = requestAnimationFrame(subtleAnimation);
  }
  
  // Start the animation
  subtleAnimation();
  
  // Cancel animation when mouse moves
  document.addEventListener('mousemove', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  });
  
  // Restart animation after no mouse movement for 3 seconds
  let mouseTimeout;
  document.addEventListener('mousemove', () => {
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      if (!animationFrame) {
        subtleAnimation();
      }
    }, 1000);
  });
  
  // Input method toggle
  const uploadBtn = document.getElementById('uploadBtn');
  const webcamBtn = document.getElementById('webcamBtn');
  const uploadArea = document.getElementById('uploadArea');
  const webcamContainer = document.getElementById('webcamContainer');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  let capturedImage = null;
  
  // Toggle between upload and webcam
  uploadBtn.addEventListener('click', function() {
    uploadBtn.classList.add('active');
    webcamBtn.classList.remove('active');
    uploadArea.style.display = 'block';
    webcamContainer.style.display = 'none';
    capturedImage = null;
  });
  
  webcamBtn.addEventListener('click', function() {
    webcamBtn.classList.add('active');
    uploadBtn.classList.remove('active');
    uploadArea.style.display = 'none';
    webcamContainer.style.display = 'block';
    
    // Check if we already have stream
    if (!window.stream) {
      webcamPermissions.style.display = 'flex';
    }
  });
  
  // Handle webcam initialization
  const webcamFeed = document.getElementById('webcamFeed');
  const webcamPermissions = document.getElementById('webcamPermissions');
  const enableCameraBtn = document.getElementById('enableCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const webcamCanvas = document.getElementById('webcamCanvas');
  
  enableCameraBtn.addEventListener('click', initWebcam);
  
  function initWebcam() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(mediaStream) {
          window.stream = mediaStream;
          webcamFeed.srcObject = mediaStream;
          webcamPermissions.style.display = 'none';
          webcamFeed.style.display = 'block';
          captureBtn.disabled = false;
        })
        .catch(function(err) {
          console.error('Unable to access webcam', err);
          webcamPermissions.innerHTML = `
            <div class="webcam-error">
              <p>Unable to access webcam: ${err.message}</p>
              <p>Please make sure your camera is connected and permissions are granted.</p>
            </div>
          `;
        });
    } else {
      webcamPermissions.innerHTML = `
        <div class="webcam-error">
          <p>Your browser doesn't support webcam access.</p>
          <p>Please try a modern browser like Chrome or Firefox.</p>
        </div>
      `;
    }
  }
  
  // Handle image capture
  captureBtn.addEventListener('click', function() {
    if (!window.stream) return;
    
    const context = webcamCanvas.getContext('2d');
    webcamCanvas.width = webcamFeed.videoWidth;
    webcamCanvas.height = webcamFeed.videoHeight;
    
    // Draw the video frame to the canvas
    context.drawImage(webcamFeed, 0, 0, webcamCanvas.width, webcamCanvas.height);
    
    // Get the image data
    capturedImage = webcamCanvas.toDataURL('image/png');
    
    // Give visual feedback that image was captured
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0.7';
    flash.style.transition = 'opacity 0.3s ease';
    
    const webcamInner = document.querySelector('.webcam-inner');
    webcamInner.appendChild(flash);
    
    // Fade out and remove the flash
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.remove();
      }, 300);
    }, 50);
    
    // Change the capture button text to indicate success
    captureBtn.textContent = 'Image Captured';
    setTimeout(() => {
      captureBtn.textContent = 'Capture Again';
    }, 1500);
  });
  
  // Handle upload area clicks
  uploadArea.addEventListener('click', function() {
    fileInput.click();
  });
  
  // Handle drag and drop
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-highlight)';
    uploadArea.style.background = 'var(--hover-bg)';
  });
  
  uploadArea.addEventListener('dragleave', function() {
    uploadArea.style.borderColor = 'var(--glass-border)';
    uploadArea.style.background = 'var(--upload-area-bg)';
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--glass-border)';
    uploadArea.style.background = 'var(--upload-area-bg)';
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      updateFileName();
    }
  });
  
  // Handle file selection
  fileInput.addEventListener('change', updateFileName);
  
  function updateFileName() {
    if (fileInput.files && fileInput.files.length > 0) {
      fileInfo.style.display = 'block';
      fileName.textContent = fileInput.files[0].name;
    } else {
      fileInfo.style.display = 'none';
    }
  }
  
  // Chat image upload
  const chatImageUpload = document.getElementById('chatImageUpload');
  
  // Add event listener for image upload
  chatImageUpload.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      // This will be handled in detection.js
      if (window.analyzeImage) {
        window.analyzeImage(this.files[0]);
      }
      // Reset file input so the same file can be selected again
      this.value = '';
    }
  });
  
  // Helper function to escape HTML
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
  
  // Fullscreen chat functionality
  const fullscreenChatBtn = document.getElementById('fullscreenChatBtn');
  const chatColumn = document.getElementById('chatColumn');
  const aiAssistantButton = document.getElementById('aiAssistantButton');
  
  if (fullscreenChatBtn && chatColumn) {
    fullscreenChatBtn.addEventListener('click', function() {
      chatColumn.classList.toggle('fullscreen');
      
      // Update button icon based on state
      if (chatColumn.classList.contains('fullscreen')) {
        fullscreenChatBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6"></path>
            <path d="M20 10h-6V4"></path>
            <path d="M14 10l7-7"></path>
            <path d="M3 21l7-7"></path>
          </svg>
        `;
        fullscreenChatBtn.setAttribute('title', 'Exit fullscreen');
        
        // Hide AI assistant button when in fullscreen mode
        if (aiAssistantButton) {
          aiAssistantButton.style.display = 'none';
        }
      } else {
        fullscreenChatBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
            <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
            <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
            <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
          </svg>
        `;
        fullscreenChatBtn.setAttribute('title', 'Toggle fullscreen');
        
        // Show AI assistant button when exiting fullscreen mode
        if (aiAssistantButton) {
          aiAssistantButton.style.display = 'flex';
        }
      }
      
      // Scroll chat to bottom
      const chatMessages = document.getElementById('chatSidebarMessages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }
}); 