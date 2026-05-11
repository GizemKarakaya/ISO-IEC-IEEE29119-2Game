# Process Panic: Test Office

ISO/IEC/IEEE 29119-2 test süreçlerini öğretmek için geliştirilen 2D top-down eğitim oyunu prototipi.

Oyuncu bir test ofisinde süreç akışını yönetir. Masalarda oluşan problemleri (`!`) zamanında çözüp
EV/PV dengesini korumaya çalışır.

## Oyun akışı (özet)

1. Açılışta **başlangıç paneli** (zorluk seçimi + **`PLAY`**).
2. **`PLAY`**, **`ENTER`** veya **`SPACE`** ile run başlar; süre ve periyodik **`!`** uyarıları devreye girer.
3. Uyarılı masanın yanına gidip **`E`** ile quiz açılır; doğru cevap masayı normale alır, yanlış cevap **cooldown** başlatır.
4. Quiz paneli sağ üstteki **`X`** ile cevap vermeden kapatılabilir. Şık seçildikten sonra kısa geri bildirim gösterilir; panel yaklaşık **1 saniye** sonra kapanır (veya cevap sonrası **`WASD`** ile hemen kapatılabilir).
5. Süre bitince **sonuç paneli** (`EV`, `PV`).

Oyundayken **`ESC`** → **duraklatma menüsü** (`RESUME` / `RESTART`). Henüz oyun başlamadıysa **`ESC`** giriş ekranında işlem yapmaz. Yardım paneli açıkken **`ESC`** işlem yapmaz; yardım için **`H`** kullanılır.

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

Port doluysa başka port kullan (ör. `8081`). Örnek: `python3 -m http.server 8081` → `http://localhost:8081`

## Oynanış Özeti

Oyunda üç katman vardır:

- Organizational Layer (`OT1`, `OT2`, `OT3`)
- Test Management Layer (`TMP1`, `TMP2`, `TMP3`)
- Dynamic Test Processes Layer (`DP1`, `DP2`, `DP3`, `DP4`)

Masalar arasında veri/task akışı görsel olarak akar. Bir masada `!` çıktığında süreç yavaşlar.
Oyuncu masaya gidip soruyu cevaplayarak süreci toparlar veya hatalı cevapla cooldown'a düşürür.

Oyun açıldığında başlangıç paneli görünür; süre ve olaylar **`PLAY`** butonuna veya **`ENTER` / `SPACE`** ile başlar.

## Kontroller

- `W A S D`: karakter hareketi
- `E`: yakındaki warning (`!`) masasıyla etkileşim (quiz)
- `H`: yardım / “Quick Demo” panelini **aç-kapat**
- `ESC`: oyundayken **duraklatma menüsü**; oyun başlamadan önce giriş ekranında işlem yapmaz. Yardım açıkken `ESC` yardımı kapatmaz — yardımı **`H`** ile kapat.
- `ENTER` / `SPACE`: run başlatır (başlangıç panelindeyken)
- `1` / `2` / `3`: **Easy** / **Medium** / **Hard** (başlangıç ekranından; zorluk değişince oyun sıfırlanır)
- Quiz’de cevap verdikten sonra: panel otomatik kapanmadan önce **`WASD`** ile quiz’i hemen kapatabilirsin
- `EXIT` (sağ üst): oyunu sıfırdan resetleyip başlangıç ekranına döner

## EV ve Durum Kuralları

- Doğru cevap: uyarıyı temizler; EV'ye anlık ekleme yapmaz
- Yanlış cevap: masayı cooldown'a alır; EV'den anlık düşüş yapmaz

Masa durumları:

- `normal`: tam verim
- `warning`: düşük verim (`!` aktif)
- `cooldown`: çok düşük verim (yanlış cevap sonrası süre)

## EV / PV Mantığı

Kaynak sabitler: `src/game.js` içinde `GAME_DURATION_MS` ve `updateProgress()` / `finishGame()`.

- Oyun süresi: **`90` saniye** — `PV` süre boyunca doğrusal büyür; süre sonunda **`100`** tavanına sıkıştırılır.
- **`EV`**, `PV` hızının yaklaşık **%25** üstünde, masa verimi ve uyarı/cooldown çarpanlarıyla büyür; quiz doğru/yanlışları anlık **EV** düzeltmesi yapmaz.

Bu nedenle:

- uyarılar ve cooldown’lar birikirse **`EV < PV`** olma ihtimali artar
- iyi yönetimde HUD’daki farka göre **`EV ≈ PV`** veya **`EV > PV`**

Süre dolunca sonuç panelinde **`EV`** ve **`PV`** gösterilir:

- **`EV − PV ≥ −5`** ise **MISSION COMPLETE**
- daha geride ise **PROJECT BEHIND PLAN**

## Soru Sistemi

- Sorular `src/questions.json` dosyasından yüklenir.
- Sorular masa anahtarlarına göredir (`OT1` … `DP4`).
- Aynı masada aynı sorunun üst üste gelmesi mümkün olduğunca engellenir (`questionHistoryByTable`).
- Şıklar her soru açılışında karıştırılır (`shuffleQuestionOptions`).
- `src/game.js` içinde `SHOW_CORRECT_ANSWER_DEBUG = true` yapılırsa test modunda doğru şık quiz altında gösterilir.

## Görsel Geri Bildirimler

- Şık seçimi sonrası: doğru şık yeşil, yanlış şık kırmızı vurgu
- Doğru şıkkın satırında yeşil **`OK`** etiketi
- `!` uyarısı pulse animasyonludur

## Zorluk Seviyeleri

Üç zorlukta da yeni **`!`** üretim aralığı aynıdır (**10 saniyede bir** uyarı tetikleme döngüsü — `alertEveryMs`).

Farklı olanlar:

- **Cooldown süresi** (yanlış cevap sonrası masanın ne kadar süre verimsiz kalacağı): Easy kısa, Hard uzun.
- Kodda **`warningMs`** zorluklara göre tanımlıdır; “uyarıyı şu kadar süre içinde çözme” sayacı şu an bu değerlerle bağlı değildir.

Özet: Zorluk öncelikle **cooldown süresi** ve **soru seti** (`easy` / `medium` / `hard` bankaları) ile hissedilir.

## Test Edilenler

Bu depoda aşağıdaki kontroller çalıştırılabilir:

- `node --check src/game.js` (JavaScript sözdizimi)
- `python3 -m json.tool src/questions.json` (JSON doğrulama)
- yerel sunucu üzerinden sayfa yanıtı (`HTTP 200`)

## Hızlı Test Senaryosu

1. Oyunu aç; isteğe bağlı **`H`** ile yardımı aç/kapa.
2. Zorluk seç, **`PLAY`** veya **`ENTER`** ile başlat.
3. Bir `!` bekle; masaya yaklaşıp **`E`** ile quiz aç.
4. Bir doğru, bir yanlış dene; renkleri ve cooldown’u gözle.
5. `1` / `2` / `3` ile zorluk değiştir (oyun sıfırlanır); soru seti ve cooldown farkını kontrol et.
6. HUD’da EV/PV metninin değiştiğini izle.
7. Süre bitince sonuç panelini doğrula.

## Katman / masa hızlı referans

| Katman        | Masalar                          |
|---------------|----------------------------------|
| Organizational | `OT1`, `OT2`, `OT3`             |
| Test Management | `TMP1`, `TMP2`, `TMP3`        |
| Dynamic       | `DP1`, `DP2`, `DP3`, `DP4`      |
