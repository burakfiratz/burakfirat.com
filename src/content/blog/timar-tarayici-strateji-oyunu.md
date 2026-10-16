---
title: 'Timar: Tarayıcıda Kaynak, Bina ve Zaman Tasarlamak'
description: 'PHP, MongoDB ve Twig ile geliştirdiğim deneysel tarayıcı strateji oyununda bina yükseltmelerini, kaynak maliyetlerini ve zaman tabanlı işlem kuyruğunu nasıl tasarladım?'
pubDate: 2022-10-25
lang: 'tr'
tags: ['php', 'mongodb', 'game-development', 'software-architecture']
draft: false
---

Bir strateji oyununda bina yükseltme düğmesine basmak birkaç saniyelik bir işlem gibi görünebilir. Oyuncu yeterli kaynağa sahipse düğmeye basar, bir sayaç başlar ve belirli bir süre sonra bina yeni seviyesine ulaşır.

Ancak bu küçük etkileşimin arkasında birden fazla problem var. Oyuncunun kaynağı gerçekten yeterli mi? Yükseltmenin maliyeti ve süresi nereden geliyor? Oyuncu tarayıcıyı kapatırsa işlem devam edecek mi? Sayaç sıfıra ulaştığında binanın seviyesini kim artıracak?

**Timar** projesine başlarken ilgimi çeken şey tam olarak buydu. Tarayıcıda çalışan bir strateji oyununun bütün dünyasını bir seferde oluşturmaktansa önce bu dünyanın temel kurallarını geliştirmek istedim: kaynaklar, binalar, seviyeler ve zaman.

PHP, MongoDB ve Twig kullanarak bir oyun prototipi oluşturdum. Çalışmanın sonunda bina tiplerini ve yükseltme maliyetlerini tanımlayan veri yapısı, oyuncu kaynaklarını yöneten servisler, yükseltme isteklerini alan uçlar ve süresi dolan işlemleri tamamlayan bir arka plan görevi ortaya çıktı. Bu yazıda özellikle zaman tabanlı bina mekaniğini nasıl tasarladığımı anlatacağım.

## Önce oyunun kuralları

Tarayıcı strateji oyunlarında en önemli kararlar genellikle savaş ekranında değil, kaynak ekonomisinde verilir. Bir binanın ikinci seviyeye yükseltilmesi ile onuncu seviyeye yükseltilmesi aynı maliyette olmamalı. Yükseltme süresi de seviyeye ve bina tipine göre değişmeli.

Bu yüzden Timar'da bina özelliklerini PHP sınıflarının içine sabit değerler olarak yerleştirmek yerine veri olarak tanımladım. Her bina için bir kimlik, ad, kullanılabilir seviye aralığı, seviyelere göre kaynak maliyetleri ve yine seviyelere göre inşa süreleri bulunuyor.

Örneğin bir bina için veri modelini sadeleştirerek şöyle gösterebilirim:

```json
{
  "building_tag": "wood_camp",
  "building_name": "Wood Camp",
  "resource_per_level": {
    "2": { "wood": 120, "rock": 60, "gold": 30 }
  },
  "building_time_per_level": {
    "2": 25
  }
}
```

*Bu örnekteki rakamlar ve alanlar anlatımı basitleştirmek için temsili olarak gösterilmiştir.*

Bu yaklaşımın avantajı, bina türü arttıkça yükseltme algoritmasını yeniden yazmak zorunda kalmamam. Aynı kod, hangi binanın hangi seviyeye yükseltildiğini bilerek ilgili maliyeti ve süreyi veriden okuyabiliyor.

İlk aşamada belediye binası, sur, kışla, okçuluk yapısı ve tahıl tarlası, oduncu kampı, taş ocağı ile altın madeni gibi kaynak binalarını tanımladım. Asker türleri için de can, saldırı, savunma, hız ve menzil gibi özellikleri seviyelere göre saklayan ayrı veri tanımları oluşturdum. Burada asker verilerinin bulunması, savaş mekaniklerinin de tamamlandığı anlamına gelmiyor; çalışmanın odağı bina ve kaynak altyapısıydı.

## Neden PHP ve MongoDB?

Bu çalışma için kapsamlı bir oyun motoruna ihtiyacım yoktu. Oyuncunun yaptığı işlemler bir HTTP isteğiyle başlayabiliyor, sunucuda değerlendiriliyor ve sonuç tekrar tarayıcıya iletilebiliyordu. Bu nedenle backend tarafında PHP ile ilerledim.

Veri tarafında iki farklı yaklaşım kullandım. Giriş işlemlerinde ilişkisel veritabanı ve PDO yer alırken, bina tanımları, oyuncunun binaları, kaynakları ve yükseltme kuyruğu için MongoDB kullandım.

MongoDB'nin doküman yapısı özellikle burada işime yaradı. Oyuncunun her bina için mevcut seviyesini iç içe alanlar halinde tutabiliyor; örneğin belirli bir binanın seviyesini diğer binalara dokunmadan değiştirebiliyordum.

```text
Oyuncu
  ├── resources
  │     ├── grain
  │     ├── wood
  │     ├── rock
  │     └── gold
  └── buildings
        ├── town_hall → level
        ├── wood_camp → level
        └── barrack → level
```

Bu kararın bedeli de var: farklı koleksiyonlardaki güncellemeleri yönetmek ve aynı anda gelen istekleri güvenli şekilde işlemek, tek bir veri değişikliği kadar basit değil. İlk sürümde önce doğru veri akışını kurmaya odaklandım.

## Bina yükseltmeyi tek bir akış olarak ele almak

Bir binanın ilk defa kurulması ile mevcut binanın seviye atlaması, oyuncuya farklı metinlerle gösterilebilir. Ama her ikisinde de aynı temel sorular soruluyor: Bir sonraki seviye ne, bu seviyenin maliyeti ne ve ne kadar sürecek?

Bunları `BuildingManager` içerisinde topladım. Oyuncunun mevcut bina seviyesi okunuyor, bir sonraki seviye hesaplanıyor ve bu seviyeye ait kaynak gereksinimleri MongoDB'den alınıyor. Ardından oyuncunun kaynaklarıyla karşılaştırılıyor.

Akış kabaca şöyle:

```text
Yükseltme isteği
       ↓
Mevcut bina seviyesi
       ↓
Bir sonraki seviyenin maliyeti ve süresi
       ↓
Oyuncunun kaynakları yeterli mi?
       ├── Hayır → Yükseltme reddedilir
       └── Evet  → Kaynak düşülür
                     ↓
                 Kuyruğa eklenir
```

Kaynaklar yeterliyse ilgili miktarlar oyuncu hesabından düşülüyor. Bu işlemi MongoDB'nin `$inc` operatörüyle yaptım; böylece birden fazla kaynak alanını tek güncelleme komutunda azaltabiliyorum.

Burada kaynak yeterliliğini kontrol etmek ile kaynağı düşmek ayrı adımlar. Bu nedenle eşzamanlı iki yükseltme isteğinin yarışması gibi senaryoları güvence altına almak için sonraki bir sürümde atomik koşullar ve kuyruk kısıtları eklemek gerekecek. İlk prototipin bu konuda kusursuz olduğunu iddia etmiyorum.

## Sayacı tarayıcı değil, sunucu yönetmeli

Projede üzerinde en çok düşündüğüm bölüm zaman tabanlı yükseltmeydi.

Oyuncu binayı yükselttiğinde yalnızca bir `setTimeout` çalıştırıp sürenin sonunda seviyeyi değiştirebilirdim. Fakat bu durumda oyun durumu tarayıcıya bağımlı olurdu. Sayfa kapanırsa veya oyuncu başka bir cihazdan girerse sistemin güvenilir bir bitiş zamanı kalmazdı.

Bu yüzden yükseltmenin bitiş anını sunucuda hesaplayıp MongoDB'deki ayrı bir kuyruğa kaydettim.

```php
$finishAt = floor(microtime(true) * 1000)
    + ($buildingTimeInSeconds * 1000);
```

Kuyruktaki kayıt, hangi oyuncunun hangi binayı yükselttiğini ve işlemin ne zaman tamamlanması gerektiğini içeriyor.

```text
building_queue
  ├── user_id
  ├── building_tag
  └── building_time_timestamp
```

Böylece oyuncunun tarayıcıyı açık tutması gerekmiyor. İşlem, bitiş zamanı geçmiş bir kayıt olarak sunucuda bekliyor.

## Cron ile tamamlanan işler

Kuyruğa alınan bir yükseltmenin gerçekten tamamlanması için ikinci bir süreç gerekiyor. Bunun için PHP ile ayrı bir komut dosyası oluşturdum.

Bu görev, MongoDB'deki `building_queue` koleksiyonunda bitiş zamanı geçmiş kayıtları arıyor. Bulduğu her işlem için oyuncunun ilgili bina seviyesini bir artırıyor, binanın kurulmuş olduğunu işaretliyor ve kuyruk kaydını siliyor.

```text
Cron görevi
      ↓
Bitiş zamanı geçmiş kayıtları bul
      ↓
Oyuncunun bina seviyesini artır
      ↓
Binayı kurulmuş olarak işaretle
      ↓
Kuyruk kaydını sil
```

Yerel geliştirme ortamında cron'u dakika başı ve aynı dakika içerisinde ek aralıklarla çalıştıracak bir düzen denedim. Bu, yükseltmenin tamamlanmasını kullanıcı isteğinden bağımsız hale getirdi.

Burada önemli bir ayrıntı var: kuyruk işinin tekrar çalıştırılması veya aynı kaydın iki görev tarafından işlenmesi gibi durumlar için tam bir işlem sahiplenme ve idempotency mekanizması henüz yok. Bu nedenle tasarım, ilk sürümün zaman tabanlı işleme yaklaşımını gösteriyor; dağıtık bir iş kuyruğunun bütün garantilerini sunmuyor.

## Kullanıcının gördüğü sayaç

Sunucuda bitiş zamanı tutulurken tarayıcı tarafında da oyuncunun ne kadar bekleyeceğini göstermem gerekiyordu.

Twig şablonlarında bina seviyesi, yükseltme düğmesi ve sayaç alanını hazırladım. JavaScript tarafında sunucudan dönen bitiş zamanını kullanarak her saniye kalan süreyi hesaplayan bir sayaç oluşturdum.

Böylece iki farklı sorumluluk ortaya çıktı:

- **Sunucu:** Yükseltmenin ne zaman biteceğine ve bina seviyesinin ne zaman değişeceğine karar veriyor.
- **Tarayıcı:** Kullanıcıya kalan süreyi gösteriyor ve sonuçları yeniden sorguluyor.

Sayaç bittiğinde arayüz, binanın mevcut seviyesini ve yeni bir yükseltme yapılıp yapılamayacağını AJAX üzerinden tekrar kontrol ediyor. Böylece kullanıcıya gösterilen bilgi yalnızca yerel sayaçtan türetilmiyor; sunucudan yeniden okunuyor.

Yine de arayüzün yenilenen sayfada bekleyen kuyruğu doğru şekilde yeniden başlatması gibi kenar durumlar ilk prototipte geliştirmeye açık kaldı. Zamanı sunucuda tutmak doğru temel olsa da kullanıcı deneyiminin de bu modelle tutarlı olması gerekiyor.

## Twig ile oyun kurallarını HTML'den uzak tutmak

İlk denemelerde görüntü katmanını daha farklı bir template sistemiyle oluşturmuştum. Kısa süre sonra Twig'e geçtim.

Bunun nedeni çok büyük bir frontend uygulaması kurmak değil, PHP'nin veri hazırlayan bölümleriyle HTML'i ayırmaktı. Sayfayı karşılayan PHP dosyası ilgili bina ve oyuncu verisini hazırlıyor, Twig ise bu veriyi gösteriyordu.

Ortak başlık, yan menü, sayfa iskeleti ve yükseltme alanlarını tekrar kullanılabilir şablonlara ayırdım. Böylece yeni bir bina sayfası eklerken aynı HTML yapısını baştan oluşturmak zorunda kalmadım.

Oyunun görsel tarafı bu çalışmada oldukça basitti. Bootstrap tabanlı yönetim panelini andıran bir arayüz kullandım. Asıl hedefim önce kuralların ve veri akışının şeklini görmekti; sanat tasarımı veya kapsamlı bir oyun haritası geliştirmek değildi.

## Birkaç ay arayla gelişen prototip

Timar'ın Git geçmişinde iki belirgin dönem var. Şubat 2022'de giriş ekranı, ilk binalar, temel sınıflar ve Twig geçişi üzerinde çalıştım. Ekim ayında ise kaynak kontrolünü, bina yöneticisini, yükseltme süresini, kuyruğu ve arka plan görevini geliştirdim.

Bu iki aşama projenin yönünü de açıklıyor. İlk dönem daha çok *hangi nesneler ve sayfalar olacak?* sorusuna cevap veriyordu. İkinci dönemde ise *bu nesnelerin durumu zaman içerisinde nasıl değişecek?* sorusu ön plana çıktı.

Benim için prototipi anlamlı hale getiren kısım da ikinci aşamaydı. Bir bina artık yalnızca sayfada adı ve seviyesi gösterilen bir kayıt değildi; oyuncunun kaynaklarını tüketen, zaman isteyen ve tamamlandığında durum değiştiren bir oyun nesnesine dönüşüyordu.

## Buradan sonra neler yapılabilir?

Timar'ın ilk sürümünde bina ve kaynak sisteminin temelini oluşturmuş oldum. Fakat tam kapsamlı bir strateji oyununa ilerlemek için çözülmesi gereken başka problemler var.

İlk sıraya oyun durumunun güvenilirliğini koyardım. Kaynak düşme ve kuyruk ekleme işlemlerinin tutarlı yürütülmesi, aynı bina için çakışan yükseltmelerin engellenmesi ve arka plan görevlerinin tekrar çalıştırılmasında çift seviye artışı yaşanmaması önemli. Oturum kontrolü ve giriş akışının da tek bir kurala bağlanması gerekiyor.

Sonraki adımlar kaynak üretiminin zamanla hesaplanması, asker eğitimi, birlik hareketi ve savaş gibi mekanikler olabilir. Oyuncuların birbirleriyle etkileşime girmesi, harita sistemi ve denge ayarları ise ayrı çalışmalar gerektirir.

Bunlar mevcut prototipte tamamlanmış özellikler değil; kurduğum bina ve zaman altyapısının üzerine eklenebilecek yeni oyun sistemleri.

## Sonuç

Timar ile bir strateji oyununun bütün içeriğini geliştirmedim. Bunun yerine küçük fakat kendi içinde anlamlı bir oyun döngüsünü oluşturan bileşenleri bir araya getirdim: **seviye, maliyet, kaynak, bekleme süresi ve tamamlanma.**

Bu çalışmadan çıkardığım en önemli ders, zaman tabanlı sistemlerde ekranda görünen sayacın yalnızca bir gösterim olduğuydu. Gerçek durum değişikliğinin sunucuda, güvenilir bir zaman kaydına ve tekrar işlenebilir görevlere dayanması gerekiyor.

Bir binayı yükseltmek basit bir düğmeyle başlıyor olabilir. Ama o düğmenin arkasındaki kuralları tasarlamak, başlı başına bir mühendislik problemi.
