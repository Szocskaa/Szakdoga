"use strict";
/**
 * Client-side example for using the 3D Print Monitor API
 *
 * This file demonstrates how to use the API from a client-side application.
 * It's not meant to be run directly, but rather to serve as a reference.
 */
// Example 1: Uploading an image file
async function uploadImageExample() {
    const formData = new FormData();
    const fileInput = document.querySelector('#fileInput');
    if (fileInput?.files && fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
        try {
            const response = await fetch('http://localhost:5000/api/roboflow/detect', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            console.log('Detection results:', data);
            // Process the results (e.g., display bounding boxes)
            displayResults(data);
        }
        catch (error) {
            console.error('Error uploading image:', error);
        }
    }
}
// Example 2: Using a URL
async function detectFromUrlExample(imageUrl) {
    try {
        const response = await fetch('http://localhost:5000/api/roboflow/detect-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
        });
        const data = await response.json();
        console.log('Detection results:', data);
        // Process the results
        displayResults(data);
    }
    catch (error) {
        console.error('Error detecting from URL:', error);
    }
}
// Example 3: Using base64 image data
async function detectFromBase64Example() {
    const canvas = document.querySelector('#webcamCanvas');
    if (canvas) {
        // Get base64 image data from canvas
        const imageData = canvas.toDataURL('image/jpeg');
        try {
            const response = await fetch('http://localhost:5000/api/roboflow/detect-base64', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });
            const data = await response.json();
            console.log('Detection results:', data);
            // Process the results
            displayResults(data);
        }
        catch (error) {
            console.error('Error detecting from base64:', error);
        }
    }
}
// Example function to display results
function displayResults(data) {
    // Get the original image dimensions
    const imageWidth = data.image.width;
    const imageHeight = data.image.height;
    // Get the container where we'll display the results
    const container = document.querySelector('#resultsContainer');
    if (!container)
        return;
    // Clear previous results
    container.innerHTML = '';
    // Create a wrapper for the image and bounding boxes
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    // Add the original image
    const img = document.createElement('img');
    const fileInput = document.querySelector('#fileInput');
    if (fileInput?.files && fileInput.files.length > 0) {
        img.src = URL.createObjectURL(fileInput.files[0]);
    }
    img.style.width = '100%';
    wrapper.appendChild(img);
    // Add bounding boxes for each prediction
    data.predictions.forEach((prediction) => {
        const box = document.createElement('div');
        // Calculate position and size
        const x = (prediction.x - prediction.width / 2) / imageWidth * 100;
        const y = (prediction.y - prediction.height / 2) / imageHeight * 100;
        const width = prediction.width / imageWidth * 100;
        const height = prediction.height / imageHeight * 100;
        // Style the box
        box.style.position = 'absolute';
        box.style.left = `${x}%`;
        box.style.top = `${y}%`;
        box.style.width = `${width}%`;
        box.style.height = `${height}%`;
        box.style.border = '2px solid red';
        box.style.boxSizing = 'border-box';
        // Add label
        const label = document.createElement('div');
        label.textContent = `${prediction.class} (${Math.round(prediction.confidence * 100)}%)`;
        label.style.position = 'absolute';
        label.style.top = '-20px';
        label.style.left = '0';
        label.style.background = 'red';
        label.style.color = 'white';
        label.style.padding = '2px 4px';
        label.style.fontSize = '12px';
        box.appendChild(label);
        wrapper.appendChild(box);
    });
    container.appendChild(wrapper);
    // Add a list of predictions
    const list = document.createElement('ul');
    list.className = 'prediction-list';
    data.predictions.forEach((prediction) => {
        const item = document.createElement('li');
        item.textContent = `${prediction.class}: ${Math.round(prediction.confidence * 100)}% confidence`;
        list.appendChild(item);
    });
    container.appendChild(list);
}
// Example HTML structure:
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Print Monitor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .upload-section {
      margin-bottom: 20px;
    }
    #resultsContainer {
      margin-top: 20px;
    }
    .prediction-list {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>3D Print Monitor</h1>
  
  <div class="upload-section">
    <h2>Upload Image</h2>
    <input type="file" id="fileInput" accept="image/*">
    <button onclick="uploadImageExample()">Detect Failures</button>
  </div>
  
  <div id="resultsContainer"></div>
  
  <script src="client-example.js"></script>
</body>
</html>
*/ 
