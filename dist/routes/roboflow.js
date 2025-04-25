"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roboflowRoutes = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const uploadConfig_1 = require("../uploadConfig");
// Load env
dotenv_1.default.config();
const router = express_1.default.Router();
// Env
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;
const MODEL_VERSION = process.env.MODEL_VERSION;
if (!ROBOFLOW_API_KEY || !PROJECT_ID || !MODEL_VERSION) {
    console.warn('Warning: One or more Roboflow environment variables are not set (ROBOFLOW_API_KEY, PROJECT_ID, MODEL_VERSION)');
    console.log('Current environment values:');
    console.log(`ROBOFLOW_API_KEY: ${ROBOFLOW_API_KEY ? 'Set' : 'Not set'}`);
    console.log(`PROJECT_ID: ${PROJECT_ID ? PROJECT_ID : 'Not set'}`);
    console.log(`MODEL_VERSION: ${MODEL_VERSION ? MODEL_VERSION : 'Not set'}`);
}
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
            if (!ROBOFLOW_API_KEY || !PROJECT_ID || !MODEL_VERSION) {
                return res.status(500).json({ error: 'Server configuration error: API credentials not properly configured' });
            }
            const filePath = req.file.path;
            const imageBase64 = fs_1.default.readFileSync(filePath, { encoding: 'base64' });
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
            fs_1.default.unlinkSync(filePath);
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
exports.roboflowRoutes = router;
