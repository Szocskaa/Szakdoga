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
            // Get Roboflow prediction data if available
            let predictionData = null;
            if (req.body.predictions) {
                try {
                    predictionData = JSON.parse(req.body.predictions);
                    console.log('Received prediction data from Roboflow:', predictionData);
                }
                catch (e) {
                    console.error('Error parsing prediction data:', e);
                }
            }
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
            // Create a prompt that includes Roboflow prediction data if available
            let prompt = `
      Analyze this 3D print image and determine if it shows a failed print.

      IMPORTANT: Return your analysis EXACTLY in the following format to ensure proper parsing:

      Confirmation: [State CLEARLY if the print has failed OR if it's acceptable]

      Issue Type: [Describe the specific type of failure or quality assessment]

      Potential Causes:
      - [Cause 1]
      - [Cause 2]
      - [Add more causes as needed]

      Recommended Fixes:
      - [Fix 1]
      - [Fix 2]
      - [Add more fixes as needed]

      Severity: [Rate on a scale of 1-10, with 10 being the most severe]

      Additional Notes: [Any other observations that don't fit above]
      `;
            // Add prediction information if available
            if (predictionData && predictionData.predictions && predictionData.predictions.length > 0) {
                prompt += `
        
      IMPORTANT: The image has been analyzed by a computer vision model (Roboflow) which detected the following issues:
      `;
                predictionData.predictions.forEach((prediction, index) => {
                    prompt += `
      ${index + 1}. ${prediction.class} (confidence: ${Math.round(prediction.confidence * 100)}%)`;
                    if (prediction.position) {
                        prompt += ` - Located at position: left=${prediction.position.left}%, top=${prediction.position.top}%, width=${prediction.position.width}%, height=${prediction.position.height}%`;
                    }
                });
                prompt += `
        
      Please take these detected issues into account in your analysis. Use them as guidance, but feel free to identify other issues you can see in the image.
      `;
            }
            prompt += `

      GUIDELINES:

      If the print has FAILED:
      1. In the "Confirmation" section: Write ONLY "The print has failed."
      2. In the "Issue Type" section: Be SPECIFIC about the type of failure (e.g., stringing, layer shifting, warping)
      3. List at least 3 potential causes, each on a new line with a dash (-)
      4. List at least 3 recommended fixes, each on a new line with a dash (-)
      5. Rate severity from 7-10 if it's a severe failure

      If the print is ACCEPTABLE:
      1. In the "Confirmation" section: Write ONLY "The print is acceptable."
      2. In the "Issue Type" section: Note any minor issues if present, or write "Good quality print"
      3. List any potential improvements in the causes section
      4. List optional enhancements in the fixes section
      5. Rate severity from 1-3 for minor issues

      IMPORTANT FORMATTING RULES:
      - Keep the exact headers as shown: "Confirmation:", "Issue Type:", etc.
      - Use dashes (-) at the start of each bullet point
      - Keep each bullet point on a separate line
      - Be concise but thorough
      - For the severity, just write the number (1-10)
      - Do not add any other sections beyond what is specified

      Your response will be parsed by a computer program, so strict adherence to this format is essential.
      `;
            console.log('Sending prompt to Gemini:', prompt);
            // Send the image to Gemini with the prompt
            const result = await model.generateContent([prompt, imagePart]);
            const response = result.response.text();
            console.log('Received response from Gemini');
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
