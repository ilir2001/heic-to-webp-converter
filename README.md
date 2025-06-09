A web application that allows users to easily convert HEIC images to the WebP format. Upload a ZIP file containing HEIC images, and receive a ZIP file with the converted WebP images.

## Features

- Simple and intuitive web interface
- Batch conversion of multiple HEIC images
- Real-time progress tracking using Server-Sent Events (SSE)
- Automatic ZIP file handling for input and output
- High-quality WebP conversion with optimized settings
- Error handling for failed conversions

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/heic-to-webp-converter.git
   cd heic-to-webp-converter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node index.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Open the application in your browser
2. Click on the drop area or "browse" to select a ZIP file containing HEIC images
3. Click "Convert Images" to start the conversion process
4. Monitor the progress as your images are converted
5. Once complete, the converted WebP images will be automatically downloaded as a ZIP file

## How It Works

1. The application extracts the uploaded ZIP file
2. It identifies all HEIC images in the extracted directory
3. Each HEIC image is converted to JPEG using the heic-convert library
4. The JPEG is then converted to WebP format using Sharp
5. All WebP images are compressed into a new ZIP file
6. The resulting ZIP file is sent back to the user

## Technologies Used

- [Express.js](https://expressjs.com/) - Web server framework
- [Multer](https://github.com/expressjs/multer) - File upload handling
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [heic-convert](https://github.com/catdad-experiments/heic-convert) - HEIC conversion
- [Archiver](https://github.com/archiverjs/node-archiver) - ZIP file creation
- [Unzipper](https://github.com/ZJONSSON/node-unzipper) - ZIP file extraction
- [TailwindCSS](https://tailwindcss.com/) - Frontend styling

## Requirements

- Node.js 14.x or higher

## License

This project is licensed under the ISC License - see the package.json file for details.