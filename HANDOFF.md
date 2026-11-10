# Proje Devir Notu

Son güncelleme: 9 Kasım 2026  
Mevcut sürüm: `1.1.1`  
İncelenen dal: `versions/v1.1.1`

## 1. Amaç ve kapsam

Bu depo, Timix HR servislerini n8n içinden kullanılabilir hale getiren bir **n8n community node paketi**dir. Paket n8n arayüzünde tek bir `Timix` düğümü sunar; kullanıcı bu düğüm içinde kaynak ve operasyon seçerek Timix API'lerine istek gönderir.

Mevcut kaynaklar ve işlemler:

| Kaynak | Desteklenen işlemler |
| --- | --- |
| Chat | Hedef arama, hedefi sohbete çözümleme, mesaj gönderme, anket oluşturma, mesaja tepki ekleme |
| File | Bir n8n girdisindeki binary dosyaları yükleme |
| Employee | Honor ataması için yetki kapsamındaki çalışanları arama |
| Honor | Oluşturma, tek kayıt getirme, listeleme, güncelleme, silme |
| Employee Honor | Honor atama, tek kayıt getirme, listeleme, güncelleme, kaldırma |
| Task | Form alanlarından veya ham JSON'dan görev oluşturma |

Depo genel amaçlı bir Timix SDK'sı değildir. n8n parametre tanımlarını, girdi doğrulamasını, HTTP isteğini ve n8n çıktı eşlemesini aynı paket içinde sağlar.

## 2. Mimari

Ana akış şöyledir:

1. `Timix.node.ts`, n8n'de görünen kaynak ve operasyon seçicilerini tanımlar.
2. Her kaynağın `description.ts` dosyası o kaynağa ait UI alanlarını ve hangi operasyonda görüneceklerini bildirir.
3. Ana `execute()` metodu her girdi öğesini sırasıyla işler ve seçilen operasyona ait fonksiyona yönlendirir.
4. Operasyon dosyası parametreleri okur, gerekiyorsa saf helper fonksiyonlarıyla doğrular ve API gövdesini oluşturur.
5. Ortak `timixApiRequest()` katmanı credential, dinamik token ve HR/Files taban URL seçimini uygular.
6. API yanıtı n8n `INodeExecutionData` öğelerine dönüştürülür ve kaynak girdiyle `pairedItem` üzerinden ilişkilendirilir.

Ana bileşenler:

- **Credential katmanı:** `TimixHrApi.credentials.ts`; HR taban URL'si, isteğe bağlı ayrı Files taban URL'si ve bearer token saklar. Credential testi HR servisinin health endpoint'ini kullanır.
- **Node tanımı ve dispatcher:** `Timix.node.ts`; tek node altındaki kaynakları birleştirir ve operasyonlara dağıtır.
- **Kaynak modülleri:** `nodes/Timix/resources/` altında Chat, Employees, EmployeeHonors, Files, Honors ve Tasks olarak ayrılır.
- **Ortak yardımcılar:** `resources/shared.ts`; UUID normalizasyonu, collection alanı okuma, boş string temizleme, HR `payload` zarfını açma, yanıt dönüşümü ve HTTP isteklerini merkezileştirir.
- **Saf payload helper'ları:** Özellikle Chat, Honor ve Employee Honor için doğrulama ile gövde üretimini operasyon kodundan ayırır; mevcut birim testlerinin ana hedefi bunlardır.

Ana node, n8n'de AI tool olarak kullanılabilmesi için `usableAsTool` desteğini açık tutar.

## 3. Klasör yapısı

- `credentials/`: n8n credential tipi ve credential doğrulama isteği.
- `nodes/Timix/`: ana node tanımı, node metadata dosyası, node dokümantasyonu ve ikonlar.
- `nodes/Timix/resources/`: kaynak bazında UI tanımları, operasyon uygulamaları ve helper'lar.
- `icons/`: paket seviyesinde açık/koyu tema ikonları.
- `tests/`: derlenmiş `dist/` dosyalarını Node.js'in yerleşik test koşucusuyla test eden dosyalar.
- `scripts/`: derleme varlıklarını kopyalamak ve `dist/` çıktısını n8n custom extensions dizinine dağıtmak için shell scriptleri.
- `workflows/`: mesaj tepkisi için örnek n8n workflow JSON'u.
- `dist/`: üretilen JavaScript, declaration, source map, metadata ve statik dosyalar. Git tarafından izlenmez; kaynak kabul edilmemelidir.
- `.github/`: şu anda boş; CI workflow'u yoktur.

## 4. Kullanılan teknolojiler

- TypeScript 5.9; CommonJS çıktısı ve ES2019 hedefi.
- n8n community node API'si ve `n8n-workflow` tipleri.
- `@n8n/node-cli` ile build, development, lint ve release akışları.
- ESLint 9; n8n'in sağladığı ortak lint yapılandırması.
- Prettier 3.6; tab, tek tırnak, noktalı virgül, trailing comma ve 100 karakter satır uzunluğu kuralları.
- Node.js yerleşik `node:test` ve `node:assert` modülleri.
- Bash dağıtım scriptleri.
- npm ve `package-lock.json` lockfile v3.

Node.js için depoda kesin bir sürüm sabitlemesi (`engines`, `.nvmrc` veya benzeri) yoktur. README yalnızca LTS sürümü ister.

## 5. Önemli kararlar ve nedenleri

### Tek node, kaynak/operasyon modeli

Chat, dosya, honor ve görev yetenekleri ayrı n8n node'ları yerine tek `Timix` node altında toplandı. Bu, kullanıcının tek credential ve tek entegrasyon yüzeyiyle çalışmasını sağlarken kaynak kodunda modül ayrımı korunuyor.

### HR ve Files servislerinin ayrı URL kullanabilmesi

Credential'da HR URL'sine ek olarak isteğe bağlı Files URL'si bulunur. Ayrı mikroservis kurulumlarında dosya istekleri Files URL'sine gider; gateway kurulumlarında alan boş bırakılır ve HR URL'sine geri dönülür. Böylece aynı node iki dağıtım topolojisini destekler.

### Dinamik token override

Normal durumda n8n credential içindeki bearer token otomatik eklenir. `Dynamic Credential` doluysa istek açıkça bu token ile yapılır. Amaç, workflow verisinden veya expression'dan gelen kullanıcıya/oturuma özel token'la çalışabilmektir.

### Public UUID kullanımı

Honor ve Employee Honor akışları sayısal iç ID yerine public UUID kullanır. Bu karar API sözleşmesiyle uyumludur ve dahili veritabanı kimliklerinin workflow'lara sızmasını önler.

### UUID girdilerinin toleranslı normalizasyonu

Ortak katman collection alanı, dizi, nesne, virgülle ayrılmış metin ve bazı JSON-string biçimlerinden UUID toplamaya çalışır; boşlukları temizler ve tekrarları kaldırır. Bunun nedeni n8n expression ve önceki node çıktılarının farklı şekillerde gelebilmesidir.

### HR yanıt zarfını varsayılan olarak açma

Honor, Employee Honor ve Employee arama operasyonları API'nin `payload` zarfını varsayılan olarak açar ve listedeki her kaydı ayrı n8n öğesi yapar. `Include Metadata` seçeneği ham zarfı korur. Bu, normal workflow kullanımını kolaylaştırırken hata ayıklama ve sayfalama metadata'sına erişimi kaybetmemeyi amaçlar.

### Kontrollü otomatik sayfalama

Honor ve Employee Honor `Return All` modu 100'lük sayfalarla ilerler ve en fazla 1000 sayfaya izin verir. Sınır, hatalı veya sonsuz sayfalama davranışında workflow'un kontrolsüz çalışmasını engeller.

### Güncellemelerde Keep / Set / Clear ayrımı

Employee Honor tarih/metin alanlarında ve Honor görselinde "değiştirme", "yeni değer ata" ve "null ile temizle" anlamları ayrı tutulur. PATCH isteklerinde alanı hiç göndermemek ile açıkça temizlemek farklı işlemler olduğu için bu ayrım gereklidir.

### Girdi-çıktı eşlemesi ve `continueOnFail`

Sonuçlar `pairedItem` ile kaynak girdi indeksine bağlanır. `continueOnFail` açıkken hata alan girdi tamamen kaybedilmez; orijinal JSON hata bilgisiyle birlikte korunur. Toplu workflow'larda bir kaydın hatasının diğer kayıtları durdurmaması hedeflenmiştir.

### Görev oluşturmada form ve JSON modu

Form modu sık kullanılan alanları n8n UI'da güvenli biçimde sunar; JSON modu API'nin daha geniş veya değişen alanlarına kaçış kapısı verir. Her iki modda da en az bir atama kapsamı zorunludur.

## 6. Kod kuralları

- TypeScript `strict`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns` ve `noUnusedLocals` açıktır.
- Yeni bir kaynak eklerken UI tanımı `description.ts` içinde, iş mantığı ayrı operasyon/execute dosyasında tutulmalıdır.
- API istekleri doğrudan tekrarlanmamalı; credential, URL ve token davranışı için ortak `timixApiRequest()` kullanılmalıdır.
- Tekrarlanan normalizasyon ve yanıt dönüşümü `shared.ts` içine alınmalıdır; kaynağa özel payload doğrulaması saf helper olarak tutulmalıdır.
- Boş isteğe bağlı alanlar API gövdesine eklenmemeli; boolean `false` gibi anlamlı değerler kaybedilmemelidir.
- UUID listeleri temizlenmeli ve tekilleştirilmelidir.
- Operasyon hataları mümkün olduğunca `itemIndex` bağlamıyla `NodeOperationError` olarak iletilmelidir.
- Her çıktı öğesi doğru `pairedItem` bilgisine sahip olmalıdır.
- Kaynak dosyalar tab girintisi, tek tırnak, noktalı virgül, trailing comma ve 100 karakter satır sınırıyla formatlanır.
- `dist/` elle değiştirilmemeli; her zaman build ile yeniden üretilmelidir.
- Yeni davranış için en az payload doğrulaması ve HTTP method/URL/body sözleşmesini test eden birim testi eklenmelidir.

## 7. Kurulum, çalıştırma ve test

### Ön koşullar

- Node.js LTS ve npm.
- Geliştirme veya manuel entegrasyon testi için çalışan bir n8n kurulumu.
- API denemeleri için Timix HR base URL, gerekiyorsa Files base URL ve geçerli access token.

### Bağımlılıklar

Temiz kurulumda lockfile'a sadık kalmak için tercih edilen komut `npm ci` olmalıdır. Bağımlılık güncelleme amacı varsa `npm install` kullanılabilir.

### Derleme

- `npm run build`: TypeScript'i `dist/` altına derler ve n8n statik dosyalarını kopyalar.
- `npm run build:watch`: yalnızca TypeScript watch modunu başlatır.

### Geliştirme

- `npm run dev`: paketi n8n node development modu ile başlatır.
- n8n'de `Timix HR API` credential oluşturulmalı; HR URL ve token zorunlu, Files URL isteğe bağlıdır.

### Kalite kontrolleri

- `npm run lint`: n8n ESLint kurallarını çalıştırır.
- `npm run lint:fix`: otomatik düzeltilebilen lint sorunlarını düzeltir.
- `npm test`: önce build alır, ardından `tests/**/*.test.js` dosyalarını çalıştırır.

9 Kasım 2026 tarihinde mevcut dalda:

- Build başarılı.
- 16 testin tamamı başarılı.
- Lint hata vermeden tamamlandı; yalnızca ortam kaynaklı `NO_COLOR`/`FORCE_COLOR` uyarısı görüldü.

### Yerel n8n'e dağıtım

README'deki local path veya `npm link` yöntemi kullanılabilir. Depodaki gerçek yardımcı script `scripts/deploy_custom.sh` dosyasıdır:

- Önce ayrıca `npm run build` çalıştırılmalıdır.
- Hedef dizin `N8N_CUSTOM_DIR` ile verilebilir.
- Değişken verilmezse script yalnızca `/home/testproject/n8n-compose/data/custom` mevcutsa bu varsayılanı kullanır.
- Hedefteki aynı paket dizinini silip `dist/` ve `package.json` dosyasını yeniden kopyalar; n8n veya Docker restart etmez.

## 8. Bilinen hatalar ve riskler

### Yüksek öncelik: npm paketindeki n8n entry point uzantıları hatalı görünüyor

Kök `package.json`, n8n credential ve node yollarını `.ts` uzantısıyla tanımlıyor. Build ve `npm pack --dry-run` incelemesinde pakete ilgili `.js` ve `.d.ts` dosyalarının girdiği, fakat bu `.ts` dosyalarının girmediği doğrulandı. Bu nedenle yayımlanmış paketin n8n tarafından keşfedilmesi/yüklenmesi bozulabilir. Entry point'ler `.js` çıktılarına yöneltilmeli ve paket tarball'ı temiz bir n8n kurulumunda smoke test edilmelidir.

### README var olmayan bir scripti anlatıyor

README, tek adımlı kurulum için `build_timix_node.sh` adlı bir script tarif ediyor; depoda bu dosya yok. Gerçek scriptler `scripts/build_assets.sh` ve `scripts/deploy_custom.sh`. Ayrıca mevcut deploy scripti README'de anlatılan interaktif modları veya Docker restart davranışını uygulamıyor.

### `scripts/build_assets.sh` geçersiz yollara sahip

Script içindeki iki ikon kopyalama yolu normalize edildiğinde `/n8n-nodes-timix/icons/...` konumuna çıkıyor; normal proje kurulumunda bu yol mevcut değil. Script ayrıca herhangi bir npm komutuna bağlı değil. Mevcut `n8n-node build` ikonları zaten başarıyla kopyaladığı için script ya kaldırılmalı ya da gerçek bir kullanım senaryosuna göre düzeltilmelidir.

### Dosya yükleme dokümantasyonu gerçek çıktıyla uyuşmuyor

Node dokümantasyonu UUID bulununca `uuids`, `fileUuids` ve ham `response` döneceğini söylüyor. Uygulama UUID bulduğunda yalnızca `uuids` alanını döndürüyor. Beklenen sözleşme belirlenip kod veya dokümantasyon eşitlenmelidir.

### Test kapsamı dar

Mevcut testler Chat helper'larının bir bölümü ile Honor/Employee Honor helper ve temel isteklerini kapsıyor. File upload, Task create, Employee search, ana dispatcher, credential override, ayrı Files URL'si, sayfalama, `continueOnFail` ve gerçek n8n paket yükleme akışı test edilmiyor.

### CI yok

`.github/` altında workflow bulunmuyor. Build, lint, test ve paket smoke testi pull request veya release sırasında otomatik çalışmıyor.

### Sürüm aralıkları fazla geniş

`@n8n/node-cli` ve `n8n-workflow` için `*` kullanılıyor. Lockfile geliştirme kurulumunu kısmen sabitlese de yeni kurulumlarda veya peer dependency çözümlemesinde haber verilmeden uyumsuz ana sürümler gelebilir. Desteklenen n8n/Node aralığı tanımlanmalıdır.

### Otomatik testlerin API entegrasyonu yok

Testler mock execution context kullanır. Timix API endpoint'lerinin gerçek response şekilleri, auth davranışı, multipart form-data ve gateway/split-service topolojileri otomatik olarak doğrulanmıyor. API sözleşmesi değişiklikleri ancak manuel denemede fark edilebilir.

## 9. Yarım kalan işler

Depoda açık `TODO` veya `FIXME` işareti yoktur. Bununla birlikte mevcut durumdan yarım kaldığı anlaşılan işler şunlardır:

- Paket manifestinin derlenmiş `.js` entry point'leriyle uyumlu hale getirilmesi ve gerçek n8n kurulumu üzerinde doğrulanması.
- README'deki tek adımlı kurulum anlatımının gerçek scriptlerle eşitlenmesi.
- `build_assets.sh` için kaldırma veya düzeltme kararı.
- File upload çıktı sözleşmesinin netleştirilmesi.
- Test kapsamının diğer kaynakları ve ortak istek katmanını kapsayacak şekilde genişletilmesi.
- CI/release kontrol hattının kurulması.
- Resmî desteklenen Node.js ve n8n sürümlerinin belirlenip manifest ve README'ye yazılması.

## 10. Önerilen sıradaki adımlar

1. **Paketlemeyi düzelt:** `package.json` n8n yollarını derlenmiş `.js` dosyalarına yönelt; build al; `npm pack --dry-run` ile tarball içeriğini kontrol et; tarball'ı boş bir n8n custom-node ortamına kurup node ve credential keşfini doğrula.
2. **Doküman ve scriptleri eşitle:** Var olmayan `build_timix_node.sh` anlatımını kaldır veya gerçekten uygula. `deploy_custom.sh` davranışını ve hedef dizini açıkça belgelemeye devam et. Bozuk asset scriptini kaldır veya düzelt.
3. **File upload sözleşmesini kararlaştır:** Sonraki node'ların yalnızca UUID listesine mi, yoksa ham yanıt ve alias alanına da mı ihtiyaç duyduğunu belirle; test ve dokümantasyonu aynı anda güncelle.
4. **Kritik testleri ekle:** Dinamik token, Files URL fallback/override, multipart upload, Task form/JSON modu, `Return All` sayfalama ve ana dispatcher için test yaz.
5. **CI kur:** Desteklenen Node LTS sürümlerinde temiz `npm ci`, lint, test, build ve pack smoke testi çalıştır.
6. **Uyumluluk politikası belirle:** n8n ve Node sürüm aralıklarını sabitle; wildcard bağımlılıkları kontrollü aralıklarla değiştir.
7. **API smoke testi yap:** Chat, Files, Honor, Employee Honor ve Task akışlarını hem gateway hem de ayrı HR/Files kurulumunda geçerli credential ile dene.

## 11. Yeni geliştirici için hızlı başlangıç

1. `npm ci` ile bağımlılıkları kur.
2. `npm test` ve `npm run lint` ile mevcut baseline'ı doğrula.
3. `Timix.node.ts`, ardından `resources/shared.ts` dosyasını oku.
4. Değiştireceğin kaynağın `description.ts`, operasyon ve helper dosyalarını birlikte incele.
5. API sözleşmesi değişiyorsa UI alanı, payload helper'ı, HTTP operasyonu, test ve node dokümantasyonunu aynı değişiklikte güncelle.
6. Release düşünmeden önce paket entry point sorununu çöz ve temiz n8n kurulumunda tarball smoke testi yap.
