import React from 'react';

const ResultsDashboard = ({ requirements, totals, targetGcaa, estimatedGcaa }) => {
  const getStatusClass = (provided, required, isMax = false) => {
    if (required === 0) return 'info';
    const ratio = provided / required;
    if (isMax) {
      if (ratio > 1.2) return 'danger';
      if (ratio > 1.0) return 'warning';
      return 'success';
    } else {
      if (ratio < 0.8) return 'danger';
      if (ratio < 0.95) return 'warning';
      return 'success';
    }
  };

  const MetricBlock = ({ label, provided, required, unit, isMax = false }) => {
    const status = getStatusClass(provided, required, isMax);
    const percent = required > 0 ? Math.min(100, (provided / required) * 100) : 0;
    
    return (
      <div className={`metric-card ${status}`}>
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {provided.toFixed(2)} <span className="metric-unit">/ {required.toFixed(2)} {unit}</span>
        </div>
        <div className="progress-bg">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${percent}%`, 
              backgroundColor: status === 'danger' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--success)' 
            }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        <span>📊</span> Rasyon Analizi ve Sonuçlar
      </h2>

      <div className="metrics-grid">
        <MetricBlock 
          label="Metabolik Enerji (ME)" 
          provided={totals.me} 
          required={requirements.me} 
          unit="Mcal" 
        />
        <MetricBlock 
          label="Ham Protein (HP)" 
          provided={totals.cp} 
          required={requirements.cp} 
          unit="kg" 
        />
        <MetricBlock 
          label="Lif / Selüloz" 
          provided={totals.fiber} 
          required={requirements.minFiber} 
          unit="kg" 
        />
        <MetricBlock 
          label="Karbonhidrat/Nişasta" 
          provided={totals.cb} 
          required={totals.dm * 0.45} // Recommend ~45% of DM as NFC max
          unit="kg" 
          isMax={true}
        />
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="metric-card info">
          <div className="metric-label">Enerji Kaynak Dağılımı</div>
          <div className="metric-value" style={{ fontSize: '1.25rem' }}>
            Karbonhidrat: %{totals.energyPercentCarbs.toFixed(1)}
          </div>
          <div className="metric-sub" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Protein: %{totals.energyPercentProtein.toFixed(1)}
          </div>
        </div>
        
        <div className={`metric-card ${totals.recommendedSoda > 0 ? 'warning' : 'success'}`}>
          <div className="metric-label">Asidoz Riski & Sodyum Bikarbonat (Soda)</div>
          <div className="metric-value" style={{ fontSize: '1.25rem' }}>
            {totals.recommendedSoda > 0 ? `${totals.recommendedSoda.toFixed(0)} gr / Gün` : 'Gerekmiyor'}
          </div>
          <div className="metric-sub">
            Kesif Yem Oranı: %{totals.kesifRatio.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <div>
          <strong>Tahmini GCAA:</strong> Mevcut rasyon ile hayvanın günlük tahmini canlı ağırlık artışı <strong>{estimatedGcaa.toFixed(2)} kg</strong> olarak hesaplanmıştır.
        </div>
        <div style={{fontSize: '0.85rem', opacity: 0.8, marginTop: '0.4rem'}}>(Hedef: {targetGcaa} kg)</div>
      </div>

      {totals.me < requirements.me * 0.9 && (
        <div className="alert alert-warning">
          <strong>Enerji Yetersiz:</strong> Rasyonunuzdaki enerji hedef GCAA için yetersiz kalıyor.
        </div>
      )}
      
      {totals.cp < requirements.cp * 0.9 && (
        <div className="alert alert-warning">
          <strong>Protein Yetersiz:</strong> Rasyonunuzdaki protein miktarı hedef GCAA için yeterli değil. Soya veya pamuk tohumu küspesi eklemeyi düşünebilirsiniz.
        </div>
      )}

      {totals.fiber < requirements.minFiber && (
        <div className="alert alert-danger">
          <strong>Kaba Yem Yetersiz:</strong> Rasyonda yeterli selüloz/lif bulunmuyor. İşkembe sağlığı için saman, yonca veya silaj oranını artırın.
        </div>
      )}

      {totals.me >= requirements.me && totals.cp >= requirements.cp && totals.fiber >= requirements.minFiber && (
        <div className="alert alert-success">
          <strong>Rasyon Dengeli:</strong> Tebrikler, rasyonunuz hayvanın yaşama ve hedef GCAA payı gereksinimlerini karşılıyor.
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
