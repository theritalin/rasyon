import React, { useState } from 'react';
import { convertToDM } from '../utils/calculations';

const RationBuilder = ({ feedsDb, rationItems, onAdd, onUpdateAmount, onRemove, onClear, totals, theoryMeta, selectedTheory }) => {
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (!selectedFeedId || !amount || Number(amount) <= 0) return;
    onAdd(Number(selectedFeedId), Number(amount));
    setAmount('');
  };

  const getEnergyValue = (feed, dmKg) => {
    switch (selectedTheory) {
      case 'inra':
        return dmKg * (feed.ufb || 0);
      case 'cncps': {
        const ndfd = feed.ndfd || 45;
        const ndfdCorrection = 1 + (ndfd - 45) * 0.002;
        return dmKg * feed.me * ndfdCorrection;
      }
      default:
        return dmKg * feed.me;
    }
  };

  const getProteinValue = (feed, dmKg) => {
    switch (selectedTheory) {
      case 'inra': {
        // Per-row: min(PDIE, PDIN) contribution for display
        // (actual ration total uses ration-level min)
        const pdie = dmKg * (feed.pdie || 0);
        const pdin = dmKg * (feed.pdin || 0);
        return Math.min(pdie, pdin);
      }
      case 'cncps': {
        const kd = feed.kd || 8;
        const kp = feed.type === 'kesif' ? 5 : 3.5;
        const cpGrams = dmKg * (feed.cp / 100) * 1000;
        const rdpFraction = 0.20 + 0.65 * (kd / (kd + kp));
        const rupFraction = 0.65 * (kp / (kd + kp));
        const rdp = cpGrams * rdpFraction;
        const rup = cpGrams * rupFraction;
        const mpFromMicrobes = rdp * 0.85 * 0.64;
        const mpFromRup = rup * 0.80;
        return mpFromMicrobes + mpFromRup;
      }
      default:
        return dmKg * (feed.cp / 100);
    }
  };

  const formatProtein = (val) => {
    if (selectedTheory === 'nrc') return val.toFixed(2);
    return val.toFixed(0);
  };

  return (
    <div className="glass-panel">
      <div className="flex-between mb-4">
        <h2 className="panel-title" style={{ margin: 0, padding: 0, border: 'none' }}>
          <span>⚖️</span> Rasyon Oluşturucu
          <span className="theory-badge-sm">{theoryMeta.flag}</span>
        </h2>
        {rationItems.length > 0 && (
          <button className="btn-danger" onClick={onClear} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Rasyonu Temizle
          </button>
        )}
      </div>

      <div className="form-row mb-4">
        <div>
          <label className="mb-2" style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Yem Seç</label>
          <select 
            value={selectedFeedId} 
            onChange={e => setSelectedFeedId(e.target.value)}
          >
            <option value="" disabled>-- Yem Kaynağı Seçin --</option>
            {feedsDb.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.type === 'kaba' ? 'Kaba' : 'Kesif'})</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="mb-2" style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Miktar (kg)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              min="0.1" 
              step="0.1" 
              placeholder="0.0" 
            />
          </div>
          <button className="btn-primary" onClick={handleAdd}>Ekle</button>
        </div>
      </div>

      <div className="table-container mt-4">
        <table>
          <thead>
            <tr>
              <th>Yem Adı</th>
              <th>Miktar (kg)</th>
              <th>KM (kg)</th>
              <th>{theoryMeta.energyLabel.split('(')[0].trim()} ({theoryMeta.energyUnit})</th>
              <th>{theoryMeta.proteinLabel.split('(')[0].trim()} ({theoryMeta.proteinUnit})</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rationItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Henüz rasyona yem eklenmedi.
                </td>
              </tr>
            ) : (
              rationItems.map(item => {
                const feed = feedsDb.find(f => f.id === item.feedId);
                if (!feed) return null;
                const km = convertToDM(item.amount, feed.dm);
                const energyVal = getEnergyValue(feed, km);
                const proteinVal = getProteinValue(feed, km);
                
                return (
                  <tr key={item.id}>
                    <td>{feed.name}</td>
                    <td>
                      <input 
                        type="number" 
                        value={item.amount} 
                        onChange={e => onUpdateAmount(item.id, Number(e.target.value))} 
                        min="0" 
                        step="0.1"
                        style={{ width: '80px', padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }} 
                      />
                    </td>
                    <td>{km.toFixed(2)}</td>
                    <td>{energyVal.toFixed(2)}</td>
                    <td>{formatProtein(proteinVal)}</td>
                    <td>
                      <button className="btn-danger" onClick={() => onRemove(item.id)}>Kaldır</button>
                    </td>
                  </tr>
                );
              })
            )}
            {rationItems.length > 0 && (
              <tr style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: 'bold' }}>
                <td>TOPLAM</td>
                <td>{totals.asFed.toFixed(2)} kg</td>
                <td>{totals.dm.toFixed(2)} kg</td>
                <td>{totals.energy.toFixed(2)}</td>
                <td>{formatProtein(totals.protein)}</td>
                <td>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RationBuilder;
