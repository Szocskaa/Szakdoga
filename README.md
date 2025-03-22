# 3D Print Monitor

A web application for monitoring and analyzing 3D prints, with AI-powered failure detection and analysis.

## Features

- **3D Print Failure Detection**: Utilizes Roboflow to detect print failures from images
- **AI-Powered Failure Analysis**: Uses Gemini AI to analyze detected failures and provide recommendations
- **Chat Interface**: Interact with AI assistant to ask questions about detected print failures
- **Image Upload**: Upload images of 3D prints for analysis directly through the chat interface

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file with the following variables:
```
ROBOFLOW_API_KEY=your_roboflow_api_key
PROJECT_ID=your_roboflow_project_id
MODEL_VERSION=your_model_version
GEMINI_API_KEY=your_gemini_api_key
```
4. Build the application:
```bash
npm run build
```
5. Start the server:
```bash
npm start
```

## Using the AI Print Failure Analysis

1. Use the "Upload print image for analysis" button in the chat interface
2. Gemini AI will analyze the image and determine if it shows a print failure
3. If a failure is detected, the AI will:
   - Describe the type of failure
   - Analyze potential causes
   - Suggest specific fixes
   - Rate the severity on a scale of 1-10
4. You can ask follow-up questions about the failure in the chat

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express, TypeScript
- **AI Services**: 
  - Roboflow (Object Detection)
  - Google Gemini AI (Image Analysis and Chat)

## Development

To run the development server with hot-reloading:
```bash
npm run dev
```

## License

ISC 