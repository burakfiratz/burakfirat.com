---
title: 'Snegz: GraphQL API Tasarlarken Veri Erişimini Katmanlara Ayırmak'
description: '2021’de SQLite, Node.js, Express ve GraphQL ile geliştirdiğim Snegz prototipi: tipli sorgular, iç içe veri ilişkileri, veri erişim katmanı, sayfalama, sıralama ve filtreleme üzerine mimari kararlar.'
pubDate: 2021-12-23
lang: 'tr'
tags: ['graphql', 'nodejs', 'sqlite', 'express', 'api-design', 'software-architecture']
draft: false
featured: false
---

Bir API geliştirirken alıştığım yaklaşım, her ihtiyaca karşılık gelen bir endpoint tanımlamaktı. Kullanıcı bilgisi için başka, ürünler için başka, kullanıcının ürünleri için başka bir endpoint. İstemcinin ihtiyaç duyduğu veri şekli değiştikçe sunucudaki endpoint sayısı da artabiliyordu.

2021'in sonunda farklı bir yaklaşımı denemek istedim: **İstemci, hangi alanlara ve hangi ilişkilere ihtiyaç duyduğunu tek bir sorguda söyleyebilseydi nasıl bir API tasarlardım?**

Bu soruyla başladığım projeye **Snegz** adını verdim. İsim aslında kullandığım teknolojilerin baş harflerinden geliyor: **SQLite, Node.js, Express ve GraphQL**. Kullanıcı, ürün ve sipariş kavramları üzerinden küçük bir veri modeli oluşturdum; bu modelin sorgulanmasını, ilişkili verilerin çözülmesini ve listeleme davranışlarını GraphQL tarafında tanımladım.

Snegz'i büyük bir e-ticaret servisinin alternatifi olarak değil, GraphQL'in sadece sorgu sözdizimini değil, **sunucu tarafındaki mimari etkilerini** anlamak için geliştirdim. Çalışmanın sonunda bir GraphQL şeması, sorgu ve mutation tanımları, SQLite veri erişim katmanı, iç içe ilişkiler ve listeleme seçeneklerinden oluşan bir API prototipi ortaya çıktı.

## Tek endpoint, farklı veri ihtiyaçları

REST yaklaşımında `GET /users/1` ve `GET /users/1/products` gibi adresler tanımlamak doğal bir tercih. GraphQL'de ise farklı kaynakları tek bir şema altında ifade etmek mümkün.

Snegz'de Express üzerinde `/graphql` endpoint'ini açtım. GraphiQL arayüzünü de etkinleştirerek şemayı tarayıcıdan sorgulayabileceğim bir geliştirme ortamı oluşturdum.

```js
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));
```

Burada asıl iş endpoint'in kendisinde değil, arkasındaki tip sistemindeydi. `User`, `Product` ve `Order` için GraphQL nesne tipleri oluşturdum; okunabilecek alanları, sorguların argümanlarını ve yeni kayıt oluşturma operasyonlarını bu tipler üzerinden tanımladım.

Örneğin bir kullanıcının yalnızca kimliğini ve sahip olduğu ürünlerin adlarını isteyen sorgu şu şekilde ifade edilebiliyor:

```graphql
query {
  user(userId: 1) {
    id
    username
    products {
      name
      price
    }
  }
}
```

Bu ifade bana GraphQL'in en önemli farkını gösterdi: Sunucu her kullanım senaryosu için yeni bir JSON yanıt biçimi tasarlamak yerine, istemcinin seçebileceği **tipli bir veri sözleşmesi** yayımlıyor.

## Şemanın büyümesi ve ilk mimari değişiklik

Projeye başladığımda şema tanımları `schema.js` etrafında toplanıyordu. Kullanıcı, ürün ve sipariş işlemleri eklendikçe bu yaklaşımın okunabilirliği azaldı. Bir noktadan sonra tek dosyada hem tipleri hem sorguları hem de veri erişimini görmek istemedim.

Bu nedenle yapıyı birkaç sorumluluğa ayırdım:

```text
server.js
   │
   └── schema.js
         ├── graphql/user.js
         ├── graphql/product.js
         ├── graphql/order.js
         └── typedefs.js
                 │
              models/
                 │
               db/dao.js
                 │
               SQLite
```

`graphql/` dosyalarında hangi query ve mutation'ların sunulacağını belirledim. `typedefs.js`, `User`, `Product` ve `Order` alanlarını ve ilişkilerini tarif ediyor. `models/` klasöründe SQL sorgularına yer verdim; `db/dao.js` ise SQLite'ın callback tabanlı işlemlerini Promise döndüren `get`, `all` ve `run` metotlarına dönüştürüyor.

Böylece GraphQL resolver'ının doğrudan veritabanı bağlantısının nasıl yönetildiğini bilmesi gerekmiyor. Bir kullanıcıyı getirmek istediğinde ilgili modelin metoduna başvurabiliyor.

Ayrıca SQLite satırlarındaki `user_id`, `created_at` gibi alanlarla GraphQL'de kullandığım `userId`, `createdAt` adlandırmalarını birbirinden ayırmak için küçük controller sınıfları oluşturdum. Bunlar HTTP controller'ları değil; veritabanından gelen kaydı API'nin sunduğu nesne biçimine dönüştüren eşleme katmanları.

Bu ayrım küçük bir örnek projede bile faydalı oldu. Şema büyürken veri erişim kodunu farklı bir yere taşımak, yeni özellik eklemeyi daha anlaşılır hale getirdi.

## İlişkili verilerin sorgulanması

GraphQL'i denemek için yalnızca düz liste sorguları yeterli değildi. Bir kullanıcının ürünlerini ve siparişlerini, bir ürünün ya da siparişin sahibini de aynı şema üzerinden okuyabilmek istedim.

Bunun için tiplerin içine alan bazlı resolver'lar yerleştirdim. Örneğin `User` tipindeki `products` alanı, kullanıcı kimliğini alıp ürün modelinin `getUserProducts` metodunu çağırıyor. Ürün tipindeki `user` alanı da `userId` üzerinden ilişkili kullanıcıya gidiyor.

```graphql
query {
  users(page: { limit: 5, offset: 0 }) {
    username
    products {
      name
      stock
    }
  }
}
```

Bu sorgunun güzel tarafı, kullanıcı listesiyle ilişkili ürünleri aynı veri sözleşmesi içinde tanımlayabilmek. Fakat mimari açıdan bir karşılığı da var: Her kullanıcının `products` alanı ayrı bir veritabanı sorgusu tetikleyebiliyor. Yani birkaç kullanıcıda görünmeyen **N+1 sorgu problemi**, veri sayısı büyüdüğünde önemli hale gelebilir.

Snegz'in bu sürümünde toplu yükleme veya DataLoader benzeri bir optimizasyon kullanmadım. İlişkilerin nasıl çözüldüğünü doğrudan görmek, ilk hedefim açısından daha öğreticiydi.

## Mutation'lar ve veri erişim katmanı

GraphQL sadece veri okumakla sınırlı değil. Snegz'de `setUser`, `setProduct` ve `setOrder` mutation'larını da tanımladım. Şemada zorunlu alanları `GraphQLNonNull` ile belirledim; örneğin bir ürün oluştururken kullanıcı kimliği, ad, açıklama, fiyat ve stok bilgileri bekleniyor.

Veritabanı tarafında SQL parametrelerini `?` yer tutucularıyla aktardım. Kayıt ekleme işleminin ardından oluşan `lastID` ile yeni kaydı tekrar okuyup GraphQL yanıtına dönüştüren bir akış kurdum.

```text
GraphQL mutation
      ↓
Resolver
      ↓
Model.setProduct(args)
      ↓
DAO.run(INSERT ...)
      ↓
DAO.get(SELECT ...)
      ↓
Product nesnesi
```

Bu yaklaşım, bir mutation sonucunda yalnızca “başarılı” mesajı dönmek yerine oluşturulan kaydın alanlarını yeniden sorgulayabilme imkânı veriyor.

## Listeleme: Sayfalama ve sıralama

Kullanıcı ve ürün listeleri oluştuktan sonra ikinci bir ihtiyaç ortaya çıktı: Sorgulara **sayfalama ve sıralama** seçenekleri eklemek.

Aynı `limit`, `offset` ve yön bilgisini her GraphQL alanında yeniden tanımlamak yerine ortak `InputObjectType` ve `EnumType` yapılarına taşıdım. Böylece örneğin bir ürün listesi için sorgu şu hale geldi:

```graphql
query {
  products(
    page: { limit: 5, offset: 0 }
    sort: { field: PRICE, direction: DESC }
  ) {
    id
    name
    price
  }
}
```

SQL tarafında da bu girdileri yorumlayan bir `CollateDef` yardımcı sınıfı oluşturdum. Sınıfın işi sayfalama sınırlarını hesaplamak ve sıralama ifadesini üretmek; modeller ise aynı parçayı kendi `SELECT` sorgularında kullanıyor.

Burada önemli bir tercih, sıralama alanlarını kullanıcıdan sınırsız bir string olarak almak yerine GraphQL enum'ları üzerinden tanımlamak oldu. Ürünlerde fiyat, oluşturulma tarihi ve stok; kullanıcılarda oluşturulma tarihi gibi belirli alanlar sunuluyor.

İlk sürümde limit ve offset için oldukça dar sınırlar kullandım. Ayrıca `offset` üst sınırı gibi uygulama kararları gerçek kullanımda yeniden düşünülmeli. Yine de listeleme davranışlarını her modelin içerisinde çoğaltmamak iyi bir adımdı.

## Filtreleme neden beklediğimden zor çıktı?

Projenin son aşamasında siparişler için filtreleme eklemeye başladım. Eşitlik (`EQ`), büyük (`GT`), küçük (`LT`) karşılaştırmalarını ve `AND` / `OR` ile birden fazla koşulu ifade etmeyi denedim.

Bu çalışma GraphQL tipleriyle SQL sorgusu üretmek arasındaki sınırı daha görünür hale getirdi. GraphQL bir girdinin biçimini doğrulayabiliyor ama bu, girdinin SQL'e güvenli ve doğru şekilde dönüştürüldüğü anlamına gelmiyor.

Bu sürümde sipariş filtresi sınırlı bir yapıya sahip: Kod, belirli bir koşul kümesini dolaşıp `WHERE` ifadesi oluşturuyor. Değerleri SQL metnine doğrudan ekliyor; karşılaştırma yönleri ve iç içe `AND` / `OR` çözümlemesi de genel amaçlı bir filtreleyicinin ihtiyaçlarını karşılamıyor. Bu nedenle geliştirdiğim bölümü **filtreleme dilinin ilk denemesi** olarak görüyorum; güvenli ve tam bir sorgu oluşturucu olarak değil.

Benzer şekilde, depolama başlangıç kodunda kullanıcı ve ürün tabloları oluşturulurken sipariş tablosunun oluşturulduğu bir migration bulunmuyor. `Order` tipi ve resolver'ları geliştirilmiş olsa da sipariş akışının farklı bir veritabanı hazırlığı olmadan uçtan uca çalıştığını söylemek doğru olmaz.

Bence burada asıl kazanım, API seviyesindeki zengin sorgulama yeteneğinin veri erişim katmanında ne kadar dikkatli tasarım gerektirdiğini görmekti.

## Projenin sonunda ne vardı?

Snegz üzerinde Kasım–Aralık 2021 arasında çalıştım. İlk Express/GraphQL iskeletinden başlayıp veri erişimini katmanlara ayırdım; kullanıcı ve ürünler için sorgu ve oluşturma işlemlerini, ilişkili alanları, sayfalama ve sıralamayı, sipariş tarafında ise şema ve filtreleme denemelerini geliştirdim.

Ortaya çıkan sistem, **GraphQL'in tip sistemiyle ilişkisel veri modelini birlikte düşünmek için tamamladığım bir API prototipiydi**. Üretime alınmış, yetkilendirmesi tamamlanmış ya da yük testleri yapılmış bir servis değildi. İlgili geliştirme deneyimini ve mimari kararları kayda geçirmek açısından ise hedeflediğim çalışmayı tamamladı.

## Bundan sonra neler yapılabilir?

Bu projeyi ilerletmek isteseydim ilk işim veritabanı tablolarını migration'larla yönetmek ve sipariş akışını baştan sona çalışır hale getirmek olurdu. Ardından filtreleri parametreli SQL ile güvenli biçimde kurmak, `GT` / `LT` semantiğini ve iç içe mantıksal koşulları test etmek gerekirdi.

İlişkili sorgularda N+1 problemi için toplu veri yükleme, alan bazlı yetkilendirme, sorgu karmaşıklığı limitleri, hataların istemciye doğru yansıtılması ve otomatik testler de doğal sonraki adımlar olurdu.

## Sonuç

Snegz'in bana öğrettiği en önemli şey, GraphQL'in sadece *tek endpoint'ten veri almak* olmadığıydı.

Şemayı tasarlamak, istemciye hangi ilişkilerin açılacağını belirlemek, bu ilişkileri veritabanından doğru ve verimli şekilde çözmek, filtre ve sıralamayı kontrollü biçimde SQL'e taşımak en az endpoint oluşturmak kadar önemli.

Başta küçük bir teknoloji denemesi olarak başladığım Snegz, sonunda benim için daha temel bir soruya dönüştü: **API'nin sunduğu esneklik artarken sunucunun iç mimarisini nasıl anlaşılır tutabilirim?**

Projede cevaplamaya çalıştığım şey buydu.
