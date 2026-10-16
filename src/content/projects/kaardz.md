---
title: 'Kaardz'
description: 'Vue 3 ile geliştirilen, kart metni, istatistikleri, sembolleri ve renklerini özelleştirmeye yönelik görsel kart editörü prototipi.'
summary: 'Kartın görünümünü bağımsız editör bileşenleriyle değiştirip canlı önizlemede birleştiren küçük bir Vue projesi.'
startDate: 2022-04-12
endDate: 2022-04-25
ongoing: false
cover: './kaardz.svg'
coverAlt: 'Krem zemin üzerinde geometrik oyun kartları ve kırmızı mühür detaylarıyla hazırlanmış minimalist Kaardz kapağı.'
stack: ['Vue 3', 'JavaScript', 'Vite', 'Bootstrap', 'html2canvas']
role: 'Tasarım ve geliştirme'
links: []
featured: false
order: 11
draft: false
---

**Kaardz**, tarayıcı üzerinden özelleştirilebilir kartlar tasarlamak için geliştirdiğim bir frontend prototipi.

Kartın açıklaması, istatistikleri, arka plan geçişi, görsel alanının kenarları ve küçük semboller farklı kontroller üzerinden düzenlenebiliyor. Yapılan değişiklikler, `Kard.vue` bileşenindeki kart önizlemesine aktarılıyor.

Projeyi Vue 3 ve Vite ile geliştirdim. Arayüzü `Stat`, `Parchment`, `Image`, `KardBackground` ve `Bean` bileşenlerine ayırdım. Bu bileşenler değişen değerleri olaylarla üst bileşene iletiyor; üst bileşen de ortak kart özelliklerini önizlemeye prop olarak gönderiyor.

Son aşamada `html2canvas` ile kartın HTML görünümünü canvas'a dönüştürme yaklaşımını denedim. Prototipte canvas üretimi için bir örnek bulunuyor; eksiksiz görsel indirme ve tasarım kaydetme sistemi ise kapsam dışında.

**Teknik hikâye:** [Kaardz: Vue ile Özelleştirilebilir Kartlar Tasarlamak](/blog/kaardz/)
