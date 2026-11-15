import { useEffect, useRef, useState } from 'react';
import { toNum } from '../utils/calculations';
import { feedNfc } from '../utils/theories';
import NumberField from './NumberField';

const NEW_FEED = {
  name: '', type: 'kesif', dm: '88', cp: '', me: '', fb: '', cb: '', nfc: '', price: '',
  ufl: '0.8', ufv: '0.8', pdie: '80', pdin: '80', kd: '8', ndfd: '45',
};

const BASIC_FIELDS = [
  { key: 'dm', label: 'Kuru Madde', unit: '%', max: 100 },
  { key: 'cp', label: 'Ham Protein', unit: '%', max: 100 },
  { key: 'me', label: 'ME', unit: 'Mcal/kg', max: 5 },
  { key: 'fb', label: 'Ham Selüloz', unit: '%', max: 100 },
  { key: 'nfc', label: 'Nişasta + Şeker (NFC)', unit: '%', max: 100 },
  { key: 'cb', label: 'Toplam Karbonhidrat', unit: '%', max: 100 },
  { key: 'price', label: 'Fiyat', unit: '₺/kg' },
];

const ADVANCED_FIELDS = [
  { key: 'ufl', label: 'UFL (INRA, süt)', unit: '/kg KM', max: 2 },
  { key: 'ufv', label: 'UFV (INRA, besi)', unit: '/kg KM', max: 2 },
  { key: 'pdie', label: 'PDIE (INRA)', unit: 'g/kg', max: 500 },
  { key: 'pdin', label: 'PDIN (INRA)', unit: 'g/kg', max: 500 },
  { key: 'kd', label: 'kd (CNCPS)', unit: '%/saat', max: 50 },
  { key: 'ndfd', label: 'NDFD (CNCPS)', unit: '%', max: 100 },
];

const hasNfc = (feed) => feed.nfc !== undefined && feed.nfc !== null && feed.nfc !== '';

const NUMERIC_KEYS = [...BASIC_FIELDS, ...ADVANCED_FIELDS].map(f => f.key);

const validate = (form) => {
  if (!form.name.trim()) return 'Yem adı boş olamaz.';
  const dm = toNum(form.dm);
  if (dm <= 0 || dm > 100) return 'Kuru madde %1 ile %100 arasında olmalıdır.';
  if (toNum(form.me) <= 0) return 'ME değeri sıfırdan büyük olmalıdır.';
  for (const f of [...BASIC_FIELDS, ...ADVANCED_FIELDS]) {
    if (f.max !== undefined && toNum(form[f.key]) > f.max) return `${f.label} en fazla ${f.max} olabilir.`;
  }
  return null;
};

const FeedDatabase = ({ feedsDb, isCustomFeed, onUpdateFeed, onAddFeed, onDeleteFeed, onResetFeeds }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null); // null = kapalı; id yoksa yeni yem
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (form && !dialog.open) dialog.showModal();
    if (!form && dialog.open) dialog.close();
  }, [form]);

  const openForm = (feed) => {
    setError(null);
    if (!feed) return setForm({ ...NEW_FEED });
    const asText = { ...feed };
    NUMERIC_KEYS.forEach(k => { asText[k] = feed[k] === undefined || feed[k] === null ? '' : String(feed[k]); });
    setForm(asText);
  };

  const closeForm = () => setForm(null);
  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const save = (e) => {
    e.preventDefault();
    const problem = validate(form);
    if (problem) return setError(problem);
    const feed = { ...form, name: form.name.trim() };
    NUMERIC_KEYS.forEach(k => { feed[k] = toNum(form[k]); });
    if (form.price === '') feed.price = '';
    if (form.nfc === '') delete feed.nfc; // boşsa toplam karbonhidrattan tahmin edilir
    if (form.id === undefined) onAddFeed(feed); else onUpdateFeed(feed);
    closeForm();
  };

  const remove = () => {
    if (window.confirm(`"${form.name}" yemini silmek istediğinize emin misiniz? Rasyondan da kaldırılır.`)) {
      onDeleteFeed(form.id);
      closeForm();
    }
  };

  const q = query.trim().toLocaleLowerCase('tr');
  const visible = q ? feedsDb.filter(f => f.name.toLocaleLowerCase('tr').includes(q)) : feedsDb;

  return (
    <section className="panel panel-feeds" aria-labelledby="yem-baslik">
      <div className="panel-head">
        <h2 className="panel-title" id="yem-baslik">Yem Kaynakları</h2>
        <button type="button" className="btn btn-secondary btn-sm" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? 'Gizle' : `Göster (${feedsDb.length})`}
        </button>
      </div>
      <p className="panel-sub">Besin değerleri kuru madde (KM) bazındadır. Kendi analiz değerlerinize göre düzenleyebilirsiniz.</p>

      {open && (
        <>
          <div className="feed-toolbar">
            <input
              type="search"
              placeholder="Yem ara…"
              aria-label="Yem ara"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openForm(null)}>+ Yeni Yem</button>
          </div>

          <ul className="feed-list">
            {visible.map(feed => (
              <li key={feed.id} className="feed-row">
                <div className="feed-main">
                  <span className="feed-name">{feed.name}</span>
                  <span className={`tag tag-${feed.type}`}>{feed.type === 'kaba' ? 'Kaba' : 'Kesif'}</span>
                </div>
                <dl className="stats stats-compact">
                  <div><dt>KM %</dt><dd>{feed.dm}</dd></div>
                  <div><dt>HP %</dt><dd>{feed.cp}</dd></div>
                  <div><dt>ME</dt><dd>{feed.me}</dd></div>
                  <div><dt>HS %</dt><dd>{feed.fb}</dd></div>
                  <div>
                    <dt>NFC %</dt>
                    <dd title={hasNfc(feed) ? undefined : 'Girilmemiş; toplam karbonhidrattan tahmin edildi'}>
                      {hasNfc(feed) ? feed.nfc : `~${Math.round(feedNfc(feed))}`}
                    </dd>
                  </div>
                </dl>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openForm(feed)} aria-label={`${feed.name} yemini düzenle`}>Düzenle</button>
              </li>
            ))}
            {visible.length === 0 && <li className="empty">Aramayla eşleşen yem bulunamadı.</li>}
          </ul>

          <button type="button" className="btn btn-link" onClick={onResetFeeds}>Yem değerlerini varsayılana döndür</button>
        </>
      )}

      <dialog ref={dialogRef} className="sheet" onClose={closeForm} aria-labelledby="yem-form-baslik">
        {form && (
          <form onSubmit={save} noValidate>
            <h3 id="yem-form-baslik">{form.id === undefined ? 'Yeni Yem Ekle' : 'Yemi Düzenle'}</h3>

            <div className="field">
              <label htmlFor="feed-name">Yem Adı</label>
              <input id="feed-name" type="text" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="feed-type">Tür</label>
              <select id="feed-type" value={form.type} onChange={e => setField('type', e.target.value)}>
                <option value="kesif">Kesif (Fabrika / Dane / Küspe)</option>
                <option value="kaba">Kaba (Ot / Saman / Silaj)</option>
              </select>
            </div>

            <div className="field-grid field-grid-compact">
              {BASIC_FIELDS.map(f => (
                <NumberField
                  key={f.key}
                  label={f.label}
                  unit={f.unit}
                  value={form[f.key]}
                  onChange={val => setField(f.key, val)}
                  placeholder={f.key === 'nfc' ? `~${Math.round(feedNfc({ ...form, nfc: undefined, cb: toNum(form.cb) }))}` : undefined}
                  hint={f.key === 'nfc' && form.nfc === '' ? 'Boş bırakılırsa toplam karbonhidrattan tahmin edilir.' : undefined}
                />
              ))}
            </div>

            <details className="advanced">
              <summary>INRA ve CNCPS değerleri</summary>
              <div className="field-grid field-grid-compact">
                {ADVANCED_FIELDS.map(f => (
                  <NumberField key={f.key} label={f.label} unit={f.unit} value={form[f.key]} onChange={val => setField(f.key, val)} />
                ))}
              </div>
            </details>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="sheet-actions">
              {form.id !== undefined && isCustomFeed(form.id) && (
                <button type="button" className="btn btn-ghost-danger" onClick={remove}>Sil</button>
              )}
              <span className="spacer" />
              <button type="button" className="btn btn-secondary" onClick={closeForm}>İptal</button>
              <button type="submit" className="btn btn-primary">Kaydet</button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
};

export default FeedDatabase;
