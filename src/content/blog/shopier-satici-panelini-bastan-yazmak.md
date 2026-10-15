---
title: "Shopier Satıcı Panelini Baştan Yazmak: Merchant"
description: "Satıcı panelini ortak repodan ayırıp merchant adıyla sıfırdan yazmak: mimari, veri erişimi, güvenlik ve eski panelden kademeli geçiş."
pubDate: 2019-09-24
lang: 'tr'
tags: ['software-architecture', 'php', 'shopier', 'legacy-modernization']
---

Shopier'de satıcıların kullandığı panel uzun süredir başka bir projenin bir parçası olarak yaşıyordu.

Satıcı ürününü burada ekliyor, siparişlerini burada takip ediyor, mağaza ayarlarını ve ödemelerini buradan yönetiyordu. Ancak bu proje yalnızca satıcı paneli değildi. İç yönetim araçları da aynı projenin içerisindeydi. Zaman içerisinde satıcı tarafının ihtiyaçları büyüdükçe iki farklı dünyanın aynı kod tabanında yaşamasının sınırlarına ulaşmaya başladık.

Uzun süre üzerinde çalıştığım yeni satıcı panelini bu nedenle ayrı bir proje olarak geliştirdim.

Projenin adı `merchant` oldu.

Bu yazıda eski paneli neden geliştirmeye devam etmek yerine yeniden yazmayı tercih ettiğimizi, yeni panelin mimarisini ve eski sistemden yeni sisteme geçişi nasıl tasarladığımızı anlatacağım.

> **Not:** Bu yazıda yer alan bazı klasör ve dosya adları, kod örnekleri, dizin yolları ve mimari detaylar; şirketin fikrî mülkiyetini ve teknik altyapısının gizliliğini korumak amacıyla sadeleştirilmiş, anonimleştirilmiş veya temsili olarak yeniden düzenlenmiştir. Anlatılan teknik yaklaşımlar ve mimari kararlar gerçek geliştirme sürecine dayanmakla birlikte, paylaşılan örnekler sistemin birebir implementasyonunu yansıtmayabilir.

## Eski Panel

Eski yapıda satıcı sayfaları kabaca şöyle bir yerde yaşıyordu:

```text
Ortak repo/
└── public/
    ├── products.php
    ├── orders.php
    ├── ...
    ├── productsv2.php
    ├── ordersv2.php
    └── ...
```

Buradaki ilk problem oldukça temel:

Ortak repo sadece merchant uygulaması değildi. Satıcıların kullandığı sayfalarla şirket içerisinde kullanılan yönetim ekranları aynı uygulamanın parçasıydı. İki taraf zaman içerisinde birbirinden oldukça farklı ihtiyaçlara sahip olmaya başladı.

Bir tarafta:

```text
admin
operasyon
iç araçlar
```

diğer tarafta:

```text
ürünler
siparişler
ödemeler
mağaza yönetimi
kargo
entegrasyonlar
```

vardı. Satıcı tarafı artık kendi başına bir ürün haline gelmişti.


## Baştan Yazmak

Burada önemli bir karar verdik:

Eski paneli yeni bir tema giydirerek devam ettirmek yerine satıcı panelini sıfırdan yazmak. Bunun amacı yalnızca daha modern bir arayüz değildi. Kod tarafında da daha net sınırlar istiyordum.

Eski kodda sayfa, sorgu ve iş mantığının birbirine karıştığı yerler oldukça fazlaydı.
Yeni panelde tam bir framework kullanmadan daha düzenli ve tahmin edilebilir bir yapı kurmaya çalıştım. 

Ortaya üç temel parçadan oluşan basit bir model çıktı:

```text
Page
  │
  ├── JavaScript / Middleware
  │
  ▼
Middleware Endpoint
  │
  ▼
Domain Class
  │
  ▼
Database
```

Bir ekranın hangi parçalarının nerede bulunacağı artık daha belirgindi.

## Page + Middleware + Domain Class

Örneğin sipariş ekranını düşünelim.

Sayfanın kendisi:

```text
orders.php
```

UI'ın temel yapısını oluşturuyor.

Siparişlerle ilgili iş mantığı ve veri erişimi:

```text
src/
```

altındaki ilgili sınıfta bulunuyor.

Tarayıcıdan gelen dinamik işlemler ise:

```text
api/v1/
```

altındaki endpoint'ler üzerinden gerçekleştiriliyor.

Yani genel yapı:

```text
orders.php
    │
    │ Middleware
    ▼
api/v1/...
    │
    ▼
src/Order.php
    │
    ▼
Database
```

şeklinde.

Bugün baktığımda oldukça basit bir ayrım. Zaten istediğim de buydu.

Framework'ün getirdiği büyük bir mimari yerine, projedeki herkesin baktığında kodun nerede olması gerektiğini anlayabileceği küçük bir convention.

## Sayfayı Değil Veriyi Yenilemek

Yeni panelde değiştirmek istediğim şeylerden biri de liste ekranlarının çalışma şekliydi.

Sipariş ve ürün ekranları giderek büyüyordu.

Binlerce kaydı tek seferde getirip HTML üretmek yerine sayfayı önce arayüz iskeletiyle açıp veriyi Middleware üzerinden almaya başladım.

Örneğin sipariş listesinde kullanıcı:

- arama yaptığında,
- tarih değiştirdiğinde,
- filtre uyguladığında,
- sıralamayı değiştirdiğinde,
- başka sayfaya geçtiğinde

tüm sayfanın yeniden yüklenmesine gerek kalmıyor. Sadece gerekli veri tekrar isteniyor. Büyük listelerde DataTables'ı server-side modda kullandım.

Akış kabaca şöyle:

```text
Browser
   │
   │ search / filter / sort / page
   ▼
Middleware
   │
   ▼
PHP
   │
   ▼
SQL
LIMIT / OFFSET
   │
   ▼
JSON
   │
   ▼
DataTables
```

Bu özellikle siparişler ve ürünler gibi sürekli kullanılan ekranlarda paneli çok daha rahat hale getiriyor.

## Veritabanı Katmanını da Yenilemek

Eski panelden değiştirmek istediğim önemli noktalardan biri veri erişimiydi. Eski sayfalarda `mysqli` ve string birleştirilerek oluşturulan sorgular oldukça yaygındı.

Yeni panelde veri erişimini PDO üzerine taşıdım. Sorgularda prepared statement kullandım.

Örneğin temel yaklaşım:

```php
$stmt = $db->prepare(
    'SELECT * FROM orders WHERE user_id = :user_id'
);

$stmt->execute([
    ':user_id' => $userId
]);
```

Buradaki amaç sadece syntax değiştirmek değildi. Yeni kod tabanında veri erişiminin nasıl yapılacağı konusunda ortak bir standart oluşturmaktı.

Dinamik sıralama gibi doğrudan parameter binding yapılamayan alanlarda da izin verilen kolonları whitelist üzerinden kontrol ettim. Daha önemli işlemlerde transaction kullandım.

Örneğin bir ürün güncellemesi birden fazla tabloyu etkiliyorsa:

```text
BEGIN

update product
update variant
update category
update other data

COMMIT
```

işlemlerden biri başarısız olduğunda:

```text
ROLLBACK
```

ile değişikliklerin tamamını geri alabiliyoruz. Eski panelden yeni panele geçerken değiştirmek istediğim en temel şeylerden biri tam olarak buydu:

**Yeni kod yazarken hangi standardı kullanacağımız belli olsun.**

## Ortak Bir Başlangıç Noktası

Paneldeki her sayfanın tekrar tekrar aynı başlangıç işlemlerini yapmasını da istemedim. Bu yüzden authenticated sayfaların ortak başlangıç noktası `autoloader.php` oldu.

Burada:

```text
configuration
class loading
session
authentication
```

gibi temel işler hazırlanıyor. Middleware endpoint'lerinin de buna karşılık gelen ortak bir başlangıç mekanizması var. Aradaki önemli fark şu:

Normal bir sayfada session sona ermişse kullanıcı login ekranına yönlendirilebilir. Ama Middleware isteğinde HTML redirect döndürmek istemedim. Bunun yerine istemciye session'ın sona erdiğini anlatan bir JSON cevabı döndürdüm. Tarayıcı tarafı da buna göre davranıyor.

Küçük bir ayrıntı ama middleware istekleri ağırlıklı bir panel geliştirirken bu tarz davranışların baştan standartlaştırılması işleri oldukça kolaylaştırıyor.

## Header Bir HTML Dosyası Olmaktan Çıktı

Yeni panelde ortak arayüz parçalarını da merkezi hale getirdim.

Header, menü, üst bar, arama alanı ve JavaScript dependency'leri ayırdım. Ama bütün sayfalara bütün JavaScript kütüphanelerini yüklemek istemedim.

Örneğin bir sayfa:

```text
select2
daterangepicker
chart
```

kullanıyorsa bunu belirtiyor ve sadece gerekli dependency'ler ekleniyor. Böylece header ortak kalırken her ekran kendi ihtiyacını tanımlayabiliyor.

## Güvenliği de Baştan Ele Almak

Yeni bir authentication akışı yazarken eski davranışları birebir taşımak istemedim. Panelde oturum güvenliği için birkaç katman ekledim.

- Middleware işlemlerinin tamamında CSRF token kontrolü yapıyoruz.
- Oturum cookie'si `httponly` olarak tutuluyor ve session identifier düzenli olarak yenileniyor.
- Bunun yanında satıcının isteğe bağlı olarak açabileceği TOTP tabanlı iki adımlı doğrulama da ekledim.
- Login ve register güvenliğini ele aldım.

## Panel Artık Sadece Ürün ve Sipariş Değil

Yeni paneli yazmaya başladığımda temel ihtiyaçlar belliydi:

```text
ürünler
siparişler
ödemeler
mağaza ayarları
```

Fakat geliştirme ilerledikçe satıcının günlük operasyonlarının çok daha büyük bir bölümünü aynı yerden yönetebilmesi gerektiği ortaya çıktı.

- Dashboard tarafında satış istatistikleri ve özetleri ekledim
- Ürün tarafında varyasyonlar, kategoriler, ürün kopyalama, toplu işlemler ve görsel düzenlemeleri yaptım
- Siparişlerde gelişmiş arama ve filtreleme yanında toplu kapatma ve kargo işlemleri alanları geldi.
- Tahsilat tarafında haftalık hakedişleri, kesintileri ve iadeleri görüntüleyip verileri CSV veya Excel olarak dışarı aktarabiliyorlar.
- Bunun yanında kupon kodları, API erişimi, callback adresleri, hesap güvenliği ve onboarding gibi alanlar da artık aynı panelin parçası.
- Basit ve gelişmiş görünüm

Bu noktada `merchant` artık eski panelin yeni tasarımlı hali olmaktan çıktı.

**Satıcının Shopier'deki çalışma alanına dönüştü.**

## Neden Bir PHP Framework Kullanmadım?

Bu projede bilinçli olarak büyük bir PHP framework'üne geçmedim. Framework kullanmaya karşı olduğum için değil. Çözmeye çalıştığım problem bu olmadığı için bir framework tercih etmedim. Framework üzerine düşüncelerim başka makale konusu olabilir.

Yeni panelin, Shopier'in mevcut:

```text
database
session
services
storev2
```

yapısıyla birlikte çalışması gerekiyordu.

Aynı anda hem satıcı panelini baştan yazmak hem de platformun geri kalanını yeni bir framework mimarisine taşımak projenin kapsamını ciddi şekilde büyütecekti. Bu nedenle daha pragmatik bir yol seçtim:

```text
PHP
PDO
namespace
basit autoload
Middleware
net klasör sınırları
```

Benim için burada önemli olan framework isminden çok kodun sınırlarının belli olmasıydı.

Bir sipariş sorgusunun nerede olması gerektiğini biliyorsak, bir middleware isteğinin nereden geçeceği belliyse ve UI ile business logic birbirinden ayrılabiliyorsa ilk hedefe ulaşmış oluyoruz.

## Kullandığım Araçları Nasıl Seçtim?

Frontend tarafında da benzer şekilde sıfırdan bir UI sistemi oluşturmak istemedim.

Bu sayede:

```text
layout
cards
forms
modals
responsive grid
```

gibi temel UI problemlerini tekrar çözmek yerine ürünün kendisine odaklanabildim.

- Projenin UI kısmı bir admin dashboard olarak önceden hazırdı.
- jQuery tema ve kullandığımız component'lerin ortak tabanı.
- DataTables büyük veri listelerini yönetiyor.
- Chart.js dashboard grafiklerini oluşturuyor.
- Select2 ve daterangepicker yoğun filtre kullanılan ekranlarda işimizi kolaylaştırıyor.
- Görsellerin işlenmesi, optimize edilmesi ve saklanması ile işlemsel e-postaların gönderimi gibi ihtiyaçlarda mevcut altyapı servislerinden yararlanıyoruz.

Enerjiyi Shopier'e özgü problemlere ayırmak istedim. Buradaki seçimlerin ortak noktası şu:

**İhtiyacımız olmayan şeyi kendimiz yazmamak.**

## Eski Panelden Bir Anda Çıkmadık

Yeni panel hazır olduğunda bütün satıcıları aynı anda taşımak istemedim. Çünkü yeniden yazılan bir sistemde kodun çalışmasıyla gerçek kullanıcıların günlük işlerini sorunsuz yapabilmesi aynı şey değil. Bu yüzden geçişi kademeli tasarladım.

Eski login akışı yeni paneli biliyordu. Bir satıcı yeni panele geçirilmişse login sonrasında:

```text
Ortak repo
   │
   ▼
login
   │
   ├── eski panel
   │
   └── merchant
```

şeklinde `merchant`'a yönlendiriliyordu. İlk aşamada sınırlı sayıda satıcıyı yeni panele aldık. Sorunları gördükçe düzelttik. Daha sonra yeni kayıtları doğrudan `merchant` ile başlattık.

Son aşamada mevcut satıcıları kademeli olarak taşıdık. Bu süreçte eski panel çalışmaya devam etti. Böylece migration ile rewrite'ı birbirinden ayırmış olduk.

Bence yeniden yazılan büyük bir sistemde en önemli konulardan biri de bu:

**Yeni sistemi yazmak kadar eski sistemden nasıl çıkacağını da tasarlamak gerekiyor.**

## `Ortak repo` ve `merchant`

İki sistem arasındaki değişimi özetlersem:

|                 | `Ortak repo`        | `merchant`                        |
| --------------- | ------------------- | --------------------------------- |
| Amaç            | Satıcı + iç yönetim | Yalnızca satıcı                   |
| Panel           | v1 / v2             | Tek panel                         |
| Veri erişimi    | mysqli ağırlıklı    | PDO + prepared statements         |
| İşlem bütünlüğü | Sınırlı             | Transaction                       |
| Kod yapısı      | Sayfa ağırlıklı     | Page + domain class + middleware  |
| Listeleme       | Geleneksel sayfalar | middleware + server-side DT       |
| Güvenlik        | Temel oturum        | CSRF + 2FA + brute-force koruması |
| Mobil kullanım  | İkincil             | Tasarımın parçası                 |

Fakat benim için en önemli değişiklik, eskiden satıcı paneli `Ortak repo` uygulamasının bir parçasıydı. Şimdi kendi sınırı olan bir uygulama.

```text
Ortak repo → internal management

merchant   → merchant panel
```

Asıl mimari değişiklik bu.

## Bundan Sonra

`merchant` günlük satıcı operasyonlarının büyük bölümünü karşılayan bir noktaya geldi. Fakat bu, üzerinde yapılacak bir şey kalmadığı anlamına gelmiyor.

- Önümüzdeki dönemde özellikle dil altyapısını tamamlamak, bazı büyük ekranları daha küçük parçalara ayırmak ve tekrar eden başlangıç kodlarını azaltmak istiyorum.
- Dependency yönetimini daha düzenli hale getirmek de bakmak istediğim konulardan biri.

Kod açısından baktığımda ise bu projeden çıkan en önemli sonuç benim için şu oldu:

**Bazen bir sistemi iyileştirmenin doğru yolu mevcut kodu biraz daha düzenlemek değil, yanlış sınırı düzeltmektir.**

Buradaki problem yalnızca eski PHP veya eski arayüz değildi. Satıcı panelinin başka bir uygulamanın içerisinde büyümeye çalışmasıydı.

`merchant` ile yaptığımız temel değişiklik satıcı paneline yeni bir görünüm vermek değil, ona kendi sınırını vermek oldu.

Şimdi bu sınırın önümüzdeki yıllarda nasıl büyüyeceğini göreceğiz.

---

> Bin millik yolculuk tek bir adımla başlar.
>
> - Lao Tzu, *Tao Te Ching*