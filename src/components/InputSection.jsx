import React from 'react';
import { THEORY_META } from '../utils/theories';

const InputSection = ({ 
  weight, setWeight, 
  targetGcaa, setTargetGcaa, 
  animalType, setAnimalType,
  milkYield, setMilkYield,
  milkFat, setMilkFat,
  pregnancyPeriod, setPregnancyPeriod,
  selectedTheory, setSelectedTheory 
}) => {
  const theories = Object.values(THEORY_META);
  const currentTheory = THEORY_META[selectedTheory];

  const animalTypes = [
    { id: 'besi', label: 'Erkek Besi' },
    { id: 'bos_duve', label: 'Boş Düve / İnek' },
    { id: 'sagmal', label: 'Sağmal İnek' },
    { id: 'gebe_sagmal', label: 'Gebe Sağmal İnek' },
    { id: 'kuru_gebe', label: 'Kuru Gebe İnek' }
  ];

  const getMaintenanceInfo = () => {
    const w = Number(weight) || 0;
    if (w <= 0) return null;
    
    if (selectedTheory === 'inra') {
      const ufbM = 1.4 + (0.006 * w);
      return `${ufbM.toFixed(2)} UFB`;
    } else {
      const meM = w * 0.035;
      return `${meM.toFixed(2)} Mcal ME`;
    }
  };

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
      
      {/* Animal Type Selector */}
      <div className="form-group">
        <label>Hayvan Tipi ve Durumu</label>
        <select 
          value={animalType} 
          onChange={(e) => setAnimalType(e.target.value)}
          className="animal-type-select"
          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', marginTop: '0.5rem' }}
        >
          {animalTypes.map(t => (
            <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Canlı Ağırlık (kg)</label>
        <input 
          type="text" 
          inputMode="decimal"
          value={weight} 
          onChange={e => {
            const val = e.target.value.replace(',', '.');
            if (val === '' || /^\d*\.?\d*$/.test(val)) setWeight(val);
          }} 
          min="50" 
          max="1500" 
          step="50" 
        />
        {Number(weight) > 0 && (
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.4rem' }}>
            <em>Yaşama Payı (Enerji): <strong>{getMaintenanceInfo()}</strong></em>
          </div>
        )}
      </div>

      {(animalType === 'besi' || animalType === 'bos_duve') && (
        <div className="form-group">
          <label>Hedef Günlük Canlı Ağırlık Artışı (GCAA) (kg)</label>
          <input 
            type="text" 
            inputMode="decimal"
            value={targetGcaa} 
            onChange={e => {
              const val = e.target.value.replace(',', '.');
              if (val === '' || /^\d*\.?\d*$/.test(val)) setTargetGcaa(val);
            }} 
            min="0" 
            max="3" 
            step="0.1" 
          />
        </div>
      )}

      {(animalType === 'sagmal' || animalType === 'gebe_sagmal') && (
        <>
          <div className="form-group">
            <label>Günlük Süt Verimi (Litre)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={milkYield} 
              onChange={e => {
                const val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) setMilkYield(val);
              }} 
            />
          </div>
          <div className="form-group">
            <label>Süt Yağ Oranı (%)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={milkFat} 
              onChange={e => {
                const val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) setMilkFat(val);
              }} 
            />
          </div>
        </>
      )}

      {(animalType === 'gebe_sagmal' || animalType === 'kuru_gebe') && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Gebelik Dönemi</label>
          <div className="theory-selector" style={{ marginTop: '0.5rem' }}>
            <button
              className={`theory-btn ${pregnancyPeriod === 'ilk_6_ay' ? 'active' : ''}`}
              onClick={() => setPregnancyPeriod('ilk_6_ay')}
            >
              <span className="theory-name">İlk 6 Ay</span>
            </button>
            <button
              className={`theory-btn ${pregnancyPeriod === 'son_3_ay' ? 'active' : ''}`}
              onClick={() => setPregnancyPeriod('son_3_ay')}
            >
              <span className="theory-name">Son 3 Ay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputSection;
