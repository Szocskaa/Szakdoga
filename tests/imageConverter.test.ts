import * as fs from 'fs';
import * as path from 'path';

async function fileToGenerativePart(filePath: string): Promise<{
  inlineData: { data: string, mimeType: string }
}> {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = 
    extension === '.png' ? 'image/png' : 
    extension === '.webp' ? 'image/webp' :
    extension === '.heic' ? 'image/heic' :
    extension === '.heif' ? 'image/heif' :
    'image/jpeg';
  
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

describe('fileToGenerativePart function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test-image-data'));
  });

  test('handles PNG files correctly', async () => {
    const result = await fileToGenerativePart('test-image.png');
    
    expect(fs.readFileSync).toHaveBeenCalledWith('test-image.png');
    expect(result.inlineData.mimeType).toBe('image/png');
    expect(result.inlineData.data).toBe(Buffer.from('test-image-data').toString('base64'));
  });

  test('handles JPEG files correctly', async () => {
    const result = await fileToGenerativePart('test-image.jpg');
    
    expect(fs.readFileSync).toHaveBeenCalledWith('test-image.jpg');
    expect(result.inlineData.mimeType).toBe('image/jpeg');
    expect(result.inlineData.data).toBe(Buffer.from('test-image-data').toString('base64'));
  });

  test('handles WEBP files correctly', async () => {
    const result = await fileToGenerativePart('test-image.webp');
    
    expect(fs.readFileSync).toHaveBeenCalledWith('test-image.webp');
    expect(result.inlineData.mimeType).toBe('image/webp');
  });

  test('treats unknown extensions as JPEG', async () => {
    const result = await fileToGenerativePart('test-image.xyz');
    
    expect(fs.readFileSync).toHaveBeenCalledWith('test-image.xyz');
    expect(result.inlineData.mimeType).toBe('image/jpeg');
  });
}); 