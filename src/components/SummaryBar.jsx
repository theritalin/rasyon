import { getStatus } from '../utils/status';

// Mobilde ekranın altına sabitlenen özet: yem eklerken analiz görünür kalır.
const SummaryBar = ({ requirements, totals, totalCost, theoryMeta }) => {
  const items = [
    { label: 'Enerji', status: getStatus(totals.energy, requirements.energy) },
    { label: 'Protein', status: getStatus(totals.protein, requirements.protein) },
    { label: 'KM', status: getStatus(totals.dm, requirements.targetDM, 'range') },
  ];

  return (
    <a className="summary-bar" href="#analiz" aria-label={`Rasyon analizi özeti (${theoryMeta.name}). Ayrıntı için dokunun.`}>
      {items.map(({ label, status }) => (
        <div key={label} className={`summary-item ${status.level}`}>
          <span className="summary-label">{label}</span>
          <span className="summary-value">%{status.percent.toFixed(0)}</span>
          <span className="progress"><span className="progress-fill" style={{ width: `${Math.min(100, status.percent)}%` }} /></span>
        </div>
      ))}
      <div className="summary-item summary-cost">
        <span className="summary-label">Maliyet</span>
        <span className="summary-value">{totalCost.toFixed(0)} ₺</span>
        <span className="summary-more">Analiz ›</span>
      </div>
    </a>
  );
};

export default SummaryBar;
