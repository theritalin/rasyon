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
- **Kişiselleştirilebilir Yem Veritabanı:** 17 kaba ve kesif yem önceden yüklenmiştir. Tüm değerleri (INRA ve CNCPS alanları dahil) kendi analizlerinize göre düzenleyebilir, yeni yem ekleyebilir veya varsayılan değerlere dönebilirsiniz.
- **Mobil Uyumlu Arayüz:** Telefonda tek sütun, büyük dokunma hedefleri ve ekranın altında sabit duran enerji / protein / KM / maliyet özeti ile çalışır. Açık ve koyu tema cihaz ayarını izler.
- **Ayarlanabilir İşkembe Sınırları:** Ham selüloz alt sınırı ve nişasta + şeker üst sınırı her hayvan tipi için varsayılan değerlerle gelir; "Hayvan Bilgileri > İşkembe sınırları" bölümünden kendi değerlerinizi girebilirsiniz.
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

### Hedef Kuru Madde (KM) Gereksinimi / Kapasitesi
Hayvanın günlük tüketebileceği hedef Kuru Madde (KM) kapasitesi teorilerden bağımsız hesaplanır:
```
Besi / Boş Düve : Hedef KM (kg) = Canlı Ağırlık × 0.025
Kuru Gebe İnek  : Hedef KM (kg) = Canlı Ağırlık × 0.020
Sağmal İnek     : Hedef KM (kg) = Canlı Ağırlık × 0.020 + Süt Verimi × 0.3
```
**Örnek:** 500 kg besi hayvanı → `500 × 0.025 = 12.5 kg KM / gün`

### Ham Selüloz ve Nişasta + Şeker Sınırları
İşkembe sağlığı için lif ve hızlı fermente olan karbonhidrat miktarı, hayvanın ağırlığına göre değil **rasyon kuru maddesindeki oranına** göre değerlendirilir:
```
Ham Selüloz (% KM)     = Σ (Yem KM × HS%)  / Toplam KM × 100
Nişasta + Şeker (% KM) = Σ (Yem KM × NFC%) / Toplam KM × 100
```

| Hayvan | En az ham selüloz | En fazla nişasta + şeker (NFC) |
|--------|-------------------|-------------------------------|
| Erkek besi | %10 | %55 (soda ile) |
| Boş düve / inek | %15 | %40 |
| Sağmal / gebe sağmal | %17 | %40 |
| Kuru gebe | %20 | %35 |

Süt ineği değerleri NRC 2001 önerilerine dayanır. Besi ve kuru gebe değerleri yaygın saha uygulamasıdır. Varsayılanlar programda **"İşkembe sınırları"** bölümünden hayvan tipine göre değiştirilebilir; değişiklik tarayıcıda saklanır ve "Varsayılan sınırlara dön" ile geri alınır.

NFC (lif dışı karbonhidrat = nişasta + şeker + pektin) şöyle hesaplanır:
```
NFC (% KM) = 100 − NDF − HP − Ham Yağ − Ham Kül
```

Yem veritabanındaki NFC değerleri (% KM), NRC 2001 bileşim tablolarındaki NDF, HP, yağ ve kül değerlerinden hesaplanıp yuvarlanmıştır. Karma yemlerde (besi, buzağı, süt yemi) tipik formül değeridir; kendi yeminizin etiket/analiz değerini girmeniz önerilir:

| Yem | NFC | Yem | NFC |
|-----|-----|-----|-----|
| Arpa (Dane) | 62 | Mısır Silajı | 39 |
| Mısır (Dane) | 75 | Yonca Kuru Otu | 22 |
| Buğday (Dane) | 68 | Buğday Samanı | 13 |
| Soya Küspesi | 26 | Fiğ Kuru Otu | 24 |
| Ayçiçeği Küspesi | 21 | Çayır Kuru Otu | 19 |
| Pamuk T. Küspesi | 15 | Arpa Samanı | 14 |
| Buğday Kepeği | 30 | Pancar Posası (Kuru) | 36 |
| Besi Yemi (%20 HP) | 40 | Buzağı Büyütme Yemi | 42 |
| Süt Yemi (%19 HP) | 38 | | |

Kendi eklediğiniz bir yemde NFC boş bırakılırsa değer toplam karbonhidrattan tahmin edilir (kesif yemde aynısı, kaba yemde yarısı). Yem listesinde tahmini değerler **~** işaretiyle gösterilir.

**Örnek:** 10 kg mısır silajı + 7 kg arpa + 2 kg buğday samanı + 1.5 kg soya küspesi (12.3 kg KM) → ham selüloz %15.0, NFC %45.0. Besi için ikisi de uygun.

### Sodyum Bikarbonat (Soda) İhtiyacı
Kesif yem oranı toplam KM'nin **%55'ini** aşarsa asidoz riski vardır:
```
Soda (g/gün) = Kesif Yem KM (kg) × 0.012 × 1000
```
**Örnek:** 6 kg kesif yem KM → `6 × 0.012 × 1000 = 72 g/gün`

### Enerji Yoğunluğu ve Ham Protein Oranı
Analiz bölümünde rasyonun besin yoğunluğu da gösterilir:
```
Enerji yoğunluğu  = Toplam Enerji / Toplam KM          (Mcal ME/kg KM, INRA'da UFV veya UFL/kg KM)
Ham protein (% KM) = Σ (Yem KM × HP%) / Toplam KM × 100
```
**Örnek:** 12.3 kg KM ve 33.0 Mcal ME → `33.0 / 12.3 = 2.68 Mcal/kg KM`

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

NRC gereksinimleri net enerji (NE) olarak verir. Program bunları, yaklaşık 2.6 Mcal ME/kg KM'lik tipik bir rasyon için sabit verimliliklerle ME'ye çevirir:

| Verimlilik | Değer | Kullanım |
|-----------|-------|----------|
| km | 0.65 | ME → yaşama net enerjisi (besi) |
| kg | 0.42 | ME → büyüme net enerjisi |
| kl | 0.64 | ME → yaşama + süt net enerjisi (süt ırkı) |

**A) Yaşama Payı:**
```
SBW (aç ağırlık) = Canlı Ağırlık × 0.96

Besi / Boş Düve : MEm = 0.077 × SBW^0.75 / 0.65
Süt ırkı        : MEm = 0.080 × CA^0.75  / 0.64
```

**B) Büyüme Payı:**
```
EBW (boş vücut ağırlığı) = SBW × 0.891
EBG (boş vücut artışı)   = GCAA × 0.956

Tutulan enerji (RE) = 0.0635 × EBW^0.75 × EBG^1.097
MEg = RE / 0.42
```

**Toplam:**
```
Toplam ME = MEm + MEg
```

**Örnek (500 kg, 1.5 kg GCAA hedefi):**
```
SBW = 480 kg, SBW^0.75 = 102.5
MEm = 0.077 × 102.5 / 0.65 = 12.15 Mcal

EBW = 427.7 kg, EBW^0.75 = 94.0
RE  = 0.0635 × 94.0 × (1.434)^1.097 = 8.87 Mcal
MEg = 8.87 / 0.42 = 21.12 Mcal

Toplam = 33.26 Mcal/gün
```

## 1.2 Protein Gereksinimi (Ham Protein – kg/gün)

Metabolik protein (MP) gereksinimi hesaplanır ve `HP = MP / 0.64` ile ham proteine çevrilir.

**A) Yaşama Payı:**
```
HPm = 3.8 g × SBW^0.75 / 0.64
```

**B) Büyüme Payı:**
```
Net protein (g) = GCAA × (268 − 29.4 × RE / GCAA)     (alt sınır: 60 g/kg artış)
Verim           = SBW ≤ 300 kg ise 0.834 − 0.00114 × SBW, değilse 0.492
HPg = Net protein / Verim / 0.64
```

**Toplam:**
```
Toplam HP = HPm + HPg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
HPm = 3.8 × 102.5 / 0.64 = 609 g = 0.61 kg
Net protein = 1.5 × (268 − 29.4 × 8.87 / 1.5) = 141 g
HPg = 141 / 0.492 / 0.64 = 449 g = 0.45 kg
Toplam = 1.06 kg/gün
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

Gereksinim formülleri tersten çözülür:
```
Enerji bazlı GCAA  = [ (Toplam ME – MEm) × 0.42 / (0.0635 × EBW^0.75) ]^(1/1.097) / 0.956
Protein bazlı GCAA = (Toplam HP – HPm) miktarını karşılayan GCAA (HPg formülünün tersi)
Tahmini GCAA = min(Enerji bazlı, Protein bazlı)
```

**Örnek (500kg, rasyon: 25 Mcal ME, 0.9 kg HP):**
```
GCAA_enerji  = [ (25 – 12.15) × 0.42 / (0.0635 × 94.0) ]^(1/1.097) / 0.956 = 0.95 kg
GCAA_protein = (0.9 – 0.61) kg HP → 0.89 kg
Tahmini GCAA = min(0.95, 0.89) = 0.89 kg (protein sınırlayıcı)
```

> **Not:** Enerji yaşama payının altındaysa açık vücut rezervinden karşılanır:
> Kayıp = (Toplam ME – MEm) × 0.65 / (0.0635 × EBW^0.75 × 0.956^1.097). Protein açığında kayıp = açık / 0.25

---

# TEORİ 2: INRA (Institut National de la Recherche Agronomique) 🇫🇷

**Avrupa / Fransız Sistemi – Net Enerji (UFV / UFL) + PDI Protein**

NRC'den daha "garantici" bir sistemdir. Enerji iki birimle ifade edilir:
- **UFV** (Unité Fourragère Viande = et yem birimi): erkek besi ve boş düve
- **UFL** (Unité Fourragère Lait = süt yem birimi): sağmal, gebe sağmal ve kuru gebe inek

Program seçilen hayvan tipine göre birimi otomatik değiştirir ve yemlerin UFV veya UFL değerini kullanır. Proteini ham protein yerine **PDI** (Protéines Digestibles dans l'Intestin) sistemiyle daha detaylı hesaplar.

## 2.1 Enerji Gereksinimi (UFV veya UFL/gün)

**A) Yaşama Payı:**
```
UFm = 1.4 + 0.006 × Canlı Ağırlık
```

**B) Büyüme Payı:**
```
UFVg = Hedef GCAA × 3.2
```

**Toplam:**
```
Toplam UFV = UFm + UFVg
```

**Örnek (500 kg, 1.5 kg GCAA):**
```
UFm  = 1.4 + 0.006 × 500 = 1.4 + 3.0 = 4.40 UFV
UFVg = 1.5 × 3.2 = 4.80 UFV
Toplam = 9.20 UFV/gün
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
Enerji katkısı = KM (kg) × Yemin UFV değeri (besi) veya UFL değeri (süt ineği)
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

**Örnek (besi) — 3 kg Arpa (KM=%88, UFV=1.12, PDIE=101, PDIN=78) + 0.5 kg Soya K. (KM=%89, UFV=1.08, PDIE=169, PDIN=327):**
```
Arpa KM  = 3 × 0.88 = 2.64 kg
Soya KM  = 0.5 × 0.89 = 0.445 kg

UFV toplam = (2.64 × 1.12) + (0.445 × 1.08) = 2.96 + 0.48 = 3.44 UFV

PDIE toplam = (2.64 × 101) + (0.445 × 169) = 266.6 + 75.2 = 341.8 g
PDIN toplam = (2.64 × 78) + (0.445 × 327) = 205.9 + 145.5 = 351.4 g

Efektif PDI = min(341.8, 351.4) = 341.8 g  → PDIE sınırlayıcı (enerji yetersiz)
```

## 2.4 Tahmini GCAA

```
GCAA_enerji  = (Toplam UFV – UFm) / 3.2
GCAA_protein = (Efektif PDI – PDIm) / 280
Tahmini GCAA = min(GCAA_enerji, GCAA_protein)
```

> Kilo kaybı durumunda: enerji / 2.5, protein / 200

## 2.5 Yem Veritabanındaki INRA Değerleri

UFV değerleri, her yemin UFL değerinden INRA (1988) verimlilik denklemleriyle türetilmiştir:
```
q   = ME / GE   (enerjinin metabolize olabilirliği, GE ≈ 4400 kcal/kg KM)
kl  = 0.60 + 0.24 × (q − 0.57)          → UFL = ME × kl  / 1700
km  = 0.287 × q + 0.554
kf  = 0.78 × q + 0.006
kmf = km × kf × 1.5 / (kf + 0.5 × km)   → UFV = ME × kmf / 1820
```
Önce UFL değerini veren q bulunur, sonra aynı q ile UFV hesaplanır. Kesif yemlerde UFV ≈ UFL; düşük enerjili kaba yemlerde UFV belirgin olarak daha düşüktür (ör. saman 0.45 UFL → 0.33 UFV).

| Yem | UFL | UFV | PDIE (g/kg KM) | PDIN (g/kg KM) |
|-----|-----|-----|----------------|----------------|
| Arpa (Dane) | 1.13 | 1.12 | 101 | 78 |
| Mısır (Dane) | 1.22 | 1.23 | 90 | 64 |
| Buğday (Dane) | 1.16 | 1.16 | 103 | 85 |
| Soya Küspesi (44%) | 1.10 | 1.08 | 169 | 327 |
| Ayçiçeği Küspesi | 0.74 | 0.66 | 109 | 192 |
| Pamuk T. Küspesi | 0.99 | 0.95 | 150 | 290 |
| Buğday Kepeği | 0.91 | 0.86 | 99 | 109 |
| Mısır Silajı | 0.90 | 0.84 | 68 | 47 |
| Yonca Kuru Otu | 0.78 | 0.70 | 93 | 107 |
| Buğday Samanı | 0.45 | 0.33 | 47 | 21 |

---

# Teoriler Arası Karşılaştırma

| Özellik | NRC 🇺🇸 | INRA 🇫🇷 | CNCPS 🔬 |
|---------|---------|----------|----------|
| **Enerji birimi** | ME (Mcal) | UFV (besi) / UFL (süt) | Düzeltilmiş ME (Mcal) |
| **Enerji hesabı** | KM × ME | KM × UFV veya UFL | KM × ME × NDFD katsayısı |
| **Protein birimi** | HP (kg) | PDI (g) | MP (g) |
| **Protein hesabı** | KM × HP% | min(Σ PDIE, Σ PDIN) | RDP→MCP + RUP→Bypass |
| **Kolaylık** | ★★★ Çok kolay | ★★ Orta | ★ Karmaşık |
| **Hassasiyet** | ★★ Orta | ★★ Orta-İyi | ★★★ Yüksek |
| **En iyi kullanım** | Genel besi, hızlı kontrol | AB uyumu, güvenli marj | Hassas optimizasyon |

### 500 kg hayvan, 1.5 kg GCAA hedefi — Gereksinim karşılaştırması:

| Gereksinim | NRC | INRA | CNCPS |
|-----------|-----|------|-------|
| Enerji (yaşama) | 12.15 Mcal | 4.4 UFV | 12.15 Mcal |
| Enerji (büyüme) | 21.12 Mcal | 4.8 UFV | 21.12 Mcal |
| **Enerji (toplam)** | **33.26 Mcal** | **9.2 UFV** | **33.26 Mcal** |
| Protein (yaşama) | 0.61 kg | 344 g | 402 g |
| Protein (büyüme) | 0.45 kg | 420 g | 458 g |
| **Protein (toplam)** | **1.06 kg** | **764 g** | **860 g** |

---

# Dişi Hayvan (Süt ve Gebelik) Hesaplamaları

Yeni eklenen sistem sayesinde program artık sadece erkek besi hayvanlarını değil, **Boş Düve**, **Sağmal İnek** ve **Gebe İnek** rasyonlarını da hesaplamaktadır. Dişi hayvanların hesaplama prensipleri temel olarak yaşama ve büyüme paylarına eklenen **süt verimi** ve **gebelik** paylarından oluşur.

## 1. Sağmal İnek (Süt Verimi) Hesaplamaları
Süt veren bir ineğin rasyonunda, ürettiği her 1 litre süt ve bu sütün yağ oranına göre ekstra enerji ve protein hesaplanır.

*   **Enerji İhtiyacı (NRC ve CNCPS):** Sütün net enerjisi `NEL = 0.360 + 0.0969 × Süt Yağı (%)` Mcal/kg'dır ve `ME = NEL / 0.64` ile ME'ye çevrilir. 1 kg %3.5 yağlı süt için **~1.09 Mcal ME** gerekir.
*   **Protein İhtiyacı (NRC):** 1 kg süt üretimi için yaklaşık **85 gram Ham Protein (HP)** eklenir.
*   **INRA:** Enerji UFL ile hesaplanır. 1 kg süt için `UFL = 0.44 × (0.4 + 0.15 × Süt Yağı %)` (%4 yağlı sütte 0.44 UFL, %3.5'te 0.41 UFL); protein için ~50 g PDI eklenir.
*   **CNCPS:** Protein için 1 kg süt başına ~45 g MP eklenir.
*   **Kuru Madde Tüketimi:** Sağmal inekler, besi hayvanlarına göre daha fazla kuru madde tüketebilir. Formülasyon `CA × %2` + `Süt Verimi × 0.3` şeklinde esnetilmiştir.

## 2. Gebe İnek (Gebelik Dönemi) Hesaplamaları
Gebeliğin ilk aylarında ceninin (fötus) büyümesi yavaştır, bu yüzden rasyona büyük bir yük getirmez. Ancak **son 3 ayda** fötus çok hızlı büyür ve ek gereksinimler doğar.

*   **İlk 6 Ay:** Gereksinim artışı minimum düzeydedir (Örn: +0.5 Mcal ME, +50g HP).
*   **Son 3 Ay (Kuru Dönem):** Fötusun gelişimi için yüksek bir gereksinim artışı yaşanır. Günlük yaşama payına yaklaşık **+4.5 Mcal ME** ve **+250g HP** (NRC) eklenir. İneğin bu dönemde aşırı yağlanmaması ve kalsiyum dengesine dikkat edilmesi (süt hummasını önlemek için) çok önemlidir.

## Tahmini Verim (Süt vs. GCAA)
Sistem seçilen hayvan türüne göre tahminleme yapar:
*   **Erkek Besi / Boş Düve / Kuru Gebe:** Rasyondaki mevcut enerji ve proteinden yaşama ve gebelik payları düşülür, kalan miktar ile **"Tahmini Günlük Canlı Ağırlık Artışı (GCAA)"** hesaplanır.
*   **Sağmal / Gebe Sağmal:** Rasyondaki mevcut enerji ve proteinden yaşama ve gebelik payları düşülür, kalan miktar ile **"Tahmini Süt Verimi (Litre)"** hesaplanarak gösterilir.
