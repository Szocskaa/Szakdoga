import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { upload } from '../uploadConfig';

dotenv.config();

const router = express.Router();

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in the environment variables');
  console.log('Please check that your .env file contains the GEMINI_API_KEY variable');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper function to read image as base64
async function fileToGenerativePart(filePath: string): Promise<{
  inlineData: { data: string, mimeType: string }
}> {
  const extension = path.extname(filePath).toLowerCase();
  // Support more image formats based on documentation
  const mimeType = 
    extension === '.png' ? 'image/png' : 
    extension === '.webp' ? 'image/webp' :
    extension === '.heic' ? 'image/heic' :
    extension === '.heif' ? 'image/heif' :
    'image/jpeg'; // Default to jpeg for jpg and others
  
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

/**
 * @route POST /api/gemini/chat
 * @desc Send a message to Gemini AI and get a response
 * @access Public
 */
router.post('/chat', express.json(), (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'No message provided' });
      }

      // Get the Gemini model - updated to newer version
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      // Updated generation config with more parameters
      const generationConfig = {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Create a chat session
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      // Send message to Gemini
      const result = await chatSession.sendMessage(message);
      const response = result.response.text();
      
      // Return the chat response
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error processing Gemini chat request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to process Gemini AI request',
        details: errorMessage 
      });
    }
  })().catch(next);
});

/**
 * @route POST /api/gemini/analyze-print
 * @desc Analyze a 3D print image and provide failure analysis
 * @access Public
 */
router.post('/analyze-print', upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Get the uploaded file path
      const imagePath = req.file.path;
      
      // Get Roboflow prediction data if available
      let predictionData = null;
      if (req.body.predictions) {
        try {
          predictionData = JSON.parse(req.body.predictions);
          console.log('Received prediction data from Roboflow:', predictionData);
        } catch (e) {
          console.error('Error parsing prediction data:', e);
        }
      }

      // Get the Gemini Pro Vision model - updated to more advanced model
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-pro',
      });

      // Enhanced generation config for better image analysis
      const generationConfig = {
        temperature: 0.4, // Lower temperature for more accurate analysis
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Convert image to format Gemini can use
      const imagePart = await fileToGenerativePart(imagePath);
      
      // Create a prompt that includes Roboflow prediction data if available
      // Enhanced prompt with image understanding techniques mentioned in documentation
      let prompt = `
      Analyze this 3D print image and determine if it shows a failed print.

      IMPORTANT: Return your analysis EXACTLY in the following format to ensure proper parsing:

      Confirmation: [State CLEARLY if the print has failed OR if it's acceptable]

      Issue Type: [Describe the specific type of failure or quality assessment]

      Potential Causes:
      • [Cause 1]
      • [Cause 2]
      • [Cause 3]

      Recommended Fixes:
      • [Fix 1]
      • [Fix 2]
      • [Fix 3]

      Severity: [Rate on a scale of 1-10, with 10 being the most severe]

      Affected Areas: [Describe specific regions of the print with issues, using top/bottom/left/right descriptors]

      Additional Notes: [Any other observations that don't fit above]
      `;
      
      // Add prediction information if available
      if (predictionData && predictionData.predictions && predictionData.predictions.length > 0) {
        prompt += `
        
      IMPORTANT: The image has been analyzed by a computer vision model (Roboflow) which detected the following issues:
      `;
        
        predictionData.predictions.forEach((prediction: any, index: number) => {
          prompt += `
      • ${prediction.class} (confidence: ${Math.round(prediction.confidence * 100)}%)`;
          
          if (prediction.position) {
            // Using normalized bbox coordinates (0-1000) as mentioned in the documentation
            const normalizedBox = {
              ymin: Math.round(prediction.position.top * 10),
              xmin: Math.round(prediction.position.left * 10),
              ymax: Math.round((prediction.position.top + prediction.position.height) * 10),
              xmax: Math.round((prediction.position.left + prediction.position.width) * 10)
            };
            
            prompt += ` - Located at position: [${normalizedBox.ymin}, ${normalizedBox.xmin}, ${normalizedBox.ymax}, ${normalizedBox.xmax}] (normalized to 0-1000 scale)`;
          }
        });
        
        prompt += `
        
      Please take these detected issues into account in your analysis. Use them as guidance, but feel free to identify other issues you can see in the image. For each issue, try to describe its location in the image accurately.
      `;
      }
      
      prompt += `

      GUIDELINES:

      If the print has FAILED:
      1. In the "Confirmation" section: Write ONLY "The print has failed."
      2. In the "Issue Type" section: Be SPECIFIC about the type of failure (e.g., stringing, layer shifting, warping)
      3. List at least 3 potential causes, using bullet points (•) NOT dashes (-)
      4. List at least 3 recommended fixes, using bullet points (•) NOT dashes (-)
      5. Rate severity from 7-10 if it's a severe failure
      6. In "Affected Areas", precisely describe where the issues are located

      If the print is ACCEPTABLE:
      1. In the "Confirmation" section: Write ONLY "The print is acceptable."
      2. In the "Issue Type" section: Note any minor issues if present, or write "Good quality print"
      3. List any potential improvements in the causes section
      4. List optional enhancements in the fixes section
      5. Rate severity from 1-3 for minor issues
      6. In "Affected Areas", mention any regions that could be improved, if any

      IMPORTANT FORMATTING RULES:
      - Keep the exact headers as shown: "Confirmation:", "Issue Type:", etc.
      - Use bullet points (•) for each list item, NOT dashes (-)
      - Keep each bullet point on a separate line
      - Be concise but thorough
      - For the severity, just write the number (1-10)
      - Be specific about locations - use terms like top-left, bottom-right, center, etc.

      Your response will be parsed by a computer program, so strict adherence to this format is essential.
      `;

      console.log('Sending prompt to Gemini:', prompt);

      // Send the image to Gemini with the prompt
      const result = await model.generateContent([prompt, imagePart]);
      
      const response = result.response.text();
      
      console.log('Received response from Gemini');
      
      // Return the analysis with enhanced response
      res.status(200).json({ 
        response,
        imageUrl: `/uploads/${path.basename(imagePath)}`, // Return the URL to the saved image
        analysisTimestamp: new Date().toISOString(),
        modelVersion: 'gemini-2.0-pro'
      });
      
    } catch (error) {
      console.error('Error processing 3D print analysis request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to analyze 3D print image',
        details: errorMessage 
      });
    }
  })().catch(next);
});

/**
 * @route POST /api/gemini/segment-print
 * @desc Segment a 3D print image and provide detailed object analysis with masks
 * @access Public
 */
router.post('/segment-print', upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Get the uploaded file path
      const imagePath = req.file.path;

      // Use Gemini 2.5 for segmentation capabilities
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
      });

      // Convert image to format Gemini can use
      const imagePart = await fileToGenerativePart(imagePath);
      
      // Create prompt for segmentation
      const prompt = `
      Give the segmentation masks for any failures or defects in this 3D print.
      Output a JSON list of segmentation masks where each entry contains:
      1. The 2D bounding box in the key "box_2d" in format [ymin, xmin, ymax, xmax] normalized to 0-1000
      2. The segmentation mask in key "mask" 
      3. The text label in the key "label" describing the specific type of defect
      4. A "confidence" value between 0 and 1
      5. A "description" key with a brief explanation of the issue

      Use descriptive labels for the specific 3D printing issues (e.g., "layer_shift", "stringing", "warping").
      If no defects are found, return an empty list.
      `;

      // Send the image to Gemini with the segmentation prompt
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              imagePart
            ]
          }
        ]
      });
      
      const response = result.response.text();
      
      console.log('Received segmentation response from Gemini');
      
      // Return the segmentation analysis
      res.status(200).json({ 
        response,
        imageUrl: `/uploads/${path.basename(imagePath)}`,
        modelVersion: 'gemini-2.5-pro'
      });
      
    } catch (error) {
      console.error('Error processing 3D print segmentation request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to perform segmentation on 3D print image',
        details: errorMessage 
      });
    }
  })().catch(next);
});

export const geminiRoutes = router;