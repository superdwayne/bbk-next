const express = require('express');
const next = require('next');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3002;

app.prepare().then(() => {
  const server = express();

  server.use(cors());
  server.use(express.json());

  server.post('/api/SS-chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const data = JSON.stringify({
      endpoint: 'SS-chat',
      inputs: {
        chat_messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      },
    });
    const config = {
      method: 'post',
      url: 'https://api.lmnr.ai/v2/endpoint/run',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LMNR_API_KEY}`,
      },
      data: data,
    };
    try {
      const response = await axios(config);
      res.json(response.data);
    } catch (error) {
      console.error('Error calling LMNR API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        res.status(error.response.status).json({ error: error.response.data });
      } else if (error.request) {
        console.error('No response received:', error.request);
        res.status(500).json({ error: 'No response received from LMNR API' });
      } else {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
      }
    }
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
