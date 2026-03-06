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
- **Kişiselleştirilebilir Yem Veritabanı:** 15'ten fazla kaba ve kesif yem önceden yüklenmiştir, kendi laboratuvar/analiz değerlerinize göre oranları düzenleyebilirsiniz.

## Hesaplama Yaklaşımı ve Formüller

Uygulamanın arka planında koşan hesaplamalar standart *NRC (National Research Council)* yaklaşımları baz alınarak sadeleştirilmiş **Metabolik Enerji (ME)** ve **Ham Protein (HP)** gereksinimlerini kullanmaktadır:

### 1- Enerji Gereksinimi (ME - Mcal)
Hayvanın günlük enerji ihtiyacı iki bileşenden oluşur: 
**A) Yaşama Payı (mEm):** Hayvanın sadece canlılığını sürdürebilmesi için gereken enerjidir.
- `Formül: Canlı Ağırlık (kg) * 0.035 Mcal`

**B) Gelişme/Büyüme Payı (mEg):** Hayvanın hedeflenen Günlük Canlı Ağırlık Artışını (GCAA) sağlayabilmesi için gereken ekstra enerjidir.
- `Formül: Hedef GCAA (kg) * (Canlı Ağırlık * 0.015) Mcal`
- *Not: Büyüme enerjisi hayvanın vücut kütlesine orantılı artmaktadır.*

### 2- Protein Gereksinimi (HP - kg)
**A) Yaşama Payı (cPm):**
- `Formül: Canlı Ağırlık (kg) * 0.001 kg (Yani ağırlığın binde biri kadar protein)`

**B) Gelişme Payı (cPg):**
- `Formül: Hedef GCAA (kg) * 0.35 kg (Her 1 kg canlı ağırlık artışı için ortalama 350 gr protein)`

### 3- Lif / Selüloz İhtiyacı
İşkembe fonksiyonlarının (rumen) sağlıklı çalışması ve laktik asidoz gibi sorunların önüne geçilmesi için rasyonda belirli oranda fiziksel lif/kaba yem bulunmalıdır:
- `Minimum Lif Formülü: Canlı Ağırlık (kg) * 0.006` (Yani hayvan ağırlığının yaklaşık %0.6'sı kadar saf lif / selüloz alınmalıdır).

### 4- Karbonhidrat, Nişasta ve Asidoz Riski 
Rasyondaki Karbonhidrat formülü, genel olarak nişasta ve fermente edilebilir şekerleri (NFC - Non-Fiber Carbohydrates) temsil eder. 
- Yüksek süt ve et verimi için karbonhidrat elzemdir, ancak **Kuru Maddenin (KM) maksimum %45'i** oranında tutulması tavsiye edilir. Sınırın aşılması durumunda rumendeki asitlik aniden artar ve laktik asidoz tehlikesi başlar.

### 5- Sodyum Bikarbonat (Soda) İhtiyacı
Kesif yem (tahıl ağırlıklı) oranı çok yüksek olan diyetlerde, ineğin kendi tükürüğü ile ürettiği doğal tamponlama (buffer) sistemi yetersiz kalır.
- **Hesaplama Yaklaşımı:** Kesif yem oranı tổng Kuru Maddenin (KM) **%55'ini** aşıyorsa asidoz riski yüksek kabul edilir.
- Uygulama bu durumda, yedirilen toplam kesif yemin Kuru Maddesinin (KM) **%1.2'si** kadar günlük Sodyum Bikarbonat (Soda) takviyesi önermektedir (100 kg Kesif Yem KM = 1.2 kg Soda).

### 6- Enerji Kaynak Dağılımı (% Protein vs % Karbonhidrat)
Rasyondan gelen toplam enerjinin kalitesini analiz etmek için kalori kaynaklarına bakılır.
- **Hesaplama:** `1 gram Protein ~ 4 kcal`, `1 gram Karbonhidrat/Nişasta ~ 4 kcal` kabul edilerek kaba bir metabolik kalori dağılımı grafiği çıkarılır.

### 7- Tahmini GCAA Hesaplaması Nasıl Yapılıyor?
Rasyondan gelen toplam enerjiden ve proteinden öncelikle **Yaşama Payları (mEm ve cPm)** düşülür.
Kalan miktar, geliştirme formülüne tersten yerleştirilerek Enerji bazlı *Maksimum Kilo Alımı* ve Protein bazlı *Maksimum Kilo Alımı* hesaplanır.
Hayvanın büyüme hızı her zaman en az olan / sınırlayıcı (bottleneck) besine bağlı olduğu için, her iki potansiyel GCAA değerinden **en düşük olanı** sonuç tablosuna tahmini büyüme olarak yazdırılır. Doğada hayvanlar eksik besinde potansiyellerine ulaşamaz.
