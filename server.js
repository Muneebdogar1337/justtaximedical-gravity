const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const db = require('./db.js');

const PORT = process.env.PORT || 3030;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.csv': 'text/csv; charset=utf-8'
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURI(urlObj.pathname);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API ROUTES ---
  if (pathname === '/api/config' && req.method === 'GET') {
    return sendJson(res, config);
  }

  if (pathname === '/api/stats' && req.method === 'GET') {
    return sendJson(res, db.getStats());
  }

  if (pathname === '/api/bookings' && req.method === 'GET') {
    const status = urlObj.searchParams.get('status');
    const search = urlObj.searchParams.get('search');
    const bookings = db.getBookings({ status, search });
    return sendJson(res, { bookings });
  }

  if (pathname === '/api/bookings' && req.method === 'POST') {
    const data = await parseBody(req);
    if (!data.driver_name || !data.driver_phone || !data.date) {
      return sendJson(res, { error: 'Please provide full name, phone number, and appointment date.' }, 400);
    }
    const booking = db.createBooking(data);
    return sendJson(res, { success: true, booking });
  }

  if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/status') && req.method === 'PATCH') {
    const id = pathname.split('/')[3];
    const data = await parseBody(req);
    const updated = db.updateBookingStatus(id, data.status);
    return sendJson(res, { success: true, booking: updated });
  }

  if (pathname === '/api/bookings/export.csv' && req.method === 'GET') {
    const bookings = db.getBookings();
    let csv = 'Reference,Service,Price,Council,Clinic,Date,Time,Driver Name,Phone,Email,Licence No,Payment,Status,Booked At\n';
    for (const b of bookings) {
      csv += `"${b.ref}","${b.service}","£${b.price}","${b.council}","${b.clinic}","${b.date}","${b.time}","${b.driver_name}","${b.driver_phone}","${b.driver_email}","${b.licence_number || ''}","${b.payment_method}","${b.status}","${b.created_at}"\n`;
    }
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="direct_taxi_medicals_bookings.csv"'
    });
    return res.end(csv);
  }

  if (pathname === '/api/inquiries' && req.method === 'POST') {
    const data = await parseBody(req);
    if (!data.name || !data.email || !data.message) {
      return sendJson(res, { error: 'Please provide name, email, and message.' }, 400);
    }
    const result = db.createInquiry(data);
    return sendJson(res, result);
  }

  if (pathname === '/api/inquiries' && req.method === 'GET') {
    return sendJson(res, { inquiries: db.getInquiries() });
  }

  // --- ADMIN PORTAL ROUTE ---
  if (pathname === '/admin' || pathname === '/admin/') {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(adminPath).pipe(res);
    }
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(__dirname, reqPath);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If extension is omitted, try .html
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Fallback to index.html for client routing
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Direct Taxi Medicals UK running live at: http://localhost:${PORT}`);
  console.log(`Admin Management Dashboard: http://localhost:${PORT}/admin`);
});
