# Process Panic: Test Office

ISO/IEC/IEEE 29119-2 test süreçlerini öğretmek için geliştirilen 2D top-down eğitim oyunu prototipi.

Oyuncu bir test ofisinde süreç akışını yönetir. Masalarda oluşan problemleri (`!`) zamanında çözüp
EV/PV dengesini korumaya çalışır.

## Proje Yapısı

- `index.html`: oyun giriş noktası
- `styles.css`: sayfa stilleri
- `src/game.js`: Phaser 3 oyun mantığı
- `src/questions.json`: soru bankası

## Çalıştırma

```bash
cd /Users/gizemkky/436-oyun
python3 -m http.server 8080
```

Tarayıcı:

- `http://localhost:8080`

## Oynanış Özeti

Oyunda üç katman vardır:

- Organizational Layer (`OT1`, `OT3`)
- Test Management Layer (`TMP1`, `TMP2`, `TMP3`)
- Dynamic Test Processes Layer (`DP1`, `DP2`, `DP3`, `DP4`)

Masalar arasında veri/task akışı görsel olarak akar. Bir masada `!` çıktığında süreç yavaşlar.
Oyuncu masaya gidip soruyu cevaplayarak süreci toparlar veya hatalı cevapla cooldown'a düşürür.
Oyun açıldığında başlangıç paneli görünür; süre ve olaylar `START` butonuna basınca başlar.

## Kontroller

- `W A S D`: karakter hareketi
- `E`: yakındaki warning (`!`) masasıyla etkileşim
- `H`: yardım/demoyu aç-kapat
- `ESC`: sadece yardım panelini kapat
- `ENTER` / `SPACE`: oyunu başlat
- `1`: Easy
- `2`: Medium
- `3`: Hard
- `EXIT` butonu (sağ üst): oyunu sıfırdan resetleyip başlangıç ekranına döner

## Skor ve Durum Kuralları

- Doğru cevap: `+10` skor
- Yanlış cevap: `-5` skor
- Warning süresini kaçırma: `-7` skor

Masa durumları:

- `normal`: tam verim
- `warning`: düşük verim
- `cooldown`: çok düşük verim

## EV / PV Mantığı

- Oyun süresi: `180 saniye`
- `PV`: plana göre beklenen ilerleme (süreye bağlı doğrusal artar)
- `EV`: gerçek ilerleme (masa verimi + warning/cooldown cezasına bağlı artar)

Bu nedenle:

- çok sorun birikirse `EV < PV`
- süreç iyi yönetilirse `EV ~= PV` veya `EV > PV`

Süre sonunda sonuç paneli açılır:

- EV, PV'nin çok gerisinde değilse başarılı
- ciddi gerideyse "PROJECT BEHIND PLAN"

## Soru Sistemi

- Sorular `src/questions.json` dosyasından yüklenir.
- Sorular masa/süreç bazlıdır (OT, TMP, DP başlıklarına göre).
- Aynı masada aynı sorunun üst üste gelmesi engellenir (mümkün olduğunda).
- Şıklar her soru açılışında karıştırılır; doğru cevap sabit bir sırada değildir.
- Test modu açıkken doğru şık bilgisi quiz altında gösterilir.

## Görsel Geri Bildirimler

- Şık seçimi sonrası:
  - doğru şık: yeşil efekt
  - yanlış şık: kırmızı efekt
- Doğru seçeneğin satırında kısa bir `✓` işareti görünür.
- `!` işareti pulse animasyonludur.

## Zorluk Seviyeleri

Zorluk; warning çıkma sıklığını ve süreleri değiştirir:

- `Easy`: daha seyrek warning, daha uzun müdahale süresi
- `Medium`: dengeli ayar
- `Hard`: daha sık warning, daha kısa müdahale süresi

## Test Edilenler

Bu depoda aşağıdaki kontroller çalıştırıldı:

- `node --check src/game.js` (JavaScript sözdizimi)
- `python3 -m json.tool src/questions.json` (JSON doğrulama)
- yerel sunucu `http://localhost:8080` yanıt kontrolü (`HTTP 200`)
- edit sonrası lint kontrolü (hata yok)

## Hızlı Test Senaryosu

1. Oyunu aç, `H` ile yardım panelini kapat.
2. Bir `!` bekle, masaya gidip `E` ile soruyu aç.
3. Bir kez doğru, bir kez yanlış cevap ver; renk efektlerini kontrol et.
4. `1/2/3` ile zorluğu değiştirip warning sıklığını gözlemle.
5. EV/PV metninin duruma göre değiştiğini kontrol et.
6. Süre bitince sonuç panelinin düzgün yerleşimle açıldığını doğrula.

## Not

Eğer port doluysa farklı portla çalıştırabilirsin:

```bash
python3 -m http.server 8081
```
