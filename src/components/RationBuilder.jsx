import { useState } from 'react';
import { convertToDM, toNum } from '../utils/calculations';
import { getFeedContribution } from '../utils/theories';
import NumberField from './NumberField';

const RationBuilder = ({ feedsDb, rationItems, onAdd, onUpdateAmount, onUpdateFeedPrice, onRemove, onClear, totals, totalCost, theoryMeta, selectedTheory }) => {
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [amount, setAmount] = useState('');

  const canAdd = selectedFeedId !== '' && toNum(amount) > 0;
  const proteinDecimals = selectedTheory === 'nrc' ? 2 : 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(Number(selectedFeedId), toNum(amount));
    setAmount('');
    setSelectedFeedId('');
  };

  const feedGroups = [
    { label: 'Kaba Yemler', feeds: feedsDb.filter(f => f.type === 'kaba') },
    { label: 'Kesif Yemler', feeds: feedsDb.filter(f => f.type !== 'kaba') },
  ];

  const proteinStats = (c) => selectedTheory === 'inra'
    ? [
        { label: 'PDIE (g)', value: c.pdie.toFixed(0) },
        { label: 'PDIN (g)', value: c.pdin.toFixed(0) },
      ]
    : [{ label: `Protein (${theoryMeta.proteinUnit})`, value: c.protein.toFixed(proteinDecimals) }];

  const energyLabel = `Enerji (${theoryMeta.energyUnit})`;

  return (
    <section className="panel panel-builder" aria-labelledby="rasyon-baslik">
      <div className="panel-head">
        <h2 className="panel-title" id="rasyon-baslik">Rasyon</h2>
        {rationItems.length > 0 && (
          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={onClear}>Rasyonu Temizle</button>
        )}
      </div>

      <div className="add-form">
        <div className="field add-feed">
          <label htmlFor="feed-select">Yem</label>
          <select id="feed-select" value={selectedFeedId} onChange={e => setSelectedFeedId(e.target.value)}>
            <option value="" disabled>Yem seçin…</option>
            {feedGroups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.feeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="add-amount">
          <NumberField label="Miktar" unit="kg" value={amount} onChange={setAmount} step={0.5} placeholder="0" onEnter={handleAdd} />
        </div>
        <button type="button" className="btn btn-primary add-btn" onClick={handleAdd} disabled={!canAdd}>Ekle</button>
      </div>

      {rationItems.length === 0 ? (
        <p className="empty">Henüz rasyona yem eklenmedi. Yukarıdan bir yem ve günlük miktarını seçin.</p>
      ) : (
        <>
          <ul className="ration-list">
            {rationItems.map(item => {
              const feed = feedsDb.find(f => f.id === item.feedId);
              if (!feed) return null;
              const km = convertToDM(item.amount, feed.dm);
              const c = getFeedContribution(selectedTheory, feed, km);
              const cost = toNum(item.amount) * toNum(feed.price);
              const stats = [
                { label: 'KM (kg)', value: km.toFixed(2) },
                { label: energyLabel, value: c.energy.toFixed(2) },
                ...proteinStats(c),
                { label: 'Maliyet (₺)', value: cost.toFixed(2) },
              ];

              return (
                <li key={item.id} className="ration-item">
                  <div className="ration-item-head">
                    <span className="ration-item-name">{feed.name}</span>
                    <span className={`tag tag-${feed.type}`}>{feed.type === 'kaba' ? 'Kaba' : 'Kesif'}</span>
                    <button type="button" className="icon-btn" onClick={() => onRemove(item.id)} aria-label={`${feed.name} yemini rasyondan kaldır`}>
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                  <div className="ration-item-body">
                    <div className="ration-item-inputs">
                      <NumberField label="Miktar" unit="kg" value={item.amount} onChange={val => onUpdateAmount(item.id, val)} step={0.5} />
                      <NumberField label="Fiyat" unit="₺/kg" value={feed.price ?? ''} onChange={val => onUpdateFeedPrice(feed.id, val)} placeholder="0" />
                    </div>
                    <dl className="stats">
                      {stats.map(s => (
                        <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                      ))}
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="ration-total">
            <span className="ration-total-title">Günlük Toplam</span>
            <dl className="stats">
              <div><dt>Yem (kg)</dt><dd>{totals.asFed.toFixed(2)}</dd></div>
              <div><dt>KM (kg)</dt><dd>{totals.dm.toFixed(2)}</dd></div>
              <div><dt>{energyLabel}</dt><dd>{totals.energy.toFixed(2)}</dd></div>
              <div>
                <dt>{selectedTheory === 'inra' ? 'PDI (g)' : `Protein (${theoryMeta.proteinUnit})`}</dt>
                <dd>{totals.protein.toFixed(proteinDecimals)}</dd>
              </div>
              <div><dt>Maliyet (₺)</dt><dd>{totalCost.toFixed(2)}</dd></div>
            </dl>
          </div>
        </>
      )}
    </section>
  );
};

export default RationBuilder;
