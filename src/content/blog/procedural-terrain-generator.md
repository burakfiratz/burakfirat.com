---
title: 'Procedural Terrain Generator: Rastgelelikten Bir Oyun Dünyası Üretmek'
description: 'Python ile rastgele biyomlardan kare bir dünya oluşturmak, dağılımı kontrol etmeyi denemek ve Arcade ile haritayı tile tabanlı görselleştirmek üzerine bir geliştirme hikâyesi.'
pubDate: 2022-05-20
lang: 'tr'
tags: ['python', 'procedural-generation', 'game-development', 'algorithms', 'arcade']
draft: false
---

Oyun geliştirirken dünyayı tasarlamak, oyunun kurallarını yazmak kadar ilginç bir problem. Bir haritayı elle oluşturduğumda her ağacın, dağın veya su parçasının nerede duracağı belli. Peki aynı dünyayı bir algoritmaya ürettirdiğimde hangi kararları benim vermem, hangilerini rastgeleliğe bırakmam gerekiyor?

**Procedural Terrain Generator** projesini bu sorunun peşinden gitmek için Python ile geliştirdim. Hedefim baştan karmaşık bir coğrafya simülasyonu kurmak değildi. Önce bir haritayı veriye dönüştürmek, sonra biyomları bir kurala göre hücrelere dağıtmak ve son olarak bu veriyi küçük bir 2D oyun dünyası gibi ekranda göstermek istedim.

Bu çalışma birkaç gün içinde birbirini izleyen dört denemeden oluştu. İlkinde terminale basılan bir matris vardı; sonuncusunda ise aynı fikir, sprite'lardan oluşan bir haritaya dönüşmüştü.

## Bir dünyayı önce sayılardan oluşturmak

Başlangıç için dünyayı `N × N` boyutunda iki boyutlu bir dizi olarak tanımladım. Her hücre, dünya üzerindeki bir konumu temsil ediyordu. İlk sürümde her hücreye `random.random()` ile 0 ve 1 arasında bir değer veriyor, bu değerin düştüğü aralığa göre biyom seçiyordum.

Başlangıç biyomları beşti: dağ, orman, çöl, bataklık ve su.

```python
# İlk sürümün temel fikri
value = random.random()

if 0.0 < value < 0.2:
    biome = "Mountains"
elif 0.2 < value < 0.4:
    biome = "Forests"
elif 0.4 < value < 0.6:
    biome = "Deserts"
elif 0.6 < value < 0.8:
    biome = "Swamps"
elif 0.8 < value < 1.0:
    biome = "Water"
```

Bu yöntem basitti ama önemli bir şeyi öğretti: **dünya üretiminin ilk çıktısı bir görsel değil, üzerinde işlem yapılabilen bir veri yapısı olmalıydı.** Terminalde hem biyom isimlerini hem de seçime neden olan rastgele değerleri görerek kararın nerede verildiğini izleyebiliyordum.

Elbette hücrelerin birbirinden bağımsız seçilmesi, ormanları orman bölgeleri hâlinde toplamıyordu. Bir dağın hemen yanına çöl, onun yanına su düşebiliyordu. İlk sürüm için istediğim de tam olarak buydu: karmaşık coğrafi ilişkiler olmadan temel üretim mekanizmasını görmek.

## Rastgele dağıtmak ile dağılımı yönetmek arasındaki fark

İkinci sürümde soruyu değiştirdim. Beş biyomun hepsini her haritaya koymak zorunda mıydım? Bir biyomun bütün haritayı kaplamasına izin vermeli miydim?

Önce kullanılabilecek biyomları karıştırdım. Ardından bunların içinden belirli sayıda seçim yaptım. Kodda bu sayı dört olarak sabitlendi; dolayısıyla her çalıştırmada beş olası biyomdan dördü kullanılıyordu.

```python
selectedBiom = random.sample(WorldBiomEntity, maxBiom)
cellPerBiom = math.ceil((worldCellSize * worldCellSize) / maxBiom)
```

Buradaki `cellPerBiom`, toplam hücre sayısından hareketle biyom başına bir hedef üst sınır hesaplama denemesiydi. Örneğin 20 × 20 bir dünya 400 hücreden oluşuyorsa ve dört biyom seçilmişse hesaplanan değer 100 oluyordu.

Bir de kümülatif olasılık eşikleri oluşturdum. Dört biyom için başlangıç eşikleri yaklaşık olarak `0.25`, `0.50`, `0.75`, `1.00` şeklindeydi. Rastgele sayı hangi eşiğin altında kalıyorsa ilgili biyom seçiliyordu.

Buradaki problem, rastgeleliğe tamamen güvenmek ile dağılımı kontrol etmeye çalışmak arasındaki gerilimdi. Seçilen bir biyom hedef sayıya ulaştığında olasılık listesini daraltmayı denedim. Böylece üretim algoritmasının yalnızca bir zar atma işleminden ibaret olmaması için ilk adımı atmış oldum.

Bu sürümün bir teknik sınırı vardı: olasılık ve kullanım sayısı dizileri daraltılırken seçilen biyom dizisi aynı şekilde güncellenmiyordu. Dolayısıyla kod, hedef kotayı her durumda doğru uygulayan bir algoritma değildi. Yine de bana çok önemli bir sonraki soruyu gösterdi: **rastgele seçim ile durum takibini aynı veri modeli üzerinde tutmak** gerekiyordu.

## Veri üretimi ve çizimi birbirinden ayırmak

İlk iki denemede sonuçları konsola yazdırıyordum. Ancak bir haritanın hissini anlamak için onu görmek gerekiyordu.

Üçüncü denemede Python'ın **Arcade** kütüphanesiyle çizim altyapısını denedim. Bu aşamada üretilmiş rastgele bir dünya yerine, dört satır ve dört sütundan oluşan örnek bir biyom matrisi kullandım. Her biyomu bir renge eşleyip hücreleri ekrana dikdörtgenler olarak çizmeyi hedefledim. Bu sürümdeki test modülü bağlantısı kusursuz bir çalışma garantisi vermiyordu; esas katkısı, üretim kodundan ayrı bir görselleştirme deneyi oluşturmamdı.

- Dağlar gri,
- Ormanlar yeşil,
- Çöller sarı,
- Bataklıklar koyu yeşil,
- Su alanları mavi görünüyordu.

Bu küçük çalışma, üretimden bağımsız bir görselleştirme denemesiydi. Bir dizideki `Forests` değerinin, haritada doğru konuma yerleşen bir hücreye dönüşmesini sağlamak istiyordum. Başka bir deyişle veri ve sunum arasına basit ama net bir sınır koyuyordum.

Bu ayrım sonraki sürüm için işimi kolaylaştırdı. Çünkü dünyanın nasıl hesaplandığı değişse bile ekrana çizilmesi aynı temel mantığı kullanabilirdi: matrisi dolaş, hücrenin biyomunu bul, karşılığını çiz.

## Renkli hücrelerden sprite tabanlı haritaya

Dördüncü sürümde önceki iki çalışmayı birleştirdim. Biyomları rastgele seçen ve matrisi dolduran kodu, Arcade ile yaptığım çizim denemesine bağladım. Fakat bu kez her hücreyi düz bir renkle boyamak yerine bir **tileset** içinden küçük görseller kullanmaya başladım.

`assets/set2/1_terrain.png` dosyasından farklı koordinatlardaki 40 × 40 piksellik parçaları keserek biyomlarla eşleştirdim. Dağ, orman, çöl, bataklık ve su artık birer renk etiketi değil, oyun haritasının görsel parçalarıydı.

```python
# Dördüncü sürümdeki bir eşleştirme örneği
if biomName == "Mountains":
    return arcade.load_texture(
        "assets/set2/1_terrain.png", 20, 512, 40, 40
    )
```

Haritayı çizerken yine iki iç içe döngü kullandım. Dış döngü satırlar arasında ilerlerken ekrandaki dikey konumu azaltıyor, iç döngü sütunlar arasında yatay konumu artırıyordu. Hücrelerin ekrandaki boyutu 40 piksel olarak belirlenmişti. Pencere 1280 × 960 boyutundaydı.

Kısacası veri tarafındaki bir hücre, görsel tarafta bir tile'a karşılık geliyordu:

```text
Rastgele sayı
    ↓
Biyom seçimi
    ↓
N × N harita matrisi
    ↓
Biyoma karşılık gelen texture
    ↓
Arcade üzerinde tile çizimi
```

Böylece terminalde biyom isimlerinden oluşan çıktıdan, tile görselleriyle temsil edilebilen küçük bir oyun dünyası prototipine ulaştım. Kodu çalıştıran ortam ve Arcade sürümüne göre son görsel sonucun ayrıca doğrulanması gerekiyordu.


## Algoritmanın tuttuğu durum da kuralların bir parçası

Biyomları dengeli dağıtmak için başladığım kota denemesi, algoritmanın en öğretici kısmı oldu. Hücrenin biyomunu seçmek tek başına yeterli değildi. Her biyomdan kaç hücre kullanıldığını, hangilerinin artık seçilemeyeceğini ve kalan olasılıkların hangi biyomlara karşılık geldiğini tutarlı bir şekilde güncellemek gerekiyordu.

Bir listeden eleman çıkarınca onunla aynı indekslere bağlı diğer listeler değişmeden kalıyorsa, algoritma artık ilk varsayımına göre işlem yapmıyor. `world-two.py` ve `world-four.py` içinde karşılaştığım temel sorun buydu. Kümülatif eşikler küçülüyor, kullanım sayaçları değişiyor, fakat biyom eşleşmelerinin tamamı aynı şekilde güncellenmiyordu.

Bu durum bana prosedürel üretimde **olasılıkların kendisi kadar olasılıkları yöneten durumun da** tasarlanması gerektiğini gösterdi. Daha sağlam bir sürümde biyom adı, kalan kota ve seçim ağırlığını tek bir veri yapısında tutmak mümkün olurdu. Böylece hangi biyomun hâlâ seçilebilir olduğuna karar verirken ayrı dizilerin birbirinden kopması önlenebilirdi.

Bu çözümü ilk prototipe sonradan uygulanmış bir özellik olarak değil, o deneyin ortaya çıkardığı mimari ders olarak görüyorum.

## Dünya büyüdüğünde başka bir problem başlıyor

Çizim tarafında da benzer bir sınır oluştu. Haritanın boyutunu kullanıcıdan alıyordum ama pencerenin boyutu sabitti. Her hücre 40 piksel genişliğinde çizildiğinde, örneğin 30 × 30 bir dünya yalnızca karo alanı olarak 1200 × 1200 piksel yer gerektiriyordu. 1280 × 960 piksellik pencere ve başlangıç koordinatlarıyla her haritanın bütünü görünür kalamazdı.

Yani algoritmanın üretebildiği dünya boyutuyla ekranda gösterebildiğim dünya boyutu aynı şey değildi. Bu ilk sürümde kamerayı, kaydırmayı veya yalnızca görünür tile'ları çizmeyi uygulamadım. Yine de matrisi ayrı tutmak, ileride ekrana sığmayan alanı yönetmek için doğru başlangıç noktasını oluşturuyordu.

Üretim algoritması bütün haritayı tanımlayabilir; çizim katmanı ise yalnızca o anda görülmesi gereken bölümle ilgilenebilir. Bu ayrım, ilk birkaç günde üzerinde çalıştığım küçük bir prototipin daha büyük bir oyun sistemine dönüşmesi için önemli bir temel oluşturdu.

## Asıl mesele rastgelelik değil, kurallar

Bu çalışmanın bana gösterdiği en önemli şey, prosedürel üretimin sadece `random()` çağırmaktan ibaret olmadığıydı. Rastgele sayı, yalnızca bir aday seçiyor. Dünyanın nasıl görüneceğini ise onun etrafına yazdığımız kurallar belirliyor.

Örneğin her hücreyi bağımsız seçtiğimde dünya çeşitleniyordu ama coğrafi bir süreklilik göstermiyordu. Biyomların sayısını sınırlamaya çalıştığımda dağılımı yönetmeye yaklaşıyor, bu kez algoritmanın kendi durumunu doğru tutması gerektiğini görüyordum. Sprite kullandığımda ise üretilen matrisin görselleştirmeyle ilişkisinin ne kadar önemli olduğu ortaya çıkıyordu.

Bu nedenle projeye sadece bir harita çizim aracı olarak bakmıyorum. **Bir oyun dünyasını veri modeli, seçim kuralları ve görselleştirme olarak üç ayrı problem hâlinde ele alma denemesiydi.**

## İlk çalışmanın sonunda

Mayıs 2022'deki bu çalışmayı dört sürümlük bir prototiple tamamladım: rastgele biyom matrisi, biyom seçimi ve dağılımını sınırlama denemesi, renkli 2D gösterim ve tileset üzerinden görselleştirme. Üç günlük denemeler boyunca bir algoritmanın çıktısını önce sayılarla, sonra renklerle, en sonunda da oyun görselleriyle okumayı öğrendim.

Bundan sonraki bir sürümde komşu hücreleri hesaba katan biyom bölgeleri, sabit bir `seed` ile tekrar üretilebilir haritalar, Perlin/Simplex gibi gürültü teknikleri, daha güvenilir biyom kotaları ve büyük haritalar için kamera/viewport desteği eklemek anlamlı olurdu.

Ama ilk sürümün benim için sonucu daha yalındı: **Önce dünyayı üret, sonra onu çiz.** Harita üretimindeki asıl esneklik, bu iki parçayı birbirinden ayırabildiğinde başlıyor.
