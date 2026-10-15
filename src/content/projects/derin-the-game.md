---
title: 'Derin - Bir Oyundan Önce Oyun Sistemini Tasarlamak'
description: 'Tarayıcıda çalışan, mod ve plugin yaklaşımıyla genişletilebilir bir oyun çekirdeği üzerine kurduğum erken aşama oyun prototipi.'
summary: 'Oyun dünyası büyümeden önce onu taşıyacak sistemleri denediğim; event bus, yeniden kullanılabilir envanter, modüler arayüz ve temalarla ilerleyen bir JavaScript oyun prototipi.'
startDate: 2026-03-30
ongoing: true
cover: './derin-the-game.svg'
coverAlt: 'Derin proje kapağı: kırmızı daire içinde modüler oyun sistemini simgeleyen dört kare'
stack: ['JavaScript', 'HTML', 'CSS']
role: 'Kişisel proje'
featured: true
order: 2
---

Bir tarayıcı oyunu geliştirmeye başladığınızda ilk akla gelen şey genellikle oyuncunun ne yapacağı oluyor. Kaynak toplayacak mı, bir şeyler inşa edecek mi, bir harita üzerinde mi ilerleyecek?

Ben *Derin* üzerinde çalışırken bunların yanında başka bir soruyla da ilgilendim: **Oyuna yeni bir mekanik eklemek için mevcut kodun ne kadarını değiştirmek zorunda kalacağım?**

Bir elma toplanabiliyorsa yarın odun da toplanabilmeli. Odun varsa onu tüketen bir yapı inşa edilebilmeli. Daha sonra yeni bir kaynak, farklı bir karakter özelliği veya bambaşka bir oyun modu eklemek istediğimde başlangıçtaki sistemi her defasında yeniden düzenlemek istemiyordum.

Bu yüzden ilk aşamada büyük bir dünya veya tamamlanmış bir oyun döngüsü oluşturmaya çalışmak yerine, oyun mekaniklerinin üzerine kurulabileceği küçük bir çekirdek geliştirdim.

`Derin`, şu anda tarayıcıda çalışan, JavaScript ile yazılmış erken aşama bir oyun prototipi. Bu yazıda Mart 2026'daki ilk iterasyonlarını, mod ve plugin yaklaşımını ve bu yapıyı geliştirirken karşılaştığım tasarım kararlarını anlatacağım.

## Oyunu Küçük Bir Çekirdeğin Etrafında Kurmak

Projede büyük bir oyun motoru veya kapsamlı bir frontend framework'ü bulunmuyor. HTML, CSS ve tarayıcının yerel JavaScript modülleriyle ilerliyorum.

Uygulamanın başlangıç noktası oldukça küçük. Sayfa yüklendiğinde bir `GameManager` oluşturuluyor ve oyun bileşenleri başlatılıyor.

Ama asıl iş `GameManager`'ın arkasındaki oyun çekirdeğinde.

Burada oyuncunun durumu, dünya bilgisi, kayıtlı nesneler, aksiyonlar ve modlar için ortak bir yapı var. Çekirdeğin amacı her oyun mekaniğini kendisinin bilmesi değil; farklı mekaniklerin konuşabileceği bir arayüz sunmak.

Genel yapı şu şekilde:

```text
Browser
   │
   ▼
GameManager
   │
   ▼
GameCore
   ├── State
   ├── Item Registry
   ├── Action Registry
   ├── Event Bus
   ├── Plugins
   └── Mods
```

Örneğin çekirdeğin bir elmanın ne olduğunu bilmesine gerek yok. Elma modülü kendi nesnesini ve yapılabilecek aksiyonlarını tanımlıyor. Çekirdek yalnızca bunların nasıl kaydedileceğini ve çalıştırılacağını biliyor.

Bu ayrım, projenin en başından itibaren korumak istediğim temel fikir.

## Plugin ile Mod Aynı Şey Değil

Projede özellikle ayırmaya çalıştığım iki kavram var: **plugin** ve **mod**.

Plugin, başka oyun sistemlerinin kullanabileceği genel bir yetenek sağlıyor. Sekmeli arayüz, bildirimler, envanter veya buton üzerindeki ilerleme animasyonu buna örnek.

Mod ise oyun dünyasına bir davranış veya içerik ekliyor. Elma toplamak, odun biriktirmek, altın çıkarmak veya kulübe inşa etmek gibi.

Böylece envanterin nasıl çalıştığını odun modülüne yazmam gerekmiyor. Odun modülü yalnızca hangi nesneyi ürettiğini ve bu nesnenin hangi aksiyonla kazanıldığını tanımlıyor.

Bir modun yaşam akışını da üç aşamaya ayırdım:

```text
register → init → ui
```

`register` aşamasında nesneler ve aksiyonlar tanımlanıyor. `init` aşamasında gerekli olay dinleyicileri kuruluyor. `ui` aşamasında ise mod kendi arayüz bileşenlerini oluşturabiliyor.

Örneğin odun toplama modülü, bir `wood:brushwood` nesnesini ve `wood:gather:brushwood` aksiyonunu kaydediyor. Ardından oyuncunun kullanabileceği toplama butonunu ilgili panele yerleştiriyor.

Bu yapı şu an otomatik olarak mod keşfeden veya çalışma anında istediği modülü kaldırabilen tamamlanmış bir sistem değil. Yükleme sırası `GameManager` içerisinde açıkça belirleniyor. Fakat modların ortak bir sözleşmeyle eklenebilmesi için ilk sınırları oluşturmuş oldum.

## Aksiyonlar ve Event Bus

Bir oyun mekanizmasının yalnızca çalışması yetmiyor. Çalıştığında başka sistemlerin de bundan haberdar olması gerekiyor.

Örneğin oyuncu odun topladığında envanter değişiyor. Envanter görünümü güncellenmeli. İleride görev sistemi varsa bir görevin ilerlemesi gerekebilir. Belki bir bildirim veya ses efekti de oynatılacak.

Bu davranışların tamamını odun toplama fonksiyonunun içine koymak istemedim.

Bu nedenle çekirdeğe basit bir event bus ekledim. Bir bileşen olay yayınlıyor; o olayla ilgilenen diğer bileşenler kendi işini yapıyor.

Akışın sadeleştirilmiş hali şöyle:

```text
Oyuncu "Odun Topla" butonuna basar
              │
              ▼
       Toplama aksiyonu
              │
              ▼
       Envantere odun ekle
              │
              ▼
         Olay yayınla
              │
              ▼
       Envanter arayüzünü yenile
```

Kod tarafında da yaklaşım oldukça küçük:

```js
api.registerAction('wood:gather:brushwood', async (ctx) => {
    // Toplama işlemini gerçekleştir.
    ctx.playerInventory.add('wood:brushwood', 1);
    ctx.bus.emit('action:wood:gather', {
        itemId: 'wood:brushwood',
        quantity: 1
    });
});
```

*Bu örnek, gerçek aksiyonun zamanlama ayrıntıları çıkarılarak sadeleştirilmiş halidir.*

Bunun önemli tarafı, envanter ekranının odun modülünü tanımak zorunda olmaması.

Bugün aynı mekanizma odun topladıktan sonra envanteri yenilemek için kullanılıyor. İleride görev, başarı, ses veya animasyon sistemlerini bağlamak için de doğal bir genişleme noktası sağlayabilir.

## Oyunda Zamanın Akması

Derin'de ilk denediğim sistemlerden biri karakter istatistikleri oldu.

Sağlık, mana, açlık ve susuzluk gibi değerlerin sadece bir butona basıldığında değişmesini istemiyordum. Bazıları zaman içerisinde yenilenmeli, bazıları ise azalmalıydı.

Bu nedenle çekirdekte düzenli çalışan bir güncelleme döngüsü oluşturdum. Her güncellemede bir önceki çalışmadan beri geçen gerçek süre hesaplanıyor. Karakter istatistiklerine bu süreye göre yenilenme veya azalma uygulanıyor.

```text
Geçen süreyi hesapla
         │
         ▼
    Stat değerini güncelle
         │
         ▼
     stat:ticked yayınla
         │
         ▼
      HUD'ı güncelle
```

Burada sabit miktarda değişiklik uygulamak yerine geçen süreyi hesaba katmak önemli. Tarayıcıdaki zamanlayıcılar her zaman tam belirtilen anda çalışmayabiliyor. Geçen süreyi kullanmak bu sapmaları azaltmaya yardımcı oluyor.

Şimdilik küçük bir sistem ama oyuna yeni istatistikler eklenebilmesi için bir temel oluşturuyor.

Elma tüketiminin sağlık ve açlık gibi değerlere etki etmesi de aynı olay mekanizması üzerinden gerçekleşiyor.

## Tek Bir Envanter Değil, Envanter Sistemi

İlk mekanikler çalışmaya başladığında oyuncunun topladığı nesneleri saklamak gerekiyordu.

İlk bakışta bu iş için bir dizi yeterli görünebilir. Fakat nesnelerin adetleri, aynı nesnenin birden fazla slotta bulunması, maksimum yığın miktarı ve farklı saklama alanları gibi konular hızla ortaya çıkıyor.

Bu yüzden envanteri doğrudan oyuncuya bağlı tek bir yapı olarak geliştirmek yerine yeniden kullanılabilir bir plugin haline getirdim.

Envanter plugin'i kendisine verilen slot verisi için yeni bir envanter arayüzü üretiyor. Bu arayüz üzerinden nesne ekleme, çıkarma, miktar kontrolü ve görünümü yenileme işlemleri yapılabiliyor.

Kullanımı kabaca şöyle:

```js
const inventory = api.inventory.create({
    slots: Array(20).fill(null),
    summary: {}
});

inventory.add('wood:brushwood', 1);
inventory.has('wood:brushwood', 1);
```

Asıl güzel tarafı, bu yapının sadece oyuncunun çantasıyla sınırlı olmaması.

Oyuncu envanteri için 20 slotlu bir örnek oluştururken depo için aynı plugin üzerinden 3 slotlu ayrı bir örnek oluşturabiliyorum.

```text
           Inventory Plugin
                  │
          ┌───────┴────────┐
          ▼                ▼
    Player Inventory   Player Storage
       20 slots           3 slots
```

Burada depoya eşya taşıma gibi daha kapsamlı bir sistem henüz tamamlanmış değil. Fakat aynı envanter davranışını farklı saklama alanlarında yeniden kullanabilmek, erken aşamada görmek istediğim önemli bir sonuçtu.

Bir oyun nesnesini nasıl sakladığımızla, o nesnenin kime ait olduğunu birbirinden ayırmaya başladık.

## Toplamak, Tüketmek, İnşa Etmek

Çekirdeğin işe yarayıp yaramadığını anlamanın yolu farklı özelliklerin onun üzerinde nasıl çalıştığını görmek.

Bunun için küçük oyun mekanikleri oluşturdum.

Elma toplanabiliyor ve tüketildiğinde karakter değerlerini etkileyebiliyor. Çalı çırpı toplanabiliyor. Altın için ayrı bir toplama aksiyonu var. Kulübe ise belirli miktarda odun gerektiren bir inşa örneği.

Özellikle kulübe örneği önemliydi. Çünkü yalnızca yeni bir nesne eklemiyordu; başka bir modülün ürettiği kaynağa bağımlıydı.

Kulübe inşa edilmeden önce envanterde yeterli odun olup olmadığı kontrol ediliyor. Gereken kaynaklar çıkarılıyor ve ilgili olay yayınlanıyor.

Bu, birbirinden bağımsız geliştirilen iki mekaniğin ortak sistem üzerinden çalışabildiğini gösteren küçük bir örnek.

Toplama butonlarında zaman alan aksiyonları göstermek için ilerleme animasyonu da ekledim. Aksiyonun başladığı olayını dinleyen plugin, butonu geçici olarak devre dışı bırakıp görsel bir ilerleme çubuğu gösteriyor.

Burada görsel ilerleme ile oyun aksiyonunun tamamlanmasını daha sıkı bağlamak hâlâ geliştirilmesi gereken konulardan biri. Şimdilik bu mekanikler, kurulmakta olan altyapıyı sınamak için kullandığım küçük senaryolar.

## Arayüzün de Modüler Olması

Oyun çekirdeğini modlara ayırıp bütün arayüzü tek bir HTML dosyasında yönetmek istemedim.

Bu yüzden sekmeli menü sistemini de ayrı bir plugin olarak ele aldım.

Genel menüde oyun alanı, çanta, dünya ve ayarlar gibi bölümler bulunuyor. Modlar ihtiyaç duyduklarında kendi butonlarını ilgili panele ekleyebiliyor.

Dünya bölümünde iç içe sekme yapısını da denedim.

Bu aşamada oyun ekranının büyük bölümünü HUD oluşturuyor. Sol üstte karakter istatistikleri ve menü, arka planda ise oyun dünyası için ayrılmış alan var.

Görsel tarafta üç farklı tema hazırladım: **Violet, Stellar ve Crimson**.

Temaların renklerini ayrı CSS dosyalarında tanımladım. Ortak HUD yapısı ise bu renkleri CSS değişkenlerinden alıyor.

Böylece tema değiştirmek için bütün arayüzü yeniden oluşturmam gerekmiyor. Aktif stylesheet değişiyor; kullanıcının seçimi tarayıcıda saklanıyor.

Burada kalıcı olarak saklanan şeyin tema tercihi olduğunu özellikle ayırmak gerekiyor. Oyuncunun bütün ilerlemesini kaydeden bir save sistemi henüz bu prototipin parçası değil.

## Dünya Henüz Bir Taslak

Projeye deneysel bir harita tanımı da ekledim.

Şimdilik bu tanım bir köyün kimliği, adı, açıklaması ve görsel referansı gibi bilgiler içeriyor. Oyun çekirdeği haritaları kayıt altına alabiliyor.

Fakat bu aşamayı çalışan bir dünya veya harita motoru olarak anlatmak doğru olmaz.

Karakterin harita üzerinde hareket ettiği, nesnelerin yerleştirildiği veya bölgeler arasında geçiş yapılabilen tamamlanmış bir sistem henüz yok.

Bu ayrımı önemli buluyorum. Çünkü prototip geliştirirken bazen bir mekanizmanın veri modelini oluşturmakla o mekanizmanın oyun içinde gerçekten çalışması birbirine karıştırılabiliyor.

Benim şu anda üzerinde çalıştığım şey, ileride böyle bir dünyanın kurulabileceği parçaları birbirine bağlamak.

## İlk İterasyonlardan Ne Öğrendim?

Mart ayındaki ilk commit'lere baktığımda değişimin daha çok oynanabilir içerik eklemekten ziyade altyapıyı ayrıştırma yönünde olduğunu görüyorum.

Önce çekirdek ve birkaç kaynak toplama örneği vardı. Ardından context menu eklendi. Harita tanımıyla deney yapıldı. Menü bileşenleri yeniden düzenlendi. Envanter bağımsız bir plugin'e dönüştü, oyuncu çantası ve depo aynı altyapıyı kullanmaya başladı. Sonra HUD temaları eklendi.

Bunların hiçbiri tek başına büyük bir oyun özelliği değil.

Fakat bir araya geldiklerinde yeni mekanikleri nereye ekleyeceğim konusunda daha net bir yapı ortaya çıkıyor.

Diğer taraftan prototipin eksikleri de belirgin. Modların kaldırılması ve olay dinleyicilerinin temizlenmesi, envanter sınır durumları, aksiyon zamanlaması, kayıt sistemi ve gerçek harita davranışları henüz olgunlaştırılması gereken alanlar.

Ben bu projeyi şimdilik tamamlanmış bir oyun olarak değil, **oyunun nasıl geliştirileceğini araştırdığım bir çalışma alanı** olarak görüyorum.

## Bundan Sonra

Derin'de bir sonraki önemli adımın daha fazla kaynak veya buton eklemekten çok mevcut mekanikleri birbirine bağlamak olduğunu düşünüyorum.

Topladığım odunun yalnızca envantere eklenmesi değil, dünyada bir değişiklik yaratması gerekiyor. İnşa ettiğim yapının bir karşılığı olmalı. Oyuncunun yaptığı işlerin kalıcı hale gelmesi ve ileride tekrar devam edebilmesi gerekiyor.

Bunların yanında oyun çekirdeği ile modlar arasındaki sözleşmeyi de güçlendirmek istiyorum. Yeni özellik eklemek kolay olmalı ama farklı modların birbirini yanlış sırada yüklemesi veya gereksiz yere birbirinin durumuna erişmesi gibi problemler de kontrol altına alınmalı.

Şu ana kadar yaptığım çalışma bana bir şeyi yeniden hatırlattı:

**Bir oyunda yeni bir özellik geliştirmek kadar, o özellikten sonra gelecek olanı kolaylaştırmak da önemli.**

Derin henüz küçük bir prototip. Ama benim için asıl ilginç tarafı da bu. Oyun dünyası büyümeden önce onu taşıyacak sistemlerin hangi sınırlar üzerine kurulacağını deneyebiliyorum.

Belki ileride bambaşka bir oyuna dönüşecek. Şimdilik amacım, her yeni fikirde baştan başlamamı gerektirmeyen bir temel oluşturmak.

> Eğlence, öğrenmenin başka bir adıdır.
>
> *"Fun is just another word for learning."* — Raph Koster, *A Theory of Fun*
