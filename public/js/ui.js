// UI functionality
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
  });
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  }
  
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
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
}); 