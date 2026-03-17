/**
 * Rasyon Hesaplama Teorileri
 *
 * 1. NRC  – Metabolize Olabilir Enerji (ME, Mcal) + Ham Protein (HP, kg)
 * 2. INRA – Net Enerji (UFB birimi) + PDI protein sistemi (PDIE/PDIN, g)
 * 3. CNCPS – ME (Mcal, NDFD düzeltmeli) + Metabolik Protein (MP, g) (RDP/RUP)
 */

import { convertToDM } from './calculations';

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
    subtitle: 'Avrupa / Fransız Sistemi – Net Enerji (UFB) + PDI Protein',
    energyLabel: 'Net Enerji (UFB)',
    energyUnit: 'UFB',
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
//  Shared helper: acidosis risk & energy breakdown
// ─────────────────────────────────────────────
const calcSharedMetrics = (totalDM, totalKesifDM, totalCB, totalEnergyFromProtein, totalEnergyFromCarbs) => {
  let recommendedSoda = 0;
  const kesifRatio = totalDM > 0 ? (totalKesifDM / totalDM) * 100 : 0;
  if (kesifRatio > 55 && totalKesifDM > 0) {
    recommendedSoda = totalKesifDM * 0.012 * 1000;
  }
  const totalCalcEnergy = totalEnergyFromProtein + totalEnergyFromCarbs;
  const energyPercentProtein = totalCalcEnergy > 0 ? (totalEnergyFromProtein / totalCalcEnergy) * 100 : 0;
  const energyPercentCarbs = totalCalcEnergy > 0 ? (totalEnergyFromCarbs / totalCalcEnergy) * 100 : 0;
  return { kesifRatio, recommendedSoda, energyPercentProtein, energyPercentCarbs };
};

// ═══════════════════════════════════════════════
//  N R C   (mevcut / referans sistem)
// ═══════════════════════════════════════════════
export const nrcRequirements = (weight, targetGcaa) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0 };

  const mEm = weight * 0.035;                       // Mcal yaşama payı
  const mEg = (targetGcaa || 0) * (weight * 0.015);  // Mcal büyüme payı
  const totalMe = mEm + mEg;

  const cPm = weight * 0.001;                        // kg yaşama payı
  const cPg = (targetGcaa || 0) * 0.35;              // kg büyüme payı
  const totalCp = cPm + cPg;

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + ((targetGcaa || 0) * 1.5);

  return { energy: totalMe, protein: totalCp, minFiber, cb };
};

export const nrcRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0, totalProtein = 0;
  let totalFiber = 0, totalCB = 0, totalKesifDM = 0, totalKabaDM = 0;
  let totalEnergyFromCarbs = 0, totalEnergyFromProtein = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = Number(item.amount) || 0;
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;
    if (feed.type === 'kaba') totalKabaDM += dmKg;
    totalEnergy += dmKg * feed.me;
    const feedCP = dmKg * (feed.cp / 100);
    totalProtein += feedCP;
    totalEnergyFromProtein += feedCP * 4;
    totalEnergyFromCarbs += dmKg * (feed.cb / 100) * 4;
    totalFiber += dmKg * (feed.fb / 100);
    totalCB += dmKg * (feed.cb / 100);
  });

  const shared = calcSharedMetrics(totalDM, totalKesifDM, totalCB, totalEnergyFromProtein, totalEnergyFromCarbs);

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber, cb: totalCB, ...shared,
  };
};

export const nrcEstimateGCAA = (weight, totalEnergy, totalProtein) => {
  if (!weight || weight <= 0) return 0;
  const mEm = weight * 0.035;
  const availableE = totalEnergy - mEm;
  const cPm = weight * 0.001;
  const availableP = totalProtein - cPm;

  const gcaaE = availableE > 0 ? availableE / (weight * 0.015) : availableE / (weight * 0.010);
  const gcaaP = availableP > 0 ? availableP / 0.35 : availableP / 0.25;

  return Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP)));
};

// ═══════════════════════════════════════════════
//  I N R A   (Net Enerji – UFB + PDI)
//
//  Temel fark: Enerji "UFB" birimi, protein "PDI" sistemi.
//  PDI = min(toplam PDIE, toplam PDIN) — rasyon düzeyinde!
// ═══════════════════════════════════════════════
export const inraRequirements = (weight, targetGcaa) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0 };

  // UFB gereksinimi (besi sığırı)
  // Yaşama payı ≈ 1.4 + 0.006 × CA  (INRA 2018 basitleştirilmiş)
  const ufbMaintenance = 1.4 + 0.006 * weight;
  // Büyüme payı: ~3.2 UFB / kg GCAA (besi sığırı ortalaması)
  const ufbGrowth = (targetGcaa || 0) * 3.2;
  const totalUfb = ufbMaintenance + ufbGrowth;

  // PDI gereksinimi (g/gün)
  // Yaşama: 3.25 × CA^0.75
  const metabolicWeight = Math.pow(weight, 0.75);
  const pdiMaintenance = 3.25 * metabolicWeight;
  // Büyüme: ~280 g PDI / kg GCAA
  const pdiGrowth = (targetGcaa || 0) * 280;
  const totalPdi = pdiMaintenance + pdiGrowth;

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + ((targetGcaa || 0) * 1.5);

  return { energy: totalUfb, protein: totalPdi, minFiber, cb };
};

export const inraRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0;
  let totalPDIE = 0, totalPDIN = 0;
  let totalFiber = 0, totalCB = 0, totalKesifDM = 0, totalKabaDM = 0;
  let totalEnergyFromCarbs = 0, totalEnergyFromProtein = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = Number(item.amount) || 0;
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;
    if (feed.type === 'kaba') totalKabaDM += dmKg;

    // Enerji: UFB × KM
    totalEnergy += dmKg * (feed.ufb || 0);

    // Protein: PDIE ve PDIN ayrı ayrı toplanır — rasyon seviyesinde min alınır
    totalPDIE += dmKg * (feed.pdie || 0);
    totalPDIN += dmKg * (feed.pdin || 0);

    totalFiber += dmKg * (feed.fb / 100);
    totalCB += dmKg * (feed.cb / 100);

    // Enerji dağılımı tahmini
    const cpKg = dmKg * (feed.cp / 100);
    totalEnergyFromProtein += cpKg * 4;
    totalEnergyFromCarbs += dmKg * (feed.cb / 100) * 4;
  });

  // PDI = min(PDIE, PDIN) — RASYON düzeyinde, yem başına DEĞİL
  const totalProtein = Math.min(totalPDIE, totalPDIN);

  const shared = calcSharedMetrics(totalDM, totalKesifDM, totalCB, totalEnergyFromProtein, totalEnergyFromCarbs);

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber, cb: totalCB,
    pdie: totalPDIE, pdin: totalPDIN,  // ekstra — UI'da gösterilebilir
    ...shared,
  };
};

export const inraEstimateGCAA = (weight, totalEnergy, totalProtein) => {
  if (!weight || weight <= 0) return 0;

  const ufbMaintenance = 1.4 + 0.006 * weight;
  const availableUfb = totalEnergy - ufbMaintenance;
  const gcaaFromEnergy = availableUfb > 0 ? availableUfb / 3.2 : availableUfb / 2.5;

  const metabolicWeight = Math.pow(weight, 0.75);
  const pdiMaintenance = 3.25 * metabolicWeight;
  const availablePdi = totalProtein - pdiMaintenance;
  const gcaaFromProtein = availablePdi > 0 ? availablePdi / 280 : availablePdi / 200;

  return Math.max(-2, Math.min(3, Math.min(gcaaFromEnergy, gcaaFromProtein)));
};

// ═══════════════════════════════════════════════
//  C N C P S   (Cornell – Metabolik Protein + NDFD düzeltmeli ME)
//
//  Enerji: NRC ME baz + NDF sindirebilirlik düzeltmesi (±5%)
//  Protein: kd bazlı RDP/RUP ayrımı → Mikrobik CP + Bypass → MP
//  Ekstra: Senkronizasyon skoru
// ═══════════════════════════════════════════════
export const cncpsRequirements = (weight, targetGcaa) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0 };

  // Enerji: ME bazlı (NRC ile aynı birim — Mcal)
  const mEm = weight * 0.035;
  const mEg = (targetGcaa || 0) * (weight * 0.015);
  const totalMe = mEm + mEg;

  // Metabolik Protein (MP) gereksinimi (g/gün)
  const metabolicWeight = Math.pow(weight, 0.75);
  // Yaşama payı: ~3.8 g MP / kg metabolik ağırlık
  const mpMaintenance = 3.8 * metabolicWeight;
  // Büyüme payı: ~305 g MP / kg GCAA
  const mpGrowth = (targetGcaa || 0) * 305;
  const totalMp = mpMaintenance + mpGrowth;

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + ((targetGcaa || 0) * 1.5);

  return { energy: totalMe, protein: totalMp, minFiber, cb };
};

export const cncpsRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0, totalDM = 0, totalEnergy = 0, totalProtein = 0;
  let totalFiber = 0, totalCB = 0, totalKesifDM = 0, totalKabaDM = 0;
  let totalEnergyFromCarbs = 0, totalEnergyFromProtein = 0;
  let totalKdWeighted = 0, totalNdfdWeighted = 0;
  let syncNumerator = 0, syncDenominator = 0;

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;
    const kg = Number(item.amount) || 0;
    totalAsFed += kg;
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    if (feed.type === 'kesif') totalKesifDM += dmKg;
    if (feed.type === 'kaba') totalKabaDM += dmKg;

    // ── Enerji: ME + NDFD düzeltmesi ──
    // NDF sindirebilirliği yüksek yemler biraz daha fazla enerji sağlar.
    // Düzeltme miktarı: ±5% civarı (ndfd 28→ -%3.4, ndfd 72→ +%5.4)
    const ndfd = feed.ndfd || 45;
    const ndfdBaseline = 45;
    const ndfdCorrection = 1 + (ndfd - ndfdBaseline) * 0.002;
    const adjustedME = dmKg * feed.me * ndfdCorrection;
    totalEnergy += adjustedME;

    // ── Protein: kd bazlı RDP / RUP ayrımı → MP ──
    const kd = feed.kd || 8;
    // Passage rate: kesif ~5%/hr, kaba ~3.5%/hr
    const kp = feed.type === 'kesif' ? 5 : 3.5;

    const cpGrams = dmKg * (feed.cp / 100) * 1000;

    // Protein fraksiyonları (basitleştirilmiş):
    //   A fraksiyonu (hemen çözünen): ~20%
    //   B fraksiyonu (yavaş sindirimli): ~65%
    //   C fraksiyonu (sindirilmez): ~15%
    const fracA = 0.20;
    const fracB = 0.65;
    // fracC = 0.15 (hesaplamaya girmez, kayıp)

    // RDP = A + B × kd/(kd+kp)
    const rdpFraction = fracA + fracB * (kd / (kd + kp));
    const rdp = cpGrams * rdpFraction;
    // RUP = B × kp/(kd+kp) (C fraksiyonu sindirilmez)
    const rupFraction = fracB * (kp / (kd + kp));
    const rup = cpGrams * rupFraction;

    // MCP (Mikrobik Crude Protein) = RDP × %85 yakalama
    // MP from microbes = MCP × %64 (80% true protein × 80% sindirilebilirlik)
    const mpFromMicrobes = rdp * 0.85 * 0.64;
    // MP from bypass = RUP × %80 bağırsak sindirilebilirliği
    const mpFromRup = rup * 0.80;
    const mp = mpFromMicrobes + mpFromRup;
    totalProtein += mp;

    // ── Ortak metrikler ──
    totalFiber += dmKg * (feed.fb / 100);
    totalCB += dmKg * (feed.cb / 100);
    totalEnergyFromProtein += cpGrams * 0.004; // 1g protein ≈ 4 kcal → 0.004 Mcal
    totalEnergyFromCarbs += dmKg * (feed.cb / 100) * 4;

    totalKdWeighted += dmKg * kd;
    totalNdfdWeighted += dmKg * ndfd;
    syncNumerator += dmKg * kd;
    syncDenominator += dmKg;
  });

  const shared = calcSharedMetrics(totalDM, totalKesifDM, totalCB, totalEnergyFromProtein, totalEnergyFromCarbs);

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
      const dmKg = convertToDM(Number(item.amount) || 0, feed.dm);
      const diff = (feed.kd || 8) - avgKdVal;
      variance += dmKg * diff * diff;
    });
    variance /= syncDenominator;
    // Düşük standart sapma → yüksek skor
    syncScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 8));
  }

  return {
    asFed: totalAsFed, dm: totalDM, energy: totalEnergy, protein: totalProtein,
    fiber: totalFiber, cb: totalCB,
    avgKd, avgNdfd, syncScore,
    ...shared,
  };
};

export const cncpsEstimateGCAA = (weight, totalEnergy, totalProtein) => {
  if (!weight || weight <= 0) return 0;

  // Enerji bazlı (ME — NRC ile aynı birim)
  const mEm = weight * 0.035;
  const availableE = totalEnergy - mEm;
  const gcaaFromEnergy = availableE > 0
    ? availableE / (weight * 0.015)
    : availableE / (weight * 0.010);

  // Protein bazlı (MP)
  const metabolicWeight = Math.pow(weight, 0.75);
  const mpMaintenance = 3.8 * metabolicWeight;
  const availableP = totalProtein - mpMaintenance;
  const gcaaFromProtein = availableP > 0 ? availableP / 305 : availableP / 220;

  return Math.max(-2, Math.min(3, Math.min(gcaaFromEnergy, gcaaFromProtein)));
};

// ─────────────────────────────────────────────
//  D I S P A T C H E R
// ─────────────────────────────────────────────
export const getTheoryFunctions = (theory) => {
  switch (theory) {
    case 'inra':
      return {
        calculateRequirements: inraRequirements,
        calculateRationTotals: inraRationTotals,
        estimateGCAA: inraEstimateGCAA,
        meta: THEORY_META.inra,
      };
    case 'cncps':
      return {
        calculateRequirements: cncpsRequirements,
        calculateRationTotals: cncpsRationTotals,
        estimateGCAA: cncpsEstimateGCAA,
        meta: THEORY_META.cncps,
      };
    case 'nrc':
    default:
      return {
        calculateRequirements: nrcRequirements,
        calculateRationTotals: nrcRationTotals,
        estimateGCAA: nrcEstimateGCAA,
        meta: THEORY_META.nrc,
      };
  }
};
