---
title: 'BFZ Context Menu'
description: 'Seçili metin ve bağlantılar üzerinden sık kullandığım geliştirici kısayollarını Chrome sağ tık menüsüne taşıdığım kişisel eklenti prototipi.'
summary: 'Chrome’un mevcut bağlam menüsünü günlük geliştirme akışımın bir parçası haline getirmek için hazırladığım küçük, JavaScript tabanlı araç.'
startDate: 2023-01-17
endDate: 2023-01-27
ongoing: false
cover: './bfz-context-menu.svg'
coverAlt: 'Krem kâğıt üzerinde siyah çizgilerle bir sağ tık menüsü; seçili satır ve imleç kırmızı mühür tonunda gösteriliyor'
stack: ['JavaScript', 'Chrome Extensions API', 'Manifest V3', 'HTML', 'CSS']
role: 'Kişisel proje'
featured: false
order: 12
draft: false
---

Tarayıcı üzerinde çalışırken aynı metni tekrar tekrar kopyalayıp farklı adreslerde kullanmak, küçük görünse de geliştirme akışını bölebiliyor. **BFZ Context Menu**'yu bu tekrarlanan işlemleri sayfanın bulunduğum noktasından başlatabilmek için geliştirdim.

Chrome'un `contextMenus` API'siyle seçili metne ve bağlantılara özel komutlar ekledim. Seçili bir mağaza tanımlayıcısını farklı geliştirme ortamlarında açmaya yönelik kısayollar, bağlantıyı gizli pencerede açma işlemi ve bağlantı dönüştürme/çeviri denemeleri hazırladım.

İlk sürüm Manifest V2 ile başlamıştı. Çalışmanın devamında yapılandırmayı Manifest V3'e taşıyıp arka plan işleyicisini service worker olarak güncelledim. Böylece Chrome eklenti mimarisinin sürüm geçişini de küçük bir proje üzerinde deneyimledim.

Proje, tüm menü komutları tamamlanmış bir ürün değil; **kişisel kullanım ihtiyaçları için oluşturduğum bir eklenti prototipi**. Özellikle bazı deneysel komutların Manifest V3 uyumluluğunda geliştirilmesi gereken noktalar bulunuyor.

Bu projeyle ilgili geliştirme kararlarını ve öğrendiklerimi [teknik makalede](/blog/bfz-context-menu) anlattım.
