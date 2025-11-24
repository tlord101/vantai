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
  
  try {
    // For image editing, return an error for now
    if (isEdit && imageBase64) {
      throw new Error('Image editing is currently not available. Please use text-to-image generation.');
    }
    
    // Use Pollinations.ai - free image generation API
    // This is a reliable, free alternative that works well
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }
    
    // Convert image to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return { imageData: base64 };
    
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
