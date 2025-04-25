0
document.addEventListener('DOMContentLoaded', function() {

  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  themeToggle.addEventListener('click', function() {
    const isLightTheme = htmlElement.getAttribute('data-theme') === 'light';
    const newTheme = isLightTheme ? 'dark' : 'light';

    htmlElement.setAttribute('data-theme', newTheme);

    if (window.themeMesh) {
      window.themeMesh.updateTheme(!isLightTheme);
    }

    localStorage.setItem('theme', newTheme);

    if (window.syncThemeWithFullscreen && document.getElementById('fullscreenChatOverlay') && 
        document.getElementById('fullscreenChatOverlay').style.display === 'block') {
      window.syncThemeWithFullscreen();
    }
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  } else {

    htmlElement.setAttribute('data-theme', 'dark');
  }

  const titleEffect = document.getElementById('titleEffect');
  const subtitleEffect = document.getElementById('subtitleEffect');
  const titleLayers = document.querySelectorAll('.title-layer');
  const subtitleLayers = document.querySelectorAll('.subtitle-layer');
  const maxOffset = 12;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseVelocity = { x: 0, y: 0 };

  function updateChromaticEffect(e) {
    if (!titleEffect || !subtitleEffect) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const titleRect = titleEffect.getBoundingClientRect();
    const titleCenterX = titleRect.left + titleRect.width / 2;
    const titleCenterY = titleRect.top + titleRect.height / 2;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    mouseVelocity = {
      x: deltaX * 0.5,
      y: deltaY * 0.5
    };
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    const distanceX = (e.clientX - titleCenterX) / (window.innerWidth / 2);
    const distanceY = (e.clientY - titleCenterY) / (window.innerHeight / 2);

    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const falloff = Math.max(0, 1 - Math.min(1, distance / 2));

    const time = Date.now() / 1000;

    titleLayers.forEach(layer => {

      const noiseX = Math.sin(time * 1.5) * 3;
      const noiseY = Math.cos(time * 1.2) * 2;

      const waveX = Math.sin(time * 0.8 + titleCenterY * 0.01) * 2;

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

    subtitleLayers.forEach(layer => {

      const noiseX = Math.sin(time * 1.7) * 2;
      const noiseY = Math.cos(time * 1.3) * 1.5;

      const waveX = Math.sin(time * 0.9 + titleCenterY * 0.012) * 1.5;

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

  document.addEventListener('mousemove', updateChromaticEffect);

  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      updateChromaticEffect({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      });
    }
  });

  let animationFrame;
  function subtleAnimation() {
    const time = Date.now() / 1000;

    const amplitude = Math.sin(time * 0.5) * 100 + 150; 
    const x = Math.sin(time) * amplitude + window.innerWidth / 2;
    const y = Math.cos(time * 0.7) * (amplitude * 0.5) + window.innerHeight / 2;

    const randomX = Math.sin(time * 0.3) * 50;
    const randomY = Math.cos(time * 0.4) * 30;

    updateChromaticEffect({
      clientX: x + randomX,
      clientY: y + randomY
    });

    animationFrame = requestAnimationFrame(subtleAnimation);
  }

  subtleAnimation();

  document.addEventListener('mousemove', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  });

  let mouseTimeout;
  document.addEventListener('mousemove', () => {
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      if (!animationFrame) {
        subtleAnimation();
      }
    }, 1000);
  });

  const uploadBtn = document.getElementById('uploadBtn');
  const webcamBtn = document.getElementById('webcamBtn');
  const uploadArea = document.getElementById('uploadArea');
  const webcamContainer = document.getElementById('webcamContainer');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  let capturedImage = null;

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

    if (!window.stream) {
      webcamPermissions.style.display = 'flex';
    }
  });

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

  captureBtn.addEventListener('click', function() {
    if (!window.stream) return;

    if (this.textContent === 'Capture Again') {

      const capturedDisplay = document.getElementById('capturedImageDisplay');
      if (capturedDisplay) {
        capturedDisplay.style.display = 'none';
      }

      webcamFeed.style.display = 'block';
      webcamCanvas.style.display = 'none';

      this.textContent = 'Capture Image';

      window.capturedImage = null;
      return;
    }

    const context = webcamCanvas.getContext('2d');
    webcamCanvas.width = webcamFeed.videoWidth;
    webcamCanvas.height = webcamFeed.videoHeight;

    context.drawImage(webcamFeed, 0, 0, webcamCanvas.width, webcamCanvas.height);

    window.capturedImage = webcamCanvas.toDataURL('image/png');

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

    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.remove();
      }, 300);
    }, 50);

    captureBtn.textContent = 'Capture Again';

    displayCapturedImage();
  });

  function displayCapturedImage() {
    if (!window.capturedImage) return;

    webcamFeed.style.display = 'none';

    webcamCanvas.style.display = 'block';

    if (!document.getElementById('capturedImageDisplay')) {
      const capturedDisplay = document.createElement('img');
      capturedDisplay.id = 'capturedImageDisplay';
      capturedDisplay.src = window.capturedImage;
      capturedDisplay.style.position = 'absolute';
      capturedDisplay.style.top = '0';
      capturedDisplay.style.left = '0';
      capturedDisplay.style.width = '100%';
      capturedDisplay.style.height = '100%';
      capturedDisplay.style.objectFit = 'cover';

      const webcamInner = document.querySelector('.webcam-inner');
      webcamInner.appendChild(capturedDisplay);
    } else {

      document.getElementById('capturedImageDisplay').src = window.capturedImage;
      document.getElementById('capturedImageDisplay').style.display = 'block';
    }
  }

  uploadArea.addEventListener('click', function() {
    fileInput.click();
  });

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

  fileInput.addEventListener('change', updateFileName);

  function updateFileName() {
    if (fileInput.files && fileInput.files.length > 0) {
      fileInfo.style.display = 'block';
      fileName.textContent = fileInput.files[0].name;
    } else {
      fileInfo.style.display = 'none';
    }
  }

  const chatImageUpload = document.getElementById('chatImageUpload');

  chatImageUpload.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {

      if (window.analyzeImage) {
        window.analyzeImage(this.files[0]);
      }

      this.value = '';
    }
  });

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

  const fullscreenChatBtn = document.getElementById('fullscreenChatBtn');
  const chatColumn = document.getElementById('chatColumn');
  const aiAssistantButton = document.getElementById('aiAssistantButton');

  if (fullscreenChatBtn && chatColumn) {
    fullscreenChatBtn.addEventListener('click', function() {
      chatColumn.classList.toggle('fullscreen');

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

        if (aiAssistantButton) {
          aiAssistantButton.style.display = 'flex';
        }
      }

      const chatMessages = document.getElementById('chatSidebarMessages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }

  const detectButton = document.getElementById('detectButton');
  detectButton.addEventListener('click', function() {

    if (!window.capturedImage) return;

    setTimeout(() => {

      const resultsContainer = document.getElementById('resultsContainer');
      if (resultsContainer && !resultsContainer.querySelector('.error-message')) {
        const capturedDisplay = document.getElementById('capturedImageDisplay');
        if (capturedDisplay) {
          capturedDisplay.style.display = 'none';
        }

        webcamFeed.style.display = 'block';
        webcamCanvas.style.display = 'none';
        captureBtn.textContent = 'Capture Image';
      }
    }, 100);
  });
});