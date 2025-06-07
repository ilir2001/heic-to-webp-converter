const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs');             // ✅ stream methods
const fsp = require('fs/promises');   // ✅ promise-based methods
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const heicConvert = require('heic-convert');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

let currentStatus = 'Idle';

app.get('/progress', (req, res) => {
  res.json({ status: currentStatus });
});

app.post('/upload', upload.single('zipfile'), async (req, res) => {
  currentStatus = 'Extracting ZIP...';

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
    const inputPath = path.join(extractDir, file);
    const name = path.basename(file, '.heic');

    // Add this around line 48 in index.js, inside the for loop
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
      // You could update status to show errors too
      currentStatus = `Error converting ${file}: ${error.message}`;
    }
  }

  currentStatus = 'Creating ZIP...';

  const archivePath = `uploads/${req.file.filename}_converted.zip`;
  const output = fs.createWriteStream(archivePath);
  const archive = archiver('zip');

  archive.pipe(output);
  archive.directory(outputDir, false);
  archive.finalize();

  output.on('close', () => {
    currentStatus = 'Done';
    res.download(archivePath, 'converted_webp.zip');
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
