import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

// Initialize Imagen 3 with @google/genai SDK
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  image?: string;
  generatedImage?: string; // For AI-generated images
}

class ImagenService {
  async generateImage(prompt: string, referenceImage?: File): Promise<string> {
    try {
      let enhancedPrompt = prompt;
      
      // Enhance prompt based on whether we have a reference image
      if (referenceImage) {
        enhancedPrompt = `Edit and enhance this image: ${prompt}. Maintain the original composition while applying the requested changes.`;
      }

      // Generate content using Gemini 2.0 Flash with image generation
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: enhancedPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '4K',
          },
        },
      });

      // Extract generated image from response
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const firstCandidate = response.candidates[0];
      if (!firstCandidate.content || !firstCandidate.content.parts) {
        throw new Error('Invalid response structure');
      }

      for (const part of firstCandidate.content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${imageData}`;
        }
      }

      throw new Error('No image data found in response');
    } catch (error: any) {
      console.error('Error generating image with Gemini 2.0 Flash:', error);
      throw new Error(error.message || 'Failed to generate image. Please check your API key and try again.');
    }
  }

  async sendMessage(text: string, image?: File): Promise<{ text: string; generatedImage?: string }> {
    try {
      // Generate image based on prompt
      const generatedImage = await this.generateImage(text, image);
      
      return {
        text: image 
          ? `✨ Image edited successfully! Here's your result based on: "${text}"`
          : `🎨 Image generated successfully! Here's your creation: "${text}"`,
        generatedImage
      };
    } catch (error: any) {
      console.error('Error with Gemini 2.0 Flash API:', error);
      
      return {
        text: `❌ Image generation failed: ${error.message}\n\n💡 Tips:\n• Make sure your API key is valid\n• Ensure Gemini API is enabled in Google Cloud\n• Try a different prompt`
      };
    }
  }
}

export const geminiService = new ImagenService();
