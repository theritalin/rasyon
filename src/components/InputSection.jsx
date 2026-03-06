import React from 'react';

const InputSection = ({ weight, setWeight, targetGcaa, setTargetGcaa }) => {
  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        <span>🐄</span> Hayvan Bilgileri
      </h2>
      
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
