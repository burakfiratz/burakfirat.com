---
title: 'Flow: Tema Geliştirmelerinde Görünmeyen İşleri Görünür Kılmak'
description: 'Çoklu mağaza temalarında geliştirilen sayfa ve davranışları izlemek için React, Ant Design ve Supabase ile tasarladığım Flow kontrol listesi prototipi.'
pubDate: 2023-12-03
lang: 'tr'
tags: ['react', 'frontend', 'workflow', 'software-engineering', 'supabase']
draft: false
---

Bir mağaza temasının geliştirildiğini söylemek kolay. Peki gerçekten tamamlandığını nasıl anlayacağız?

Mağaza sayfası açılıyor olabilir. Ürünler listeleniyordur. Ürün detayında fiyatı, varyasyonları ve sepete ekle butonunu görüyoruzdur. Ama butonun hangi koşullarda çalıştığı, miktar artırıp azaltma işlemlerinin doğru davranıp davranmadığı veya filtrelemenin bütün senaryoları karşılayıp karşılamadığı ayrı konular.

Üstelik birden fazla tema üzerinde çalışıldığında aynı soruları her tema için tekrar sormak gerekiyor. Bir temada tamamlanan özellik, diğerinde henüz ele alınmamış olabilir.

**Flow** projesini bu işler arasındaki görünmez farkları takip edebilmek için geliştirmeye başladım. Hedefim kapsamlı bir proje yönetim aracı yazmak değildi. Tema geliştirme sürecinde neyin yapıldığını, neyin kaldığını ve hangi alana ait olduğunu kolayca gösterebilen küçük bir kontrol paneli oluşturmaktı.

2023 sonunda React ile geliştirdiğim ilk prototipte tema bazlı sayfaları, görev listelerini, ortak checkbox davranışını ve kullanıcıya göre ilerleme saklayabileceğim veri modelini oluşturdum.

## Bir sayfanın görünmesi, çalıştığı anlamına gelmiyor

İlk çözmem gereken şey, kontrol edeceğim işleri doğru tanımlamaktı.

Bir ürün sayfasını tek bir *Product Page* maddesi olarak işaretlemek işime yaramayacaktı. Çünkü ürün sayfası tek bir iş değil, farklı türde sorumlulukların birleşimi.

Örneğin ürün görsellerinin, fiyatın, varyasyonların ve satın alma butonunun yerleştirilmesi bir grup iş. Sepete ekleme, sepetten çıkarma, miktar artırma ve azaltma gibi davranışlar ise başka bir grup.

Aynı ayrım mağaza vitrininde de var. Ürünlerin listelenmesi ve daha fazla yükleme alanının görünmesiyle, filtreleme ve sıralama fonksiyonlarının çalışması birbirinden farklı.

Bu yüzden yapılacak işleri yalnızca ekrana göre değil, **görünüm ve davranış** olarak da düşünmeye başladım. Kontrol listesindeki her maddenin tek başına tamamlanabilir bir sorumluluğu temsil etmesini istedim.

İlk görev tanımlarında basit bir nesne yeterliydi:

```js
const productTasks = {
  product_images: 'Ürün görselleri',
  variations: 'Varyasyonlar',
  add_to_cart: 'Sepete ekle butonu',
  increment_product: 'Miktar artırma davranışı',
};
```

*Bu örnek, projedeki görev yaklaşımını göstermek için sadeleştirilmiştir.*

Makine tarafından kullanılabilecek sabit bir anahtar ile kullanıcıya gösterilecek açıklamayı ayırmak önemliydi. Böylece ekrandaki metin değişse bile kaydedilen görev durumunu aynı anahtarla takip edebilirdim.

## Tema, sayfa ve görev

Başlangıçta tek bir kontrol listesi yeterliymiş gibi görünüyordu. Fakat farklı temalar işin içine girince durum değişti.

Birinci tema için mağaza vitrini tamamlanmış olabilir. İkinci tema için ürün sayfası henüz başlangıç aşamasındadır. Üçüncü temada görünüm hazırdır ama etkileşimlerin bir bölümü eksiktir.

Bu nedenle Flow'u üç katman etrafında düzenledim: **tema, sayfa ve görev**.

Her tema için ayrı bir ekran oluşturdum. Ekranın içerisindeyse sayfa ve akış bölümlerini sekmelere ayırdım. İlk somut listeleri `Store` ve `Product` için hazırladım. Kargo, ödeme, sipariş işleme ve onay gibi sonraki adımları da aynı sekme yapısında yer alabilecek şekilde tasarladım.

```text
Flow
 ├── Theme 1
 │    ├── Store
 │    │    ├── Ürünlerin listelenmesi
 │    │    ├── Daha fazla gösterme
 │    │    └── Filtreleme ve sıralama
 │    └── Product
 │         ├── Görseller ve fiyat
 │         ├── Varyasyonlar
 │         └── Sepet davranışları
 ├── Theme 2
 ├── Theme 3
 └── Theme 4
```

Burada özellikle istemediğim şey, her tema için ayrı kontrol paneli mantığı yazmaktı. Temalar farklı olsa da takip ettiğim işlerin önemli bir bölümü ortaktı. Değişmesi gereken şey checklist bileşeni değil, **hangi temanın hangi görevleri tamamladığı** bilgisi olmalıydı.

## Arayüzü küçük parçalara ayırmak

Projeyi React, Vite ve Ant Design ile geliştirdim. Vite geliştirme ortamını hızlıca kurmamı sağladı; Ant Design ise menü, sekme, liste ve checkbox gibi bileşenler için hazır bir temel sundu.

İlk arayüzde menü, sayfalar ve görev listeleri birbirine daha yakındı. Proje genişleyince bu yapıyı ayırdım.

Ana uygulama oturum bilgisini sağlayan katmanı yüklüyor. Router genel sayfa iskeletini oluşturuyor. Sol menü tema bağlantılarını gösterirken içerik alanı seçilen sayfayı açıyor. Tema sayfasının içerisinde de ilgili kontrol listeleri yer alıyor.

Bu ayrım bir framework mimarisi kurmaktan çok, aynı dosyanın bütün sorumlulukları üstlenmesini önlemek içindi. Yeni bir tema ekranı eklemek için menüdeki bütün JSX'i değiştirmek veya kontrol listesinin davranışını tekrar yazmak istemiyordum.

İlk sürümün sonunda temel parçalar şöyle ayrılmıştı:

```text
App
 └── AuthProvider
      └── FlowRouter
           ├── FlowSider
           └── FlowContent
                └── Flow
                     └── FlowTab
                          ├── StoreFlow
                          └── ProductFlow
```

Aynı zamanda checkbox işlemlerini tekrar kullanabilmek için ortak bir `CheckBoxy` yapısı üzerinde çalıştım. Her sayfanın görev tanımlarını bu ortak yapıya vererek durum okuma ve değiştirme mantığını tek yerde toplamayı hedefledim.

## Kontrol listesinin kalıcı olması

Kullanıcı bir checkbox'ı işaretlediğinde bu bilginin yalnızca React state'inde durması yeterli değildi. Sayfa yenilendiğinde veya başka bir temaya geçildiğinde ilerlemenin kaybolmaması gerekiyordu.

Bu noktada Supabase'i denemeye başladım.

Tasarladığım veri modelinde temel soru şuydu: *Hangi kullanıcı, hangi temada, hangi görevi tamamladı?*

Sorguları kullanıcı kimliği ve tema kimliği üzerinden kurdum. Görev durumlarını ise JSON yapısı içerisinde saklamayı denedim. Böylece mağaza vitrini ve ürün sayfasına ait görevleri aynı tema kaydında gruplandırabilecektim.

```json
{
  "store": {
    "listing_of_products": 1,
    "filtering_sorting_function": 0
  },
  "product": {
    "product_images": 1,
    "variations": 0
  }
}
```

Bu örnek, kullandığım veri modelinin sadeleştirilmiş bir gösterimi. Burada `1` tamamlanan, `0` ise bekleyen işi ifade ediyor.

Bu yaklaşımın avantajı, ilk sürümde her yeni checklist maddesi için ayrı bir tablo veya sütun tanımlamak zorunda kalmamaktı. Ancak JSON içindeki bir alanı güncellerken diğer alanları korumak ve aynı veriyi birden fazla kullanıcının değiştirmesi gibi konuların dikkatle yönetilmesi gerektiği de ortaya çıktı.

## Kullanıcı yönetimiyle birlikte kapsamın genişlemesi

İlk kontrol listelerini geliştirdikten sonra, farklı kullanıcıların kendi ilerlemelerini görebilmesi için giriş ve kayıt ekranları ekledim.

Böylece proje yalnızca statik bir todo listesinden çıkıp kullanıcı ve tema bağlamı olan bir uygulamaya doğru ilerlemeye başladı. Oturum bilgilerini React Context üzerinden paylaşmayı, menüleri giriş durumuna göre değiştirmeyi ve veritabanı sorgularında kullanıcı kimliğini kullanmayı denedim.

Burada ilk iterasyonun sınırını da açıkça belirtmek gerekiyor. Repodaki son haliyle oturum ve veri güncelleme entegrasyonlarının tamamı doğrulanmış değil. Bazı bağlantı yapılandırmaları ve güncelleme davranışları üzerinde çalışılması gerekiyor. Bu yüzden projeyi çok kullanıcılı, kullanıma hazır bir servis olarak değil, temel arayüzü ve veri modelini geliştirdiğim bir **prototip** olarak görüyorum.

Bu ayrım, çalışmanın değerini azaltmıyor. Aksine ilk sürümde çözmeye çalıştığım problemi daha net tarif ediyor: tema geliştirirken yapılacak işlerin görünür ve takip edilebilir hale gelmesi.

## Bu denemeden geriye ne kaldı?

Flow'un ilk sürümünde dört tema için sayfa düzenini, mağaza ve ürün görev listelerini, ortak checkbox yaklaşımını, temel navigasyonu ve kullanıcıya göre ilerleme saklamak için düşündüğüm veri yapısını oluşturdum.

Geriye bakınca projedeki en yararlı kararın teknoloji seçimi değil, **işi doğru küçük parçalara bölmek** olduğunu düşünüyorum.

Bir temayı tamamlandı veya tamamlanmadı diye işaretlemek fazla genel kalıyor. Oysa ürün görseli, varyasyon seçimi, sepete ekleme ve miktar değiştirme birbirinden ayrıldığında hem ilerleme daha anlamlı hale geliyor hem de eksik davranışları görmek kolaylaşıyor.

Projenin devamında gerçek kullanım için oturum entegrasyonunu tamamlamak, veri güncellemelerini güvenilir hale getirmek, Supabase erişim politikalarını doğrulamak, bekleyen akış sekmelerini doldurmak ve görev durumları için testler eklemek gerekir.

Flow, benim için büyük bir proje yönetim uygulaması geliştirme denemesinden çok, küçük bir mühendislik sorusuna verilen ilk cevaptı:

**Bir şeyin yapılmış olduğunu nasıl takip ettiğimiz, onu nasıl geliştirdiğimiz kadar önemli olabilir.**
