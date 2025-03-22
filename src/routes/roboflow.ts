import express, { Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import { upload } from '../uploadConfig';

const router = express.Router();

// Environment variables
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || 'OW2ci9cwEzLofsYscZgf';
const PROJECT_ID = process.env.PROJECT_ID || '3dprinting-iscuw';
const MODEL_VERSION = process.env.MODEL_VERSION || '1';

/**
 * @route POST /api/roboflow/detect
 * @desc Detect 3D printing failures in an uploaded image
 * @access Public
 */
router.post('/detect', upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const filePath = req.file.path;
      
      // Read the image file as base64
      const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
      
      // Make request to Roboflow API
      const response = await axios({
        method: 'POST',
        url: `https://detect.roboflow.com/${PROJECT_ID}/${MODEL_VERSION}`,
        params: {
          api_key: ROBOFLOW_API_KEY
        },
        data: imageBase64,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Clean up the temporary file
      fs.unlinkSync(filePath);
      
      // Return the detection results
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error detecting 3D printing failures:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to process image',
        details: errorMessage 
      });
    }
  })().catch(next);
});

export const roboflowRoutes = router; 