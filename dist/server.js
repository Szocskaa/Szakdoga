"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load env
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const roboflow_1 = require("./routes/roboflow");
const gemini_1 = require("./routes/gemini");
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 7070;
// conf middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/roboflow', roboflow_1.roboflowRoutes);
app.use('/api/gemini', gemini_1.geminiRoutes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: '3D Print Monitor TypeScript API is running' });
});
// Root endpoint
app.get('/api', (req, res) => {
    res.status(200).json({ message: '3D Print Monitor TypeScript API is running' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the web interface`);
});
