import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in the environment variables');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

export const geminiRoutes = router; 