import { useId } from 'react';
import { toNum } from '../utils/calculations';

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

// Ondalık sayı alanı: virgül/nokta kabul eder, mobilde sayısal klavye açar,
// `step` verilirse büyük dokunma hedefli − / + düğmeleri gösterir.
const NumberField = ({ label, value, onChange, unit, step, min = 0, max, placeholder, hint, onEnter }) => {
  const id = useId();

  const handleChange = (e) => {
    const val = e.target.value.replace(',', '.');
    if (DECIMAL_PATTERN.test(val)) onChange(val);
  };

  const nudge = (direction) => {
    let next = toNum(value) + direction * step;
    if (max !== undefined) next = Math.min(max, next);
    next = Math.max(min, next);
    onChange(String(Math.round(next * 100) / 100));
  };

  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className={`number-field${step ? ' has-stepper' : ''}`}>
        {step && (
          <button type="button" className="step-btn" onClick={() => nudge(-1)} aria-label={`${label || 'Değer'} azalt`}>−</button>
        )}
        <div className="number-input">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value ?? ''}
            placeholder={placeholder}
            onChange={handleChange}
            onFocus={e => e.target.select()}
            onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
          />
          {unit && <span className="unit">{unit}</span>}
        </div>
        {step && (
          <button type="button" className="step-btn" onClick={() => nudge(1)} aria-label={`${label || 'Değer'} artır`}>+</button>
        )}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
};

export default NumberField;
