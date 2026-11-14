import { THEORY_META } from '../utils/theories';
import { toNum } from '../utils/calculations';
import NumberField from './NumberField';

const ANIMAL_TYPES = [
  { id: 'besi', label: 'Erkek Besi' },
  { id: 'bos_duve', label: 'Boş Düve / İnek' },
  { id: 'sagmal', label: 'Sağmal İnek' },
  { id: 'gebe_sagmal', label: 'Gebe Sağmal İnek' },
  { id: 'kuru_gebe', label: 'Kuru Gebe İnek' },
];

const PREGNANCY_PERIODS = [
  { id: 'ilk_6_ay', label: 'İlk 6 Ay' },
  { id: 'son_3_ay', label: 'Son 3 Ay' },
];

const Segmented = ({ label, options, value, onChange }) => (
  <div className="segmented" role="group" aria-label={label}>
    {options.map(o => (
      <button
        key={o.id}
        type="button"
        className={value === o.id ? 'active' : ''}
        aria-pressed={value === o.id}
        onClick={() => onChange(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const InputSection = ({
  weight, setWeight,
  targetGcaa, setTargetGcaa,
  animalType, setAnimalType,
  milkYield, setMilkYield,
  milkFat, setMilkFat,
  pregnancyPeriod, setPregnancyPeriod,
  selectedTheory, setSelectedTheory,
}) => {
  const theories = Object.values(THEORY_META).map(t => ({ id: t.id, label: t.name }));
  const w = toNum(weight);
  const isGrowing = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  const maintenance = selectedTheory === 'inra'
    ? `${(1.4 + 0.006 * w).toFixed(2)} UFB`
    : `${(w * 0.035).toFixed(2)} Mcal ME`;

  return (
    <section className="panel panel-input" aria-labelledby="hayvan-baslik">
      <h2 className="panel-title" id="hayvan-baslik">Hayvan Bilgileri</h2>

      <div className="field">
        <span className="field-label">Hesaplama Sistemi</span>
        <Segmented label="Hesaplama sistemi" options={theories} value={selectedTheory} onChange={setSelectedTheory} />
        <p className="field-hint">{THEORY_META[selectedTheory].subtitle}</p>
      </div>

      <div className="field">
        <label htmlFor="animal-type">Hayvan Tipi ve Durumu</label>
        <select id="animal-type" value={animalType} onChange={e => setAnimalType(e.target.value)}>
          {ANIMAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="field-grid">
        <NumberField
          label="Canlı Ağırlık"
          unit="kg"
          value={weight}
          onChange={setWeight}
          step={10}
          max={1500}
          hint={w > 0 ? `Yaşama payı: ${maintenance}` : 'Hesaplama için ağırlık girin'}
        />

        {isGrowing && (
          <NumberField
            label="Hedef Günlük Artış (GCAA)"
            unit="kg/gün"
            value={targetGcaa}
            onChange={setTargetGcaa}
            step={0.1}
            max={3}
          />
        )}

        {isLactating && (
          <>
            <NumberField label="Günlük Süt Verimi" unit="L" value={milkYield} onChange={setMilkYield} step={1} max={80} />
            <NumberField label="Süt Yağ Oranı" unit="%" value={milkFat} onChange={setMilkFat} step={0.1} max={8} />
          </>
        )}
      </div>

      {isPregnant && (
        <div className="field">
          <span className="field-label">Gebelik Dönemi</span>
          <Segmented label="Gebelik dönemi" options={PREGNANCY_PERIODS} value={pregnancyPeriod} onChange={setPregnancyPeriod} />
        </div>
      )}
    </section>
  );
};

export default InputSection;
