process.env.GEMINI_API_KEY = 'mock-api-key';

import request from 'supertest';
import express from 'express';
import { geminiRoutes } from '../src/routes/gemini';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation(() => ({
      startChat: jest.fn().mockImplementation(() => ({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('Mock response from Gemini')
          }
        })
      })),
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mock analysis of 3D print')
        }
      })
    }))
  }))
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock-image-data'))
}));

describe('Gemini Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/gemini', geminiRoutes);
  });

  test('chat endpoint returns response with valid message', async () => {
    const res = await request(app)
      .post('/api/gemini/chat')
      .send({ message: 'Hello, world!' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('response');
  });

  test('chat endpoint returns 400 with missing message', async () => {
    const res = await request(app)
      .post('/api/gemini/chat')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
}); 