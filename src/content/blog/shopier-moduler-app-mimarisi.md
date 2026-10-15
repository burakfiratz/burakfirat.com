---
title: "Shopier'de Modüler Bir App Mimarisi Tasarlamak"
description: "Opsiyonel özellikleri ana uygulamalara gömmek yerine kendi sınırları olan app'lere taşımak: Shopier için tasarladığım apps mimarisinin ilk hali."
pubDate: 2021-10-04
lang: 'tr'
tags: ['software-architecture', 'php', 'shopier', 'app-market', 'plugin-system']
featured: true
---

Shopier'de yeni özellikler geliştirdikçe bir süredir aynı problemle karşılaşıyorduk: Her yeni özellik doğrudan mevcut uygulamaların içine ekleniyordu.
Kural şuydu, **yeni özellik core bir özellik midir?** diye soruyorduk. Eğer öyleyse geliştirmeyi ilgili repolarda geliştiriyorduk.

Ya core özellik değilse,i işte o zaman yeni özelliği backloga alıyorduk. Burada işletme kararı olarak;
- Bu özelliğe ne kadar talep geldi? 
- Bu geliştirme ne kadar acil? 
- Sektördeki yeri nedir?

gibi sorulara göre özelliğin geleceği belli oluyordu 😅

Satıcı tarafındaki bir özellik `merchant` projesine, mağaza tarafındaki bir özellik `storefront - storev2` projesine giriyor; her iki tarafı ilgilendiren özelliklerde ise kod doğal olarak iki projeye birden yayılıyordu.

Bu yöntem bir noktaya kadar gayet iyi çalışıyor. Ancak özellik sayısı arttıkça özellikle **opsiyonel özelliklerde** yönetilmesi zor bir yapı ortaya çıkmaya başlıyor.

- Bir özelliği yalnızca belirli satıcılara açmak istediğimizde ne yapacağız?
- Satıcı özelliği sonradan kurabilecek veya kaldırabilecek mi?
- Bir özelliğin hem satıcı panelinde hem mağazada çalışan parçaları varsa bunları nerede tutacağız?
- Yeni bir fikri/özelliği dışarıdan geliştirici Shopier'e özel geliştirmek isterse nasıl yapacağız?
- Ücretli bir özellik geliştirirsek abonelik durumunu nerede yöneteceğiz?

Bu sorular üzerine son birkaç aydır üzerinde çalıştığım yeni bir yapı ortaya çıktı: 

`Shopier Apps`

## Problem

Shopier'in şu anda bu konuyla doğrudan ilişkili iki ana uygulaması var. `merchant - m`, satıcıların ürünlerini, siparişlerini ve mağaza ayarlarını yönettiği merchant paneli. `storefront - storev2` ise ürünlerin müşterilere gösterildiği ve satın alma akışının gerçekleştiği mağaza tarafı.

İki proje de `Shopier Apps` fikrinden çok daha önce geliştirilmeye başlanmış durumda. Bu nedenle bugüne kadar yeni bir özellik geliştirirken en doğal yöntem ilgili kodu doğrudan bu projelerden birine eklemekti.

Örneğin opsiyonel bir özellik için zamanla buna benzer kontroller oluşabilir:

```php
if ($featureEnabled) {
    // feature logic
}
```

Tek bir özellik için bunda problem yok. Ama aynı yaklaşımı onlarca farklı özellik için uyguladığımızda ana uygulama, kendi iş mantığının yanında opsiyonel özelliklerin de kodunu taşımaya başlıyor.

Daha önemlisi, bu özelliklerin ortak bir yaşam döngüsü yok:

- Bir özellik sisteme nasıl kurulur?
- Nasıl kaldırılır?
- Geçici olarak nasıl devre dışı bırakılır?
- Satıcı bu özelliği satın aldı mı?
- Kendi `Shopier Apps`ini geliştirmek isteyen geliştiriciler nasıl yönetecek?

Bu soruların her özellik tarafından ayrı ayrı cevaplanmasını istemiyorum. Bunun yerine platform seviyesinde ortak bir **app modeli** oluşturmak daha doğru görünüyor.

## Fikir

Shopier'in mevcut yapısına uyabilecek daha basit bir model oluşturmak istiyorum.

Temel fikir şu:

```text
Shopier
│
├── Merchant
│
├── Storefront
│
└── Apps
    │
    ├── App A
    ├── App B
    ├── App C
    └── ...
```

Yeni bir opsiyonel özellik mümkün olduğunca `merchant - m` veya `storefront - storev2` içerisine gömülmeyecek; bunun yerine kendi app'i olacak. App'in kendi PHP kodu, asset'leri, dil veirleri ve gerektiğinde kendi iş mantığı bulunacak.

Ana uygulamalar ise app'in iç yapısını bilmek yerine ortak bir arayüz üzerinden onunla iletişim kuracak. Bunun için ayrı bir `Shopier Apps` reposu oluşturdum.

## İlk Yapı

İlk çalışan sürümde sistemi mümkün olduğunca küçük tutmaya çalıştım. Çekirdek yapı şu şekilde:

```text
Shopier Apps/
│
├── Apps/
│   ├── AppCore
│   ├── AppList
│   ├── AppManager
│   └── AppStorage
│
├── billing_address/
│
└── welcome_to_shopier/
```

Buradaki ilk dört class app sisteminin altyapısını oluşturuyor. `billing_address` ve `welcome_to_shopier` ise mimarinin gerçekten çalışıp çalışmadığını görmek için oluşturduğum ilk app'ler.

Özellikle ilk aşamada karmaşık app'lerle başlamak istemedim. Önce şu akışın çalışması gerekiyordu:

```text
App'i bul
    ↓
Satıcıda kurulu mu kontrol et
    ↓
App class'ını yükle
    ↓
Gerekli noktada çalıştır
    ↓
Gerekirse verisini sakla
```

Bu akış oturduktan sonra app'lerin yaptığı işin karmaşıklığı ikinci planda kalıyor.

## AppCore

Sistemin merkezindeki yapılardan biri `AppCore`. Amacım her app'in platform ile konuşabileceği ortak noktaları tanımlamak. Bunun için `AppCore`, app'lere platformun sağladığı servislere erişim ve içerik gösterebilecekleri ortak noktalar sunuyor. Örneğin:

```php
showBlock()
showScriptBlock()

getPropertyList()
getStorageInstance()
getLanguageInstance()

...Diğer ortak çatı fonksiyonları ve 
şirkete ait özel/fikri mülkiyet niteliğindeki fonksiyonlar
```

Her app bütün metodları kullanmak zorunda değil; ihtiyaç duyduğu noktayı kendi içerisinde implemente edebilir. Basitleştirilmiş bir app şu şekilde düşünülebilir:

```php
class ExampleApp extends AppCore
{
    public function getPropertyList()
    {
        // App'in satıcı bazındaki ayarlarını ve özelliklerini döner
    }

    public function getStorageInstance()
    {
        // App ve satıcıya bağlı AppStorage nesnesini döner
    }

    public function getLanguageInstance()
    {
        // App ve satıcıya bağlı AppLanguage nesnesini döner
    }

    public function showBlock($blockName = null, $args = [])
    {
        // İstenen block'u, varsa ek verilerle birlikte render eder
    }

    ...App'in kendi özelinde public/private fonksiyonlar
}
```

Burada asıl önemli nokta metodların kendisinden çok oluşan sınır. Ana uygulamanın `ExampleApp` içerisinde ne olduğunu bilmesine gerek yok; sadece app'in uyması gereken kontratı bilmesi yeterli.

Bu sayede yeni app'ler ekledikçe ana uygulamanın her app'in implementasyon detayını öğrenmesini engelleyebiliriz.

## AppManager

Bir sonraki problem hangi app'in çalışacağını belirlemek. Bunun sorumluluğunu `AppManager` taşıyor. Bir satıcı için manager oluşturup kurulu app'leri initialize edebiliyoruz. Kabaca kullanım şu şekilde:

```php
$appManager = new AppManager(...);

$appManager->initUserApps();

$appManager->handleUserApp([
    "billing_address",
    "welcome_to_shopier"
]);
```

Burada mümkün olduğunca configuration yazmak yerine convention kullanmaya çalıştım. Bir app'in slug'ından class dosyasının nerede olduğunu bulabiliyoruz. Örneğin `billing_address` için sistem ilgili app klasörüne gidip convention'a uygun class'ı yükleyebiliyor.

Böylece her app eklediğimizde merkezi bir dosyada şöyle sürekli büyüyen ikinci bir registry tutmak zorunda kalmıyoruz:

```php
$apps = [
    'app1' => App1::class,
    'app2' => App2::class,
    'app3' => App3::class,
];
```

App kendi klasöründe bulunuyorsa sistem onu keşfedebiliyor.

## Bir App'in Yapısı

Her app'i mümkün olduğunca kendi sınırları içerisinde tutmak istiyorum. Genel yapı şuna benzer diyebiliriz:

```text
Shopier Apps/
└── example_app/
    ├── ExampleApp.php
    └── assets/
        ├── css/
        ├── js/
        └── img/
```

Bunun önemli bir avantajı var: Bir özellik için gerekli PHP, JavaScript, CSS ve görseller aynı yerde bulunabiliyor.

Örneğin `billing_address` üzerinde çalışıyorsam, bu özelliğin parçalarını bulmak için `merchant - m` ve `storefront - v2` içerisinde farklı klasörleri aramak yerine app'in kendi sınırına bakabiliyorum. App kaldırıldığında da hangi kodun o özelliğe ait olduğu çok daha açık.

## AppStorage

App'leri ayırmaya başladıktan sonra ortaya çıkan başka bir problem veri saklama. Birçok app'in küçük miktarda kullanıcı bazlı configuration veya state tutması gerekiyor. Bunun için her app'in kendi tablosunu oluşturması gereksiz bir yük oluşturabilir.

Bu nedenle `AppStorage` adında ortak bir storage katmanı ekledim. Amaç basit: `user + app + data` ilişkisini ortak bir mekanizma üzerinden saklayabilmek.

Böylece basit bir app yalnızca birkaç ayar saklamak için yeni bir tablo tasarlamak zorunda kalmıyor. İhtiyaç büyürse elbette app kendi veri modelini oluşturabilir; fakat küçük app'ler için ortak storage yeterli.

## Dil Verilerini App İçinde Tutmak

App'in bağımsız olabilmesi için sadece PHP kodunun ayrılması yeterli değil. UI tarafındaki metinlerin de ana uygulamanın dosyalarında olmasını istemiyorum.

Bu nedenle app kendi dil verilerini, veritabanında kendine ait dil alanında bulunduruyor. Böylece app'e ait çeviriler de app ile birlikte hareket ediyor.

Bu küçük bir detay gibi görünse de modül sınırının korunması açısından önemli. Bir app'in mümkün olduğunca bütün parçaları aynı yerde olmalı.

## Mevcut Projelere Nasıl Bağlanıyor?

Buradaki en önemli kısıtlardan biri şu: Bu mimariyi sıfırdan yazılmış yeni bir uygulamaya eklemiyorum. `merchant - m` ve `storefront - v2` zaten çalışan projeler. Dolayısıyla yeni app sisteminin mevcut kod tabanlarına minimum müdahaleyle eklenmesi gerekiyor.

Sunucuda projeler kardeş klasörler halinde bulunuyor:

```text
/
├── merchant -m/
├── storefront - storev2/
├── Shopier Apss/
└── other-repos/
```

Bu nedenle ilk aşamada oldukça basit bir entegrasyon kullandım: Mevcut autoloader'a `apps` için bir fallback ekliyorum. 

```php
spl_autoload_register(...);
```

Böylece uygulama kendi içerisinde bulamadığı bir app class'ı için `Shopier Apps` reposuna bakabiliyor.

Bu yaklaşım oldukça basit. Ama şu an çözmeye çalıştığım problem açısından bunun bir avantaj olduğunu düşünüyorum: Mevcut iki büyük projeyi yeniden organize etmeden yeni mimariyi sisteme dahil edebiliyorum.

## Neden Composer Değil?

Burada doğal olarak şu soru ortaya çıkıyor: Neden `Shopier Apps` bir Composer package değil?
Buna modern değil diyebiliriz **ama** işletme kararlarının bir sonucu olduğu için uyum sağlamalıydı. Bu durumu şuna benzetiyorum;

> diğer repolar birbirleriyle uyumlu bitmemiş büyük bir yapboz ürünleri, bu yüzden yeni parça oraya uymalıydı. 

Hemen açıklıyorum. Temel neden, mevcut sistemde `merchant - m` ve `storefront - v2` zaten bu dependency modeliyle geliştirilmiş projeler değil. Sadece app sistemi eklemek için iki projede büyük bir dependency/autoload migration yapmak, çözmeye çalıştığım problemden daha büyük bir değişiklik yaratacaktı. Bu nedenle ilk aşamada mevcut sisteme uyum sağlamayı tercih ettim.

Bu kararın sonsuza kadar böyle kalması gerekmiyor. İleride yazılacak yeni bir uygulama `Shopier Apps`'i farklı bir autoload mekanizmasıyla da kullanabilir. Önemli olan app'in public contract'ının consumer'ın onu nasıl yüklediğine bağlı olmaması.

## İlk İki App

Altyapıyı doğrulamak için iki app ile başladım.

### Billing Address

`billing_address`, checkout sırasında farklı bir fatura adresi alınabilmesini sağlıyor.

Bu app özellikle önemli çünkü yalnızca panel tarafında çalışan bir UI özelliği değil; satın alma akışına dokunuyor ve veri saklaması gerekiyor. Dolayısıyla app sisteminin gerçek bir platform akışına entegre olabildiğini test etmek için iyi bir örnek.

### Welcome to Shopier

`welcome_to_shopier` ise daha basit bir örnek. Satıcı panelinde yeni kullanıcıya gösterilebilecek bir karşılama alanı sağlıyor.

Bu iki app'i birlikte kullanmak farklı ihtiyaçları test etmemi sağladı. Bir tarafta checkout ve veri saklama gibi daha işlevsel bir özellik, diğer tarafta panel içerisinde gösterilen daha basit bir UI app'i var.

## Ücretli App'ler

Bu mimariyi oluştururken düşündüğüm konulardan biri de app'lerin ileride ücretli olabilmesi.
İleride bu konuda çalışma yapılırken, `AppCore` bunun için app'lere ortak metodlar sunabilir.

Buradaki hedef şu: Bir özelliği ücretli hale getirdiğimizde ilgili app'in içerisine farklı yerlerde manuel ödeme kontrolleri eklemek zorunda kalmamak. App altyapısı zaten bu kavramı tanıyor olmalı.

Bu aynı zamanda `Shopier Apps` projesinin yalnızca teknik bir kod organizasyonu olmadığını gösteriyor. Uzun vadede bunun satıcının ihtiyacına göre özellik seçebileceği bir platform katmanına dönüşmesini istiyorum.

## Dışarıdan Geliştiriciler İçin

Bu yapıyı kurarken aklımda olan bir diğer hedef, app geliştirmenin yalnızca Shopier ekibiyle sınırlı kalmaması.

App sınırını net çizmenin bir faydası da burada ortaya çıkıyor. Dışarıdan bir geliştiricinin `merchant - m`, `storefront - v2` ve diğer repolardaki kod tabanlarını tanımasına gerek olmamalı. `AppCore`'un sunduğu kontratı, yani ayarlara, storage'a ve asset'lere nasıl erişeceğini ve içeriğini hangi noktalarda gösterebileceğini bilmesi yeterli olmalı zaten kendi klasöründe ve veritabanında bu yapılar duruyor; bu da bir app'i bağımsız olarak geliştirip teslim etmeyi mümkün kılıyor.

Ücretli veya ücretsiz app altyapısı hayata geçtiğinde bu senaryonun da bir parçası olacak. Satıcı app'i Shopier üzerinden kurup ödemesini yine Shopier üzerinden yapacak; geliştirici ise yalnızca özelliğin kendisine odaklanabilecek.

Elbette dışarıdan gelen bir app'in doğrudan yayına alınması doğru olmaz. App'ler checkout gibi hassas akışlara dokunabildiği için yayınlanmadan önce Shopier tarafında incelenmesi ve onaylanması gerekecek. Satıcının da bir app'i Shopier'in mi yoksa başka bir geliştiricinin mi geliştirdiğini görebilmesi önemli.

Bu henüz bir plan. Ama `AppCore`'u küçük ve net tutmaya özen göstermemin nedenlerinden biri de bu: Bir gün dışarıdan biri bu kontrata göre app yazacaksa, kontratın kendisinin anlaşılır ve kararlı olması gerekiyor.

## Nereye Gitmesini İstiyorum?

Şu an sistemin ilk çalışan hali ortaya çıkmış durumda. Ama asıl değer bundan sonra yeni özellikleri nasıl geliştirdiğimizde ortaya çıkacak. Örneğin şunlar gibi ana platformun zorunlu parçası olmayan özellikler bu yapıya oldukça uygun:

- kargo özellikleri
- ürüne özel uygulamalar
- satın alma sonrası servisler
- analytics entegrasyonları

Yeni bir özellik geldiğinde ilk sorulardan biri artık şu olabilir:

> Bu gerçekten platformun core özelliği mi, yoksa bir app mi?

Bence bu ayrım uzun vadede önemli olacak. Çünkü her yeni özelliğin core'a eklenmesi, zamanla core'un sınırının ortadan kalkmasına neden oluyor. App yaklaşımı ise bize ikinci bir seçenek veriyor.

## Sonuç

`Shopier Apps` projesiyle ile çözmeye çalıştığım problem aslında yalnızca kodu farklı klasörlere taşımak değil. Asıl amaç platform ile opsiyonel özellikler arasında açık bir sınır oluşturmak.

Bugünkü ilk versiyonda elimizde `AppCore`, `AppManager`, `AppList` ve `AppStorage` üzerine kurulu küçük bir çekirdek ve bunu kullanan iki app var.

Mimari özellikle basit tutuldu. Çünkü şu aşamada bütün geleceği tahmin eden genel amaçlı bir plugin framework yazmak istemiyorum. Öncelikle doğru sınırı oluşturmak istiyorum:

- Yeni bir app kendi kodunu ve asset'lerini taşıyabilmeli.
- Platform app'in iç implementasyonunu bilmemeli.
- App ayar, veri ve dil ihtiyaçlarını platformun sunduğu ortak servisler üzerinden karşılayabilmeli.
- Satıcı bazında hangi app'in aktif olduğu merkezi olarak belirlenebilmeli.
- İleride ücretli özellikler eklediğimizde aynı yapı bunun temelini oluşturabilmeli.

Şu an için ilk iki app bu yaklaşımın çalıştığını gösteriyor. Bundan sonraki asıl test, üçüncü, beşinci ve onuncu app'i eklediğimizde bu sınırların hâlâ temiz kalıp kalmayacağı olacak.

---

> Mükemmelliğe, eklenecek bir şey kalmadığında değil, çıkarılacak bir şey kalmadığında ulaşılır.
>
> - Antoine de Saint-Exupéry