import React from 'react';
import { THEORY_META } from '../utils/theories';

const InputSection = ({ weight, setWeight, targetGcaa, setTargetGcaa, selectedTheory, setSelectedTheory }) => {
  const theories = Object.values(THEORY_META);
  const currentTheory = THEORY_META[selectedTheory];

  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        <span>🐄</span> Hayvan Bilgileri
      </h2>

      {/* Theory Selector */}
      <div className="form-group">
        <label>Hesaplama Teorisi</label>
        <div className="theory-selector">
          {theories.map(t => (
            <button
              key={t.id}
              className={`theory-btn ${selectedTheory === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTheory(t.id)}
            >
              <span className="theory-flag">{t.flag}</span>
              <span className="theory-name">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="theory-description">
          <span className="theory-desc-icon">{currentTheory.flag}</span>
          <span>{currentTheory.subtitle}</span>
        </div>
      </div>
      
      <div className="form-group">
        <label>Canlı Ağırlık (kg)</label>
        <input 
          type="number" 
          value={weight} 
          onChange={e => setWeight(Number(e.target.value))} 
          min="50" 
          max="1500" 
          step="50" 
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Hedef Günlük Canlı Ağırlık Artışı (GCAA) (kg)</label>
        <input 
          type="number" 
          value={targetGcaa} 
          onChange={e => setTargetGcaa(Number(e.target.value))} 
          min="0" 
          max="3" 
          step="0.1" 
        />
      </div>
    </div>
  );
};

export default InputSection;
