// Load environment variables - MUST be first
import dotenv from 'dotenv';
dotenv.config();

// Other imports
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { roboflowRoutes } from './routes/roboflow';
import { geminiRoutes } from './routes/gemini';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 7070;

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/roboflow', roboflowRoutes);
app.use('/api/gemini', geminiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '3D Print Monitor TypeScript API is running' });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ message: '3D Print Monitor TypeScript API is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the web interface`);
}); 