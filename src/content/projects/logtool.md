---
title: 'Logtool - HTTP Access Loglarından Trafik Raporu Üretmek'
description: 'Go ile access log satırlarını ayrıştırıp HTTP metotları, durum kodları, istek yoğunluğu ve endpoint dağılımını Chart.js ile görselleştirdiğim küçük raporlama aracı.'
summary: 'Access log satırlarını regex ile ayrıştırıp tek geçişte trafik metriklerine dönüştüren ve sonuçları Go template ile üretilen, Chart.js grafikli bir HTML raporunda gösteren raporlama prototipi.'
startDate: 2025-05-30
cover: './logtool.svg'
coverAlt: 'logtool proje kapağı: kırmızı daire içinde log satırları ve özet çubukları'
stack: ['Go', 'html/template', 'Chart.js']
role: 'Kişisel proje'
featured: true
order: 5
---

Bir uygulamada neler olduğunu anlamak için bakabileceğimiz en temel kaynaklardan biri web sunucusunun access log kayıtları.

Gelen her isteğin hangi adrese yapıldığı, hangi HTTP metodunun kullanıldığı, sunucunun nasıl bir yanıt verdiği ve yanıtın boyutu gibi bilgiler bu kayıtlarda bulunuyor. Ancak logları doğrudan okumaya başladığınızda başka bir problemle karşılaşıyorsunuz: **Bilgi var ama onu anlamlandırmak kolay değil.**

Arka arkaya yüzlerce satır görmek, hangi endpoint'in daha fazla çağrıldığını veya hataların belirli bir sayfada yoğunlaşıp yoğunlaşmadığını hemen göstermiyor. Bunun için ya loglarda tekrar tekrar arama yapmak ya da bilgileri özetleyebilen bir araç kullanmak gerekiyor.

Mayıs 2025'te geliştirdiğim **Logtool**, bu ihtiyacı küçük bir deney olarak ele aldığım Go projesi. Bir web sunucusunun erişim kayıtlarına benzeyen örnek satırları ayrıştırıp trafik metriklerine dönüştüren, ardından sonuçları grafiklerle gösteren bir HTML raporu üreten ilk sürümünü tamamladım.

Bu yazıda log satırlarını nasıl ayrıştırdığımı, metrikleri neden tek bir veri modelinde topladığımı ve Go ile HTML raporu üretme yaklaşımımı anlatacağım.

## Log Satırından Metrik Çıkarmak

Bir access log satırı, farklı türden bilgilerin tek bir metin içerisinde tutulduğu bir kayıt. Örneğin basitleştirilmiş ve temsili bir satır şöyle görünebilir:

```text
192.0.2.10 - - [16/May/2025:14:32:10 +0300] "GET /products HTTP/1.1" 200 2048
```

Buradan HTTP metodunu, istenen yolu, yanıt kodunu ve gönderilen veri boyutunu ayrı alanlar olarak okuyabiliyoruz. Gerçek hayatta kayıt biçimi kullanılan sunucuya ve yapılandırmaya göre değişebiliyor. Benim çalıştığım formatta bunlara ek olarak proxy IP'si, işlem numarası, referrer ve user-agent gibi alanlar da vardı.

İlk aşamada ihtiyacım olan şey, uzun satırın içinden ölçmek istediğim alanları ayırmaktı. Bunun için Go'nun standart kütüphanesindeki `regexp` paketini kullandım.

Düzenli ifadede yalnızca sıralı yakalama grupları tanımlamak yerine, gruplara isim vermeyi tercih ettim:

```go
pattern := `"(?P<method>[A-Z]+) ` +
    `(?P<url>[^ ]+) ` +
    `(?P<protocol>[^"]+)" ` +
    `(?P<http_status_code>\d+) ` +
    `(?P<response_size>\d+)`

re := regexp.MustCompile(pattern)
```

*Bu örnek, makaledeki anlatım için kısaltılmış bir regex parçası; gerçek uygulama kullandığım log biçimine özgü başka alanlar da bekliyor.*

`method`, `url` ve `http_status_code` gibi isimler, veriyi daha sonra işlerken yakalanan alanın neyi temsil ettiğini açıkça gösteriyor.

Go'daki `SubexpNames()` ile bu grup adlarını alıp, hangi değerin hangi sayaca aktarılacağını belirleyebiliyorum. Böylece ayrıştırma kodunu yalnızca sayısal grup indekslerinden oluşan bir yapıya dönüştürmek zorunda kalmadım.

Bunun karşılığında bir sınırlamayı kabul ettim: Regex, bütün access log biçimlerini kendiliğinden tanımıyor. Belirli bir log düzenini hedefliyor. Farklı sunucu yapılandırmalarını desteklemek için bu ayrıştırma katmanını genişletmek gerekiyor.

## Bir İstek Birden Fazla Soruyu Cevaplıyor

Log satırını ayrıştırmak işin ilk kısmı. Asıl hedef, bu satırlardan anlamlı sayılar elde etmekti.

Örneğin tek bir kayıt şu sayaçları etkileyebiliyor: ilgili IP'den gelen istek sayısı, HTTP metodunun kullanım sayısı, durum kodunun frekansı, endpoint'in toplam çağrı sayısı ve dönen veri miktarı.

Bu nedenle farklı analizler için veriyi tekrar tekrar gezmek yerine bir `ProcessedData` yapısı oluşturdum:

```go
type ProcessedData struct {
    IPNumbers         map[string]int
    Methods           map[string]int
    StatusCodes       map[string]int
    TotalResponseSize int
    StatusCodeUrl     map[string]map[string]int
    TotalRequest      int
    MostCalledRoutes  map[string]int
}
```

Bu yapı, ham kayıtlarla rapor arasındaki sınırı oluşturuyor. Parser satırları ayrıştırıyor; sayaçlar ise her isteğin toplam sonuçları nasıl değiştirdiğini tutuyor.

Örneğin `GET` metoduyla yapılmış bir istek geldiğinde `Methods["GET"]` değerini artırıyorum. `/products` sayfasına gelmişse aynı zamanda o endpoint'in çağrı sayısı da artıyor.

Veri yapısının bu şekilde kurulması, ilk sürümde ihtiyacım olan metrikleri tek bir geçişte toplamamı sağladı. Daha sonra HTML tarafının ham log satırlarının biçimini bilmesine gerek kalmadı.

**Raporlama katmanının girdisi artık log metni değil, anlamlandırılmış veriydi.**

## Hangi Metrikleri Görmek İstedim?

İlk sürümde özellikle istek yoğunluğu ve HTTP yanıtları üzerine odaklandım.

Toplam istek sayısı ve yanıt boyutu, trafik hacmini kabaca görmek için yeterli bir başlangıç. HTTP metotlarının dağılımı, gelen isteğin ağırlıklı olarak okuma mı yoksa yazma işlemi mi olduğunu anlamaya yardımcı oluyor. Durum kodları ise hangi yanıtların daha sık üretildiğini gösteriyor.

Bir de yalnızca toplam `500` sayısını görmek istemiyordum. **Hangi endpoint'in kaç kez `500` döndürdüğü** çok daha açıklayıcıydı.

Bu yüzden bazı durum kodlarını URL ile birlikte saydığım iç içe bir harita ekledim:

```go
if statusCode == "500" {
    if data.StatusCodeUrl[statusCode] == nil {
        data.StatusCodeUrl[statusCode] = make(map[string]int)
    }

    data.StatusCodeUrl[statusCode][url]++
}
```

Uygulamanın mevcut sürümünde bu kırılım `500` hatalarının yanında `302` yönlendirmeleri için de tutuluyor. Böylece belirli sayfalardaki yönlendirme hareketlerini de ayrı bir grupta inceleyebiliyorum.

Burada küçük ama önemli bir ayrım var: `302`, hata kodu değil, yönlendirme yanıtı. Dolayısıyla bu iki kategorinin aynı grafikte bulunması raporu basitleştiriyor ama yorum yaparken durum kodunun anlamını kaybetmemek gerekiyor.

En sık çağrılan endpoint'leri göstermek için de bütün rotaları listelemek yerine **ilk on** ile sınırlandıran bir seçim adımı oluşturdum. Bu sayede raporun en yoğun adreslere odaklanmasını hedefledim.

## Logları Grafik Haline Getirmek

Raporlama tarafında iki sorumluluğu ayırdım: Go metrikleri hazırlasın, tarayıcı onları çizsin.

HTML tarafında Chart.js kullandım. Böylece her grafik için ayrı çizim altyapısı geliştirmem gerekmedi. HTTP metotlarını pasta grafikte, durum kodlarını sütun grafiğinde, endpoint bazlı sonuçları ise yatay çubuk grafiklerde gösterebildim.

Go'da `html/template` kullanarak raporun iskeletini bir dosyada tuttum. Analiz tamamlandığında elde edilen veriler template'e aktarılıyor ve `output.html` oluşturuluyor.

Genel akış şöyle:

```text
Örnek log satırları
        ↓
Regex ile ayrıştırma
        ↓
Sayaçlar ve toplu metrikler
        ↓
JSON'a dönüştürme
        ↓
Go HTML template
        ↓
Chart.js ile rapor
```

Bu yapı sayesinde veriyi hesaplayan kod ile grafiğin görünümünü değiştiren kod birbirine karışmıyor. Örneğin durum kodlarının pasta grafik yerine sütun grafiğiyle gösterilmesi gerektiğinde Go'daki sayaç mantığını değiştirmem gerekmiyor.

Harita ve sayaçları JavaScript tarafına geçirmek için JSON dönüşümü kullandım. `ProcessedData` ve template'e aktarılan `ChartData` alanları arasındaki tekrarları azaltmak amacıyla Go'nun `reflect` paketini de denedim.

Buradaki fikir, aynı isimli alanları tek tek kopyalamak yerine belirli türleri dinamik biçimde dönüştürmekti. Küçük bir araçta Reflection kullanımının getirdiği karmaşıklık tartışılabilir; ancak farklı Go veri yapılarının bir raporlama katmanına nasıl aktarılabileceğini görmek açısından öğretici oldu.

## Neden Go?

Bu projede HTTP loglarını ayrıştırmak için kapsamlı bir framework'e ihtiyaç duymuyordum. Bir dosyadaki satırları okuyup sayısal özetler oluşturmak, ardından bir HTML çıktısı üretmek istiyordum.

Go'nun standart kütüphanesi bu çalışmanın büyük kısmı için yeterliydi: `regexp` ile ayrıştırma, `map` ile sayma, `sort` ile sıralama, `encoding/json` ile veri aktarımı ve `html/template` ile rapor oluşturma.

Ayrıca bütün akışı tek bir program içerisinde izleyebilmek, özellikle ilk sürümde avantajdı. Verinin hangi adımda ayrıştırıldığını, hangi sayaçları değiştirdiğini ve template'e nasıl ulaştığını takip etmek kolaydı.

Bu tercih, yüksek trafikli üretim ortamında belirli bir performans kazancı elde ettiğim anlamına gelmiyor. Projenin bu sürümünde benchmark veya büyük dosya üzerinde bir performans karşılaştırması bulunmuyor. Benim için kazanım, **küçük bir veri işleme aracını az sayıda bağımlılıkla kurabilmekti.**

## İlk Sürümün Sonucu

Mayıs 2025'te ortaya çıkan ilk sürümle, kod içine yerleştirdiğim örnek erişim kayıtlarından trafik özetleri üretip bunları HTML raporuna aktarabilen akışı tamamladım.

HTTP metotları, yanıt kodları, IP dağılımı, en çok çağrılan endpoint'ler ve belirli durum kodlarının URL bazlı sayıları raporun temelini oluşturdu. Oluşturduğum grafik şablonlarıyla bu bilgileri tek bir sayfada bir arada gösterebiliyorum.

Bu çalışma henüz doğrudan bir `access_log` dosyasını komut satırından alıp işleyen genel amaçlı bir araca dönüşmüş değil. Mevcut giriş verisi uygulamanın içinde tanımlı örneklerden oluşuyor. Dolayısıyla tamamladığım şey, **gerçek dosya okuyabilen bir üretim aracı değil; ayrıştırmadan görselleştirmeye kadar çalışan akışı hedefleyen bir raporlama prototipi**.

Buna rağmen üzerinde çalışmak istediğim esas sorunu somut hale getirdi: Bir erişim kaydının içindeki bilgiler tek başına fazla bir şey söylemeyebilir; fakat bu bilgileri ortak metriklere dönüştürdüğümüzde trafik hakkında daha anlaşılır sorular sorabiliyoruz.

## Bundan Sonra

Projeyi geliştirmeye devam edersem ilk adımım örnek veri listesini kaldırıp logları dosyadan, satır satır okuyabilen bir arayüz eklemek olacak. Ardından farklı log formatlarını desteklemek, eşleşmeyen satırları atlayıp raporlamak ve büyük dosyaları tümüyle belleğe almadan işlemek önemli hale gelecek.

Raporlama tarafında zaman aralığına göre trafik trendleri, `4xx` ve `5xx` hata dağılımları, yanıt süreleri ve p95 gibi performans metrikleri üzerinde çalışılabilir. Ancak bu analizler için kaynak loglarda doğru alanların bulunması gerekir. Kullanıcı etkileşimi veya saldırı tespiti gibi daha ileri çıkarımlar ise yalnızca birkaç sayaç eklemekten fazlasını gerektirir.

Aynı şekilde hazırladığım raporda grafik veri aktarımını daha kontrollü hale getirmek, HTML şablonundaki deneme çıktılarını temizlemek ve küçük veri kümeleri için daha dayanıklı hata yönetimi eklemek de önemli iyileştirmeler arasında.

## Sonuç

Logtool, kapsamlı bir gözlemlenebilirlik platformu geliştirme girişimi değil. Ham log satırlarından başlayıp okunabilir bir rapora ulaşan yolun hangi bileşenlerden oluştuğunu görmek için yaptığım küçük bir mühendislik çalışması.

Bu projede öğrendiğim en önemli şey, log analizinin yalnızca düzenli ifade yazmaktan ibaret olmadığıydı. Hangi alanların anlamlı olduğunu seçmek, bunları nasıl toplamak gerektiğini belirlemek ve sonucu yorumlanabilir biçimde göstermek de en az ayrıştırma kadar önemli.

**Ham log, olayları kaydeder. İyi bir rapor ise o olayların arasındaki ilişkileri görünür hale getirir.**
