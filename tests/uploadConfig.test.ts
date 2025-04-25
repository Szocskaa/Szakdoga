import { upload } from '../src/uploadConfig';
import * as path from 'path';

describe('Upload Configuration', () => {
  test('upload middleware exists', () => {
    expect(upload).toBeDefined();
  });

  test('upload middleware has single method', () => {
    expect(upload.single).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });
}); 