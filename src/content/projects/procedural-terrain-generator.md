---
title: 'Procedural Terrain Generator'
description: 'Python ve Arcade ile rastgele biyomlardan tile tabanlı 2D dünya üreten harita oluşturma prototipi.'
summary: 'Kare bir dünya matrisi üzerinde biyom seçimi, dağılım denemeleri ve sprite tabanlı harita çizimini bir araya getirdiğim algoritma odaklı oyun geliştirme çalışması.'
startDate: 2022-05-18
endDate: 2022-05-20
ongoing: false
cover: './procedural-terrain-generator.svg'
coverAlt: 'Kırık geometrik karo alanları ve tepe silüetiyle hazırlanmış minimalist Procedural Terrain Generator kapağı.'
stack: ['Python', 'Arcade', '2D Tile Maps', 'Procedural Generation']
role: 'Kişisel proje — tasarım ve geliştirme'
featured: false
order: 10
draft: false
---

## Bir dünyayı algoritmayla oluşturmak

**Procedural Terrain Generator**, 2D oyunlar için rastgele dünyalar oluşturmayı araştırdığım bir Python projesi. Amacım, haritayı elle yerleştirilen görseller yerine bir veri yapısından üretmek ve aynı veriyi görsel bir oyun alanına dönüştürmekti.

İlk olarak `N × N` boyutunda bir matris oluşturdum ve hücreleri beş biyom türünden biriyle eşleştirdim: **dağ, orman, çöl, bataklık ve su**. Ardından bir haritada bulunabilecek biyomların sayısını seçen ve dağılımını sınırlamayı deneyen bir yaklaşım ekledim.

Projenin sonraki aşamasında **Arcade** ile biyomları önce renkli hücreler, sonra bir tileset'ten okunan 40 × 40 piksellik görseller olarak çizmeye başladım. Böylece sayılardan oluşan bir matris, görsel olarak incelenebilen bir haritaya dönüştü.

## Teknik yaklaşım

Yapının merkezinde üç adım var: **biyom seçimi → harita matrisi → tile çizimi**. Harita üretimini ve ekrana çizimini ayrı düşünmek, algoritmayı görsel taraftan bağımsız olarak geliştirmemi sağladı.

Bu çalışma kesintisiz ve gerçekçi arazi üretmekten ziyade, rastgele biyom dağılımı ve tile tabanlı gösterimin araştırıldığı, ilk kapsamı tamamlanmış bir prototipti. Biyom komşuluk kuralları ve yeniden üretilebilir seed gibi konuları sonraki olası aşamalar olarak bıraktım.

Projenin teknik kararlarını ve dört denemenin nasıl geliştiğini [blog yazımda](/blog/procedural-terrain-generator/) anlattım.
