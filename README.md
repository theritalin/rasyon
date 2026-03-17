# Rasyon Hazırlama MicroSaaS

Büyükbaş hayvanlar için dinamik, tarayıcı tabanlı rasyon (yem reçetesi) hesaplama uygulaması. Tamamen *client-side* (kullanıcı tarayıcısında) çalışır, veritabanı kurulumu gerektirmez.

## Kurulum ve Çalıştırma
```bash
npm install
npm run dev
```
Uygulama yerel sunucuda (genellikle `http://localhost:5173`) ayağa kalkacaktır.

## Özellikler
- **Yerel Hafıza (Local Storage):** Uygulamadaki hayvan kilosu, hedef GCAA (Günlük Canlı Ağırlık Artışı), eklenen yem kaynakları ve güncel rasyon bilgileri tarayıcınızın yerel hafızasında saklanır. Sayfayı yenileseniz veya sekme kapansanız dahi verileriniz kaybolmaz. Rasyonu sıfırlamak için "Rasyonu Temizle" butonunu kullanabilirsiniz.
- **Dinamik Hesaplama:** Canlı ağırlık ve yaşama payına göre anında enerji ve protein ihtiyacı hesaplanır.
- **Kişiselleştirilebilir Yem Veritabanı:** 16 kaba ve kesif yem önceden yüklenmiştir, kendi laboratuvar/analiz değerlerinize göre oranları düzenleyebilirsiniz.
- **Çoklu Teori Desteği:** NRC, INRA ve CNCPS hesaplama teorilerinden istediğinizi seçerek rasyonunuzu değerlendirebilirsiniz.

---

## Ortak Hesaplamalar (Tüm Teoriler)

Aşağıdaki hesaplamalar teori farkı gözetmeksizin her üç sistemde de aynı şekilde uygulanır:

### Kuru Madde Dönüşümü
Yem miktarı "as-fed" (yedirilen, yaş) bazda girilir ve kuru madde yüzdesine göre dönüştürülür:
```
KM (kg) = Yedirilen Miktar (kg) × (KM% / 100)
```
**Örnek:** 10 kg Mısır Silajı (KM=%30) → `10 × 0.30 = 3.0 kg KM`

### Lif / Selüloz İhtiyacı
İşkembe fonksiyonlarının sağlıklı çalışması ve laktik asidoz riskinin önlenmesi için minimum lif gereksinimi:
```
Min Lif (kg) = Canlı Ağırlık × 0.006
```
**Örnek:** 500 kg hayvan → `500 × 0.006 = 3.0 kg saf lif`

### Karbonhidrat ve Asidoz Riski
Rasyondaki NFC (Non-Fiber Carbohydrates) oranı **Kuru Maddenin maksimum %45'i** olarak sınırlandırılır.

### Sodyum Bikarbonat (Soda) İhtiyacı
Kesif yem oranı toplam KM'nin **%55'ini** aşarsa asidoz riski vardır:
```
Soda (g/gün) = Kesif Yem KM (kg) × 0.012 × 1000
```
**Örnek:** 6 kg kesif yem KM → `6 × 0.012 × 1000 = 72 g/gün`

### Enerji Kaynak Dağılımı
```
1 gram Protein   ≈ 4 kcal
1 gram Karbonhidrat ≈ 4 kcal
```
Bu katsayılarla toplam enerjinin protein ve karbonhidrat kaynaklı oranları hesaplanır.

### Tahmini GCAA Hesaplaması (Genel Mantık)
Her teori kendi birim ve formüllerini kullanır, ancak mantık aynıdır:
1. Rasyondan gelen toplam enerji ve proteinden **yaşama payı** düşülür
2. Kalan miktar, büyüme formülüne tersten yerleştirilir → enerji bazlı GCAA ve protein bazlı GCAA hesaplanır
3. **En düşük olan** değer tahmini GCAA olarak gösterilir (sınırlayıcı besin prensibi)
4. Sonuç `-2` ile `+3` kg arasında sınırlandırılır

---

# TEORİ 1: NRC (National Research Council) 🇺🇸

**Amerikan Sistemi – Metabolize Olabilir Enerji (ME)**

Hayvanı bir makine gibi görür: "X kadar ağırlık, Y kadar artış istiyorsa, Z kadar enerji vermelisin" der. En yaygın ve en basit sistemdir.

## 1.1 Enerji Gereksinimi (ME – Mcal/gün)

**A) Yaşama Payı:**
```
MEm = Canlı Ağırlık (kg) × 0.035
```

**B) Büyüme Payı:**
```
MEg = Hedef GCAA (kg) × (Canlı Ağırlık × 0.015)
```

**Toplam:**
```
Toplam ME = MEm + MEg
```

**Örnek (500 kg, 1.5 kg GCAA hedefi):**
```
MEm = 500 × 0.035 = 17.50 Mcal
MEg = 1.5 × (500 × 0.015) = 1.5 × 7.5 = 11.25 Mcal
Toplam = 28.75 Mcal/gün
```

## 1.2 Protein Gereksinimi (Ham Protein – kg/gün)

**A) Yaşama Payı:**
```
HPm = Canlı Ağırlık (kg) × 0.001
```

**B) Büyüme Payı:**
```
HPg = Hedef GCAA (kg) × 0.35
```

**Toplam:**
```
Toplam HP = HPm + HPg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
HPm = 500 × 0.001 = 0.50 kg
HPg = 1.5 × 0.35 = 0.525 kg
Toplam = 1.025 kg/gün
```

## 1.3 Rasyondan Sağlanan Enerji ve Protein

Her yem için:
```
ME katkısı (Mcal) = KM (kg) × Yemin ME değeri (Mcal/kg KM)
HP katkısı (kg)   = KM (kg) × (Yemin HP% / 100)
```

**Örnek — 3 kg Arpa (KM=%88, ME=3.1 Mcal, HP=%11):**
```
KM  = 3 × 0.88 = 2.64 kg
ME  = 2.64 × 3.1 = 8.18 Mcal
HP  = 2.64 × (11/100) = 0.29 kg
```

## 1.4 Tahmini GCAA

```
Enerji bazlı GCAA = (Toplam ME – MEm) / (CA × 0.015)
Protein bazlı GCAA = (Toplam HP – HPm) / 0.35
Tahmini GCAA = min(Enerji bazlı, Protein bazlı)
```

**Örnek (500kg, rasyon: 25 Mcal ME, 0.9 kg HP):**
```
GCAA_enerji  = (25 – 17.5) / 7.5 = 1.0 kg
GCAA_protein = (0.9 – 0.5) / 0.35 = 1.14 kg
Tahmini GCAA = min(1.0, 1.14) = 1.0 kg (enerji sınırlayıcı)
```

> **Not:** Kilo kaybı durumunda (negatif değer) farklı katsayılar uygulanır:
> Enerji bazlı kayıp = fazla / (CA × 0.010), Protein bazlı kayıp = fazla / 0.25

---

# TEORİ 2: INRA (Institut National de la Recherche Agronomique) 🇫🇷

**Avrupa / Fransız Sistemi – Net Enerji (UFB) + PDI Protein**

NRC'den daha "garantici" bir sistemdir. Enerji için **UFB** (Unite Fourragère Viande = et birimi) kullanır. Proteini ham protein yerine **PDI** (Protéines Digestibles dans l'Intestin) sistemiyle daha detaylı hesaplar.

## 2.1 Enerji Gereksinimi (UFB/gün)

**A) Yaşama Payı:**
```
UFBm = 1.4 + 0.006 × Canlı Ağırlık
```

**B) Büyüme Payı:**
```
UFBg = Hedef GCAA × 3.2
```

**Toplam:**
```
Toplam UFB = UFBm + UFBg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
UFBm = 1.4 + 0.006 × 500 = 1.4 + 3.0 = 4.40 UFB
UFBg = 1.5 × 3.2 = 4.80 UFB
Toplam = 9.20 UFB/gün
```

## 2.2 Protein Gereksinimi (PDI – g/gün)

INRA'da protein "Ham Protein" değil, **PDI** olarak ifade edilir. PDI = bağırsakta gerçekten sindirilen protein miktarıdır.

PDI iki kaynaktan gelir:
- **PDIE** (enerji bazlı): Rasyondaki enerjiye göre işkembede üretilebilecek mikrobik protein + bypass protein
- **PDIN** (azot bazlı): Rasyondaki azota (proteine) göre işkembede üretilebilecek mikrobik protein + bypass protein

**A) Yaşama Payı:**
```
PDIm = 3.25 × CA^0.75
```
> `CA^0.75` = metabolik ağırlık. 500 kg için: `500^0.75 = 105.7`

**B) Büyüme Payı:**
```
PDIg = Hedef GCAA × 280
```

**Toplam:**
```
Toplam PDI = PDIm + PDIg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
PDIm = 3.25 × 105.7 = 343.6 g
PDIg = 1.5 × 280 = 420.0 g
Toplam = 763.6 g/gün
```

## 2.3 Rasyondan Sağlanan Enerji ve Protein

**Enerji** — her yem için:
```
UFB katkısı = KM (kg) × Yemin UFB değeri (UFB/kg KM)
```

**Protein** — INRA'nın en kritik farkı burasıdır:
1. Her yem için PDIE ve PDIN ayrı ayrı toplanır:
```
Toplam PDIE = Σ (KM_i × PDIE_i)    (her yem için)
Toplam PDIN = Σ (KM_i × PDIN_i)    (her yem için)
```
2. Rasyonun efektif PDI'sı **rasyon düzeyinde** belirlenir:
```
Efektif PDI = min(Toplam PDIE, Toplam PDIN)
```

> **Neden rasyon düzeyinde min?** Çünkü bir yemin düşük PDIN'i, başka bir yemin yüksek PDIN'i ile dengelenebilir. Yem başına min almak hatalıdır!

**Örnek — 3 kg Arpa (KM=%88, UFB=1.11, PDIE=101, PDIN=78) + 0.5 kg Soya K. (KM=%89, UFB=1.10, PDIE=169, PDIN=327):**
```
Arpa KM  = 3 × 0.88 = 2.64 kg
Soya KM  = 0.5 × 0.89 = 0.445 kg

UFB toplam = (2.64 × 1.11) + (0.445 × 1.10) = 2.93 + 0.49 = 3.42 UFB

PDIE toplam = (2.64 × 101) + (0.445 × 169) = 266.6 + 75.2 = 341.8 g
PDIN toplam = (2.64 × 78) + (0.445 × 327) = 205.9 + 145.5 = 351.4 g

Efektif PDI = min(341.8, 351.4) = 341.8 g  → PDIE sınırlayıcı (enerji yetersiz)
```

## 2.4 Tahmini GCAA

```
GCAA_enerji  = (Toplam UFB – UFBm) / 3.2
GCAA_protein = (Efektif PDI – PDIm) / 280
Tahmini GCAA = min(GCAA_enerji, GCAA_protein)
```

> Kilo kaybı durumunda: enerji / 2.5, protein / 200

## 2.5 Yem Veritabanındaki INRA Değerleri

| Yem | UFB | PDIE (g/kg KM) | PDIN (g/kg KM) |
|-----|-----|----------------|----------------|
| Arpa (Dane) | 1.11 | 101 | 78 |
| Mısır (Dane) | 1.22 | 90 | 64 |
| Buğday (Dane) | 1.16 | 103 | 85 |
| Soya Küspesi (44%) | 1.10 | 169 | 327 |
| Ayçiçeği Küspesi | 0.74 | 109 | 192 |
| Pamuk T. Küspesi | 0.99 | 150 | 290 |
| Buğday Kepeği | 0.91 | 99 | 109 |
| Mısır Silajı | 0.90 | 68 | 47 |
| Yonca Kuru Otu | 0.78 | 93 | 107 |
| Buğday Samanı | 0.45 | 47 | 21 |
| Fiğ Kuru Otu | 0.75 | 88 | 100 |
| Çayır Kuru Otu | 0.67 | 75 | 63 |
| Pancar Küspesi | 1.02 | 94 | 59 |
| Arpa Samanı | 0.47 | 50 | 23 |
| Besi Yemi (%20) | 1.00 | 120 | 135 |
| Buzağı Yemi | 1.04 | 115 | 122 |

---

# TEORİ 3: CNCPS (Cornell Net Carbohydrate and Protein System) 🔬

**Cornell Sistemi – Sindirim Hızı + Metabolik Protein (MP)**

En detaylı ve "hassas terazi" niteliğindeki sistemdir. Sadece "ne kadar" yendiğine değil, "ne kadar hızlı" sindirildiğine bakar. Protein'i işkembede parçalanan (RDP) ve kaçan (RUP = bypass) olarak ikiye ayırır.

## 3.1 Enerji Gereksinimi (ME – Mcal/gün)

CNCPS'te enerji gereksinimi NRC ile aynı birimde (ME, Mcal) hesaplanır:
```
MEm = Canlı Ağırlık × 0.035
MEg = Hedef GCAA × (Canlı Ağırlık × 0.015)
Toplam ME = MEm + MEg
```
> NRC ile aynı formül. Fark, rasyondan sağlanan enerjinin hesaplanmasındadır (NDFD düzeltmesi).

## 3.2 Protein Gereksinimi (Metabolik Protein – g/gün)

CNCPS ham protein yerine **MP (Metabolizable Protein)** kullanır = bağırsakta gerçekten emilen amino asitler.

**A) Yaşama Payı:**
```
MPm = 3.8 × CA^0.75
```

**B) Büyüme Payı:**
```
MPg = Hedef GCAA × 305
```

**Toplam:**
```
Toplam MP = MPm + MPg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
MPm = 3.8 × 105.7 = 401.7 g
MPg = 1.5 × 305 = 457.5 g
Toplam = 859.2 g/gün
```

## 3.3 Rasyondan Sağlanan Enerji (NDFD Düzeltmeli ME)

CNCPS, NRC ME değerini alır ve yemin **NDF sindirebilirliğine (NDFD)** göre hafif bir düzeltme uygular. Lif sindirebilirliği yüksek yemler biraz daha fazla enerji sağlar:

```
NDFD Düzeltme Katsayısı = 1 + (NDFD − 45) × 0.002
Düzeltilmiş ME = KM (kg) × ME (Mcal/kg KM) × NDFD Düzeltme Katsayısı
```

> NDFD=45 olan yemler için katsayı = 1.0 (düzeltme yok). Bu düzeltme ±%5 civarındadır.

| NDFD | Katsayı | Etki |
|------|---------|------|
| 28 (Saman) | 0.966 | ME %3.4 azalır |
| 45 (Ortalama) | 1.000 | Değişiklik yok |
| 52 (Silaj) | 1.014 | ME %1.4 artar |
| 72 (Pancar Küspesi) | 1.054 | ME %5.4 artar |

**Örnek — 3 kg Arpa (KM=%88, ME=3.1, NDFD=45):**
```
KM = 3 × 0.88 = 2.64 kg
Katsayı = 1 + (45 − 45) × 0.002 = 1.000
Düzeltilmiş ME = 2.64 × 3.1 × 1.000 = 8.18 Mcal
```

**Örnek — 10 kg Mısır Silajı (KM=%30, ME=2.5, NDFD=52):**
```
KM = 10 × 0.30 = 3.00 kg
Katsayı = 1 + (52 − 45) × 0.002 = 1.014
Düzeltilmiş ME = 3.00 × 2.5 × 1.014 = 7.61 Mcal (NRC'de 7.50)
```

## 3.4 Rasyondan Sağlanan Protein (RDP/RUP → MP)

Bu, CNCPS'in en önemli farkıdır. Proteini 3 fraksiyona ayırır:

| Fraksiyon | Açıklama | Oran |
|-----------|----------|------|
| **A** | Hemen çözünen (NPN vs.) | %20 |
| **B** | Yavaş sindirimli (gerçek protein) | %65 |
| **C** | Sindirilmez (ADIN bağlı) | %15 |

Her yem için hesaplama adımları:

### Adım 1: Passage Rate (kp) Belirleme
```
Kesif yemler: kp = 5 %/saat
Kaba yemler:  kp = 3.5 %/saat
```

### Adım 2: RDP ve RUP Hesabı
```
HP (g) = KM (kg) × (HP% / 100) × 1000

RDP oranı = A + B × kd / (kd + kp) = 0.20 + 0.65 × kd / (kd + kp)
RDP (g) = HP × RDP oranı

RUP oranı = B × kp / (kd + kp) = 0.65 × kp / (kd + kp)
RUP (g) = HP × RUP oranı
```
> `kd` = yemin protein sindirim hızı (%/saat), yem veritabanından gelir.
> C fraksiyonu (%15) ne RDP'ye ne RUP'a girer → kayıptır.

### Adım 3: Mikrobik Protein (MCP) → MP
İşkembede parçalanan protein (RDP) kullanılarak mikrobik proteine dönüştürülür:
```
MCP = RDP × 0.85            (RDP'nin %85'i mikroplar tarafından yakalanır)
MP_mikrobik = MCP × 0.64    (%80 gerçek protein × %80 sindirilebilirlik = %64)
```

### Adım 4: Bypass Protein → MP
İşkembeden kaçan protein (RUP) doğrudan bağırsakta sindirilir:
```
MP_bypass = RUP × 0.80      (%80 bağırsak sindirilebilirliği)
```

### Adım 5: Toplam MP
```
MP = MP_mikrobik + MP_bypass
```

**Tam Örnek — 3 kg Arpa (KM=%88, HP=%11, kd=14%/saat, Kesif):**
```
KM = 3 × 0.88 = 2.64 kg
HP = 2.64 × (11/100) × 1000 = 290.4 g
kp = 5 (kesif yem)

RDP oranı = 0.20 + 0.65 × 14/(14+5) = 0.20 + 0.65 × 0.737 = 0.679
RDP = 290.4 × 0.679 = 197.2 g

RUP oranı = 0.65 × 5/(14+5) = 0.65 × 0.263 = 0.171
RUP = 290.4 × 0.171 = 49.7 g

MP_mikrobik = 197.2 × 0.85 × 0.64 = 107.3 g
MP_bypass   = 49.7 × 0.80 = 39.8 g
MP_toplam   = 107.3 + 39.8 = 147.1 g
```

**Tam Örnek — 0.5 kg Soya Küspesi (KM=%89, HP=%44, kd=8%/saat, Kesif):**
```
KM = 0.5 × 0.89 = 0.445 kg
HP = 0.445 × (44/100) × 1000 = 195.8 g
kp = 5 (kesif yem)

RDP oranı = 0.20 + 0.65 × 8/(8+5) = 0.20 + 0.65 × 0.615 = 0.600
RDP = 195.8 × 0.600 = 117.4 g

RUP oranı = 0.65 × 5/(8+5) = 0.65 × 0.385 = 0.250
RUP = 195.8 × 0.250 = 49.0 g

MP_mikrobik = 117.4 × 0.85 × 0.64 = 63.9 g
MP_bypass   = 49.0 × 0.80 = 39.2 g
MP_toplam   = 63.9 + 39.2 = 103.1 g
```

## 3.5 Senkronizasyon Skoru

CNCPS'in eşsiz özelliği: rasyondaki farklı yemlerin sindirim hızlarının (kd) ne kadar uyumlu olduğunu ölçer.

```
Ortalama kd = Σ(KM_i × kd_i) / Toplam KM
Varyans = Σ(KM_i × (kd_i − Ortalama kd)²) / Toplam KM
Senkronizasyon Skoru = max(0, min(100, 100 − √Varyans × 8))
```

- **Skor > 70**: İyi — enerji ve protein aynı anda çözünüyor
- **Skor 40-70**: Orta — iyileştirme fırsatı var
- **Skor < 40**: Kötü — protein idrarla atılıyor olabilir, yem kombinasyonunu gözden geçirin

## 3.6 Tahmini GCAA

```
GCAA_enerji  = (Toplam Düzeltilmiş ME – MEm) / (CA × 0.015)
GCAA_protein = (Toplam MP – MPm) / 305
Tahmini GCAA = min(GCAA_enerji, GCAA_protein)
```

> Kilo kaybı durumunda: enerji / (CA × 0.010), protein / 220

## 3.7 Yem Veritabanındaki CNCPS Değerleri

| Yem | kd (%/saat) | NDFD (%) | Açıklama |
|-----|-------------|----------|----------|
| Arpa (Dane) | 14 | 45 | Orta hızda protein çözünürlüğü |
| Mısır (Dane) | 5 | 40 | Yavaş — bypass proteini yüksek |
| Buğday (Dane) | 16 | 42 | Hızlı çözünen |
| Soya Küspesi (44%) | 8 | 65 | Orta hız, yüksek lif sindirebilirlik |
| Ayçiçeği Küspesi | 7 | 35 | |
| Pamuk T. Küspesi | 6 | 40 | Gossypol etkisiyle yavaş |
| Buğday Kepeği | 10 | 50 | |
| Mısır Silajı | 5 | 52 | İyi NDF sindirebilirlik |
| Yonca Kuru Otu | 7 | 48 | |
| Buğday Samanı | 3 | 28 | Çok yavaş, düşük sindirilebilirlik |
| Fiğ Kuru Otu | 6 | 46 | |
| Çayır Kuru Otu | 5 | 42 | |
| Pancar Küspesi | 8 | 72 | En yüksek NDF sindirebilirlik |
| Arpa Samanı | 3 | 30 | |
| Besi Yemi (%20) | 9 | 50 | Hazır karma yem |
| Buzağı Yemi | 10 | 52 | |

---

# Teoriler Arası Karşılaştırma

| Özellik | NRC 🇺🇸 | INRA 🇫🇷 | CNCPS 🔬 |
|---------|---------|----------|----------|
| **Enerji birimi** | ME (Mcal) | UFB (birim) | Düzeltilmiş ME (Mcal) |
| **Enerji hesabı** | KM × ME | KM × UFB | KM × ME × NDFD katsayısı |
| **Protein birimi** | HP (kg) | PDI (g) | MP (g) |
| **Protein hesabı** | KM × HP% | min(Σ PDIE, Σ PDIN) | RDP→MCP + RUP→Bypass |
| **Kolaylık** | ★★★ Çok kolay | ★★ Orta | ★ Karmaşık |
| **Hassasiyet** | ★★ Orta | ★★ Orta-İyi | ★★★ Yüksek |
| **En iyi kullanım** | Genel besi, hızlı kontrol | AB uyumu, güvenli marj | Hassas optimizasyon |

### 500 kg hayvan, 1.5 kg GCAA hedefi — Gereksinim karşılaştırması:

| Gereksinim | NRC | INRA | CNCPS |
|-----------|-----|------|-------|
| Enerji (yaşama) | 17.5 Mcal | 4.4 UFB | 17.5 Mcal |
| Enerji (büyüme) | 11.25 Mcal | 4.8 UFB | 11.25 Mcal |
| **Enerji (toplam)** | **28.75 Mcal** | **9.2 UFB** | **28.75 Mcal** |
| Protein (yaşama) | 0.5 kg | 344 g | 402 g |
| Protein (büyüme) | 0.525 kg | 420 g | 458 g |
| **Protein (toplam)** | **1.025 kg** | **764 g** | **860 g** |
