---
title: 'Flow — Tema Geliştirme Takibi'
description: 'Birden fazla mağaza temasındaki sayfa ve etkileşim işlerini kontrol listeleriyle takip etmek için geliştirdiğim React prototipi.'
summary: 'Tema, sayfa ve görev kırılımında ilerleme takibi; React, Ant Design ve Supabase ile tasarlanmış sade bir geliştirme kontrol paneli.'
startDate: 2023-11-17
ongoing: false
cover: './flow.svg'
coverAlt: 'Flow proje kapağı: kırmızı daire içinde ikisi tamamlanmış, biri aktif, biri bekleyen dört ardışık görev'
stack: ['React', 'JavaScript', 'Vite', 'Ant Design', 'Supabase']
role: 'Tasarım & geliştirme'
featured: false
order: 6
---

Birden fazla mağaza teması geliştirirken, aynı sayfanın farklı temalarda farklı aşamalarda olması oldukça doğal. Bir temada ürünlerin listelenmesi tamamlanmışken diğerinde filtreleme veya sepet davranışları henüz ele alınmamış olabilir.

**Flow** projesini, bu küçük ama önemli işleri görünür hale getirmek için geliştirdim. Amacım genel bir proje yönetimi uygulaması değil, özellikle tema geliştirme sürecine odaklanan bir kontrol listesi arayüzü oluşturmaktı.

## Tema, sayfa ve görev

Her tema için ayrı bir bölüm oluşturdum. Bu bölümlerde mağaza vitrini ve ürün detay sayfasına ait işleri listeledim. Böylece genel bir *sayfa tamamlandı* bilgisinin ötesine geçerek ürün görselleri, varyasyonlar, sepete ekleme ve filtreleme gibi parçaları ayrı ayrı takip edebilecek bir yapı tasarladım.

Bir özelliğin görünmesi ile işlevinin tamamlanmasını farklı maddeler olarak ele almak, projenin en önemli yaklaşımıydı.

## Küçük ve yeniden kullanılabilir parçalar

Arayüzü React ve Ant Design ile oluşturdum. Menü, sayfa içeriği, tema sekmeleri ve görev listelerini ayrı bileşenlere ayırdım. Farklı temalar için aynı kontrol listesi davranışını yeniden kullanmayı hedefledim.

Supabase ile de kullanıcıya ve temaya bağlı görev durumlarının saklanabileceği bir veri modeli üzerinde çalıştım. Her tema altında birden fazla sayfanın görevlerini JSON yapısında gruplandırmak bu ilk denemenin parçasıydı.

## İlk sürümün sonucu

2023'te hazırladığım prototipte dört tema için yönlendirme yapısını, mağaza ve ürün kontrol listelerini ve ilerlemeyi kaydetmeye yönelik temel entegrasyon tasarımını oluşturdum.

Bu bir üretim sisteminden çok, **tema geliştirme sürecindeki görünmeyen işleri daha somut hale getirmeyi amaçlayan bir arayüz ve veri modeli denemesiydi.** Kimlik doğrulama, veri güncellemelerinin güvenilirliği ve diğer sayfa akışları sonraki iterasyonlarda tamamlanması gereken alanlar olarak kaldı.

Flow'dan çıkardığım temel fikir basitti: **Geliştirme ilerlemesini takip edebilmek için önce tamamlanması gereken işi doğru tanımlamak gerekiyor.**
