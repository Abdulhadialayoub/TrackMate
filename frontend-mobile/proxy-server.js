const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 8081;

// Get local IP address for better visibility on the network
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const localIp = getLocalIpAddress();

// Enable CORS for all routes with more permissive settings
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body parsing middleware
app.use(express.json());

// Log requests with more details
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    console.log('[PROXY] Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Create proxy middleware with better error handling
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:5105', // Your backend API address
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // No rewrite needed
  },
  // Add request headers for CORS and content type
  onProxyReq: (proxyReq, req, res) => {
    // If the request contains a body, make sure it's properly forwarded
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
    console.log(`[PROXY] Proxying ${req.method} ${req.url} to http://localhost:5105${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log response headers for debugging
    console.log(`[PROXY] Response for ${req.method} ${req.url}: ${proxyRes.statusCode}`);
    console.log('[PROXY] Response headers:', JSON.stringify(proxyRes.headers, null, 2));
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({
      error: 'Proxy Error',
      message: err.message,
      code: err.code || 'UNKNOWN'
    }));
  }
});

// Proxy all /api requests to the backend
app.use('/api', apiProxy);

// Health check endpoint with more information
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Proxy server is running',
    serverIp: localIp,
    port: PORT,
    target: 'http://localhost:5105'
  });
});

// Add a test endpoint to verify the proxy is working
app.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Proxy server test endpoint is working',
    clientIp: req.ip,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=== TrackMate API Proxy Server ===`);
  console.log(`Server running on:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://${localIp}:${PORT}`);
  console.log(`
Proxying API requests to: http://localhost:5105`);
  console.log(`
Test the proxy with: http://${localIp}:${PORT}/health`);
  console.log(`
Press Ctrl+C to stop the server
`);
}); 