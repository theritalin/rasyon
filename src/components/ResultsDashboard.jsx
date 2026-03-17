import React from 'react';

const ResultsDashboard = ({ requirements, totals, targetGcaa, estimatedGcaa, theoryMeta, selectedTheory }) => {
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

  const MetricBlock = ({ label, provided, required, unit, isMax = false, decimals = 2 }) => {
    const status = getStatusClass(provided, required, isMax);
    const percent = required > 0 ? Math.min(100, (provided / required) * 100) : 0;
    
    return (
      <div className={`metric-card ${status}`}>
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {provided.toFixed(decimals)} <span className="metric-unit">/ {required.toFixed(decimals)} {unit}</span>
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
        <span>📊</span> Rasyon Analizi
        <span className="theory-badge">{theoryMeta.flag} {theoryMeta.name}</span>
      </h2>

      <div className="metrics-grid">
        <MetricBlock 
          label={theoryMeta.energyLabel}
          provided={totals.energy} 
          required={requirements.energy} 
          unit={theoryMeta.energyUnit} 
        />
        <MetricBlock 
          label={theoryMeta.proteinLabel}
          provided={totals.protein} 
          required={requirements.protein} 
          unit={theoryMeta.proteinUnit}
          decimals={selectedTheory === 'nrc' ? 2 : 0}
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
          required={totals.dm * 0.45}
          unit="kg" 
          isMax={true}
        />
      </div>

      {/* INRA: PDIE/PDIN breakdown */}
      {selectedTheory === 'inra' && totals.pdie !== undefined && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <strong>PDI Detay:</strong> PDIE (enerji bazlı) = {totals.pdie.toFixed(0)}g | PDIN (azot bazlı) = {totals.pdin.toFixed(0)}g
          → Sınırlayıcı: <strong>{totals.pdie <= totals.pdin ? 'PDIE (enerji yetersiz)' : 'PDIN (azot yetersiz)'}</strong>
        </div>
      )}

      {/* CNCPS-specific metrics */}
      {selectedTheory === 'cncps' && totals.syncScore !== undefined && (
        <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className={`metric-card ${totals.syncScore >= 70 ? 'success' : totals.syncScore >= 40 ? 'warning' : 'danger'}`}>
            <div className="metric-label">Senkronizasyon Skoru</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              %{totals.syncScore.toFixed(0)}
            </div>
            <div className="metric-sub" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Enerji-Protein Eşzamanlılığı
            </div>
          </div>
          <div className="metric-card info">
            <div className="metric-label">Ort. Sindirim Hızı (kd)</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              %{(totals.avgKd || 0).toFixed(1)} <span className="metric-unit">/saat</span>
            </div>
          </div>
          <div className="metric-card info">
            <div className="metric-label">Ort. NDF Sindirebilirlik</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              %{(totals.avgNdfd || 0).toFixed(1)}
            </div>
          </div>
        </div>
      )}

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
          <strong>Tahmini GCAA ({theoryMeta.name}):</strong> Mevcut rasyon ile hayvanın günlük tahmini canlı ağırlık artışı <strong>{estimatedGcaa.toFixed(2)} kg</strong> olarak hesaplanmıştır.
        </div>
        <div style={{fontSize: '0.85rem', opacity: 0.8, marginTop: '0.4rem'}}>(Hedef: {targetGcaa} kg)</div>
      </div>

      {totals.energy < requirements.energy * 0.9 && (
        <div className="alert alert-warning">
          <strong>Enerji Yetersiz:</strong> Rasyonunuzdaki {theoryMeta.energyLabel.toLowerCase()} hedef GCAA için yetersiz kalıyor.
        </div>
      )}
      
      {totals.protein < requirements.protein * 0.9 && (
        <div className="alert alert-warning">
          <strong>Protein Yetersiz:</strong> Rasyonunuzdaki {theoryMeta.proteinLabel.toLowerCase()} miktarı hedef GCAA için yeterli değil. Soya veya pamuk tohumu küspesi eklemeyi düşünebilirsiniz.
        </div>
      )}

      {totals.fiber < requirements.minFiber && (
        <div className="alert alert-danger">
          <strong>Kaba Yem Yetersiz:</strong> Rasyonda yeterli selüloz/lif bulunmuyor. İşkembe sağlığı için saman, yonca veya silaj oranını artırın.
        </div>
      )}

      {selectedTheory === 'cncps' && totals.syncScore !== undefined && totals.syncScore < 40 && (
        <div className="alert alert-warning">
          <strong>Düşük Senkronizasyon:</strong> Rasyondaki yemlerin sindirim hızları (kd) çok farklı. Enerji ve protein işkembede eşzamanlı çözülemeyebilir, bu protein kayıplarına yol açabilir.
        </div>
      )}

      {totals.energy >= requirements.energy && totals.protein >= requirements.protein && totals.fiber >= requirements.minFiber && (
        <div className="alert alert-success">
          <strong>Rasyon Dengeli ({theoryMeta.name}):</strong> Tebrikler, rasyonunuz hayvanın yaşama ve hedef GCAA payı gereksinimlerini karşılıyor.
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
