export const initialFeeds = [
  // Kesif Yemler (Concentrate Feeds)
  //   kd  = protein degradation rate (%/hr) for CNCPS
  //   ndfd = NDF digestibility (%) for CNCPS
  //   ufl = INRA süt net enerji birimi, ufv = INRA besi (et) net enerji birimi (/kg KM)
  //         UFV, UFL'den INRA (1988) verimlilik denklemleriyle türetilmiştir
  //   pdie/pdin = INRA digestible protein (g/kg DM)
  //   fb  = ham selüloz (% KM)
  //   cb  = azotsuz öz madde benzeri toplam karbonhidrat (% KM), enerji dağılımında kullanılır
  //   nfc = lif dışı karbonhidrat: nişasta + şeker (% KM) = 100 − NDF − HP − yağ − kül
  //         (NRC 2001 bileşim tablolarına göre yuvarlanmış; karma yemlerde tipik değer)
  { id: 1, name: 'Arpa (Dane)', type: 'kesif', dm: 88, cp: 11, me: 3.1, fb: 5, cb: 58, nfc: 62,
    ufl: 1.13, ufv: 1.12, pdie: 101, pdin: 78, kd: 14, ndfd: 45 },

  { id: 2, name: 'Mısır (Dane)', type: 'kesif', dm: 88, cp: 9, me: 3.2, fb: 2, cb: 65, nfc: 75,
    ufl: 1.22, ufv: 1.23, pdie: 90, pdin: 64, kd: 5, ndfd: 40 },

  { id: 3, name: 'Buğday (Dane)', type: 'kesif', dm: 88, cp: 12, me: 3.1, fb: 3, cb: 60, nfc: 68,
    ufl: 1.16, ufv: 1.16, pdie: 103, pdin: 85, kd: 16, ndfd: 42 },

  { id: 4, name: 'Soya Küspesi (44%)', type: 'kesif', dm: 89, cp: 44, me: 2.8, fb: 7, cb: 30, nfc: 26,
    ufl: 1.10, ufv: 1.08, pdie: 169, pdin: 327, kd: 8, ndfd: 65 },

  { id: 5, name: 'Ayçiçeği Küspesi (28%)', type: 'kesif', dm: 90, cp: 28, me: 1.8, fb: 24, cb: 20, nfc: 21,
    ufl: 0.74, ufv: 0.66, pdie: 109, pdin: 192, kd: 7, ndfd: 35 },

  { id: 6, name: 'Pamuk Tohumu Küspesi', type: 'kesif', dm: 90, cp: 41, me: 2.6, fb: 13, cb: 25, nfc: 15,
    ufl: 0.99, ufv: 0.95, pdie: 150, pdin: 290, kd: 6, ndfd: 40 },

  { id: 7, name: 'Buğday Kepeği', type: 'kesif', dm: 89, cp: 16, me: 2.4, fb: 10, cb: 45, nfc: 30,
    ufl: 0.91, ufv: 0.86, pdie: 99, pdin: 109, kd: 10, ndfd: 50 },

  // Kaba Yemler (Roughage Feeds)
  { id: 8, name: 'Mısır Silajı', type: 'kaba', dm: 30, cp: 8, me: 2.5, fb: 24, cb: 50, nfc: 39,
    ufl: 0.90, ufv: 0.84, pdie: 68, pdin: 47, kd: 5, ndfd: 52 },

  { id: 9, name: 'Yonca Kuru Otu', type: 'kaba', dm: 90, cp: 16, me: 2.1, fb: 26, cb: 35, nfc: 22,
    ufl: 0.78, ufv: 0.70, pdie: 93, pdin: 107, kd: 7, ndfd: 48 },

  { id: 10, name: 'Buğday Samanı', type: 'kaba', dm: 90, cp: 4, me: 1.4, fb: 40, cb: 40, nfc: 13,
    ufl: 0.45, ufv: 0.33, pdie: 47, pdin: 21, kd: 3, ndfd: 28 },

  { id: 11, name: 'Fiğ Kuru Otu', type: 'kaba', dm: 88, cp: 15, me: 2.0, fb: 25, cb: 35, nfc: 24,
    ufl: 0.75, ufv: 0.67, pdie: 88, pdin: 100, kd: 6, ndfd: 46 },

  { id: 12, name: 'Çayır Kuru Otu', type: 'kaba', dm: 88, cp: 10, me: 1.8, fb: 30, cb: 40, nfc: 19,
    ufl: 0.67, ufv: 0.58, pdie: 75, pdin: 63, kd: 5, ndfd: 42 },

  { id: 13, name: 'Pancar Küspesi (Posası, Kuru)', type: 'kesif', dm: 90, cp: 9, me: 2.5, fb: 19, cb: 60, nfc: 36,
    ufl: 1.02, ufv: 0.99, pdie: 94, pdin: 59, kd: 8, ndfd: 72 },

  { id: 14, name: 'Arpa Samanı', type: 'kaba', dm: 90, cp: 4, me: 1.5, fb: 42, cb: 40, nfc: 14,
    ufl: 0.47, ufv: 0.35, pdie: 50, pdin: 23, kd: 3, ndfd: 30 },

  { id: 15, name: 'Besi Yemi (%20 HP)', type: 'kesif', dm: 88, cp: 20, me: 2.7, fb: 8, cb: 50, nfc: 40,
    ufl: 1.00, ufv: 0.96, pdie: 120, pdin: 135, kd: 9, ndfd: 50 },

  { id: 16, name: 'Buzağı Büyütme Yemi', type: 'kesif', dm: 88, cp: 18, me: 2.8, fb: 7, cb: 55, nfc: 42,
    ufl: 1.04, ufv: 1.01, pdie: 115, pdin: 122, kd: 10, ndfd: 52 },

  { id: 17, name: 'Süt Yemi (%19 HP)', type: 'kesif', dm: 88, cp: 19, me: 2.7, fb: 8, cb: 45, nfc: 38,
    ufl: 1.02, ufv: 0.99, pdie: 118, pdin: 130, kd: 9, ndfd: 50 },
];
