---
title: "Shopier Mağaza Altyapısını Yeniden Yazmak: storev2'den storev3'e"
description: "Yıllardır çalışan storev2'yi PHP Template Engine tabanlı, çoklu tema destekli yeni mağaza uygulaması storev3 ile değiştirmek: mimari kararlar, katmanlı mimari ve canlı trafik altında kademeli geçiş."
pubDate: 2022-06-14
updatedDate: 2025-11-20
lang: 'tr'
tags: ['system-design', 'e-commerce', 'template-system', 'php', 'shopier']
---

Shopier'de alıcıların gördüğü mağaza sayfaları, ürün detayları, sepet, kargo ve ödeme ekranları uzun yıllar boyunca tek bir PHP projesi üzerinden çalışıyordu.

Projenin adı `storev2` idi.

Bu proje benim için ayrıca önemliydi. Shopier'de çalışmaya başladığımda geliştirdiğim ilk sistemlerden biriydi ve yıllar içerisinde pek çok özelliğini ekleyerek büyüttüğüm bir kod tabanıydı. Ancak bir sistemin yıllarca çalışıyor olması, aynı mimariyle büyümeye devam edebileceği anlamına gelmiyor.

Zaman içerisinde satıcıların beklentileri değişti. Mağazaların birbirinden farklılaşması, yeni alışveriş deneyimlerinin geliştirilmesi ve daha büyük bir ekibin aynı kod üzerinde çalışabilmesi gerekiyordu.

storev2 ise bu ihtiyaçlara cevap vermekte giderek zorlanıyordu. 2021 yılında bu problemi çözmek için yeni bir proje geliştirmeye başladım.

Projemiz `storev3` 

Başlangıçta amacım eski sisteme bir şablon(template) altyapısı kazandırmaktı. Fakat birkaç yıl içerisinde bu proje, mağaza vitrininin tamamını, ürün sayfalarını, sepeti ve sipariş akışını yöneten yeni bir platforma dönüştü.

Bu yazıda `storev3` projesinin nasıl ortaya çıktığını, yeni mağaza altyapısını geliştirirken aldığımız mimari kararları, tercih ettiğimiz teknolojilerin arkasındaki nedenleri ve yıllardır çalışan bir sistemi canlı trafik altında nasıl kademeli olarak dönüştürdüğümüzü anlatacağım.

> **Not:** Bu yazıda yer alan bazı klasör ve dosya adları, kod örnekleri, dizin yolları ve mimari detaylar; şirketin fikrî mülkiyetini ve teknik altyapısının gizliliğini korumak amacıyla sadeleştirilmiş, anonimleştirilmiş veya temsili olarak yeniden düzenlenmiştir. Anlatılan teknik yaklaşımlar ve mimari kararlar gerçek geliştirme sürecine dayanmakla birlikte, paylaşılan örnekler sistemin birebir implementasyonunu yansıtmayabilir.

> **Düzenleme geçmişi**
>
> - **Haziran 2022:** İlk yayın.
> - **2024:** storev3 üzerinde geliştirilen yeni varsayılan mağaza deneyimi, veri erişimi ve önbellekleme, ödeme akışının ayrıştırılması bölümleri eklendi.
> - **2025:** storev2'den storev3'e geçiş, commit mesajı, alıcı deneyiminin genişlemesi ve kod kalitesi bölümleri eklendi; karşılaştırma tablosu ve "Bundan Sonra" bölümü güncellendi.

## Her Şeyin Başladığı Yer: storev2

storev2 geliştirilirken en önemli ihtiyaç, bir satıcının ürünlerini gösterebilmesi ve alıcının satın alma işlemini tamamlayabilmesiydi. Sistem zaman içerisinde büyüdü. 2018'de sıfırdan yazdığım projeydi ve ömrünü 5 yılda tamamlayacağını öngörüyordum ve bu tarihe yaklaşıyorduk.

Mağaza vitrinine yeni alanlar eklendi. Ürün sayfaları genişledi. Kargo ve ödeme akışları değişti. Yeni servislerle entegrasyonlar kuruldu. Bu büyüme sırasında kullandığımız PHP yaklaşımı başlangıçta yeterince pratikti. Bir sayfa isteği karşılıyor, gerekli verileri hazırlıyor, ardından HTML üretiyordu.

Sorun, bu yaklaşımın zaman içerisinde giderek daha karmaşık hale gelmesiydi. Özellikle görünüm sınıflarında HTML doğrudan PHP içerisinde üretiliyordu. Kötü bir mimari karar ama bu bir işletme kararıydı ve ben o zamanlar kıdemli geliştiri değildim.

Örneğin yapı kabaca şöyleydi:

```php
class ProductView
{
    public function render($product)
    {
        echo <<<HTML
            <div class="product">
                <h1>{$product['name']}</h1>
                <p>{$product['description']}</p>
            </div>
        HTML;
    }
}
```

Bu, gerçek kodun birebir karşılığı değil fakat eski mimarinin nasıl çalıştığını gösteriyor. 

Başlangıçta oldukça kullanışlı görünen bu yöntem, sayfalar büyüdükçe sorun yaratmaya başladı. Bazı görünüm sınıfları binlerce satıra ulaşmıştı. HTML, JavaScript, PHP değişkenleri ve iş kuralları aynı dosyanın içerisinde bulunuyordu. Bir tasarım değişikliği yapmak için PHP koduna girmek gerekiyordu. Bazen basit bir HTML düzenlemesi bile istemeden iş mantığını etkileyebiliyordu.

Daha önemlisi, **ön yüz geliştirmek ile backend geliştirmek arasında gerçek bir sınır bulunmuyordu.**

Bunun etkisini ekip büyümeye başladığında daha net görmeye başladık.

## Tek Mağaza Görünümünün Sınırları

storev2'nin başka bir önemli kısıtı da bütün mağazaların temelde aynı görünümü kullanmasıydı.

Satıcı ürünlerini, açıklamalarını ve görsellerini değiştirebiliyordu fakat mağazasının genel tasarımını değiştirme konusunda ciddi sınırlamalar vardı. Oysa farklı kategorilerde satış yapan mağazaların aynı deneyime ihtiyacı yoktu.

Birkaç ürün satan butik bir mağazayla yüzlerce ürüne sahip bir mağazanın beklentileri farklıydı. Birisi ürün görsellerini ön plana çıkarmak isterken başka birisi kategoriler, koleksiyonlar ve ürün keşfine daha fazla önem verebilirdi.

Bizim sistemimiz ise bu farklılıkları tek bir HTML yapısı içerisinde karşılamaya çalışıyordu. Yeni bir görünüm eklemek, mevcut görünümü değiştirmek anlamına geliyordu.Bu noktada çözmek istediğim problem netleşti:

**Bir mağazanın nasıl çalıştığı ile nasıl göründüğü birbirinden bağımsız olmalıydı.**

Ürün fiyatını hesaplayan kod ile ürün kartının tasarımını yapan kod aynı yerde bulunmamalıydı. Sepete ekleme işlemi temadan bağımsız çalışmalıydı. Ödeme akışı, hangi tema kullanılırsa kullanılsın aynı kurallara bağlı kalmalıydı.

Bu ayrımı gerçekleştirebilirsek yalnızca mevcut arayüzü değiştirmekle kalmayacak, gelecekte birden fazla temayı destekleyebilecek bir altyapı da kurabilecektik.

## Yeni Bir Proje: `storev3`

storev2 içerisinde değişiklik yaparak bu ayrımı gerçekleştirmek teorik olarak mümkündü.

Fakat pratikte oldukça zor olacaktı. Çünkü değiştirmek istediğimiz yapı, projenin neredeyse bütün sayfalarına yayılmış durumdaydı. Bu nedenle eski sistemi olduğu yerde dönüştürmek yerine yeni bir repo açmaya karar verdim.

Başlangıçtaki hedef oldukça basitti. storev2'nin mevcut iş mantığından mümkün olduğunca yararlanarak yeni bir görünüm katmanı oluşturmak. Yani ilk fikir, bütün sistemi sıfırdan tasarlamak değildi.

Önce HTML'i PHP'den ayıracaktım. Böylece yeni bir mağaza görünümü geliştirmek için ödeme, sipariş veya ürün mantığını tekrar yazmak zorunda kalmayacaktık. Fakat bu ayrımı yapmaya başladığımda, eski sistemin yalnızca görünüm tarafında değil, kod organizasyonunda da yeniden düzenlenmeye ihtiyacı olduğunu gördüm.

Proje böylece yavaş yavaş bir şablon katmanından bağımsız bir mağaza uygulamasına dönüşmeye başladı.

## Görünümü İş Mantığından Ayırmak

Yeni sistemin temelinde üç sorumluluğu birbirinden ayırdım:

1. HTTP isteğini karşılamak ve akışı yönetmek.
2. İlgili iş alanının verilerini ve kurallarını çalıştırmak.
3. Hazırlanan veriyi HTML'e dönüştürmek.

Bunu MVC'ye benzeyen fakat büyük bir framework'e ihtiyaç duymayan bir yapıyla gerçekleştirdim.

Genel akış şu şekilde:

```text
                 HTTP Request
                       │
                       ▼
                  Controller
                       │
                       ▼
                Domain / Model
                       │
                       ▼
                  Prepared Data
                       │
                       ▼
                   Template
                       │
                       ▼
                      HTML
```

Örneğin bir ürün sayfasına istek geldiğinde controller ilgili ürünü ve mağazayı çözümlüyor. Ürünle ilgili iş mantığı domain katmanında çalışıyor. Fiyat, stok, varyasyonlar ve gerekli diğer veriler hazırlanıyor. Ardından bu veriler seçili temanın ürün sayfası şablonuna aktarılıyor.

Şablonun görevi artık fiyatı hesaplamak değil, kendisine verilen fiyatı göstermek. Bu ayrım basit görünebilir ama projenin geri kalanını mümkün kılan en önemli karardı. Artık aynı ürün verisini farklı HTML yapılarıyla gösterebiliyoruz.

Bir tema ürün görsellerini solda, ürün bilgilerini sağda gösterebilir. Başka bir tema tamamen farklı bir yerleşim kullanabilir. Backend tarafındaki ürün mantığının bunları bilmesi gerekmiyor.

## Neden Bir PHP Template Engine?

PHP'de HTML üretmek için pek çok seçenek var. Bir framework'ün kendi template sistemini kullanabilir, farklı bir şablon motoru seçebilir veya PHP dosyalarını doğrudan view olarak çalıştırmaya devam edebilirdim.

Ben bir `PHP Template Engine` kullanmayı tercih ettim.

Bunun birkaç nedeni vardı.

İlk olarak seçtiğim `PHP Template Engine`, PHP ekosisteminde uzun süredir kullanılan ve olgunlaşmış bir araçtı. Ayrıca belirli bir framework'e bağlı değildi. Bu, mevcut PHP uygulamamızla birlikte çalışabilmesi açısından önemliydi.

İkinci neden ise template dosyalarının PHP iş mantığından ayrı olmasıydı. Ön yüz geliştiricisi bir ürün kartını değiştirmek istediğinde domain sınıflarına girmek zorunda kalmıyordu.

Controller veriyi hazırlıyor, template engine ise bu veriyi şablona aktarıyordu. Şablonların derlenmiş hallerinin yeniden kullanılabilmesi de ayrı bir avantajdı.

Burada özellikle belirtmek istediğim bir ayrıntı var: template engine'in derlenmiş şablon mekanizmasını kullanıyoruz ancak bu, bütün sayfanın HTML çıktısının önbelleğe alındığı anlamına gelmiyor.

Dinamik mağaza ve sipariş verileri için çıktı önbelleklemesi ayrı bir konu. Zaman içerisinde template engine yapılandırmasını da merkezi hale getirdik.

Şablonların erişebileceği özellikleri sınırlandırdık, farklı geliştiricilerin oluşturduğu temaların aynı kurallar içerisinde çalışmasını sağladık. Böylece template engine yalnızca HTML oluşturmak için kullanılan bir araç olmaktan çıktı.

**Backend ile tema geliştirme süreci arasındaki sınırın önemli bir parçası haline geldi.**

## Kodun Sorumluluklarına Göre Ayrılması

storev2'de birbiriyle ilişkili pek çok sınıf aynı genel kütüphane dizininde bulunuyordu.

Yeni projede bunları iş alanlarına göre organize etmeye başladım.

Mağaza, ürün, sepet, kargo, ödeme ve sipariş kendi sorumlulukları etrafında toplandı.

Örneğin kavramsal olarak yapı şöyleydi:

```text
src/
├── Shop/
├── Product/
├── Shipping/
└── Payment/
```

Bunun yanında Composer ve PSR-4 autoloading kullanmaya başladım. Eski sistemde birçok giriş dosyasında manuel sınıf yükleme kodları bulunuyordu. Yıllar içerisinde bu kodların farklı versiyonları oluşmuştu.

Yeni projede sınıfların nasıl yükleneceğini merkezi olarak tanımlamak bu tekrarları ortadan kaldırdı. Önemli olan yalnızca klasörleri düzenlemek değildi. Kodun hangi sorumluluğa ait olduğunu daha açık hale getirmekti.

Bir ürünün stok bilgisini değiştiren kodun template içerisinde bulunmasını istemiyordum. Bir ödeme sağlayıcısına istek gönderen kodun controller'ın tamamını kaplamasını da istemiyordum. Kod büyüdükçe bu sınırların önemi daha fazla ortaya çıktı.

## İlk Büyük Hedef: Siparişi Tamamlayabilmek

Bir mağaza altyapısını yeniden yazarken en zor konulardan biri neyin gerçekten çalıştığını tanımlamak.

Bir ürün sayfasının açılması yeterli değil. Bir mağazanın görüntülenmesi de yeterli değil. Sistem uçtan uca satın alma işlemini tamamlayabilmeli. Bu nedenle ilk dönemde odağım temel alışveriş akışıydı.

Önce ürün sayfasını oluşturdum. Ardından mağaza vitrini, sepet, kargo, ödeme ve sipariş onay ekranlarını geliştirdim. Bu parçalar tamamlandığında ilk kez yeni proje üzerinden uçtan uca başarılı bir sipariş akışı gerçekleştirebildik.

Benim için projenin ilk önemli kilometre taşı buydu. Çünkü artık yalnızca bir template sistemimiz yoktu. Gerçek bir alışveriş işlemini gerçekleştirebilen yeni bir uygulamamız vardı. Bundan sonraki geliştirmeleri bu temel üzerinde sürdürebilirdik.

## Tema Yönetiminin Ayrı Bir Katman Olması

Başlangıçta tek bir görünüm üzerinde ilerlemek yeterliydi. Ancak hedefimiz satıcılara farklı mağaza tasarımları sunmak olduğu için tema seçimini de sistematik hale getirmemiz gerekiyordu.

Yeni yapıda her mağazanın hangi temayı kullandığı belirleniyor. İlgili sayfa açıldığında sistem önce mağazanın tema bilgisini çözümlüyor. Ardından ilgili şablonlar seçiliyor.

Tema bilgisi bulunmuyorsa varsayılan tema kullanılıyor. Burada önemli olan, her tema için ayrı bir mağaza uygulaması oluşturmamış olmamız.

Ürün verisi, sepet işlemleri ve ödeme kuralları ortak.Değişen şey bunların kullanıcıya nasıl sunulduğu.

Temaları da tamamen bağımsız dosya yığınları olarak tasarlamadık. Ortak sayfa iskeletleri, temaya özgü görünümler ve tekrar kullanılabilir bileşenler arasında bir ayrım oluşturduk.

Örneğin bir mağaza sayfasının genel iskeleti ortak kalırken ürün kartı, kategori bölümü veya üst menü seçili temaya göre değişebiliyor. Satıcıların kendi mağazalarına özgü düzenlemeler yapabilmesi için de bir özelleştirme katmanı ekledik.Bu yaklaşım sayesinde tema sayısı arttığında bütün sistemi yeniden geliştirmemiz gerekmiyor.

Yeni bir tema, mevcut mağaza platformunun üzerinde çalışabilen yeni bir görünüm oluyor.

## Tema Sayısı Arttığında Asıl Problem Başlıyor

İlk temayı geliştirmek nispeten kolay. İkinci temada ortaklaştırılması gereken parçalar ortaya çıkıyor.

Üçüncü ve dördüncü temadan sonra ise asıl problemin yeni tasarım üretmek değil, **bütün temaları aynı davranış standardında tutmak** olduğunu fark ediyorsunuz.

Bir ürünün varyasyon seçimi bütün temalarda doğru çalışmalı. Sepete ekleme işlemi aynı iş kurallarını kullanmalı. Fiyat, indirim ve taksit bilgilerinin hesaplanması temadan temaya değişmemeli.

Yeni bir özellik eklendiğinde her temada iş mantığını tekrar yazmak istemiyoruz. Bu nedenle ortak iş mantığı ile temaya özgü bileşenler arasındaki ayrımı daha da belirginleştirdik.

Zaman içerisinde tema ve ön yüz ağırlıklı çalışan ekibimiz de büyüdü. Böylece yeni temaları geliştiren kişilerin PHP domain katmanındaki her ayrıntıyı bilmesi gerekmedi.

Backend tarafı standart veri ve davranışları sunarken ön yüz tarafı farklı deneyimler geliştirebilir hale geldi. Bu, başlangıçtaki mimari kararın organizasyon üzerindeki en somut etkilerinden biriydi.

## Her Deneme Kalıcı Olmadı: GraphQL

Projenin gelişiminde geri aldığımız teknik kararlar da oldu. Bunlardan biri veri erişim katmanıyla ilgiliydi. Başlangıçta veritabanı erişimi için PDO kullanıyorduk.

Bir aşamada doğrudan SQL sorguları yerine kurum içindeki bir GraphQL servisi üzerinden veri almaya geçmeyi denedik. Bu yaklaşımın teorik avantajları vardı.

Veri erişimini merkezi hale getirmek, farklı istemcilerin ortak bir API üzerinden çalışmasını sağlamak ve belirli sorumlulukları uygulamadan ayırmak mümkündü. Fakat uygulamaya başladığımızda her şey beklediğimiz kadar avantajlı olmadı. Özellikle mağaza sayfalarının ihtiyaç duyduğu veriler için ilave bir ağ katmanı oluşturuyorduk.

Bir PHP uygulamasının doğrudan veritabanından okuyabildiği bilgiyi başka bir servis üzerinden alması ek bağımlılıklar ve gecikmeler getiriyordu. Bu maliyetin getirdiği faydayı yeterince karşılamadığını gördük. Sonuç olarak GraphQL'e geçişin büyük bölümünü geri alıp PDO yaklaşımına devam ettik.

Sistemde bu denemeden kalan bazı entegrasyonlar hâlâ bulunuyor. Bu süreç benim için önemli bir hatırlatmaydı:

**Bir teknolojinin mimari olarak daha soyut veya modern görünmesi, mevcut probleme daha iyi çözüm sunduğu anlamına gelmiyor.**

Bazen bir katmanı kaldırmak, yeni bir katman eklemekten daha doğru bir karar olabiliyor.

## Apps Altyapısıyla Birlikte Çalışmak

`storev3` projesini geliştirirken Shopier'de başka bir mimari değişiklik de yaşanıyordu.

Satıcıların ihtiyaç duyduğu opsiyonel özellikleri çekirdek sistemden ayırmak için `Shopier Apps` altyapısını geliştirmiştim. Bu yaklaşımı [ayrı bir yazıda](/blog/shopier-moduler-app-mimarisi/) anlattım.

Yeni mağaza uygulamasının bu sistemle birlikte çalışabilmesi önemliydi. Çünkü her satıcının aynı özellikleri kullanmasını istemiyorduk. Bazı mağazalar minimum sipariş tutarı kullanabilir. Bazıları ürün sayfasında video göstermek isteyebilir. Bazılarının farklı analitik veya pazarlama entegrasyonları olabilir.

Bu özelliklerin her birini mağaza çekirdeğine gömmek yerine uygulama katmanından yönetmek daha doğruydu. Bu nedenle `storev3` içerisinde app sisteminin gerekli bileşenlerini kullanabilecek entegrasyon noktaları oluşturduk.

Örneğin ürün sayfası, kendisiyle ilgili uygulamaları yükleyebiliyor. Bir uygulamanın HTML bileşeni varsa seçili tema içerisinde uygun alanda gösterilebiliyor. Checkout sırasında davranışı etkileyen uygulamalar ise ilgili akış noktalarında çalışabiliyor.

Böylece iki önemli ayrımı birleştirmiş olduk:

- Tema, mağazanın **nasıl göründüğünü** belirliyor.
- App, mağazaya **hangi ek yeteneklerin kazandırıldığını** belirliyor.

Bunların birbirinden bağımsız olması, zaman içerisinde farklı temaların ve uygulamaların birlikte çalışmasını kolaylaştırdı.

## Arama Artık Basit Bir SQL Sorgusu Değil

Mağaza deneyiminde geliştirmemiz gereken alanlardan biri de ürün aramasıydı.

Basit bir ürün listesinde SQL ile metin araması yapmak yeterli olabilir. Ancak ürün sayısı ve aramadan beklentiler arttıkça problemin kapsamı değişiyor. Kullanıcı bir kelimeyi eksik yazabilir. Türkçe ekler nedeniyle aynı kelimenin farklı biçimlerini kullanabilir. Ürün adı, kategori veya ilgili başka alanlar üzerinden sonuç bekleyebilir. Hatta aramayı tamamlamadan öneriler görmek isteyebilir.

Bu ihtiyaçlar için Elasticsearch kullanmaya başladık.

Arama katmanında Türkçe dil özelliklerinden, kısmi eşleşmelerden ve yazım hatalarına tolerans sağlayan sorgulardan yararlanıyoruz. Zaman içerisinde arama sorgularını da optimize ettik.

Birden fazla arama ihtiyacını mümkün olduğunca az istekle karşılamak için Elasticsearch'ün çoklu arama özelliklerinden yararlanıyoruz. Fakat burada yalnızca sonuçların doğruluğu önemli değildi. Arama servisi sorun yaşadığında mağazanın tamamının çalışamaz hale gelmesini de istemiyorduk. Bu nedenle arama katmanına hata toleransı ve geçici devre dışı bırakma davranışları ekledik.

Arama servisine ulaşamamak kötü bir deneyim olabilir. Ama bunun bütün mağaza sayfasını düşürmesi daha büyük bir problem.

## Yeni Bir Görünümden Daha Fazlası

2024 yılına geldiğimizde projenin önemli bir kısmı çalışıyordu.

Artık farklı temaları destekleyebilen, uygulama entegrasyonları olan ve alışveriş akışını yönetebilen bir mağaza platformumuz vardı. Fakat kullanıcı deneyimi tarafında daha kapsamlı bir dönüşüm istiyorduk.

Bu noktada `storev3` üzerinde yeni **varsayılan mağaza** deneyiminin geliştirmesi başladı.

İlk bakışta yalnızca yeni bir tema gibi düşünülebilir. Ama bu çalışma zaman içerisinde ürün kartlarından alışveriş davranışlarına, sayfa bileşenlerinden fiyat gösterimlerine kadar oldukça geniş bir alanı etkiledi.

Ön yüz ve tema geliştirmeleri projenin önemli bir bölümünü oluşturmaya başladı. Bunun sonucunda yeni özelliklerin büyük kısmı için eskiden olduğu gibi PHP içerisinde HTML değiştirmek gerekmiyordu.

Ürün verisini hazırlayan katman ile o veriyi kullanıcıya sunan bileşenler birbirinden ayrılmıştı. Başlangıçta çözmeye çalıştığımız problem de buydu. Yıllar önce oluşturduğumuz bu sınır, böyle kapsamlı bir deneyim geliştirmesini mümkün hale getirdi.

## Yük Arttıkça Veri Erişimini Yeniden Düşünmek

Mağaza platformunun trafiği arttıkça veri erişimi de ayrı bir optimizasyon alanına dönüştü.

Özellikle ürün ve mağaza sayfalarında tekrarlanan okuma işlemleri önemliydi. Bu nedenle okuma ve yazma işlemlerini farklı veritabanı bağlantıları üzerinden yönetmeye başladık. Okuma ağırlıklı sorgular için replica kullanılması, ana veritabanının yükünü azaltmamıza yardımcı oldu.

Daha sonra sık erişilen mağaza ve kategori verileri için önbellekleme katmanı da geliştirdik. Burada benim için öncelik sadece sorguları hızlandırmak değildi. Önbelleğin kendisinin yeni bir hata kaynağına dönüşmemesi gerekiyordu. Bu nedenle önbellek katmanını mümkün olduğunca yardımcı bir bileşen olarak tasarladık.

Önbellek geçici olarak kullanılamadığında, uygun durumlarda uygulamanın asıl veri kaynağından çalışmaya devam edebilmesini istedik. Ayrıca verilerin ne kadar süre saklanacağını ve nasıl geçersiz kılınacağını merkezi olarak yönetmeye çalıştık. Çünkü önbellekleme eklemek kolay; yanlış veya eski verinin ne zaman temizleneceğini yönetmek çok daha zor.

## Ödeme Akışının Ayrıştırılması

Yeni sistemin önemli parçalarından biri de ödeme altyapısıydı.

storev2 döneminde ödeme akışının büyük bölümü oldukça merkezi bir kod yapısı içerisinde yönetiliyordu. Zaman içerisinde farklı ödeme sağlayıcıları, fraud kontrolleri, taksit seçenekleri ve farklı ödeme senaryoları eklendikçe bu yaklaşımın da sınırları ortaya çıktı.

`storev3` içerisinde ödeme işlemlerini daha küçük sorumluluklara ayırdık.

Bir katman ödeme akışını yönetirken başka bir katman ödeme sağlayıcılarıyla iletişim kuruyor. Fraud ve uygunluk kontrolleri ayrı bileşenlerde gerçekleştiriliyor. Sağlayıcıların kendilerine özgü istek ve cevap yapıları ise adaptörlerle ele alınıyor Böylece yeni bir ödeme entegrasyonu eklemek, ödeme akışının tamamını yeniden düzenlemeyi gerektirmiyor.

Ödeme sağlayıcısının seçimi ise tek bir sabit kurala bağlı değil. Kart, işlem, satıcı ve o an geçerli iş kuralları gibi farklı bilgiler bu kararı etkileyebiliyor. Bu nedenle sağlayıcı seçimiyle sağlayıcının teknik entegrasyonunu birbirinden ayırmak önemliydi. Bu mimari değişiklik sayesinde ödeme altyapısına yeni entegrasyonlar eklemek ve mevcut akışları yönetmek daha sistematik hale geldi.

## En Zor Kısım: Eski Sistemden Yeni Sisteme Geçmek

Yeni bir uygulama geliştirmek ile yıllardır çalışan bir uygulamanın yerini almak birbirinden farklı problemler.

`storev3` geliştikçe yeni mağaza sayfaları, tema sistemi ve alışveriş akışı kullanılabilir hale gelmişti. Ama storev2 hâlâ gerçek trafiği karşılıyordu. Üstelik bu trafiğin içerisinde mağazalar, ürün bağlantıları, siparişler ve ödeme işlemleri vardı. Böyle bir sistemi tek seferde değiştirmek istemedik. Çünkü yazılımın test ortamında başarılı çalışması, bütün gerçek kullanıcı senaryolarını karşıladığı anlamına gelmiyor.

Bu nedenle geçişi aşamalı olarak planladık.

İlk aşamada sınırlı sayıda mağazayı yeni uygulamaya yönlendirdik. Böylece gerçek kullanıcı davranışlarını gözlemleyebiliyor, karşılaşılan sorunları daha geniş kitlelere ulaşmadan düzeltebiliyorduk. Ardından yönlendirilen mağaza sayısını artırdık. Bu süreçte eski bağlantıların da çalışmaya devam etmesi gerekiyordu. storev2 döneminde oluşturulmuş mağaza ve ürün URL'lerini doğrudan kırmak istemedik.

Yeni sistemde daha temiz ve anlamlı URL yapıları oluştururken eski bağlantıları da yeni endpoint'lere eşledik. Böylece uygulama değişirken dış dünyadaki bağlantıların mümkün olduğunca değişmemesini sağladık.

Geçiş sırasında gerektiğinde eski sisteme dönmeyi sağlayan kontrollü mekanizmalar da bulundurduk. Buradaki asıl amaç yeni sistemi mümkün olan en hızlı şekilde açmak değildi.

**Yeni sisteme geçerken mevcut alışveriş deneyimini korumaktı.**

## Bir Commit Mesajı

2025 yılında uzun süredir üzerinde çalıştığımız önemli geçişlerden birini tamamladık.

Mağaza vitrini ve ürün sayfalarının trafiğini storev2'den `storev3`'e taşıdık. Bu geçişin ardından yazdığım commit mesajı benim için özel:

> Finally, that day has come. My first job, the storev2 project, is over. Now we will continue with the better "storev3" project... Thank you for everything storev2. You will be with us for a while, but it is time to retire.

Bu mesajı özellikle bu yazıya eklemek istedim. Çünkü yapılan iş teknik olarak bir yönlendirme veya uygulama değişikliği olsa da benim için bundan daha fazlasıydı. storev2, yıllarca üzerinde çalıştığım ve pek çok şey öğrendiğim bir projeydi.

Yıllar boyunca geliştirdiğim bir sistemi, yine kendi geliştirmeye başladığım yeni bir sisteme devretmek farklı bir deneyimdi. Üstelik eski sistemi bir gün içerisinde kapatmadık. Bazı eski entegrasyonlar, callback'ler ve başka sistemlerin kullandığı ortak parçalar bir süre daha storev2 üzerinde yaşamaya devam etti.

Bir uygulamanın kullanıcıya görünen kısmını taşımış olmak, eski uygulamaya ait bütün bağımlılıkların ortadan kalktığı anlamına gelmiyor. storev2'nin rolü değişti. Ama sistemdeki bütün sorumlulukları aynı anda sona ermedi.

## Alıcı Deneyiminin Genişlemesi

Başlangıçta `storev3` için temel hedefimiz mağaza ve alışveriş sayfalarını yeniden geliştirmekti. Fakat zaman içerisinde alıcı deneyimi yalnızca bu sayfalardan ibaret olmaktan çıktı.

Kayıtlı kullanıcılar, favori ürünler, daha sonra satın almak için saklanan ürünler, kayıtlı adresler ve satıcı takibi gibi yeni ihtiyaçlar ortaya çıktı. Bunların yönetilebilmesi için alıcı hesabını tanıyan yeni bileşenler geliştirdik.

Sepet bilgisinin kullanıcı oturumu ve diğer sistemlerle tutarlı şekilde çalışması da önemli hale geldi. Bu kapsamda oturum yönetimini yeniden ele aldık.

Mağaza bazındaki oturum bilgilerini daha düzenli yöneten ve eski oturum verilerini temizleyebilen bir yaklaşım geliştirdik.

Aynı dönemde checkout tarafında da değişiklikler yaptık. Daha önce ayrı adımlardan oluşan satın alma deneyimini birleşik bir checkout sayfasıyla desteklemeye başladık. Kayıtlı kartla ödeme gibi seçenekler de bu dönüşümün parçası oldu. Tıpkı mağaza geçişinde olduğu gibi, yeni checkout deneyimini de önce sınırlı kullanıcılarla devreye aldık.

Ardından kapsamını genişlettik. Böylece `storev3`, yalnızca satıcının mağazasını gösteren bir uygulama olmaktan çıkarak alıcının alışveriş deneyiminin daha büyük bölümünü yöneten bir sisteme dönüştü.

## Framework Kullanmamak Bilinçli Bir Tercihti

Bu kadar büyük bir projeyi geliştirirken neden Laravel veya Symfony gibi kapsamlı bir framework kullanmadığımız sorulabilir. Aslında [`merchant` projesini](/blog/shopier-satici-panelini-bastan-yazmak/) geliştirirken karşılaştığımız tercihin benzeri burada da vardı.

Çözmeye çalıştığımız problem, bütün Shopier altyapısını yeni bir framework'e taşımak değildi. Mevcut iş kurallarını ve entegrasyonları koruyarak mağaza uygulamasını daha iyi sınırlarla yeniden geliştirmekti.

Framework'e geçiş, zaten büyük olan dönüşümün kapsamını daha da genişletecekti. Bu nedenle PHP, Composer, PSR-4, PDO ve bir PHP Template Engine ile ilerledik.

İhtiyaç duyduğumuz sorumluluk ayrımlarını kendi uygulama yapımız içerisinde oluşturduk. Bunun da bazı maliyetleri vardı.

Routing, ortak başlangıç işlemleri ve belirli uygulama davranışları için kendi çözümlerimizi geliştirmemiz gerekiyordu. Zaman içerisinde bu alanları da iyileştirdik.

Örneğin eski dosya adı merkezli adreslerden daha anlamlı URL yapılarına geçtik. Dinamik işlem uçlarını daha tutarlı ve sürümlenmiş bir API organizasyonunda toplamaya başladık. Tekrarlanan şablon konfigürasyonlarını merkezi hale getirdik.

Benim için burada önemli olan bir framework kullanıp kullanmamak değildi.

**Projenin hangi sınırlar üzerine kurulduğu ve bu sınırların zaman içerisinde korunabilmesiydi.**

## Proje Büyürken Kod Kalitesini Yönetmek

Projenin ilk döneminde geliştirmelerin büyük bölümünü tek başıma yürütüyordum.

Zaman içerisinde ekibim büyüdü ve özellikle tema ile ön yüz tarafında çok daha fazla kişi çalışmaya başladı. Bu büyüme önemli bir değişiklik yarattı. Tek kişinin bildiği kurallar artık yeterli değildi.

Kodun anlaşılabilir, belirli standartlara uygun ve daha kolay kontrol edilebilir olması gerekiyordu. Bu nedenle kod stili ve statik analiz araçlarını kullanmaya başladık.

Hedef olarak,otomatik testlerin ve tam bir CI sürecinin ana geliştirme akışına yerleşmesi bunlardan biri. Tabi bu konu Shopierde uzun zamandır konuştuğumuz bir konuydu. Yıllar içerisinde büyüyen sistemlerin yalnızca özelliklerini değil, geliştirme pratiklerini de olgunlaştırmak gerekiyor.

## Bugün İki Projeye Baktığımda

storev2 ile `storev3` arasındaki farkı sadece kullanılan teknolojiler üzerinden anlatmak eksik kalır.

Yine de değişimi birkaç temel başlık altında özetleyebilirim.

| Alan | storev2 | `storev3` |
|---|---|---|
| Görünüm | PHP içerisinde üretilen HTML | PHP Template Engine şablonları |
| Tema | Tek görünüm | Çoklu tema ve özelleştirme |
| Kod organizasyonu | Büyük ortak sınıflar | İş alanlarına ayrılmış bileşenler |
| Sınıf yükleme | Manuel autoload | Composer ve PSR-4 |
| URL yapısı | Dosya ve parametre odaklı | Daha anlamlı route yapısı |
| Dinamik işlemler | Dağınık Middleware uçları | Sürümlenmiş API organizasyonu |
| Uygulama özellikleri | Çekirdekle daha iç içe | Apps entegrasyonu |
| Alıcı deneyimi | Temel alışveriş akışı | Alıcı hesabı ve genişletilmiş checkout |
| Veri erişimi | Doğrudan sorgular | PDO, okuma bağlantıları ve önbellek |
| Ekip çalışması | PHP ile iç içe ön yüz | Ayrılmış tema ve domain sorumlulukları |

Bu tablodaki en önemli değişiklik ise kullandığımız kütüphaneler değil.

- Eskiden bir ürün sayfasının nasıl görüneceği, hangi verileri kullanacağı ve bunları nasıl işleyeceği büyük ölçüde aynı kod içerisinde bulunuyordu.
- Yeni sistemde bu sorumlulukları birbirinden ayırdık. Böylece bir tema geliştirirken ödeme mantığını değiştirmek gerekmiyor.
- Yeni bir ödeme entegrasyonu eklerken bütün ürün sayfalarına dokunmak gerekmiyor.
- Bir satıcı ek bir uygulama kullandığında her temanın baştan geliştirilmesi gerekmiyor.

Bu ayrım, projenin zaman içerisinde büyümesini sağlayan en önemli mimari kazanım oldu.

## Bundan Sonra

`storev3` bugün Shopier'in alıcıya dönük mağaza deneyiminin temelini oluşturuyor. Ancak bu, projenin tamamlandığı anlamına gelmiyor.

storev2'den taşınması gereken bazı eski entegrasyonlar hâlâ bulunuyor. GraphQL denemesinden kalan bağımlılıkların temizlenmesi gerekiyor. Test ve otomasyon tarafında geliştirmek istediğimiz alanlar var.

Güvenlik kontrollerinin ve statik analiz kapsamının daha da genişletilmesi de devam eden işlerimiz arasında. Bunların yanında yeni alışveriş deneyimleri geliştirmeye de devam ediyoruz. Fakat bütün bunları düşünürken projenin başlangıçtaki amacını hatırlamak önemli.

2021 yılında yapmak istediğim ilk şey, PHP içerisine gömülü HTML'i ayrı bir katmana taşımaktı.

Bu küçük görünen karardan yola çıkarak çoklu tema sistemine, uygulama entegrasyonlarına, yeni checkout deneyimine ve sonunda eski mağaza altyapısının yerini alan bir projeye ulaştık.

Bu süreçte her karar doğru değildi. Bazı yaklaşımları denedik ve geri aldık. Bazı bölümleri birden fazla kez yeniden düzenledik.

Başlangıçta tek başıma geliştirdiğim yapı zaman içerisinde çok daha büyük bir ekibin çalıştığı bir projeye dönüştü.

Geriye dönüp baktığımda benim için en önemli çıkarım şu:

**Bir sistemi yeniden yazmanın başarısı, eski kodun tamamını yeni kodla değiştirmek değil; yeni sistemin gelecekteki değişiklikleri ne kadar kolay karşılayabildiğidir.**

storev2 uzun yıllar boyunca üzerine düşen görevi yerine getirdi. `storev3` ise onun üzerinde öğrendiklerimizle geliştirdiğimiz bir sonraki adım oldu.

Ve belki de bu projeyi benim için özel kılan şey tam olarak bu.

Yıllar önce yazdığım bir sistemin sınırlarına ulaştığını görmek, o sınırları aşacak yeni sistemi geliştirmek ve sonunda gerçek trafiği ona devretmek.

Bir projeyi başlatmak kadar, doğru zamanda yerini yenisine bırakabilmesini sağlamak da mühendisliğin bir parçası.

---

> Bilgisayarın anlayacağı kodu her aptal yazabilir. İyi programcılar insanların anlayabileceği kodu yazar.
>
> - Martin Fowler, *Refactoring*