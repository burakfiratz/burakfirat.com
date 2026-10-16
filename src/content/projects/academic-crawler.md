---
title: 'Academic Crawler - Bir Web Tarayıcısından Aranabilir İçerik Hattına'
description: 'Go ile geliştirdiğim akademik içerik odaklı crawler: öncelikli URL kuyruğu, robots.txt, içerik tekrarlarının tespiti, PostgreSQL bağlantı grafiği ve OpenSearch üzerinde arama.'
summary: 'Akademik sayfalara öncelik veren, içerikleri tekrar etmeden PostgreSQL ve OpenSearch üzerinde saklayıp indeksleyen ve küçük bir REST API ile aranabilir hale getiren Go tabanlı bir tarama hattı.'
startDate: 2026-05-15
ongoing: false
cover: './academic-crawler.svg'
coverAlt: 'Academic Crawler proje kapağı: kırmızı daire içinde birbirine bağlı düğümlerden oluşan bir bağlantı grafiği'
stack: ['Go', 'PostgreSQL', 'OpenSearch', 'goquery']
role: 'Kişisel proje'
featured: true
order: 4
---

Bir web crawler yazmak ilk bakışta basit bir iş: Bir URL'ye istek gönder, HTML'i indir, bağlantıları çıkar ve bulduğun adresler için aynı işlemi tekrarla.

İlk denemelerde bu yaklaşım gerçekten yeterli. Ancak sayfalar arasındaki bağlantılar çoğaldıkça daha önemli sorular ortaya çıkıyor. Hangi adresi önce taramalıyım? Aynı içeriğe farklı URL'lerden ulaşırsam ne yapmalıyım? Bir sitenin kaynaklarını gereksiz yere tüketmeden nasıl ilerlemeliyim? Topladığım veriler üzerinde sonradan nasıl arama yapabilirim?

**Academic Crawler** projesini bu soruları uçtan uca ele almak için geliştirdim. Amacım akademik araştırma ve yayınlarla ilişkili sayfalara öncelik verebilen, içerikleri tekrar etmeden kaydedebilen ve topladığı metinleri aranabilir hale getiren bir sistem oluşturmaktı.

Go ile geliştirdiğim ilk sürümde URL yönetiminden indekslemeye, PostgreSQL'de bağlantı ilişkilerinin saklanmasından basit bir REST arama API'sine kadar bütün hattı oluşturdum. Bu yazıda ortaya çıkan mimariyi ve bu mimariye neden ihtiyaç duyduğumu anlatacağım.

## URL indirmekten bir veri hattı kurmaya

Başlangıç noktası, bir sayfayı indirip bağlantılarını takip edebilen küçük bir programdı. Fakat tüm sorumlulukları aynı fonksiyona yığmak istemedim. Bu yüzden HTTP isteklerini, HTML ayrıştırmayı, tarama kuyruğunu ve domain bazlı zamanlamayı farklı Go paketlerine ayırdım.

Sistem büyüdükçe içerik tekrarlarının kontrolü, veri saklama ve arama indeksleme katmanlarını da ekledim. Sonuçta akış şu hale geldi:

```text
Başlangıç URL'si
       ↓
Öncelikli URL kuyruğu
       ↓
robots.txt kontrolü + domain beklemesi
       ↓
HTTP isteği + HTML ayrıştırma
       ↓
İçerik hash'i + tekrar kontrolü
       ↓
PostgreSQL'e kayıt → OpenSearch indeksleme
       ↓
Bağlantıları puanlama → yeni tarama işleri

Ayrı servis: REST Search API → OpenSearch
```

Burada benim için önemli olan yalnızca bileşenlerin ayrı dosyalarda durması değildi. Her parçanın farklı bir soruya cevap vermesiydi. Fetcher sayfayı nasıl alacağını, parser HTML'den ne çıkaracağını, frontier hangi adresin sırada olduğunu, indexer ise verinin nasıl aranabilir hale geleceğini biliyor.

## Tarama sırasını değiştiren karar: Priority Queue

Bir crawler'ın her URL'yi tarayacak zamanı veya kaynağı olmayabilir. Böyle bir durumda sıradaki adresin rastgele veya yalnızca keşif sırasına göre belirlenmesini istemedim.

Özellikle akademik içeriklerle ilgilendiğim için `research`, `paper`, `university`, `academic` ve `publication` gibi kelimelerin geçtiği adresleri daha önemli kabul eden basit bir puanlama mekanizması geliştirdim.

Puan hesaplanırken yalnızca URL'ye bakmıyorum. Bağlantının sayfada görünen metni de hesaba katılıyor. Ayrıca tarama derinliği arttıkça puan bir miktar düşüyor; adres yolu bir makale veya yayın sayfasını andırıyorsa ek puan alıyor.

Bu skorları kullanabilmek için ilk sürümdeki sıralı URL listesini Go'nun `container/heap` paketiyle bir **max-heap** yapısına dönüştürdüm. Böylece en yüksek öncelikli tarama işi kuyruktan önce çıkıyor.

```go
func (pq PriorityQueue) Less(i, j int) bool {
    return pq[i].Priority > pq[j].Priority
}
```

Buradaki karşılaştırma işareti küçük ama önemli: `container/heap` normalde en küçük öğeyi öne alırken, bu düzenlemeyle en yüksek skorlu URL'yi önce işliyorum.

Bu yaklaşımı bir akademik içerik sınıflandırıcısı olarak görmüyorum. Sayfanın gerçekten bilimsel bir çalışma olup olmadığını doğrulamıyor; bağlantının taşıdığı işaretlerden hareketle **sınırlı tarama bütçesini nereye ayıracağına** karar veriyor. İlk sürüm için ihtiyacım olan davranış tam olarak buydu.

## Sadece hızlı değil, kontrollü taramak

Crawler geliştirirken karşı taraftaki sunucuyu da düşünmek gerekiyor. Saniyeler içerisinde yüzlerce istek gönderebilmek, bunu yapmanın doğru olduğu anlamına gelmiyor.

Bu nedenle `robots.txt` kontrolünü en baştan akışa dahil ettim. Hedef sitenin kuralları okunuyor, aynı adres için tekrar tekrar istek atmamak amacıyla domain bazında bellekte saklanıyor ve tarama kararında kullanılıyor.

Buna ek olarak her domain için son istek zamanını tutan bir zamanlayıcı geliştirdim. İlk sürümde aynı domaine yapılan istekler arasında iki saniyelik bekleme hedefleniyor. HTTP istemcisinde on saniyelik timeout, indirilen yanıtta ise 5 MB'lık okuma sınırı var.

Bunlar basit ama önemli sınırlar. Taramanın kontrolsüz şekilde büyümesini önlemek ve dış kaynaklarla etkileşimi belirli kurallar çerçevesinde tutmak istedim.

Elbette `robots.txt` dosyasına erişilemediği durumlar veya çok daha yoğun bir tarama trafiği ayrı politikalar gerektirir. Bu sürümdeki kontrolleri genel amaçlı bir üretim crawler'ının bütün güvenlik ve nezaket önlemlerinin yerine koymuyorum.

## HTML'den gerçekten ihtiyacım olan veriyi çıkarmak

Sayfayı indirebilmek tek başına bir anlam ifade etmiyor. Asıl veri HTML'in içerisinden çıkarılmalı.

Burada Go ekosistemindeki `goquery` kütüphanesini kullandım. Parser, sayfa başlığını ve gövde metnini çıkarıyor; `script`, `style` ve `noscript` öğelerini temizliyor. Ayrıca sayfadaki bağlantıların hem adreslerini hem de görünen metinlerini topluyor.

Bağlantı metnini saklamak özellikle önemliydi. `publication` kelimesi URL'de bulunmasa bile *Research publications* başlıklı bir bağlantı, hedef sayfa hakkında fikir verebiliyor. Böylece parser'ın çıkardığı bilgi, önceliklendirme katmanında da kullanılabiliyor.

Göreli bağlantıları mutlak URL'lere dönüştürmek ve yalnızca HTTP/HTTPS adreslerini kabul etmek için ayrıca bir URL normalizasyon katmanı oluşturdum. Fragment'leri temizleyip sondaki `/` karakterini normalize ederek kuyrukta gereksiz tekrarların bir bölümünü azaltıyorum.

Bu aşamada amacım PDF'lerden akademik makale çıkarmak veya DOI, yazar, atıf gibi alanları çözümlemek değildi. Önce genel web içeriğini tutarlı bir veri modeline dönüştüren hattı tamamladım.

## Aynı içerik, farklı adresler

Bir sayfa farklı URL'lerden erişilebilir olabilir. Sadece daha önce görülen URL'leri saklamak, aynı metnin yeniden işlenmesini engellemiyor.

Bu nedenle **içerik tabanlı tekrar kontrolü** ekledim. Çıkardığım gövde metnini önce küçük harfe çeviriyor, art arda gelen boşlukları normalize ediyor ve ardından SHA-256 hash'ini alıyorum.

```text
Gövde metni
    ↓
Küçük harf + boşluk normalizasyonu
    ↓
SHA-256
    ↓
Daha önce görüldü mü?
```

Tarama işlemi sırasında aynı hash'e daha önce rastlandıysa içerik yeniden kaydedilip indekslenmiyor. URL kuyruğunda da ayrı bir `visited` kontrolü bulunuyor; böylece **aynı adresi yeniden sıraya almak** ile **farklı adreslerdeki aynı içeriği bulmak** iki farklı problem olarak ele alınıyor.

Bu sürümde hash kayıtları bellekte tutuluyor. Dolayısıyla tekrar kontrolü çalıştırmalar arasında kalıcı değil. Ayrıca küçük bir metin değişikliği yeni bir hash üreteceği için birbirine *çok benzeyen* belgeleri tespit etmiyor. Bu mekanizmayı bilinçli olarak deterministik ve anlaşılır tuttum.

## PostgreSQL ve OpenSearch neden ayrı?

İçerikleri toplamaya başlayınca iki farklı veri ihtiyacı oluştu.

Bir tarafta taradığım sayfaların kayıtlarını ve sayfalar arasındaki ilişkileri saklamak istiyordum. Diğer tarafta ise bütün bu metinlerin içinde hızlı arama yapabilmek gerekiyordu.

Bunun için **PostgreSQL'i kalıcı kayıtlar**, **OpenSearch'ü arama indeksi** olarak konumlandırdım.

PostgreSQL'de sayfanın URL'si, başlığı, gövde metni, HTTP durum kodu, içerik hash'i ve taranma zamanı tutuluyor. Bağlantılar ise kaynak URL, hedef URL ve bağlantı metniyle ayrıca kaydediliyor.

Bu tercih, sayfaların birbirine nasıl bağlandığını da inceleyebileceğim bir temel oluşturdu. Burada henüz PageRank benzeri bir sıralama algoritması yok; ancak ileride bağlantı grafiği üzerinde çalışmak için gerekli ilişkisel veri modeli mevcut.

OpenSearch'e ise URL, başlık, metin ve diğer temel belge alanlarını gönderiyorum. Belgenin kimliği olarak içerik hash'ini kullanıyorum. Böylece aynı normalize edilmiş içeriğin farklı taramalarda aynı indeks kimliğiyle ele alınabilmesini sağlıyorum.

Bu ayrım bana oldukça doğal geldi: **Bir veriyi güvenilir biçimde saklamak ile onu aramaya uygun şekilde indekslemek aynı sorumluluk değil.**

Ancak iki sistemli tasarımın beraberinde getirdiği bir tutarlılık problemi de var. PostgreSQL'e kayıt başarılı olduktan sonra indeksleme hata verirse belge iki sistemde farklı durumda kalabilir. İlk sürüm bu hatayı raporluyor; kalıcı bir yeniden deneme veya outbox mekanizması içermiyor. Bunun farkında olarak önce veri hattının bütün parçalarını bir araya getirmeye odaklandım.

## İndeksin üstüne küçük bir arama API'si

Veriyi indekslemek, ancak bir sorguyla ona geri ulaşabildiğimde anlam kazanıyor. Bu yüzden crawler'dan bağımsız çalışan ikinci bir Go programı geliştirdim: **REST Search API**.

API'nin ilk sürümünde tek bir endpoint yeterliydi:

```http
GET /search?q=research
```

Bu endpoint OpenSearch üzerinde `multi_match` sorgusu çalıştırıyor. Başlık ve metin birlikte aranıyor; başlığa daha yüksek ağırlık veriliyor ve sorgu için ilk on sonuç isteniyor.

Crawler'ın ve arama API'sinin ayrı çalıştırılabilir programlar olması da bilinçli bir ayrım. Bir bileşen içerik toplamak ve indekslemekle, diğeri mevcut indeksi sorgulamakla ilgileniyor.

Böylece ilk sürümün başında hedeflediğim zincirin tamamı kod düzeyinde ortaya çıktı:

**URL keşfi → kontrollü tarama → içerik ayrıştırma → tekrar kontrolü → kalıcı kayıt → indeksleme → arama.**

## İlk sürümde neyi tamamladım?

Mayıs 2026'da geliştirdiğim çalışmanın sonunda tek bir HTTP isteği yapan örnekten daha kapsamlı bir altyapıya ulaşmış oldum.

Öncelikli URL kuyruğu, akademik terimlere dayalı skorlama, domain beklemesi, `robots.txt` değerlendirmesi, HTML ayrıştırma, SHA-256 ile içerik tekrar kontrolü, PostgreSQL'e sayfa ve bağlantı kaydı, OpenSearch indeksleme ve bunların üstünde çalışan bir arama API'sinin uygulama kodlarını tamamladım.

Projenin kapsamını da bu ilk sürüme göre belirledim. Crawler'da başlangıç adresi, maksimum derinlik ve sayfa sınırı doğrudan kodda tanımlı; örnek çalışma dört sayfayla sınırlandırılmış. Tarama döngüsü tek iş parçacığında ilerliyor. Depolama katmanının kullandığı tablolar için migration dosyaları ise repoda bulunmuyor. Bu nedenle bunu büyük ölçekte devreye alınmış veya uçtan uca kurulumu doğrulanmış bir servis olarak değil, **temel mimarisi ve bileşenleri geliştirilmiş bir ilk sürüm** olarak değerlendiriyorum.

Benim için bu çalışmanın tamamlanan kısmı, birbirinden farklı veri yapılarının ve teknolojilerin tek bir amaç etrafında buluşmasıydı. Bir URL'nin neden önce tarandığından aynı sayfanın neden ikinci kez indekslenmediğine kadar birçok kararı artık ayrı bileşenlerde tanımlayabiliyorum.

## Bundan sonra neler yapılabilir?

İlk sürüm tamamlandıktan sonra projeyi farklı yönlerde geliştirmek mümkün.

Daha büyük ölçekli tarama için bellekteki kuyruğu kalıcı hale getirmek, başarısız işlemleri yeniden denemek ve domain bazlı daha gelişmiş hız politikaları oluşturmak gerekir. PostgreSQL ile OpenSearch arasındaki tutarlılık için yeniden işleme mekanizması eklenebilir. URL normalizasyonu ve içerik tekrar kontrolü de daha güçlü hale getirilebilir.

Akademik içerik özelinde ise PDF okuma, DOI ve yazar bilgisi çıkarma, yayın türü sınıflandırması, atıf bağlantıları ve bağlantı grafiğine dayalı sıralama ayrı çalışma alanları olabilir. Otomatik testler, veritabanı migration'ları ve servis yapılandırmalarının dışarı alınması da bir sonraki mühendislik adımları arasında.

Bunlar ilk sürümün yapılmış özellikleri değil; mevcut mimarinin nereye evrilebileceğine dair fikirler.

## Sonuç

Academic Crawler'ı geliştirirken en çok ilgimi çeken şey, basit görünen bir web tarama probleminin ne kadar farklı mühendislik konusu barındırması oldu.

Bir yanda heap veri yapılarıyla önceliklendirme, diğer yanda HTTP ve `robots.txt` kuralları var. İçerik tekrarını hash ile kontrol ederken başka bir katmanda ilişkisel veri modelini, arama indeksini ve API tasarımını düşünmek gerekiyor.

Bu projede büyük bir akademik arama motoru inşa etmedim. Bunun yerine o tür bir sistemi oluşturan temel parçaları ayrı sorumluluklar halinde geliştirdim ve tek bir veri hattında birleştirdim.

**Benim için önemli olan yalnızca sayfaları indirebilmek değil, hangi bilginin neden toplandığını ve toplandıktan sonra nasıl bulunacağını tasarlamaktı.**
