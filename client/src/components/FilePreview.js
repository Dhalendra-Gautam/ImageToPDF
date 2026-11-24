import React, { useState } from 'react';
import './FilePreview.css';

const FilePreview = ({ files, onRemove, onImageRotationChange, onReorder, onImageClick }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (index, e) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (index, e) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Move the dragged item to the drop position
    const newFiles = [...files];
    const [removed] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, removed);

    onReorder(newFiles);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="preview-list-section">
      <h3>Drag images to reorder • Click rotation buttons to rotate pages</h3>
      <div className="preview-grid">
        {files.map((file, index) => (
          <div
            key={index}
            className={`preview-card ${file.rotation !== 0 ? 'rotated' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(index, e)}
            onDragOver={(e) => handleDragOver(index, e)}
            onDrop={(e) => handleDrop(index, e)}
            onDragEnd={handleDragEnd}
          >
            <div
              className="thumbnail-container"
              onClick={onImageClick ? (e) => { e.stopPropagation(); onImageClick(file); } : undefined}
            >
              <img
                src={file.preview}
                alt={file.name}
                className="preview-image"
                style={{ transform: `rotate(${(file.rotation || 0)}deg)` }}
                onLoad={(e) => {
                  e.target.classList.remove('load-error');
                }}
                onError={(e) => {
                  e.target.classList.add('load-error');
                }}
              />
              <span className="file-index">{index + 1}</span>
            </div>

            <div className="file-info">
              <div className="file-name">
                <span>{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>

              <div className="action-buttons">
                <span className="rotation-display">Rotation: {file.rotation || 0}°</span>
                <div className="rotation-controls">
                  <button
                    className="rotation-btn"
                    onClick={(e) => { e.stopPropagation(); onImageRotationChange(index, ((file.rotation || 0) + 90) % 360); }}
                    title="Rotate 90° CW"
                  >
                    ↻
                  </button>
                  <button
                    className="rotation-btn"
                    onClick={(e) => { e.stopPropagation(); onImageRotationChange(index, ((file.rotation || 0) - 90 + 360) % 360); }}
                    title="Rotate 90° CCW"
                  >
                    ↺
                  </button>
                  <button
                    className="action-btn remove-btn"
                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilePreview;