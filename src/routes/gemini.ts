import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `print-failure-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Error: Only image files (jpeg, jpg, png, gif, webp) are allowed'));
  }
});

// Helper function to read image as base64
async function fileToGenerativePart(filePath: string): Promise<{
  inlineData: { data: string, mimeType: string }
}> {
  const mimeType = path.extname(filePath).toLowerCase() === '.png' 
    ? 'image/png' 
    : path.extname(filePath).toLowerCase() === '.webp'
      ? 'image/webp'
      : 'image/jpeg';
  
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

      // Get the Gemini model
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      // Generate configuration with valid parameters
      const generationConfig = {
        temperature: 1,
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

      // Get the Gemini Pro Vision model
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });

      // Generate configuration with valid parameters
      const generationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Convert image to format Gemini can use
      const imagePart = await fileToGenerativePart(imagePath);

      // The prompt that guides Gemini to analyze the 3D print
      const prompt = `
      Analyze this 3D print image and determine if it shows a failed print. 

      If it IS a failed print:
      1. Confirm that the print has indeed failed
      2. Describe the specific type of failure visible in the image (e.g., stringing, layer shifting, warping, etc.)
      3. Analyze the potential causes of this failure
      4. Suggest specific actions the user could take to fix this issue
      5. Rate the severity of the failure on a scale of 1-10

      If it is NOT a failed print or the quality is acceptable:
      1. Confirm that the print appears successful
      2. Describe any minor issues that might be present, if any
      3. Suggest any optional improvements for future prints

      Present your analysis in a clear, structured format with headings and bullet points.
      `;

      // Send the image to Gemini with the prompt
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response.text();
      
      // Return the analysis
      res.status(200).json({ 
        response,
        imageUrl: `/uploads/${path.basename(imagePath)}` // Return the URL to the saved image
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