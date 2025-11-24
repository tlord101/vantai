import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { prompt, userId, customKey, imageBase64, imageMime } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const activeKey = customKey || process.env.GOOGLE_GEN_API_KEY;
    const ai = new GoogleGenerativeAI(activeKey);
    const model = ai.getGenerativeModel({ model: 'veo-3.0-fast-generate-preview' });

    let contents;
    
    if (imageBase64) {
      // With reference image
      contents = [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: imageMime || 'image/png', data: imageBase64 } }
        ]
      }];
    } else {
      // Text-to-video only
      contents = [{ parts: [{ text: prompt }] }];
    }

    const response = await model.generateContent({
      contents,
      generationConfig: {
        responseModalities: ['VIDEO']
      }
    });

    const candidate = response.response.candidates[0];
    let videoBase64;

    // Extract video data from response
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('video/')) {
        videoBase64 = part.inlineData.data;
        break;
      }
    }

    if (!videoBase64) {
      console.error('Full Veo response:', JSON.stringify(response.response, null, 2));
      throw new Error("No video data returned from Veo.");
    }

    res.status(200).json({
      success: true,
      videoData: videoBase64
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate video'
    });
  }
}
