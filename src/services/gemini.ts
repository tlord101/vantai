import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY);

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  image?: string;
}

class GeminiService {
  private model;

  constructor() {
    // Using gemini-1.5-flash for text and image support
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async sendMessage(text: string, image?: File): Promise<string> {
    try {
      if (image) {
        // Handle image + text prompt
        const imageData = await this.fileToGenerativePart(image);
        const result = await this.model.generateContent([text, imageData]);
        const response = await result.response;
        return response.text();
      } else {
        // Handle text-only prompt
        const result = await this.model.generateContent(text);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get AI response. Please check your API key.');
    }
  }

  private async fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generateImageDescription(image: File): Promise<string> {
    try {
      const imageData = await this.fileToGenerativePart(image);
      const result = await this.model.generateContent([
        'Describe this image in detail.',
        imageData,
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating image description:', error);
      throw new Error('Failed to analyze image.');
    }
  }
}

export const geminiService = new GeminiService();
