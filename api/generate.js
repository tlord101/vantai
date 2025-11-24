// Queue system for managing requests
class RequestQueue {
  constructor() {
    if (!global.requestQueue) {
      global.requestQueue = {
        queue: [],
        processing: false,
        userRequestTimes: new Map()
      };
    }
    return global.requestQueue;
  }

  async addToQueue(requestData) {
    const queue = global.requestQueue;
    
    return new Promise((resolve, reject) => {
      const queueItem = {
        ...requestData,
        resolve,
        reject,
        addedAt: Date.now()
      };
      
      queue.queue.push(queueItem);
      this.processQueue();
    });
  }

  async processQueue() {
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
        const result = await this.generateImage(item);
        queue.userRequestTimes.get(userId).push(Date.now());
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    queue.processing = false;
  }

  async generateImage(requestData) {
    const { prompt, customKey, isEdit, imageBase64, imageMime } = requestData;
    const activeKey = customKey || process.env.GOOGLE_GEN_API_KEY;
    let url, payload;

    if (isEdit && imageBase64) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${activeKey}`;
      payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imageMime, data: imageBase64 } }
          ]
        }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${activeKey}`;
      payload = {
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1 }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let finalImageBase64;

    if (isEdit) {
      finalImageBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    } else {
      finalImageBase64 = result.predictions?.[0]?.bytesBase64Encoded;
    }

    if (!finalImageBase64) {
      throw new Error("No image data returned from API.");
    }

    return { imageData: finalImageBase64 };
  }

  getQueueLength() {
    return global.requestQueue.queue.length;
  }
}

const requestQueue = new RequestQueue();

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

    const queueLength = requestQueue.getQueueLength();

    const requestData = {
      prompt,
      userId,
      customKey,
      isEdit,
      imageBase64,
      imageMime
    };

    const result = await requestQueue.addToQueue(requestData);

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
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image'
    });
  }
}
