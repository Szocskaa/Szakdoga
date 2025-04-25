import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { upload } from '../uploadConfig';

dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in the environment variables');
  console.log('Please check that your .env file contains the GEMINI_API_KEY variable');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function fileToGenerativePart(filePath: string): Promise<{
  inlineData: { data: string, mimeType: string }
}> {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = 
    extension === '.png' ? 'image/png' : 
    extension === '.webp' ? 'image/webp' :
    extension === '.heic' ? 'image/heic' :
    extension === '.heif' ? 'image/heif' :
    'image/jpeg'; 
  
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

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const generationConfig = {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      // Send 
      const result = await chatSession.sendMessage(message);
      const response = result.response.text();
      
      // Return 
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

      const imagePath = req.file.path;
      
      let predictionData = null;
      if (req.body.predictions) {
        try {
          predictionData = JSON.parse(req.body.predictions);
          console.log('Received prediction data from Roboflow:', predictionData);
        } catch (e) {
          console.error('Error parsing prediction data:', e);
        }
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-pro',
      });

      // gen config
      const generationConfig = {
        temperature: 0.4, // Low temp. -> more accurate analysis
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      const imagePart = await fileToGenerativePart(imagePath);
      
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
      
      // + roboflow prediction
      if (predictionData && predictionData.predictions && predictionData.predictions.length > 0) {
        prompt += `
        
      IMPORTANT: The image has been analyzed by a computer vision model (Roboflow) which detected the following issues:
      `;
        
        predictionData.predictions.forEach((prediction: any, index: number) => {
          prompt += `
      • ${prediction.class} (confidence: ${Math.round(prediction.confidence * 100)}%)`;
          
          if (prediction.position) {
            // normalized bbox coordinates (0-1000) --- documentation
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
      
      res.status(200).json({ 
        response,
        imageUrl: `/uploads/${path.basename(imagePath)}`,
        analysisTimestamp: new Date().toISOString(),
        modelVersion: 'gemini-1'
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


export const geminiRoutes = router;