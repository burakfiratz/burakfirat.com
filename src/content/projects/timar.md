---
title: 'Timar'
description: 'PHP, MongoDB ve Twig ile geliştirdiğim deneysel tarayıcı strateji oyunu altyapısı.'
summary: 'Bina seviyeleri, kaynak maliyetleri ve arka planda tamamlanan zaman tabanlı yükseltmeler üzerine kurduğum tarayıcı oyunu prototipi.'
startDate: 2022-02-11
endDate: 2022-10-24
ongoing: false
cover: './timar.svg'
coverAlt: 'Timar için Japon minimalizmi esintili, mürekkep ve mühür kırmızısıyla çizilmiş bina simgeli proje kapağı'
stack: ['PHP', 'MongoDB', 'Twig', 'JavaScript', 'Bootstrap']
role: 'Tasarım & geliştirme'
featured: false
order: 8
---

Bir tarayıcı strateji oyununda oyuncunun gördüğü en basit hareketlerden biri, bir binayı yükseltmek. Ancak o düğmenin arkasında kaynak ekonomisi, seviye kuralları, bekleme süreleri ve tarayıcı kapalıyken de devam etmesi gereken bir oyun durumu var.

**Timar**, bu mekanikleri araştırmak için geliştirdiğim deneysel bir tarayıcı strateji oyunu projesi.

## Kaynaklar, binalar ve seviyeler

PHP ile geliştirdiğim uygulamada bina tiplerini ve her seviyenin maliyetini MongoDB'de veri olarak tanımladım. Tahıl, odun, taş ve altın gibi kaynaklar oyuncuya ait kayıtlarda tutuluyor. Bir yükseltme istendiğinde mevcut seviye okunuyor, sonraki seviyenin maliyeti hesaplanıyor ve kaynakların yeterliliği kontrol ediliyor.

## Zaman tabanlı yükseltmeler

Yükseltme başladığında gerekli kaynaklar düşülüyor ve işlemin biteceği zaman ayrı bir kuyruk kaydına yazılıyor. PHP ile hazırladığım cron görevi süresi dolan kayıtları işleyerek bina seviyesini artırıyor. Tarayıcıda ise JavaScript sayacı kalan zamanı gösteriyor.

Bu tasarımda süreyi yalnızca ekrandaki sayaç değil, sunucu tarafındaki kayıt belirliyor. Projede benim için en öğretici mimari karar buydu.

## Küçük bir oyun altyapısı deneyi

Twig şablonlarıyla temel bina ekranlarını ve ortak arayüz parçalarını oluşturdum. Bina özelliklerine ek olarak asker türleri için de veri modelleri hazırladım. Ancak Timar'ı tam bir savaş ve harita oyunu olarak değil, **bina yükseltme ve zaman tabanlı görev sistemine odaklanan bir prototip** olarak tamamladım.

İleride kaynak üretimi, asker eğitimi, harita ve oyuncular arası etkileşim gibi mekanikler bu altyapının üzerine eklenebilir.
