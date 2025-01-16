// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:59749', // Frontend origin
  credentials: true, // Allow credentials
}));

// Proxy Route with Target URL in Query Parameter
app.use('/', async (req, res) => {
  const targetUrl = req.query.target; // Expecting ?target=<URL>
  console.log('targetUrl', targetUrl);
  


  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL in query parameters' });
  }

  try {
    // Forward the request to the target URL
    const connParam = {
      method: req.method,
      url: targetUrl,
      data: req.body,
      // headers: { ...req.headers, host: new URL(targetUrl).host },
      headers: { ...req.headers },
      withCredentials: true,
    }

    // IMPORTANT! This is the core part of the CORS proxy server
    // Drop the headers that are not allowed in CORS requests
    deleted_headers = ['content-length', 'host', 'origin', 'referer'];
    deleted_headers.forEach(header => {
      if (connParam.headers[header]) {
        delete connParam.headers[header];
      }
    });

    console.info('Connection parameters:', connParam);

    const response = await axios(connParam);

    // Forward Set-Cookie headers
    const cookies = response.headers['set-cookie'];
    if (cookies) cookies.forEach(cookie => res.append('Set-Cookie', cookie));

    console.info('Response data:', response.data);
    console.info('Response status:', response.status);
    console.info('Response headers:', response.headers);

    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      // console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).json({ message: 'Internal Server Error', error: error.message, response: error.response });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
