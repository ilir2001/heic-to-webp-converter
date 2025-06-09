const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs'); // stream methods
const fsp = require('fs/promises'); // promise-based methods
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const heicConvert = require('heic-convert');
const { EventEmitter } = require('events');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

const progressEmitter = new EventEmitter();
const sseClients = [];

app.use(express.static('public'));

let currentStatus = 'Idle';

app.get('/progress-sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ status: currentStatus })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

function broadcastStatus() {
  const data = `data: ${JSON.stringify({ status: currentStatus })}\n\n`;
  sseClients.forEach(client => client.write(data));
}

progressEmitter.on('update', broadcastStatus);

app.post('/upload', upload.single('zipfile'), async (req, res) => {
  currentStatus = 'Extracting ZIP...';
  progressEmitter.emit('update');

  const zipPath = req.file.path;
  const extractDir = `uploads/${req.file.filename}_extracted`;
  const outputDir = `uploads/${req.file.filename}_webp`;

  await fsp.mkdir(extractDir, { recursive: true });
  await fsp.mkdir(outputDir, { recursive: true });

  await new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .on('close', resolve)
      .on('error', reject);
  });

  const files = await fsp.readdir(extractDir);
  const heicFiles = files.filter(file => path.extname(file).toLowerCase() === '.heic');

  let completed = 0;
  for (const file of heicFiles) {
    currentStatus = `Converting ${++completed} of ${heicFiles.length}...`;
    progressEmitter.emit('update');
    const inputPath = path.join(extractDir, file);
    const name = path.basename(file, '.heic');

    try {
      const inputBuffer = await fsp.readFile(inputPath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'JPEG',
      });

      await sharp(outputBuffer)
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${name}.webp`));
    } catch (error) {
      console.error(`Error converting ${file}: ${error.message}`);
      currentStatus = `Error converting ${file}: ${error.message}`;
      progressEmitter.emit('update');
    }
  }

  currentStatus = 'Creating ZIP...';
  progressEmitter.emit('update');

  const archivePath = `uploads/${req.file.filename}_converted.zip`;
  const output = fs.createWriteStream(archivePath);
  const archive = archiver('zip');

  archive.pipe(output);
  archive.directory(outputDir, false);
  archive.finalize();

  output.on('close', () => {
    currentStatus = 'Done';
    progressEmitter.emit('update');
    res.download(archivePath, 'converted_webp.zip');
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
