---
title: 'Snegz'
description: 'SQLite, Node.js, Express ve GraphQL ile geliştirilen; kullanıcı, ürün ve sipariş verilerini tipli API sorgularıyla modelleyen GraphQL araştırma prototipi.'
summary: 'GraphQL şeması, iç içe veri ilişkileri, veri erişim katmanı, sayfalama ve sıralama üzerine geliştirdiğim API prototipi.'
startDate: 2021-11-15
endDate: 2021-12-23
ongoing: false
cover: './snegz.svg'
coverAlt: 'Kâğıt zemin üzerinde GraphQL veri ilişkilerini temsil eden minimalist kırmızı geometrik mühür ve Snegz yazısı.'
stack: ['Node.js', 'Express', 'GraphQL', 'SQLite', 'JavaScript']
role: 'Tasarım & geliştirme'
links:
  - label: 'GitHub'
    url: 'https://github.com/burakfiratz/snegz'
featured: false
order: 9
draft: false
---

**Snegz**, adını **SQLite, Node.js, Express ve GraphQL** teknolojilerinin baş harflerinden alan bir API prototipi. 2021'de GraphQL'in tip sistemi, ilişkili sorguları ve ilişkisel veritabanlarıyla nasıl çalıştığını anlamak için geliştirdim.

Çalışmaya tek bir GraphQL şemasıyla başladım. Kullanıcı, ürün ve sipariş kavramları eklendikçe kodu ayrı sorumluluklara böldüm: sorgular ve mutation'lar `graphql/`, veri tipleri `typedefs.js`, veritabanı sorguları `models/`, SQLite işlemlerini Promise'lerle saran ortak arayüz ise `db/dao.js` içerisinde yer aldı.

Kullanıcı ve ürünler için kayıt oluşturma ve sorgulama işlemleri, `User`–`Product`–`Order` arasında iç içe veri ilişkileri, GraphQL input tipleriyle sayfalama ve enum tabanlı sıralama geliştirdim. Siparişler için karşılaştırma ve mantıksal operatörlere dayalı filtreleme denemesi de bu çalışmanın bir parçası oldu.

Projedeki en önemli kararım, **GraphQL şemasını SQL sorgularından ayırmak** ve tekrar eden listeleme kurallarını ortak bir katmanda toplamak oldu. Böylece aynı veri modelinin farklı sorgu biçimlerinde nasıl kullanılabildiğini gözlemledim.

Snegz'i bir üretim API'si olarak değil, sınırları belli ve tamamlanmış bir **mimari öğrenme prototipi** olarak değerlendirdim. Sipariş tablosunun hazırlığı, güvenli dinamik filtre üretimi, yetkilendirme, otomatik testler ve N+1 sorgu optimizasyonu bu sürümde tamamlanmış özellikler değil.

Bu çalışma, istemciye esnek bir sorgulama dili sunmanın sunucu tarafında veri erişim düzeni, performans ve güvenlik kararları gerektirdiğini anlamamı sağladı.
