import React from 'react';
import './Options.css';

const Options = ({ options, onChange, apiOptions }) => {
  return (
    <section className="options-section">
      <h3>Conversion Options</h3>

      <div className="option-group">
        <label>Margins:</label>
        <div className="radio-options">
          {['small', 'none', 'big'].map((value) => (
            <label
              key={value}
              className={`radio-option ${options.margins === value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="margins"
                value={value}
                checked={options.margins === value}
                onChange={() => onChange('margins', value)}
              />
              <span className="option-label">
                {value === '' ? 'None' : value}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>Paper Size:</label>
        <div className="radio-options">
          {['free', 'A4'].map((value) => (
            <label
              key={value}
              className={`radio-option ${options.paperSize === value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="paperSize"
                value={value}
                checked={options.paperSize === value}
                onChange={() => onChange('paperSize', value)}
              />
              <span className="option-label">
                {value === 'free' ? 'Free (Image Size)' : 'A4'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>Orientation:</label>
        <div className="radio-options">
          {['auto', 'portrait', 'landscape'].map((value) => (
            <label
              key={value}
              className={`radio-option ${options.orientation === value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="orientation"
                value={value}
                checked={options.orientation === value}
                onChange={() => onChange('orientation', value)}
              />
              <span className="option-label">
                {value === 'auto' ? 'Auto Detect' :
                 value === 'portrait' ? 'Portrait' :
                 value === 'landscape' ? 'Landscape' : value}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>Page Rotation: {options.rotation}°</label>
        <select
          value={options.rotation}
          onChange={(e) => onChange('rotation', parseInt(e.target.value))}
          className="rotation-select"
        >
          <option value={0}>0° (No rotation)</option>
          <option value={90}>90° (Rotate CW)</option>
          <option value={180}>180° (Upside Down)</option>
          <option value={270}>270° (Rotate CCW)</option>
        </select>
      </div>
    </section>
  );
};

export default Options;