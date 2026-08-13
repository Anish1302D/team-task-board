const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'data', 'tasks.json');

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2) + '\n', 'utf8');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request payload too large'));
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });

    req.on('error', reject);
  });
}

function safeFilePath(requestPath) {
  const relativePath = requestPath === '/' ? '/components/navbar.html' : requestPath;
  const normalized = relativePath.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT_DIR, normalized);

  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }

  return resolved;
}

function serveStaticFile(res, requestPath) {
  const filePath = safeFilePath(requestPath);

  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  res.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream'
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/tasks' && req.method === 'GET') {
    sendJson(res, 200, readTasks());
    return;
  }

  if (url.pathname === '/api/tasks' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const title = String(body.title || '').trim();
      const status = ['pending', 'in-progress', 'completed'].includes(body.status) ? body.status : 'pending';

      if (!title) {
        sendJson(res, 400, { error: 'Task title is required' });
        return;
      }

      const tasks = readTasks();
      const newTask = {
        id: Date.now(),
        title,
        status
      };

      tasks.push(newTask);
      writeTasks(tasks);
      sendJson(res, 201, newTask);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (url.pathname.startsWith('/api/tasks/')) {
    const taskId = Number(url.pathname.split('/').pop());
    const tasks = readTasks();
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      sendJson(res, 404, { error: 'Task not found' });
      return;
    }

    if (req.method === 'PUT') {
      try {
        const body = await parseBody(req);
        if (body.title !== undefined) tasks[taskIndex].title = String(body.title).trim();
        if (body.status !== undefined) {
          const nextStatus = ['pending', 'in-progress', 'completed'].includes(body.status) ? body.status : tasks[taskIndex].status;
          tasks[taskIndex].status = nextStatus;
        }
        writeTasks(tasks);
        sendJson(res, 200, tasks[taskIndex]);
      } catch (error) {
        sendJson(res, 500, { error: error.message });
      }
      return;
    }

    if (req.method === 'DELETE') {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      writeTasks(updatedTasks);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (url.pathname === '/' || url.pathname === '/components/navbar.html') {
    serveStaticFile(res, '/components/navbar.html');
    return;
  }

  if (url.pathname === '/components/tasks.html') {
    serveStaticFile(res, '/components/tasks.html');
    return;
  }

  if (url.pathname === '/data/tasks.json') {
    serveStaticFile(res, '/data/tasks.json');
    return;
  }

  serveStaticFile(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Team Task Board running at http://localhost:${PORT}`);
});
