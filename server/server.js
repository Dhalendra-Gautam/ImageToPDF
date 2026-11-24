const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration
const corsOptions = {
  origin: [
    'https://images-to-pdf-free.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads - increased to 200 files
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit per file
    files: 200 // Max 200 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, BMP, and TIFF are allowed.'), false);
    }
  }
});

// Main conversion function
async function processImageToPdfPages(files, options) {
  const { margins = 'small', paperSize = 'free', rotation = 0, orientation = 'auto', filename = 'images.pdf', imageRotations = [] } = options;

  // Margin sizes in points (1 inch = 72 points)
  // Fixed: properly handle 'none' margin with 0 value
  const marginSizes = {
    small: 36,   // 0.5 inch
    none: 0,
    big: 72      // 1 inch
  };

  // A4 dimensions in points
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;

  const margin = marginSizes[margins] !== undefined ? marginSizes[margins] : marginSizes.small;

  // Create PDF document
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageBuffer = file.buffer;
    const mimetype = file.mimetype;
    // Use per-image rotation if provided, otherwise use global rotation
    const imgRotation = imageRotations[i] !== undefined ? imageRotations[i] : rotation;

    // Get image dimensions using sharp
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // Embed image based on type using pdf-lib
    let image;
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else if (mimetype === 'image/png') {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (mimetype === 'image/webp') {
      image = await pdfDoc.embedWebp(imageBuffer);
    } else if (mimetype === 'image/gif') {
      image = await pdfDoc.embedGif(imageBuffer);
    } else if (mimetype === 'image/bmp') {
      image = await pdfDoc.embedBmp(imageBuffer);
    } else if (mimetype === 'image/tiff') {
      image = await pdfDoc.embedTiff(imageBuffer);
    } else {
      throw new Error(`Unsupported image type: ${mimetype}`);
    }

    // Determine page dimensions based on options
    let pageWidth = imgWidth;
    let pageHeight = imgHeight;

    if (paperSize === 'A4') {
      pageWidth = A4_WIDTH;
      pageHeight = A4_HEIGHT;

      if (orientation === 'landscape') {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
      } else if (orientation === 'auto') {
        if (imgWidth > imgHeight) {
          [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
      }
    }

    // Handle per-image rotation
    let applyRotation = 0;
    let finalImgWidth = imgWidth;
    let finalImgHeight = imgHeight;

    if (imgRotation !== 0) {
      // Apply per-image rotation
      applyRotation = imgRotation;
      [finalImgWidth, finalImgHeight] = [imgHeight, imgWidth];
    } else if (rotation !== 0) {
      // Apply global rotation
      applyRotation = rotation;
      [finalImgWidth, finalImgHeight] = [imgHeight, imgWidth];
    } else if (orientation === 'portrait') {
      if (imgWidth > imgHeight) {
        applyRotation = 270;
        [finalImgWidth, finalImgHeight] = [imgHeight, imgWidth];
      }
    } else if (orientation === 'landscape') {
      if (imgWidth < imgHeight) {
        applyRotation = 90;
        [finalImgWidth, finalImgHeight] = [imgHeight, imgWidth];
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Fixed: When margin is 0, use image dimensions directly
    if (margin > 0) {
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);

      const scaleX = availableWidth / finalImgWidth;
      const scaleY = availableHeight / finalImgHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = finalImgWidth * scale;
      const scaledHeight = finalImgHeight * scale;

      const centerX = (pageWidth - scaledWidth) / 2;
      const centerY = (pageHeight - scaledHeight) / 2;

      page.drawImage(image, {
        x: centerX,
        y: centerY,
        width: scaledWidth,
        height: scaledHeight
      });
    } else {
      // No margin - draw image at full size, centered
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
    }
  }

  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes,
    pageCount: files.length
  };
}

app.post('/api/convert', upload.array('images', 200), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Get filename from request body, default to 'images.pdf'
    const filename = req.body.filename || 'images.pdf';
    // Sanitize filename to prevent path traversal
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '') || 'images.pdf';

    // Parse image rotations array (JSON string)
    let imageRotations = [];
    if (req.body.imageRotations) {
      try {
        imageRotations = JSON.parse(req.body.imageRotations);
      } catch (e) {
        imageRotations = [];
      }
    }

    const options = {
      margins: req.body.margins || 'small',
      paperSize: req.body.paperSize || 'free',
      rotation: parseInt(req.body.rotation) || 0,
      orientation: req.body.orientation || 'auto',
      filename: safeFilename,
      imageRotations: imageRotations
    };

    console.log('Conversion options:', options);
    console.log('Files to process:', req.files.length);

    const result = await processImageToPdfPages(req.files, options);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': result.pdfBytes.length
    });

    res.send(Buffer.from(result.pdfBytes));

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/options', (req, res) => {
  res.json({
    margins: ['small', 'none', 'big'],
    paperSizes: ['free', 'A4'],
    rotations: [0, 90, 180, 270],
    orientations: ['auto', 'portrait', 'landscape']
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;