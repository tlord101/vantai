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
    if (isEdit && imageBase64) {
      // Image editing with Gemini
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${activeKey}`;
      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: { 
                mime_type: imageMime, 
                data: imageBase64 
              } 
            }
          ]
        }],
        generationConfig: { 
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const result = await response.json();
      
      // For now, return a message since Gemini doesn't generate images directly
      // You would need to use a different model for image editing
      throw new Error('Image editing is currently not available. Please use text-to-image generation.');
      
    } else {
      // Text to image with Imagen 3
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${activeKey}`;
      const payload = {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetySetting: "block_some",
          personGeneration: "allow_adult"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Imagen API Error:', errorText);
        throw new Error(`Imagen API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', JSON.stringify(result).substring(0, 200));
      
      // Try different possible response formats
      let finalImageBase64 = 
        result.predictions?.[0]?.bytesBase64Encoded ||
        result.predictions?.[0]?.image?.bytesBase64Encoded ||
        result.predictions?.[0]?.generatedImages?.[0]?.bytesBase64Encoded ||
        result.generated_images?.[0]?.image_base64 ||
        result.images?.[0]?.data;

      if (!finalImageBase64) {
        console.error('Full API Response:', JSON.stringify(result));
        throw new Error("No image data in API response. The API format may have changed.");
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
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image'
    });
  }
}
