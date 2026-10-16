---
title: 'HemenBul - Masaüstünde Her An Erişilebilir Küçük Bir Arama Uygulaması'
description: 'Electron, Svelte ve Fuse.js ile yerel kayıtlar arasında hızlı arama yapan, diğer pencerelerin üzerinde kalabilen küçük bir masaüstü uygulaması.'
summary: 'Yerel bir JSON dosyasındaki kayıtlar arasında bulanık arama yapan, sık kullanılan bilgileri sabitleyip tek tıkla kopyalamayı sağlayan, her zaman üstte kalabilen bir masaüstü aracı.'
startDate: 2026-05-26
ongoing: true
cover: './floating-search-app.svg'
coverAlt: 'HemenBul proje kapağı: kırmızı daire içinde yüzen bir arama penceresi'
stack: ['Electron', 'Svelte', 'TypeScript', 'Fuse.js']
role: 'Kişisel proje'
featured: true
order: 3
---

Bilgisayarda çalışırken bazen ihtiyacım olan şey yeni bir uygulama açmak değil, belirli bir bilgiye birkaç saniye içerisinde ulaşmak.

Kısa bir not, bir ürün bilgisi, sık kullandığım bir açıklama veya kopyalayıp başka yerde kullanacağım bir metin olabilir. Böyle durumlarda bilgiye ulaşmak için bir pencere açmak, doğru dosyayı bulmak ve içeriğin arasında gezinmek gereğinden fazla işlem anlamına geliyor.

Bu düşünceden yola çıkarak **HemenBul** adını verdiğim küçük bir masaüstü uygulaması geliştirdim.

Amacım yeni bir not alma veya doküman yönetim sistemi oluşturmak değildi. Mevcut kayıtların içerisinde hızlıca arama yapabileceğim, bulduğum bilgiyi tek tıkla kopyalayabileceğim ve ihtiyaç duyduğumda diğer pencerelerin üzerinde tutabileceğim bir araç istiyordum.

İlk sürüm için Electron, Svelte, TypeScript ve Fuse.js kullandım. Bu yazıda uygulamanın nasıl çalıştığını ve küçük bir masaüstü aracı geliştirirken aldığım teknik kararları anlatacağım.

## Pencereyi Açmak Yerine El Altında Tutmak

HemenBul'un temel fikri, sürekli erişilebilir küçük bir pencere olması.

Electron'da pencereyi çerçevesiz (`frame: false`) oluşturdum. Varsayılan boyutu 560 × 460 piksel; gerektiğinde yeniden boyutlandırılabiliyor. İşletim sisteminin standart başlık çubuğu yerine uygulamanın kendi başlık alanı var.

En önemli özellik ise pencerenin varsayılan olarak diğer uygulamaların üzerinde kalması.

```ts
const window = new BrowserWindow({
  width: 560,
  height: 460,
  frame: false,
  resizable: true,
  alwaysOnTop: true,
  // ...
});
```

Böylece başka bir uygulamada çalışırken HemenBul'u yan tarafta açık tutabiliyorum. İhtiyaç duyduğum bir kaydı bulup içeriğini kopyalamak için çalışma bağlamımı tamamen değiştirmem gerekmiyor.

Pencerenin her zaman üstte kalma davranışını arayüzdeki bir düğmeyle açıp kapatmak da mümkün.

## Üç Ayrı Sorumluluk

Electron kullanırken arayüzü ve işletim sisteminin sunduğu yetenekleri aynı yerde toplamak istemedim.

Uygulamayı üç parçaya ayırdım:

```text
Svelte arayüzü
      │
      ▼
Preload API
      │
      ▼
Electron main process
      │
      ▼
Yerel JSON dosyası
```

**Main process** pencereyi oluşturuyor, dosya sistemine erişiyor ve kayıtların okunması ya da güncellenmesi gibi işlemleri gerçekleştiriyor.

**Renderer** tarafında Svelte çalışıyor. Arama kutusu, sonuç listesi, pinleme ve kopyalama gibi kullanıcı etkileşimleri burada bulunuyor.

Aradaki **preload** katmanı ise renderer'ın kullanabileceği işlemleri tanımlıyor.

Örneğin arayüz doğrudan Node.js dosya sistemi API'sini çağırmak yerine şöyle bir fonksiyon kullanıyor:

```ts
const records = await window.floatingSearch.loadRecords();
```

Bu çağrı preload üzerinden Electron'un IPC mekanizmasına, oradan da main process'e ulaşıyor.

Böylece arayüzün işletim sistemiyle yapabileceği işlemler belirli bir sözleşmenin arkasında kalıyor. Electron'da `contextIsolation` açık, renderer için doğrudan Node entegrasyonu ise kapalı.

Bu yaklaşımı özellikle küçük projelerde de değerli buluyorum. Uygulama basit olsa bile hangi kodun dosyaya erişebildiğinin, hangisinin yalnızca arayüzle ilgilendiğinin belli olması işleri daha anlaşılır hale getiriyor.

## Arama İçin Bir Sunucuya İhtiyacım Yoktu

İlk sürümde bütün kayıtlar yerel bir JSON dosyasında tutuluyor.

Bir kaydın başlığı, kategorisi, içeriği ve etiketleri var. Bunun yanında kaydın sabitlenip sabitlenmediğini gösteren isteğe bağlı bir alan bulunuyor.

Arama için ayrı bir servis veya veritabanı kurmak yerine [Fuse.js](https://www.fusejs.io/) kullandım.

Fuse.js'in tercih sebebi, tarayıcı tarafında çalışabilmesi ve yalnızca tam kelime eşleşmesiyle sınırlı kalmaması. Kullanıcı bir kelimeyi eksik veya biraz farklı yazdığında da ilgili kayıtlar bulunabiliyor.

Aramanın hangi alanlara daha fazla önem vereceğini ağırlıklarla belirledim:

```ts
const fuseOptions = {
  threshold: 0.35,
  ignoreLocation: true,
  keys: [
    { name: 'title', weight: 0.45 },
    { name: 'category', weight: 0.20 },
    { name: 'content', weight: 0.25 },
    { name: 'tags', weight: 0.10 },
  ],
};
```

Başlığa en yüksek ağırlığı verdim. Çünkü kullanıcı çoğu zaman aradığı bilginin neyle ilgili olduğunu biliyor ve bunu birkaç kelimeyle ifade ediyor. İçeriğin de aranabilir olması önemli; fakat sonuçların yalnızca uzun metinlerde geçen kelimeler nedeniyle öne çıkmasını istemedim.

Burada özellikle hoşuma giden nokta şu: **Arama işleminin tamamı uygulamanın içinde gerçekleşiyor.** İlk prototip için harici bir servise, API anahtarına veya sunucu altyapısına ihtiyaç duymuyorum.

## Arama Yapılmadığında Ne Gösterilmeli?

İlk bakışta küçük bir ayrıntı gibi görünüyor ama arama kutusu boşken kullanıcının karşısına ne çıkacağına da karar vermek gerekiyor.

Bütün kayıtları göstermek yerine **sabitlenen kayıtları** göstermeyi tercih ettim.

Kullanıcı en fazla beş kaydı pinleyebiliyor. Böylece HemenBul yalnızca arama yapılan bir araç değil, sık kullanılan birkaç bilginin her zaman el altında olduğu küçük bir panel olarak da çalışıyor.

Pin bilgisi de kayıtlarla birlikte JSON dosyasında tutuluyor. Bir kaydı sabitleme veya sabitlemeyi kaldırma işlemi main process üzerinden dosyaya yazılıyor.

Sonuç kartlarındaki diğer temel işlem ise **kopyalama**. Kullanıcı kaydın içeriğini tek tıkla panoya aktarabiliyor ve arayüz kısa süreli bir geri bildirim gösteriyor.

Bu tarz araçlarda bazen küçük etkileşimler, büyük özelliklerden daha önemli hale geliyor. Aradığım bilgiyi bulduktan sonra onunla ne yapacağımı düşünmek istemiyorum; mümkün olduğunca az adımla kullanabilmeliyim.

## JSON Dosyası Değiştiğinde Uygulama da Yenileniyor

Başlangıçta kayıtları uygulama içerisinden eklemek veya düzenlemek için ayrı bir ekran yapmadım.

Veri kaynağı doğrudan JSON dosyası olduğu için dosyanın dışarıdan değişmesini izlemek daha basit bir çözüm oldu.

Node.js'in `fs.watch` mekanizmasını kullanıyorum. Dosyada değişiklik algılandığında kısa bir beklemenin ardından renderer'a haber veriliyor. Arayüz de kayıtları yeniden okuyup arama indeksini oluşturuyor.

```text
records.json değişir
        │
        ▼
    fs.watch
        │
    300 ms debounce
        │
        ▼
 records:changed
        │
        ▼
Svelte veriyi yeniden yükler
        │
        ▼
Fuse indeksi güncellenir
```

Böylece aynı dosyanın değişikliğini görmek için uygulamayı her seferinde kapatıp açmak gerekmiyor.

Bu çözüm mevcut küçük veri kümesi için yeterince sade. Daha büyük bir veri modeli veya farklı dosya güncelleme yöntemleri söz konusu olduğunda izleme ve yeniden yükleme davranışını ayrıca ele almak gerekecek.

## Arayüzde Üç Farklı Tema

HemenBul'u masaüstünde uzun süre açık tutabileceğim için görünümünü de farklı çalışma ortamlarına uyum sağlayacak şekilde tasarladım.

Koyu, açık ve daha sıcak tonlar kullanan **soft** olmak üzere üç tema oluşturdum.

Renkleri bileşenlerin içerisine dağıtmak yerine CSS değişkenleriyle tanımladım. Tema değiştiğinde aynı arayüz farklı bir renk kümesini kullanıyor.

Seçilen temayı yerel olarak saklıyorum. Böylece uygulama yeniden açıldığında kullanıcının tercihi korunabiliyor.

Bu ilk sürümde arayüzü özellikle küçük tuttum: arama kutusu, sonuç kartları, birkaç pencere kontrolü ve alt bilgi alanı. Alt bölümde saat, tarih, sürüm ve desteklenen ortamlarda pil bilgisi de gösteriliyor.

## Masaüstüne Paketlemek

Uygulamayı geliştirme ortamında çalıştırmak yeterli değildi. Windows ve macOS için paketlenebilecek bir yapı da kurmak istedim.

Bu nedenle `electron-builder` ekledim. Yapılandırmada Windows için kurulum ve portable seçenekleri, macOS için ise DMG hedefi bulunuyor.

Ardından GitHub Actions üzerinde iki ayrı paketleme işi tanımladım. Biri macOS, diğeri Windows ortamında çalışacak şekilde ayarlandı ve üretilen dosyaların build artifact olarak saklanması hedeflendi.

Bu, projenin dağıtım sürecinin ilk adımı. Paket oluşturma yapılandırmasının bulunması, bütün işletim sistemi senaryolarının test edildiği anlamına gelmiyor.

Özellikle üzerinde çalışmam gereken bir ayrıntı da veri dosyasının konumu. Geliştirme ortamında proje klasöründeki JSON dosyasını okumak ve güncellemek kolay. Paketlenmiş bir uygulamada ise uygulama kaynaklarının bulunduğu dizin her zaman yazılabilir olmayabilir.

Bu nedenle sonraki adımlardan biri, kullanıcıya ait değiştirilebilir verileri uygulamanın kurulum dosyalarından ayırmak olacak.

## Bundan Sonra

HemenBul şu anda küçük ve belirli bir probleme odaklanan bir prototip.

Şimdilik veriyi yerel JSON dosyasından alıyor, uygulama içinden yeni kayıt oluşturmak için ayrı bir düzenleyici sunmuyor. Global klavye kısayolu veya sistem tepsisi entegrasyonu gibi özellikler de henüz yok.

Bunları birer eksiklik listesi olarak değil, sonraki iterasyonlarda değerlendirebileceğim olası geliştirmeler olarak görüyorum.

İlk aşamada benim için daha önemli olan, yerel veriyle çalışan bir aramanın masaüstü uygulamasına nasıl dönüştürüleceğini görmekti. Electron'un ana süreç ve arayüz arasındaki sınırını kurmak, aramayı Svelte içerisinde yönetmek ve kayıtlar değiştiğinde sonucu güncellemek bu deneyimin asıl teknik tarafını oluşturdu.

Bazen bir problemi çözmek için büyük bir sistem geliştirmek gerekmiyor.

**Doğru yerde açılan küçük bir pencere, iyi tasarlanmış bir arama davranışı ve tek tıkla kopyalama, günlük kullanımda yeterince değerli olabiliyor.**
