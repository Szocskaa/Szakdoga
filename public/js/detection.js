document.addEventListener('DOMContentLoaded', function() {
  const detectButton = document.getElementById('detectButton');
  const fileInput = document.getElementById('fileInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const uploadBtn = document.getElementById('uploadBtn');
  const webcamBtn = document.getElementById('webcamBtn');
  const webcamCanvas = document.getElementById('webcamCanvas');
  
  // Expose capturedImage to global scope
  window.capturedImage = null;
  
  // Handle detection button click
  detectButton.addEventListener('click', async function() {
    // Check which input method is active
    const isWebcamActive = webcamBtn.classList.contains('active');
    
    // Validation
    if (!isWebcamActive && (!fileInput.files || fileInput.files.length === 0)) {
      alert('Please select an image first');
      return;
    }
    
    if (isWebcamActive && !window.capturedImage) {
      alert('Please capture an image from your webcam first');
      return;
    }
    
    // Show loading state
    resultsContainer.innerHTML = `
      <div class="prism-card loading">
        <div class="spinner"></div>
        <p class="loading-text">Analyzing your 3D print...</p>
      </div>
    `;
    
    try {
      let response;
      
      if (isWebcamActive) {
        // Process webcam image
        const formData = new FormData();
        
        // Convert base64 to blob
        const blob = await fetch(window.capturedImage).then(res => res.blob());
        formData.append('image', blob, 'webcam-capture.png');
        
        response = await fetch('http://localhost:7070/api/roboflow/detect', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Process uploaded file
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        
        response = await fetch('http://localhost:7070/api/roboflow/detect', {
          method: 'POST',
          body: formData,
        });
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      displayResults(data, isWebcamActive ? window.capturedImage : null);
      
      // Note: We don't need to reset the webcam view here as it's handled in ui.js
    } catch (error) {
      resultsContainer.innerHTML = `
        <div class="prism-card">
          <h2 class="card-title">Error</h2>
          <div class="error-message">
            ${error.message || 'Failed to process image'}
          </div>
        </div>
      `;
    }
  });
  
  // Results display function
  function displayResults(data, capturedImageUrl = null) {
    if (!data.predictions || data.predictions.length === 0) {
      resultsContainer.innerHTML = `
        <div class="prism-card">
          <h2 class="card-title">Results</h2>
          <div class="no-failures">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>No failures detected in this image. Your print looks good!</p>
          </div>
        </div>
      `;
      // Hide the chat column when no failures
      document.getElementById('chatColumn').style.display = 'none';
      return;
    }
    
    // Get the original image dimensions
    const imageWidth = data.image.width;
    const imageHeight = data.image.height;
    
    // Check if any prediction has confidence >= 60%
    const highProbabilityFailure = data.predictions.some(p => p.confidence >= 0.6);
    
    // Start building results HTML
    let resultsHTML = `
      <div class="prism-card">
        <div class="results-header">
          <h2 class="card-title">Detection Results</h2>
          <div class="detected-count">${data.predictions.length} issues found</div>
        </div>
        <div class="image-container" id="imageWrapper">
          <img src="${capturedImageUrl || URL.createObjectURL(fileInput.files[0])}" alt="Analyzed image" style="width: 100%;" id="detectedImage">
        </div>
        <h3 class="results-subtitle">Detected Issues:</h3>
        <ul class="prediction-list">
    `;
    
    data.predictions.forEach((prediction, index) => {
      const confidencePercent = Math.round(prediction.confidence * 100);
      resultsHTML += `
        <li class="prediction-item">
          <div class="prediction-class">
            <span>${prediction.class}</span>
          </div>
          <div class="confidence-meter">
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
            </div>
            <span class="prediction-confidence">${confidencePercent}%</span>
          </div>
        </li>
      `;
    });
    
    resultsHTML += `
        </ul>
      </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Show/hide the chat column based on probability threshold
    const chatColumn = document.getElementById('chatColumn');
    if (highProbabilityFailure) {
      chatColumn.style.display = 'block';
      
      // Send the image to Gemini AI for further analysis
      setTimeout(() => {
        sendImageToGemini(capturedImageUrl, fileInput.files[0]);
      }, 500);
    } else {
      chatColumn.style.display = 'none';
    }
    
    // Add bounding boxes
    const imageWrapper = document.getElementById('imageWrapper');
    
    data.predictions.forEach((prediction, index) => {
      const box = document.createElement('div');
      
      // Calculate position and size (normalized to percentages)
      const x = (prediction.x - prediction.width / 2) / imageWidth * 100;
      const y = (prediction.y - prediction.height / 2) / imageHeight * 100;
      const width = prediction.width / imageWidth * 100;
      const height = prediction.height / imageHeight * 100;
      
      box.className = 'bounding-box';
      box.style.left = `${x}%`;
      box.style.top = `${y}%`;
      box.style.width = `${width}%`;
      box.style.height = `${height}%`;
      
      // Add label
      const label = document.createElement('div');
      label.className = 'bounding-box-label';
      label.textContent = `${prediction.class} (${Math.round(prediction.confidence * 100)}%)`;
      box.appendChild(label);
      
      imageWrapper.appendChild(box);
    });
  }
  
  // Function to send the detected image to Gemini AI
  async function sendImageToGemini(capturedImageUrl, uploadedFile) {
    console.log('Sending detected image to Gemini AI for analysis');
    
    try {
      // Get the image either from capturedImageUrl (webcam) or uploadedFile
      let imageFile;
      
      if (capturedImageUrl) {
        // Convert base64/dataURL to Blob
        const response = await fetch(capturedImageUrl);
        const blob = await response.blob();
        // Create a File object with proper filename and extension
        imageFile = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
      } else if (uploadedFile) {
        imageFile = uploadedFile;
      } else {
        console.error('No image available to send to Gemini');
        return;
      }
      
      // Collect prediction data to send to Gemini
      const predictionData = {
        predictions: []
      };
      
      // Get all prediction items from the DOM
      const predictionItems = document.querySelectorAll('.prediction-item');
      predictionItems.forEach(item => {
        const classElement = item.querySelector('.prediction-class span');
        const confidenceElement = item.querySelector('.prediction-confidence');
        
        if (classElement && confidenceElement) {
          const detectedClass = classElement.textContent;
          // Extract just the number from "85%"
          const confidence = parseInt(confidenceElement.textContent) / 100;
          
          predictionData.predictions.push({
            class: detectedClass,
            confidence: confidence
          });
        }
      });
      
      // Get all bounding boxes from the DOM
      const boundingBoxes = document.querySelectorAll('.bounding-box');
      boundingBoxes.forEach((box, index) => {
        if (index < predictionData.predictions.length) {
          const left = parseFloat(box.style.left);
          const top = parseFloat(box.style.top);
          const width = parseFloat(box.style.width);
          const height = parseFloat(box.style.height);
          
          predictionData.predictions[index].position = {
            left: left,
            top: top,
            width: width,
            height: height
          };
        }
      });
      
      console.log('Sending predictions to Gemini:', predictionData);
      
      // Use the analyzeImage function from chat.js with additional prediction data
      if (window.analyzeImage) {
        window.analyzeImage(imageFile, predictionData);
      } else {
        console.error('analyzeImage function not available');
      }
    } catch (error) {
      console.error('Error sending image to Gemini:', error);
    }
  }
}); 