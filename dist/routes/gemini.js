"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiRoutes = void 0;
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const router = express_1.default.Router();
// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is not set in the environment variables');
    console.log('Please check that your .env file contains the GEMINI_API_KEY variable');
}
// Initialize Gemini AI
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
// Configure multer for image uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Ensure the uploads directory exists
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `print-failure-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
});
// Helper function to read image as base64
async function fileToGenerativePart(filePath) {
    const mimeType = path_1.default.extname(filePath).toLowerCase() === '.png'
        ? 'image/png'
        : path_1.default.extname(filePath).toLowerCase() === '.webp'
            ? 'image/webp'
            : 'image/jpeg';
    const data = fs_1.default.readFileSync(filePath);
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
router.post('/chat', express_1.default.json(), (req, res, next) => {
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
        }
        catch (error) {
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
router.post('/analyze-print', upload.single('image'), (req, res, next) => {
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
                imageUrl: `/uploads/${path_1.default.basename(imagePath)}` // Return the URL to the saved image
            });
        }
        catch (error) {
            console.error('Error processing 3D print analysis request:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                error: 'Failed to analyze 3D print image',
                details: errorMessage
            });
        }
    })().catch(next);
});
exports.geminiRoutes = router;
