// Ortak sayısal yardımcılar

// Kullanıcı girdilerini (metin, virgüllü ondalık, boş, ".") güvenle sayıya çevirir.
export const toNum = (value, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value !== 'string') return fallback;
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) ? n : fallback;
};

// Yedirilen (yaş) miktarı kuru maddeye çevirir.
export const convertToDM = (asFedKg, dmPercentage) => {
  return toNum(asFedKg) * (toNum(dmPercentage) / 100);
};
