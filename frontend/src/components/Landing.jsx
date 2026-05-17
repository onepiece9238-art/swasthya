import React from 'react';
import './Landing.css';

export default function Landing({ onEnter }) {
  return (
    <div className="landing-container">
      <div className="landing-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="glass-card">
        <div className="landing-logo">
          <i className="ti ti-heart-plus"></i>
        </div>
        <h1 className="landing-title">Swasthya Sahayak</h1>
        <p className="landing-subtitle">Offline AI Clinical Assistant for Indian PHCs</p>
        
        <div className="landing-features">
          <div className="feature-item">
            <i className="ti ti-brain feature-icon"></i>
            <div>
              <h3>Gemma 4 Edge AI</h3>
              <p>Powered by local LLM on Raspberry Pi</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="ti ti-microphone feature-icon"></i>
            <div>
              <h3>Voice Triage</h3>
              <p>Multilingual patient registration</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="ti ti-chart-arcs feature-icon" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}></i>
            <div>
              <h3>Epidemic Warning</h3>
              <p>Real-time symptom cluster detection</p>
            </div>
          </div>
        </div>
        
        <button className="landing-btn" onClick={onEnter}>
          <span>Start Triage</span>
          <i className="ti ti-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
