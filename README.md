# Image to PDF Converter

A web application that converts multiple images to a single PDF file.

## Features

- 📷 **Multiple Image Support**: Upload 200+ images (JPG, PNG, screenshots)
- 🎨 **Customizable Options**:
  - Margins: Small (0.5"), None, Big (1")
  - Paper Size: Free (image size) or A4 preset
  - Page Rotation: 0°, 90°, 180°, 270°
  - Orientation: Auto, Portrait, Landscape
- 📂 **File Reordering**: Move files up/down to change PDF page order
- 📝 **Rename PDF**: Customize the output filename before download
- 📱 **Responsive Design**: Works on desktop and mobile

## Project Structure

```
imagestopdf/
├── server/           # Express backend
│   ├── server.js     # Main server with PDF conversion API
│   └── package.json  # Server dependencies
├── client/           # React frontend
│   ├── public/       # Static files (index.html, favicon)
│   ├── src/          # React components and styles
│   └── package.json  # Client dependencies
├── Dockerfile        # Multi-stage build for production
├── docker-compose.yml # Docker Compose configuration
├── .env.example      # Environment variables template
├── .gitignore
├── package.json      # Root package for running both client and server
└── README.md         # This file
```

## Installation

### Install all dependencies

```bash
npm run install-all
```

This installs dependencies for both the server and client.

## Running the Application

### Start both server and client (Development)

```bash
npm start
```

- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

The frontend proxies API requests to the server automatically.

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/convert

Converts uploaded images to a PDF file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Multiple image files in the `images` field
- Optional body fields:
  - `margins`: 'small' | 'none' | 'big' (default: 'small')
  - `paperSize`: 'free' | 'A4' (default: 'free')
  - `rotation`: 0 | 90 | 180 | 270 (default: 0)
  - `orientation`: 'auto' | 'portrait' | 'landscape' (default: 'auto')
  - `filename`: string (default: 'images.pdf')

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="{filename}"`

### GET /api/options

Returns available conversion options.

**Response:**
```json
{
  "margins": ["small", "none", "big"],
  "paperSizes": ["free", "A4"],
  "rotations": [0, 90, 180, 270],
  "orientations": ["auto", "portrait", "landscape"]
}
```

## Usage

1. Open http://localhost:3000 in your browser
2. Click the upload area or drag images
3. Select conversion options
4. Rename your PDF (optional)
5. Click "Convert to PDF"
6. Download the generated file

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Node environment | production |
| MAX_FILE_SIZE | Max file size in bytes | 20971520 (20MB) |
| MAX_IMAGES | Max images per conversion | 200 |

## License

ISC