// Approximate formulas for calculation

export const convertToDM = (asFedKg, dmPercentage) => {
  return asFedKg * (dmPercentage / 100);
};

export const calculateRequirements = (weight, targetGcaa) => {
  if (!weight || weight <= 0) return { me: 0, cp: 0, minFiber: 0, cb: 0 };
  
  // Mcal
  const mEm = weight * 0.035;
  const mEg = (targetGcaa || 0) * (weight * 0.015);
  const totalMe = mEm + mEg;

  // Kg protein
  const cPm = weight * 0.001;
  const cPg = (targetGcaa || 0) * 0.35;
  const totalCp = cPm + cPg;

  // Minimum fiber in kg
  const minFiber = weight * 0.006;
  
  // Approximate carbohydrate requirement
  const cb = weight * 0.015 + ((targetGcaa || 0) * 1.5);

  return {
    me: totalMe,
    cp: totalCp,
    minFiber,
    cb
  };
};

export const calculateRationTotals = (rationItems, feedsDb) => {
  let totalAsFed = 0;
  let totalDM = 0;
  let totalME = 0;
  let totalCP = 0;
  let totalFiber = 0;
  let totalCB = 0;
  
  // Advanced metrics
  let totalKesifDM = 0;
  let totalKabaDM = 0;
  let totalEnergyFromCarbs = 0; // Estimation
  let totalEnergyFromProtein = 0; // Estimation

  rationItems.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId);
    if (!feed) return;

    const kg = Number(item.amount) || 0;
    totalAsFed += kg;
    
    // Amount of Dry Matter (KM)
    const dmKg = convertToDM(kg, feed.dm);
    totalDM += dmKg;
    
    if (feed.type === 'kesif') totalKesifDM += dmKg;
    if (feed.type === 'kaba') totalKabaDM += dmKg;

    // ME in Mcal (Energy density is per 1kg of DM)
    const feedME = dmKg * feed.me;
    totalME += feedME;

    // CP in Kg (Protein % of DM)
    const feedCP = dmKg * (feed.cp / 100);
    totalCP += feedCP;

    // Approximate metabolic contribution (1g Protein ~ 4kcal ME, 1g Carbs ~ 4kcal ME)
    // 1 kg Protein -> 4 Mcal, 1 kg Carbs -> 4Mcal (Rough estimation for breakdown ratio)
    totalEnergyFromProtein += feedCP * 4;
    totalEnergyFromCarbs += dmKg * (feed.cb / 100) * 4;

    // Fiber in Kg (% of DM)
    totalFiber += dmKg * (feed.fb / 100);

    // Carbs in Kg (% of DM) (Representing Starch/Sugar/NFC generally)
    totalCB += dmKg * (feed.cb / 100);
  });
  
  // Calculate buffer/soda requirement based on Concentrate:Roughage ratio
  let recommendedSoda = 0;
  const kesifRatio = totalDM > 0 ? (totalKesifDM / totalDM) * 100 : 0;
  
  // Very rough guide: if concentrate > 55% of DM, add buffer. 
  // Typically 50-100g per 100kg bodyweight or 1% of concentrate DM.
  if (kesifRatio > 55 && totalKesifDM > 0) {
    // 1.2% of concentrate intake as buffer is a common safety net for high-grain diets
    recommendedSoda = totalKesifDM * 0.012 * 1000; // In grams
  }

  // Energy source percentages
  const totalCalculatedEnergy = totalEnergyFromProtein + totalEnergyFromCarbs;
  const energyPercentProtein = totalCalculatedEnergy > 0 ? (totalEnergyFromProtein / totalCalculatedEnergy) * 100 : 0;
  const energyPercentCarbs = totalCalculatedEnergy > 0 ? (totalEnergyFromCarbs / totalCalculatedEnergy) * 100 : 0;

  return {
    asFed: totalAsFed,
    dm: totalDM,
    me: totalME,
    cp: totalCP,
    fiber: totalFiber,
    cb: totalCB,
    kesifRatio,
    recommendedSoda, // in grams
    energyPercentProtein,
    energyPercentCarbs
  };
};

export const estimateGCAA = (weight, totalProvidedME, totalProvidedCP) => {
  if (!weight || weight <= 0) return 0;

  const mEm = weight * 0.035;
  const availableMeForGain = totalProvidedME - mEm;
  
  const cPm = weight * 0.001;
  const availableCpForGain = totalProvidedCP - cPm;

  let gcaaFromEnergy = 0;
  if (availableMeForGain > 0) {
    gcaaFromEnergy = availableMeForGain / (weight * 0.015);
  } else if (availableMeForGain < 0) {
    // Loss
    gcaaFromEnergy = availableMeForGain / (weight * 0.010); // Less penalty for weight loss
  }

  let gcaaFromProtein = 0;
  if (availableCpForGain > 0) {
    gcaaFromProtein = availableCpForGain / 0.35;
  } else if (availableCpForGain < 0) {
    gcaaFromProtein = availableCpForGain / 0.25;
  }

  // Animal growth is bottlenecked by the lowest providing nutrient
  const estimated = Math.min(gcaaFromEnergy, gcaaFromProtein);
  
  // Cap at realistic maximums
  return Math.max(-2, Math.min(3, estimated));
};
