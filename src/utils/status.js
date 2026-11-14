// Karşılama durumunu hesaplar.
//  mode 'min'   → gereksinim alt sınırdır (enerji, protein, lif)
//  mode 'max'   → değer üst sınırdır (karbonhidrat)
//  mode 'range' → hem az hem fazla olması sorundur (kuru madde tüketimi)
export const getStatus = (provided, required, mode = 'min') => {
  if (!(required > 0)) return { level: 'info', label: '—', percent: 0 };
  const ratio = provided / required;
  const percent = ratio * 100;

  if (mode === 'max') {
    if (ratio > 1.2) return { level: 'danger', label: 'Fazla', percent };
    if (ratio > 1.0) return { level: 'warning', label: 'Sınırda', percent };
    return { level: 'success', label: 'Uygun', percent };
  }
  if (mode === 'range') {
    if (ratio > 1.25) return { level: 'danger', label: 'Çok fazla', percent };
    if (ratio > 1.1) return { level: 'warning', label: 'Fazla', percent };
    if (ratio < 0.7) return { level: 'danger', label: 'Çok düşük', percent };
    if (ratio < 0.85) return { level: 'warning', label: 'Düşük', percent };
    return { level: 'success', label: 'Uygun', percent };
  }
  if (ratio < 0.8) return { level: 'danger', label: 'Yetersiz', percent };
  if (ratio < 0.95) return { level: 'warning', label: 'Sınırda', percent };
  return { level: 'success', label: 'Yeterli', percent };
};
