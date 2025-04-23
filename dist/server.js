"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables - MUST be first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Other imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const roboflow_1 = require("./routes/roboflow");
const gemini_1 = require("./routes/gemini");
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 7070;
// Configure middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Set proper MIME type for ES modules
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Routes
app.use('/api/roboflow', roboflow_1.roboflowRoutes);
app.use('/api/gemini', gemini_1.geminiRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: '3D Print Monitor TypeScript API is running' });
});
// Root endpoint
app.get('/api', (req, res) => {
    res.status(200).json({ message: '3D Print Monitor TypeScript API is running' });
});
// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the web interface`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
