/**
 * Rasyon Hesaplama Teorileri
 *
 * 1. NRC  – Metabolize Olabilir Enerji (ME, Mcal) + Ham Protein (HP, kg)
 * 2. INRA – Net Enerji (besi: UFV, süt: UFL) + PDI protein sistemi (PDIE/PDIN, g)
 * 3. CNCPS – ME (Mcal, NDFD düzeltmeli) + Metabolik Protein (MP, g) (RDP/RUP)
 */

import { convertToDM, toNum } from './calculations';

// ─────────────────────────────────────────────
//  T H E O R Y   M E T A
// ─────────────────────────────────────────────
export const THEORY_META = {
  nrc: {
    id: 'nrc',
    name: 'NRC',
    flag: '🇺🇸',
    subtitle: 'Amerikan Sistemi – Metabolize Olabilir Enerji (ME)',
    energyLabel: 'Metabolik Enerji (ME)',
    energyUnit: 'Mcal',
    proteinLabel: 'Ham Protein (HP)',
    proteinUnit: 'kg',
  },
  inra: {
    id: 'inra',
    name: 'INRA',
    flag: '🇫🇷',
    subtitle: 'Avrupa / Fransız Sistemi – Net Enerji (UFV / UFL) + PDI Protein',
    energyLabel: 'Net Enerji (UFV)',
    energyUnit: 'UFV',
    proteinLabel: 'Protein (PDI)',
    proteinUnit: 'g',
  },
  cncps: {
    id: 'cncps',
    name: 'CNCPS',
    flag: '🔬',
    subtitle: 'Cornell Sistemi – Sindirim Hızı + Metabolik Protein (MP)',
    energyLabel: 'Metabolik Enerji (ME)',
    energyUnit: 'Mcal',
    proteinLabel: 'Metabolik Protein (MP)',
    proteinUnit: 'g',
  },
};

// ─────────────────────────────────────────────
//  Yem başına katkılar (rasyon toplamı ve satır gösterimi aynı formülü kullanır)
// ─────────────────────────────────────────────

// CNCPS enerji: ME + NDF sindirilebilirlik düzeltmesi
// (ndfd 28 → -%3.4, ndfd 72 → +%5.4; referans ndfd = 45)
export const cncpsFeedEnergy = (feed, dmKg) => {
  const ndfd = feed.ndfd || 45;
  return dmKg * feed.me * (1 + (ndfd - 45) * 0.002);
};

// CNCPS protein: kd bazlı RDP / RUP ayrımı → Metabolik Protein (g)
//   A fraksiyonu (hemen çözünen) ~%20, B (yavaş sindirilen) ~%65, C (sindirilmez) ~%15
//   RDP = A + B × kd/(kd+kp),  RUP = B × kp/(kd+kp)
//   MP  = RDP × 0.85 (mikrobiyal yakalama) × 0.64 + RUP × 0.80
export const cncpsFeedMp = (feed, dmKg) => {
  const kd = feed.kd || 8;
  const kp = feed.type === 'kesif' ? 5 : 3.5; // geçiş hızı %/saat
  const cpGrams = dmKg * (feed.cp / 100) * 1000;
  const rdp = cpGrams * (0.20 + 0.65 * (kd / (kd + kp)));
  const rup = cpGrams * (0.65 * (kp / (kd + kp)));
  return rdp * 0.85 * 0.64 + rup * 0.80;
};

// INRA: süt ırkı ineklerde UFL (süt birimi), besi ve düvede UFV (et birimi) kullanılır
const INRA_DAIRY_TYPES = ['sagmal', 'gebe_sagmal', 'kuru_gebe'];
export const inraEnergyUnit = (animalType) => (INRA_DAIRY_TYPES.includes(animalType) ? 'UFL' : 'UFV');
const inraFeedEnergy = (feed, animalType) =>
  inraEnergyUnit(animalType) === 'UFL' ? (feed.ufl || 0) : (feed.ufv ?? feed.ufb ?? 0);

// Tek bir yemin seçili teoriye göre enerji / protein katkısı
export const getFeedContribution = (theory, feed, dmKg, animalType) => {
  switch (theory) {
    case 'inra':
      return {
        energy: dmKg * inraFeedEnergy(feed, animalType),
        pdie: dmKg * (feed.pdie || 0),
        pdin: dmKg * (feed.pdin || 0),
      };
    case 'cncps':
      return { energy: cncpsFeedEnergy(feed, dmKg), protein: cncpsFeedMp(feed, dmKg) };
    default:
      return { energy: dmKg * feed.me, protein: dmKg * (feed.cp / 100) };
  }
};

// ─────────────────────────────────────────────
//  NRC enerji ve protein denklemleri (NRC ve CNCPS ortak kullanır)
//
//  Net enerji gereksinimleri, ~2.6 Mcal ME/kg KM'lik tipik bir rasyon için
//  sabit verimliliklerle ME'ye çevrilir.
// ─────────────────────────────────────────────
const KM = 0.65; // ME → NEm (yaşama)
const KG = 0.42; // ME → NEg (büyüme)
const KL = 0.64; // ME → NEL (yaşama + süt, süt ırkı)
const CP_PER_MP = 1 / 0.64; // metabolik protein → ham protein

const isDairyType = (animalType) =>
  animalType === 'sagmal' || animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

// Yaşama payı (Mcal ME/gün)
//   Besi / düve: NEm = 0.077 × SBW^0.75   (SBW = 0.96 × canlı ağırlık)
//   Süt ırkı:    NEL = 0.080 × CA^0.75
export const meMaintenance = (weight, animalType) =>
  isDairyType(animalType)
    ? (0.080 * Math.pow(weight, 0.75)) / KL
    : (0.077 * Math.pow(0.96 * weight, 0.75)) / KM;

// 1 kg/gün boş vücut artışı için tutulan enerji katsayısı: 0.0635 × EBW^0.75
const retainedEnergyCoef = (weight) => 0.0635 * Math.pow(0.891 * 0.96 * weight, 0.75);

// Tutulan enerji (Mcal NEg/gün): RE = 0.0635 × EBW^0.75 × EBG^1.097, EBG = 0.956 × GCAA
const retainedEnergy = (weight, gain) =>
  gain > 0 ? retainedEnergyCoef(weight) * Math.pow(0.956 * gain, 1.097) : 0;

// Büyüme payı (Mcal ME/gün)
export const meForGain = (weight, gain) => retainedEnergy(weight, gain) / KG;

// Yaşama payından artan (veya eksik kalan) ME'den beklenen GCAA (kg/gün)
export const gainFromMe = (weight, availableMe) => {
  const coef = retainedEnergyCoef(weight);
  if (availableMe >= 0) return Math.pow((availableMe * KG) / coef, 1 / 1.097) / 0.956;
  // Enerji açığı vücut rezervinden karşılanır
  return (availableMe * KM) / (coef * Math.pow(0.956, 1.097));
};

// 1 kg süt için ME (Mcal): NEL = 0.360 + 0.0969 × yağ%
export const meForMilk = (milkFat) => (0.360 + 0.0969 * milkFat) / KL;

// Yaşama payı ham protein (kg/gün): MP = 3.8 g × SBW^0.75
export const cpMaintenance = (weight) =>
  (3.8 * Math.pow(0.96 * weight, 0.75) * CP_PER_MP) / 1000;

// Büyüme payı ham protein (kg/gün)
//   Net protein = GCAA × (268 − 29.4 × RE/GCAA) g; çok ağır hayvanda alt sınır 60 g/kg
//   Kullanım verimi: SBW ≤ 300 kg → 0.834 − 0.00114 × SBW, üstü → 0.492
export const cpForGain = (weight, gain) => {
  if (!(gain > 0)) return 0;
  const sbw = 0.96 * weight;
  const netPerKg = Math.max(60, 268 - (29.4 * retainedEnergy(weight, gain)) / gain);
  const efficiency = sbw > 300 ? 0.492 : 0.834 - 0.00114 * sbw;
  return ((gain * netPerKg) / efficiency) * CP_PER_MP / 1000;
};

// Yaşama payından artan ham proteinden beklenen GCAA (kg/gün); cpForGain'in tersi
export const gainFromCp = (weight, availableCp) => {
  if (availableCp <= 0) return availableCp / 0.25;
  let lo = 0, hi = 5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (cpForGain(weight, mid) < availableCp) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

// Gebelik eki (Mcal ME/gün): son 3 ayda NRC ortalaması ~4.5
const mePregnancy = (pregnancyPeriod) => (pregnancyPeriod === 'son_3_ay' ? 4.5 : 0.5);

// Hedef kuru madde tüketimi (kg/gün)
const targetDryMatter = (weight, animalType, milkYield) => {
  if (animalType === 'sagmal' || animalType === 'gebe_sagmal') return weight * 0.02 + milkYield * 0.3;
  if (animalType === 'kuru_gebe') return weight * 0.02;
  return weight * 0.025;
};

// İşkembe sağlığı sınırları (rasyon KM'sindeki oran, %)
//   minFiberPct: en az ham selüloz   maxNfcPct: en fazla nişasta + şeker (NFC)
//   Süt ineği: NRC 2001 (HS ≥ %17, NFC ≤ %40); kuru dönem daha kaba ağırlıklı.
//   Besi: yoğun besi rasyonları HS %10'a kadar inebilir, NFC %55'e kadar çıkabilir (soda ile).
const RUMEN_LIMITS = {
  besi: { minFiberPct: 10, maxNfcPct: 55 },
  bos_duve: { minFiberPct: 15, maxNfcPct: 40 },
  sagmal: { minFiberPct: 17, maxNfcPct: 40 },
  gebe_sagmal: { minFiberPct: 17, maxNfcPct: 40 },
  kuru_gebe: { minFiberPct: 20, maxNfcPct: 35 },
};
export const rumenLimits = (animalType) => RUMEN_LIMITS[animalType] || RUMEN_LIMITS.besi;

// NFC değeri girilmemiş (eski kayıtlı) yemler için tahmin:
// kesif yemlerde toplam karbonhidrat ≈ NFC, kaba yemlerde yaklaşık yarısı lif dışıdır.
export const feedNfc = (feed) => {
  if (feed.nfc !== undefined && feed.nfc !== null && feed.nfc !== '') return Number(feed.nfc) || 0;
  const cb = Number(feed.cb) || 0;
  return feed.type === 'kaba' ? cb * 0.5 : cb;
};

// ─────────────────────────────────────────────
//  Ortak metrikler: asidoz riski, lif / NFC / HP oranları, enerji yoğunluğu
// ─────────────────────────────────────────────
const calcSharedMetrics = ({ totalDM, totalKesifDM, totalFiber, totalNFC, totalCP, totalEnergy }) => {
  let recommendedSoda = 0;
  const kesifRatio = totalDM > 0 ? (totalKesifDM / totalDM) * 100 : 0;
  if (kesifRatio > 55 && totalKesifDM > 0) {
    recommendedSoda = totalKesifDM * 0.012 * 1000;
  }
  const pct = (x) => (totalDM > 0 ? (x / totalDM) * 100 : 0);
  return {
    kesifRatio,
    recommendedSoda,
    nfc: totalNFC,
    fiberPct: pct(totalFiber),
    nfcPct: pct(totalNFC),
    cpPct: pct(totalCP), // ham protein, KM'de %
    energyDensity: totalDM > 0 ? totalEnergy / totalDM : 0, // enerji birimi / kg KM
  };
};

// ═══════════════════════════════════════════════
//  N R C   (mevcut / referans sistem)
// ═══════════════════════════════════════════════
export const nrcRequirements = ({ weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, targetDM: 0, ...rumenLimits(animalType) };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let totalMe = meMaintenance(weight, animalType); // Mcal yaşama payı
  let totalCp = cpMaintenance(weight); // kg yaşama payı

  if (isBesi) {
    totalMe += meForGain(weight, targetGcaa || 0);
    totalCp += cpForGain(weight, targetGcaa || 0);
  }

  if (isLactating) {
    totalMe += milkYield * meForMilk(milkFat);
    // Süt için protein (HP) = ~85 g / kg süt
    totalCp += milkYield * 0.085;
  }

  if (isPregnant) {
    totalMe += mePregnancy(pregnancyPeriod);
    totalCp += pregnancyPeriod === 'son_3_ay' ? 0.250 : 0.050;
  }

  const targetDM = targetDryMatter(weight, animalType, milkYield);

  return { energy: totalMe, protein: totalCp, targetDM, ...rumenLimits(animalType) };
};

export const nrcRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0, totalProtein = 0;
  let totalFiber = 0, totalNFC = 0, totalKesifDM = 0;
  let totalCP = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = toNum(item.amount);
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;
    totalEnergy += dmKg * feed.me;
    const feedCP = dmKg * (feed.cp / 100);
    totalProtein += feedCP;
    totalCP += feedCP;
    totalFiber += dmKg * (feed.fb / 100);
    totalNFC += dmKg * (feedNfc(feed) / 100);
  });

  const shared = calcSharedMetrics({ totalDM, totalKesifDM, totalFiber, totalNFC, totalCP, totalEnergy });

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber, ...shared,
  };
};

export const nrcEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let mEm = meMaintenance(weight, animalType);
  let cPm = cpMaintenance(weight);

  if (isPregnant) {
    mEm += mePregnancy(pregnancyPeriod);
    cPm += pregnancyPeriod === 'son_3_ay' ? 0.250 : 0.050;
  }

  const availableE = energy - mEm;
  const availableP = protein - cPm;

  if (isBesi || animalType === 'kuru_gebe') {
    // Büyümeyi en az sağlanan besin sınırlar
    const gcaa = Math.min(gainFromMe(weight, availableE), gainFromCp(weight, availableP));
    return { gcaa: Math.max(-2, Math.min(3, gcaa)), milk: 0 };
  } else {
    // Lactating
    const milkE = availableE > 0 ? availableE / meForMilk(milkFat || 3.5) : 0;
    const milkP = availableP > 0 ? availableP / 0.085 : 0;
    return { gcaa: 0, milk: Math.max(0, Math.min(milkE, milkP)) };
  }
};

// ═══════════════════════════════════════════════
//  I N R A   (Net Enerji – UFV / UFL + PDI)
//
//  Temel fark: Enerji besi ve düvede "UFV" (et birimi), süt ineklerinde "UFL"
//  (süt birimi) ile; protein "PDI" sistemiyle hesaplanır.
//  PDI = min(toplam PDIE, toplam PDIN) — rasyon düzeyinde!
// ═══════════════════════════════════════════════
export const inraRequirements = ({ weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, targetDM: 0, ...rumenLimits(animalType) };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  // Net enerji gereksinimi (besi/düve: UFV, süt ineği: UFL)
  let totalUf = 1.4 + 0.006 * weight; // Yaşama payı

  // PDI gereksinimi (g/gün)
  const metabolicWeight = Math.pow(weight, 0.75);
  let totalPdi = 3.25 * metabolicWeight; // Yaşama payı

  if (isBesi) {
    totalUf += (targetGcaa || 0) * 3.2; // Büyüme payı (UFV)
    totalPdi += (targetGcaa || 0) * 280; // Büyüme payı (PDI)
  }

  if (isLactating) {
    totalUf += milkYield * uflPerKgMilk(milkFat);

    // Süt PDI gereksinimi: ~50g PDI / kg süt
    totalPdi += milkYield * 50;
  }

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      totalUf += 2.0; // UFL
      totalPdi += 200; // g PDI
    } else {
      totalUf += 0.3;
      totalPdi += 30;
    }
  }

  const targetDM = targetDryMatter(weight, animalType, milkYield);

  return { energy: totalUf, protein: totalPdi, targetDM, ...rumenLimits(animalType) };
};

// INRA: 1 kg süt için UFL = 0.44 × %4 yağa düzeltilmiş süt katsayısı (0.4 + 0.15 × yağ%)
const uflPerKgMilk = (milkFat) => 0.44 * (0.4 + 0.15 * milkFat);

export const inraRationTotals = (rationItems, feedsDb, animalType) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0;
  let totalPDIE = 0, totalPDIN = 0;
  let totalFiber = 0, totalNFC = 0, totalKesifDM = 0;
  let totalCP = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = toNum(item.amount);
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;

    // Enerji: KM × yemin UFV (besi) veya UFL (süt) değeri
    totalEnergy += dmKg * inraFeedEnergy(feed, animalType);

    // Protein: PDIE ve PDIN ayrı ayrı toplanır — rasyon seviyesinde min alınır
    totalPDIE += dmKg * (feed.pdie || 0);
    totalPDIN += dmKg * (feed.pdin || 0);

    totalFiber += dmKg * (feed.fb / 100);
    totalNFC += dmKg * (feedNfc(feed) / 100);

    totalCP += dmKg * (feed.cp / 100);
  });

  // PDI = min(PDIE, PDIN) — RASYON düzeyinde, yem başına DEĞİL
  const totalProtein = Math.min(totalPDIE, totalPDIN);

  const shared = calcSharedMetrics({ totalDM, totalKesifDM, totalFiber, totalNFC, totalCP, totalEnergy });

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber,
    pdie: totalPDIE, pdin: totalPDIN,  // ekstra — UI'da gösterilebilir
    ...shared,
  };
};

export const inraEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let ufMaintenance = 1.4 + 0.006 * weight;
  const metabolicWeight = Math.pow(weight, 0.75);
  let pdiMaintenance = 3.25 * metabolicWeight;

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      ufMaintenance += 2.0;
      pdiMaintenance += 200;
    } else {
      ufMaintenance += 0.3;
      pdiMaintenance += 30;
    }
  }

  const availableUf = energy - ufMaintenance;
  const availablePdi = protein - pdiMaintenance;

  if (isBesi || animalType === 'kuru_gebe') {
    const gcaaE = availableUf > 0 ? availableUf / 3.2 : availableUf / 2.5;
    const gcaaP = availablePdi > 0 ? availablePdi / 280 : availablePdi / 200;
    return { gcaa: Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP))), milk: 0 };
  } else {
    // Lactating
    const energyPerKgMilk = uflPerKgMilk(milkFat || 3.5);
    const proteinPerKgMilk = 50;

    const milkE = availableUf > 0 ? availableUf / energyPerKgMilk : 0;
    const milkP = availablePdi > 0 ? availablePdi / proteinPerKgMilk : 0;
    return { gcaa: 0, milk: Math.max(0, Math.min(milkE, milkP)) };
  }
};

// ═══════════════════════════════════════════════
//  C N C P S   (Cornell – Metabolik Protein + NDFD düzeltmeli ME)
//
//  Enerji: NRC ME baz + NDF sindirebilirlik düzeltmesi (±5%)
//  Protein: kd bazlı RDP/RUP ayrımı → Mikrobik CP + Bypass → MP
//  Ekstra: Senkronizasyon skoru
// ═══════════════════════════════════════════════
export const cncpsRequirements = ({ weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, targetDM: 0, ...rumenLimits(animalType) };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let totalMe = meMaintenance(weight, animalType);
  const metabolicWeight = Math.pow(weight, 0.75);
  let totalMp = 3.8 * metabolicWeight; // g MP

  if (isBesi) {
    totalMe += meForGain(weight, targetGcaa || 0);
    totalMp += (targetGcaa || 0) * 305;
  }

  if (isLactating) {
    totalMe += milkYield * meForMilk(milkFat);

    // MP for milk: ~45g MP / kg milk (süt proteini için net)
    totalMp += milkYield * 45;
  }

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      totalMe += mePregnancy(pregnancyPeriod); // Mcal/gün
      totalMp += 150; // g MP/gün
    } else {
      totalMe += mePregnancy(pregnancyPeriod);
      totalMp += 20;
    }
  }


  const targetDM = targetDryMatter(weight, animalType, milkYield);

  return { energy: totalMe, protein: totalMp, targetDM, ...rumenLimits(animalType) };
};

export const cncpsRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0, totalProtein = 0;
  let totalFiber = 0, totalNFC = 0, totalKesifDM = 0;
  let totalCP = 0;
  let totalKdWeighted = 0, totalNdfdWeighted = 0;
  let syncNumerator = 0, syncDenominator = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = toNum(item.amount);
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;

    const kd = feed.kd || 8;
    const ndfd = feed.ndfd || 45;
    totalEnergy += cncpsFeedEnergy(feed, dmKg);
    totalProtein += cncpsFeedMp(feed, dmKg);
    const cpGrams = dmKg * (feed.cp / 100) * 1000;

    // ── Ortak metrikler ──
    totalFiber += dmKg * (feed.fb / 100);
    totalNFC += dmKg * (feedNfc(feed) / 100);
    totalCP += cpGrams / 1000;

    totalKdWeighted += dmKg * kd;
    totalNdfdWeighted += dmKg * ndfd;
    syncNumerator += dmKg * kd;
    syncDenominator += dmKg;
  });

  const shared = calcSharedMetrics({ totalDM, totalKesifDM, totalFiber, totalNFC, totalCP, totalEnergy });

  // Ağırlıklı ortalamalar
  const avgKd = totalDM > 0 ? totalKdWeighted / totalDM : 0;
  const avgNdfd = totalDM > 0 ? totalNdfdWeighted / totalDM : 0;

  // Senkronizasyon skoru: kd varyansı düşükse enerji-protein eşzamanlılığı iyidir
  let syncScore = 0;
  if (totalDM > 0 && rationItems.length > 0) {
    const avgKdVal = syncNumerator / syncDenominator;
    let variance = 0;
    rationItems.forEach(item => {
      const feed = feedsDb.find(f => f.id === item.feedId);
      if (!feed) return;
      const dmKg = convertToDM(item.amount, feed.dm);
      const diff = (feed.kd || 8) - avgKdVal;
      variance += dmKg * diff * diff;
    });
    variance /= syncDenominator;
    // Düşük standart sapma → yüksek skor
    syncScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 8));
  }

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber,
    avgKd, avgNdfd, syncScore,
    ...shared,
  };
};

export const cncpsEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let mEm = meMaintenance(weight, animalType);
  const metabolicWeight = Math.pow(weight, 0.75);
  let mpMaintenance = 3.8 * metabolicWeight;

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      mEm += mePregnancy(pregnancyPeriod);
      mpMaintenance += 150;
    } else {
      mEm += mePregnancy(pregnancyPeriod);
      mpMaintenance += 20;
    }
  }

  const availableE = energy - mEm;
  const availableP = protein - mpMaintenance;

  if (isBesi || animalType === 'kuru_gebe') {
    const gcaaE = gainFromMe(weight, availableE);
    const gcaaP = availableP > 0 ? availableP / 305 : availableP / 220;
    return { gcaa: Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP))), milk: 0 };
  } else {
    // Lactating
    const energyPerKgMilk = meForMilk(milkFat || 3.5);
    const proteinPerKgMilk = 45; // MP

    const milkE = availableE > 0 ? availableE / energyPerKgMilk : 0;
    const milkP = availableP > 0 ? availableP / proteinPerKgMilk : 0;
    return { gcaa: 0, milk: Math.max(0, Math.min(milkE, milkP)) };
  }
};

// ─────────────────────────────────────────────
//  D I S P A T C H E R
// ─────────────────────────────────────────────
export const getTheoryFunctions = (theory, animalType) => {
  switch (theory) {
    case 'inra': {
      const unit = inraEnergyUnit(animalType);
      return {
        calculateRequirements: inraRequirements,
        calculateRationTotals: inraRationTotals,
        estimateProduction: inraEstimateProduction,
        meta: { ...THEORY_META.inra, energyLabel: `Net Enerji (${unit})`, energyUnit: unit },
      };
    }
    case 'cncps':
      return {
        calculateRequirements: cncpsRequirements,
        calculateRationTotals: cncpsRationTotals,
        estimateProduction: cncpsEstimateProduction,
        meta: THEORY_META.cncps,
      };
    case 'nrc':
    default:
      return {
        calculateRequirements: nrcRequirements,
        calculateRationTotals: nrcRationTotals,
        estimateProduction: nrcEstimateProduction,
        meta: THEORY_META.nrc,
      };
  }
};
