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
export const nrcRequirements = ({ weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0, targetDM: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let totalMe = weight * 0.035; // Mcal yaşama payı (mEm)
  let totalCp = weight * 0.001; // kg yaşama payı (cPm)

  if (isBesi) {
    totalMe += (targetGcaa || 0) * (weight * 0.015);
    totalCp += (targetGcaa || 0) * 0.35;
  }

  if (isLactating) {
    // Süt için enerji (ME) = Süt verimi * Süt enerjisi
    // %3.5 yağlı süt için yaklaşık 0.7 Mcal ME/kg
    const milkMe = milkYield * (0.4 + (milkFat * 0.085)); // Basit NRC tahmini
    totalMe += milkMe;
    
    // Süt için protein (HP) = ~85g / kg süt (0.085 kg)
    const milkCp = milkYield * 0.085;
    totalCp += milkCp;
  }

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      // Gebeliğin son 3 ayı için ek gereksinimler
      totalMe += 3.0; // Mcal/gün
      totalCp += 0.250; // kg/gün (250g)
    } else {
      // İlk 6 ay için çok düşük, hafif eklenebilir veya 0
      totalMe += 0.5;
      totalCp += 0.050;
    }
  }

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + (isBesi ? ((targetGcaa || 0) * 1.5) : (milkYield * 0.05));
  
  // Hedef Kuru Madde (KM) Tüketimi
  let targetDM = weight * 0.025; // Besi için %2.5
  if (isLactating) {
    // Sağmal inekler canlı ağırlıklarının %3 - %4'ü kadar KM tüketebilir
    targetDM = (weight * 0.02) + (milkYield * 0.3); // NRC'ye yakın bir tahmin
  }

  return { energy: totalMe, protein: totalCp, minFiber, cb, targetDM };
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

export const nrcEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };
  
  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let mEm = weight * 0.035;
  let cPm = weight * 0.001;

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      mEm += 3.0;
      cPm += 0.250;
    } else {
      mEm += 0.5;
      cPm += 0.050;
    }
  }

  const availableE = energy - mEm;
  const availableP = protein - cPm;

  if (isBesi || animalType === 'kuru_gebe') {
    const gcaaE = availableE > 0 ? availableE / (weight * 0.015) : availableE / (weight * 0.010);
    const gcaaP = availableP > 0 ? availableP / 0.35 : availableP / 0.25;
    return { gcaa: Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP))), milk: 0 };
  } else {
    // Lactating
    const energyPerKgMilk = 0.4 + ((milkFat || 3.5) * 0.085);
    const proteinPerKgMilk = 0.085;
    
    const milkE = availableE > 0 ? availableE / energyPerKgMilk : 0;
    const milkP = availableP > 0 ? availableP / proteinPerKgMilk : 0;
    return { gcaa: 0, milk: Math.max(0, Math.min(milkE, milkP)) };
  }
};

// ═══════════════════════════════════════════════
//  I N R A   (Net Enerji – UFB + PDI)
//
//  Temel fark: Enerji "UFB" birimi, protein "PDI" sistemi.
//  PDI = min(toplam PDIE, toplam PDIN) — rasyon düzeyinde!
// ═══════════════════════════════════════════════
export const inraRequirements = ({ weight, targetGcaa, animalType, milkYield, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0, targetDM: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  // UFB gereksinimi
  let totalUfb = 1.4 + 0.006 * weight; // Yaşama payı

  // PDI gereksinimi (g/gün)
  const metabolicWeight = Math.pow(weight, 0.75);
  let totalPdi = 3.25 * metabolicWeight; // Yaşama payı

  if (isBesi) {
    totalUfb += (targetGcaa || 0) * 3.2; // Büyüme payı (UFB)
    totalPdi += (targetGcaa || 0) * 280; // Büyüme payı (PDI)
  }

  if (isLactating) {
    // 1 kg %4 yağlı süt = ~0.44 UFL (INRA'da süt için UFL kullanılır ama basitlik için UFB ile entegre edelim)
    const milkEnergy = milkYield * (0.35 + (milkFat * 0.02)); // UFB/UFL yaklaşımı
    totalUfb += milkEnergy;
    
    // Süt PDI gereksinimi: ~50g PDI / kg süt
    totalPdi += milkYield * 50;
  }

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      totalUfb += 2.0; // UFB
      totalPdi += 200; // g PDI
    } else {
      totalUfb += 0.3;
      totalPdi += 30;
    }
  }

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + (isBesi ? ((targetGcaa || 0) * 1.5) : (milkYield * 0.05));
  let targetDM = weight * 0.025;
  if (isLactating) {
    targetDM = (weight * 0.02) + (milkYield * 0.3);
  }

  return { energy: totalUfb, protein: totalPdi, minFiber, cb, targetDM };
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

export const inraEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };
  
  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let ufbMaintenance = 1.4 + 0.006 * weight;
  const metabolicWeight = Math.pow(weight, 0.75);
  let pdiMaintenance = 3.25 * metabolicWeight;

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      ufbMaintenance += 2.0;
      pdiMaintenance += 200;
    } else {
      ufbMaintenance += 0.3;
      pdiMaintenance += 30;
    }
  }

  const availableUfb = energy - ufbMaintenance;
  const availablePdi = protein - pdiMaintenance;

  if (isBesi || animalType === 'kuru_gebe') {
    const gcaaE = availableUfb > 0 ? availableUfb / 3.2 : availableUfb / 2.5;
    const gcaaP = availablePdi > 0 ? availablePdi / 280 : availablePdi / 200;
    return { gcaa: Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP))), milk: 0 };
  } else {
    // Lactating
    const energyPerKgMilk = 0.35 + ((milkFat || 3.5) * 0.02);
    const proteinPerKgMilk = 50;
    
    const milkE = availableUfb > 0 ? availableUfb / energyPerKgMilk : 0;
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
  if (!weight || weight <= 0) return { energy: 0, protein: 0, minFiber: 0, cb: 0, targetDM: 0 };

  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isLactating = animalType === 'sagmal' || animalType === 'gebe_sagmal';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let totalMe = weight * 0.035;
  const metabolicWeight = Math.pow(weight, 0.75);
  let totalMp = 3.8 * metabolicWeight; // g MP

  if (isBesi) {
    totalMe += (targetGcaa || 0) * (weight * 0.015);
    totalMp += (targetGcaa || 0) * 305;
  }

  if (isLactating) {
    // Süt için CNCPS: %3.5 yağ, ~0.7 Mcal ME
    const milkMe = milkYield * (0.4 + (milkFat * 0.085));
    totalMe += milkMe;
    
    // MP for milk: ~45g MP / kg milk (süt proteini için net)
    totalMp += milkYield * 45;
  }

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      totalMe += 3.0; // Mcal/gün
      totalMp += 150; // g MP/gün
    } else {
      totalMe += 0.5;
      totalMp += 20;
    }
  }

  const minFiber = weight * 0.006;
  const cb = weight * 0.015 + (isBesi ? ((targetGcaa || 0) * 1.5) : (milkYield * 0.05));
  
  let targetDM = weight * 0.025;
  if (isLactating) {
    targetDM = (weight * 0.02) + (milkYield * 0.3);
  }

  return { energy: totalMe, protein: totalMp, minFiber, cb, targetDM };
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

export const cncpsEstimateProduction = ({ weight, energy, protein, animalType, milkFat, pregnancyPeriod }) => {
  if (!weight || weight <= 0) return { gcaa: 0, milk: 0 };
  
  const isBesi = animalType === 'besi' || animalType === 'bos_duve';
  const isPregnant = animalType === 'gebe_sagmal' || animalType === 'kuru_gebe';

  let mEm = weight * 0.035;
  const metabolicWeight = Math.pow(weight, 0.75);
  let mpMaintenance = 3.8 * metabolicWeight;

  if (isPregnant) {
    if (pregnancyPeriod === 'son_3_ay') {
      mEm += 3.0;
      mpMaintenance += 150;
    } else {
      mEm += 0.5;
      mpMaintenance += 20;
    }
  }

  const availableE = energy - mEm;
  const availableP = protein - mpMaintenance;

  if (isBesi || animalType === 'kuru_gebe') {
    const gcaaE = availableE > 0 ? availableE / (weight * 0.015) : availableE / (weight * 0.010);
    const gcaaP = availableP > 0 ? availableP / 305 : availableP / 220;
    return { gcaa: Math.max(-2, Math.min(3, Math.min(gcaaE, gcaaP))), milk: 0 };
  } else {
    // Lactating
    const energyPerKgMilk = 0.4 + ((milkFat || 3.5) * 0.085);
    const proteinPerKgMilk = 45; // MP
    
    const milkE = availableE > 0 ? availableE / energyPerKgMilk : 0;
    const milkP = availableP > 0 ? availableP / proteinPerKgMilk : 0;
    return { gcaa: 0, milk: Math.max(0, Math.min(milkE, milkP)) };
  }
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
        estimateProduction: inraEstimateProduction,
        meta: THEORY_META.inra,
      };
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
