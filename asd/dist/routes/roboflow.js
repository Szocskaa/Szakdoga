"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roboflowRoutes = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const uploadConfig_1 = require("../uploadConfig");
const router = express_1.default.Router();
// Environment variables
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || 'OW2ci9cwEzLofsYscZgf';
const PROJECT_ID = process.env.PROJECT_ID || '3dprinting-iscuw';
const MODEL_VERSION = process.env.MODEL_VERSION || '1';
/**
 * @route POST /api/roboflow/detect
 * @desc Detect 3D printing failures in an uploaded image
 * @access Public
 */
router.post('/detect', uploadConfig_1.upload.single('image'), (req, res, next) => {
    (async () => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided' });
            }
            const filePath = req.file.path;
            // Read the image file as base64
            const imageBase64 = fs_1.default.readFileSync(filePath, { encoding: 'base64' });
            // Make request to Roboflow API
            const response = await (0, axios_1.default)({
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
            fs_1.default.unlinkSync(filePath);
            // Return the detection results
            res.status(200).json(response.data);
        }
        catch (error) {
            console.error('Error detecting 3D printing failures:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                error: 'Failed to process image',
                details: errorMessage
            });
        }
    })().catch(next);
});
/**
 * @route POST /api/roboflow/detect-url
 * @desc Detect 3D printing failures in an image from a URL
 * @access Public
 */
router.post('/detect-url', (req, res, next) => {
    (async () => {
        try {
            const { imageUrl } = req.body;
            if (!imageUrl) {
                return res.status(400).json({ error: 'No image URL provided' });
            }
            // Make request to Roboflow API
            const response = await (0, axios_1.default)({
                method: 'POST',
                url: `https://detect.roboflow.com/${PROJECT_ID}/${MODEL_VERSION}`,
                params: {
                    api_key: ROBOFLOW_API_KEY,
                    image: imageUrl
                }
            });
            // Return the detection results
            res.status(200).json(response.data);
        }
        catch (error) {
            console.error('Error detecting 3D printing failures from URL:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                error: 'Failed to process image from URL',
                details: errorMessage
            });
        }
    })().catch(next);
});
/**
 * @route POST /api/roboflow/detect-base64
 * @desc Detect 3D printing failures in a base64 encoded image
 * @access Public
 */
router.post('/detect-base64', (req, res, next) => {
    (async () => {
        try {
            const { image } = req.body;
            if (!image) {
                return res.status(400).json({ error: 'No base64 image provided' });
            }
            // Extract the base64 data if it includes the data URL prefix
            let imageBase64 = image;
            if (image.includes(',')) {
                imageBase64 = image.split(',')[1];
            }
            // Make request to Roboflow API
            const response = await (0, axios_1.default)({
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
            // Return the detection results
            res.status(200).json(response.data);
        }
        catch (error) {
            console.error('Error detecting 3D printing failures from base64:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                error: 'Failed to process base64 image',
                details: errorMessage
            });
        }
    })().catch(next);
});
exports.roboflowRoutes = router;
