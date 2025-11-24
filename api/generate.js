import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize global queue if it doesn't exist
if (!global.requestQueue) {
  global.requestQueue = {
    queue: [],
    processing: false,
    userRequestTimes: new Map()
  };
}

async function addToQueue(requestData) {
  const queue = global.requestQueue;
  
  return new Promise((resolve, reject) => {
    const queueItem = {
      ...requestData,
      resolve,
      reject,
      addedAt: Date.now()
    };
    
    queue.queue.push(queueItem);
    processQueue();
  });
}

async function processQueue() {
  const queue = global.requestQueue;
  
  if (queue.processing || queue.queue.length === 0) return;

  queue.processing = true;

  while (queue.queue.length > 0) {
    const item = queue.queue.shift();
    const { userId } = item;

    // Check rate limit for this user
    const now = Date.now();
    if (!queue.userRequestTimes.has(userId)) {
      queue.userRequestTimes.set(userId, []);
    }

    const userTimes = queue.userRequestTimes.get(userId);
    const recentTimes = userTimes.filter(time => now - time < 60000);
    queue.userRequestTimes.set(userId, recentTimes);

    if (recentTimes.length >= 3) {
      const oldestRequest = Math.min(...recentTimes);
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));
    }

    try {
      const result = await generateImage(item);
      queue.userRequestTimes.get(userId).push(Date.now());
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  queue.processing = false;
}

async function generateImage(requestData) {
  const { prompt, customKey, isEdit, imageBase64, imageMime } = requestData;
  const activeKey = customKey || process.env.GOOGLE_GEN_API_KEY;
  
  try {
    const ai = new GoogleGenerativeAI(activeKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    if (isEdit && imageBase64) {
      // Use Gemini 2.5 Flash for image editing
      const response = await model.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imageMime || 'image/png', data: imageBase64 } }
          ]
        }],
        generationConfig: { 
          responseModalities: ['IMAGE'],
          aspectRatio: '1:1',
          numberOfImages: 1
        }
      });

      const candidate = response.response.candidates[0];
      let finalImageBase64;
      
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          finalImageBase64 = part.inlineData.data;
          break;
        }
      }

      if (!finalImageBase64) {
        throw new Error("No image data returned from Gemini.");
      }

      return { imageData: finalImageBase64 };

    } else {
      // Use Gemini 2.5 Flash for text-to-image generation
      const response = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseModalities: ['IMAGE'],
          aspectRatio: '1:1',
          numberOfImages: 1
        }
      });

      const candidate = response.response.candidates[0];
      let finalImageBase64;
      
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          finalImageBase64 = part.inlineData.data;
          break;
        }
      }

      if (!finalImageBase64) {
        console.error('Full response:', JSON.stringify(response, null, 2));
        throw new Error("No image data returned from Gemini.");
      }

      return { imageData: finalImageBase64 };
    }
    
  } catch (error) {
    console.error('Generation Error:', error);
    throw error;
  }
}

function getQueueLength() {
  return global.requestQueue.queue.length;
}

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
    const { prompt, userId, customKey, isEdit, imageBase64, imageMime } = req.body;

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

    const queueLength = getQueueLength();

    const requestData = {
      prompt,
      userId,
      customKey,
      isEdit,
      imageBase64,
      imageMime
    };

    const result = await addToQueue(requestData);

    res.status(200).json({
      success: true,
      ...result,
      queueInfo: {
        wasQueued: queueLength > 0,
        position: queueLength + 1
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
