import React, { useState, useEffect, useCallback } from 'react';
import FilePreview from './components/FilePreview';
import Options from './components/Options';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState({
    margins: 'none',
    paperSize: 'free',
    rotation: 0,
    orientation: 'auto'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [apiOptions, setApiOptions] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pdfFilename, setPdfFilename] = useState('images.pdf');
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Fetch available options from API on mount
  useEffect(() => {
    fetch('/api/options')
      .then(res => res.json())
      .then(data => setApiOptions(data))
      .catch(err => console.error('Failed to fetch options:', err));
  }, []);

  const handleFileChange = useCallback((e) => {
    const uploadedFiles = Array.from(e.target.files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      preview: URL.createObjectURL(file),
      rotation: 0
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);

    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      preview: URL.createObjectURL(file),
      rotation: 0
    }));
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const removeFile = (index) => {
    const removedFile = files[index];
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
    setShowSuccess(false);
  };

  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setDownloadUrl(null);
    setShowSuccess(false);
  };

  const handleOptionChange = useCallback((name, value) => {
    setOptions(prev => ({ ...prev, [name]: value }));
    setShowSuccess(false);
  }, []);

  const handleImageRotationChange = (index, rotation) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = {
        ...newFiles[index],
        rotation: rotation
      };
      return newFiles;
    });
  };

  // Handle file reordering - move file from oldIndex to newIndex
  const handleReorder = (newFiles) => {
    setFiles(newFiles);
    setDownloadUrl(null);
    setShowSuccess(false);
  };

  // Open image enlarged view
  const openEnlargedView = (file) => {
    setEnlargedImage(file);
  };

  // Close enlarged view
  const closeEnlargedView = () => {
    setEnlargedImage(null);
  };

  // Cleanup function for URLs
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const processPdf = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setDownloadUrl(null);
    setShowSuccess(false);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file.file);
    });

    // Build per-image rotations array
    const rotationsArray = files.map(f => f.rotation || 0);

    formData.append('margins', options.margins);
    formData.append('paperSize', options.paperSize);
    formData.append('rotation', options.rotation);
    formData.append('orientation', options.orientation);
    formData.append('filename', pdfFilename);
    formData.append('imageRotations', JSON.stringify(rotationsArray));

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setShowSuccess(true);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Image to PDF Converter</h1>
        <p>Convert multiple images to PDF with customizable options</p>
        <div className="credit">
          <span>♥</span> by Dhalendra Gautam
        </div>
      </header>

      <main className="main">
        {/* Left Panel - Upload and Options */}
        <div className="left-panel">
          <section className="upload-section">
            <div
              className={`drop-zone ${files.length > 0 ? 'active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="file-input"
                id="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                <span className="upload-icon">📁</span>
                <p className="upload-text">Click to upload or drag images here</p>
                <p className="file-info">Supports JPG, PNG, screenshots (max 200 images, 20MB each)</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="file-count-section">
                <h3>Selected Files ({files.length})</h3>
                <button className="clear-btn" onClick={clearAllFiles}>
                  Clear All
                </button>
              </div>
            )}
          </section>

          <Options
            options={options}
            onChange={handleOptionChange}
            apiOptions={apiOptions}
          />

          <section className="action-section">
            <div className="filename-input">
              <label>Output Filename:</label>
              <input
                type="text"
                value={pdfFilename}
                onChange={(e) => setPdfFilename(e.target.value.replace(/\.pdf$/, '') + '.pdf')}
                placeholder="enter-filename.pdf"
              />
            </div>

            <button
              className="process-btn"
              onClick={processPdf}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Convert to PDF'
              )}
            </button>

            {showSuccess && downloadUrl && (
              <div className="success-message show">
                PDF created successfully!
              </div>
            )}

            {downloadUrl && (
              <a href={downloadUrl} download={pdfFilename} className="download-btn">
                Download PDF
              </a>
            )}
          </section>
        </div>

        {/* Right Panel - Image Previews */}
        <div className="right-panel">
          <FilePreview
            files={files}
            onRemove={removeFile}
            onImageRotationChange={handleImageRotationChange}
            onReorder={handleReorder}
            onImageClick={openEnlargedView}
          />
        </div>
      </main>

      {/* Modal for Enlarged Image */}
      {enlargedImage && (
        <div className="modal-overlay" onClick={closeEnlargedView}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeEnlargedView}>✕</button>
            <div className="modal-image-container">
              <img
                src={enlargedImage.preview}
                alt={enlargedImage.name}
                className="modal-image"
              />
            </div>
            <div className="modal-info">
              <p className="modal-filename">{enlargedImage.name}</p>
              <p className="modal-size">{(enlargedImage.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;