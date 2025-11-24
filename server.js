require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Queue system for managing requests
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.userRequestTimes = new Map(); // Track request times per user
  }

  async addToQueue(requestData) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        ...requestData,
        resolve,
        reject,
        addedAt: Date.now()
      };
      
      this.queue.push(queueItem);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      const { userId } = item;

      // Check rate limit for this user
      const now = Date.now();
      if (!this.userRequestTimes.has(userId)) {
        this.userRequestTimes.set(userId, []);
      }

      const userTimes = this.userRequestTimes.get(userId);
      // Remove requests older than 1 minute
      const recentTimes = userTimes.filter(time => now - time < 60000);
      this.userRequestTimes.set(userId, recentTimes);

      // If user has made 3+ requests in the last minute, wait
      if (recentTimes.length >= 3) {
        const oldestRequest = Math.min(...recentTimes);
        const waitTime = 60000 - (now - oldestRequest);
        await new Promise(resolve => setTimeout(resolve, waitTime + 100));
      }

      // Process the request
      try {
        const result = await this.generateImage(item);
        this.userRequestTimes.get(userId).push(Date.now());
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Small delay between requests to prevent API throttling
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }

  async generateImage(requestData) {
    const { prompt, customKey, isEdit, imageBase64, imageMime } = requestData;
    const activeKey = customKey || process.env.GOOGLE_GEN_API_KEY;
    
    try {
      // For image editing, return an error for now
      if (isEdit && imageBase64) {
        throw new Error('Image editing is currently not available. Please use text-to-image generation.');
      }
      
      // Use Pollinations.ai API (free, no authentication required)
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
      
      const response = await fetch(pollinationsUrl);
      
      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      return { imageData: base64Image };
      
    } catch (error) {
      console.error('Generation Error:', error);
      throw error;
    }
  }

  getQueuePosition(userId) {
    const position = this.queue.findIndex(item => item.userId === userId);
    return position === -1 ? 0 : position + 1;
  }

  getQueueLength() {
    return this.queue.length;
  }
}

const requestQueue = new RequestQueue();

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    },
    paystack: {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY
    }
  });
});

// Get queue status endpoint
app.get('/api/queue-status', (req, res) => {
  res.json({
    queueLength: requestQueue.getQueueLength(),
    processing: requestQueue.processing
  });
});

// Generate image endpoint with queue system
app.post('/api/generate', async (req, res) => {
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

    // Add to queue and get position
    const queueLength = requestQueue.getQueueLength();
    const estimatedWaitMinutes = Math.ceil(queueLength * 20 / 60); // Assuming ~20 seconds per request

    // Send immediate response with queue info
    const requestData = {
      prompt,
      userId,
      customKey,
      isEdit,
      imageBase64,
      imageMime
    };

    // Add to queue and wait for result
    const result = await requestQueue.addToQueue(requestData);

    res.json({
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
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
