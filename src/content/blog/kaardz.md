---
title: 'Kaardz: Vue ile Özelleştirilebilir Kartlar Tasarlamak'
description: 'Vue 3 ile kart tasarımını küçük editör bileşenlerine ayırmak, olaylarla ortak durumu yönetmek ve html2canvas ile görsel çıktı üretimini denemek.'
pubDate: 2022-04-25
lang: 'tr'
tags: ['vue', 'javascript', 'frontend', 'component-design', 'canvas']
draft: false
---

Bir oyun kartına baktığımda aslında aynı yüzeyde bir araya getirilmiş birkaç farklı veri görüyorum: görsel, açıklama, istatistikler, renkler ve küçük semboller. Bunların her biri ayrı ayrı değiştirilebiliyor, fakat sonuçta tek bir kartın parçası olarak görünmeleri gerekiyor.

**Kaardz** projesini bu fikirden hareketle geliştirdim. Amacım, tarayıcı üzerinde bir kartın görünümünü düzenleyebileceğim küçük bir araç oluşturmaktı. Kartın istatistiklerini, arka planını, üzerindeki sembolleri ve görsel alanının biçimini değiştirirken sonucu aynı ekranda görmek istiyordum.

Projeyi **Vue 3 ve Vite** ile geliştirdim. Bootstrap'i arayüzün hızlıca kurulması için kullandım. Bir yandan Vue'nun bileşen modelini daha iyi tanırken diğer yandan tek bir görsel çıktının birden çok kontrol tarafından nasıl yönetilebileceği üzerine çalıştım.

## Kartın kendisini bir bileşen olarak düşünmek

Başlangıçta kartın özelliklerini tek bir sayfada yönetmek mümkün görünüyordu. Ama kartın kendisi ile kartı düzenlemek için kullanılan kontroller aynı sorumluluğa sahip değildi.

Bu nedenle kartın ekrana çizilen kısmını `Kard.vue` içine aldım. Kartın görünümü bu bileşenin işi; hangi özelliklerin değiştirileceğine ilişkin kontroller ise ayrı bileşenlerin işi oldu.

Ortaya çıkan yapı kabaca şöyleydi:

```text
App.vue
├── Kard.vue                 # Kartın önizlemesi
├── Stat.vue                 # İstatistik editörü
├── Parchment.vue            # Açıklama editörü
├── Image.vue                # Görsel alanı ayarları
├── KardBackground.vue       # Arka plan renkleri
└── Bean.vue                 # Rozet / sembol ayarları
```

Bu ayrımın önemli tarafı, düzenleme arayüzü büyüdüğünde kartın nasıl çizildiğini değiştirmek zorunda kalmamaktı. Örneğin bir istatistiğin rengi değiştiğinde ilgili editör yalnızca yeni değeri üretir; bunun kart üzerinde nasıl görüneceğine `Kard` karar verir.

## Ortak durumun sahibi: App.vue

En çok üzerinde durduğum konulardan biri, bu bağımsız editörlerin aynı kartı değiştirmesiydi.

`App.vue` içerisinde `kardProps` adını verdiğim bir nesne oluşturdum. Kartın açıklaması, istatistikleri, arka plan renkleri, görsel kenar yuvarlaklığı, sembol sayısı ve sembolün rengi bu nesnede tutuluyordu.

`Kard.vue` bu nesneyi prop olarak alıyordu:

```vue
<Kard v-bind="kardProps" />
```

Alt taraftaki editörler kendi yerel durumlarını yönetiyor ve bir değişiklik olduğunda yukarıya olay (`$emit`) gönderiyordu. Üst bileşen gelen değeri `kardProps` içinde güncelliyordu. Vue da ilgili prop'lar değiştiğinde kartın önizlemesini yeniden oluşturuyordu.

Akışın özeti şöyleydi:

```text
Kullanıcı bir kontrolü değiştirir
           ↓
İlgili editör kendi değerini günceller
           ↓
$emit ile App.vue'ya yeni değer iletilir
           ↓
App.vue → kardProps güncellenir
           ↓
Kard.vue yeni prop'larla görüntülenir
```

Böylece farklı editörlerin doğrudan birbirini tanımasına gerek kalmadı. Sistemin merkezi `App.vue`, görsel çıktı noktası ise `Kard.vue` oldu.

Editörlerin çoğunda aynı olay adını (`statFromStatInstance`) kullanmıştım. Küçük bir prototipte işimi gördü; ancak proje büyüseydi her editöre daha anlamlı olay adları vermek ve birbiriyle ilişkili özellikleri nesne olarak iletmek bakım kolaylığı açısından daha iyi olurdu.

## Bir kartın istatistikleri

Kartı yalnızca renkli bir görsel olarak bırakmak istemedim. Oyundaki saldırı, savunma veya enerji gibi değerleri temsil edebilecek bir **istatistik alanı** ekledim.

`Stat.vue` içinde başlangıçta üç istatistik tanımladım. Her birinin bir kimliği, adı, değeri, ekranda görünecek birleşik metni ve arka plan rengi vardı.

Örneğin kullanıcı istatistiğin adını `Attack`, değerini `25` yaptığında bunu kartta tek bir rozet olarak göstermek mümkündü:

```js
{
  id: 0,
  stat_name: 'Attack',
  stat_value: '25',
  stat_pretty: 'Attack / 25',
  stat_background_color: '#ffc107'
}
```

İstatistik editöründeki alanlar değiştiğinde diziyi yeniden yorumlayıp üst bileşene aktardım. `Kard.vue`, bu diziyi `v-for` ile dönerek renkli etiketlere dönüştürdü.

Burada hoşuma giden fikir, kart üzerindeki istatistiklerin sabit bir HTML bloğuna dönüşmemesiydi. Her istatistiğin metni ve rengi veriden geliyordu. Kartın sunumunu değiştirmeden bu veriyi düzenleyebiliyordum.

## Görünüm ayrı kontrollerden oluşmalı

Kartın diğer özellikleri için de benzer bir yaklaşım kullandım.

`Parchment.vue` açıklama metnini düzenliyordu. Bir `textarea` üzerinden değişen değer izleniyor ve kartın açıklamasına aktarılıyordu.

`Image.vue` görsel alanının iç boşluğunu ve kenar yuvarlaklığını iki ayrı aralık kontrolüyle değiştiriyordu. Bu denemede kart görseli kullanıcı tarafından yüklenmiyordu; `Kard.vue` içinde örnek bir görsel URL'si vardı. Dolayısıyla burada çözdüğüm problem görsel yükleme değil, **görsel alanının sunumunu değiştirmekti**.

`KardBackground.vue` ise iki farklı renk seçici kullanıyordu. Üst ve alt renkler seçildiğinde bunlardan CSS `linear-gradient` değeri oluşturuluyor, kartın arka planına uygulanıyordu. Tek renk yerine geçişli arka plan kullanmak, basit bir kartı bile daha fazla özelleştirilebilir hale getirdi.

Bu kontrollerin ortak yanı, düzenledikleri değerin kartın geri kalanından bağımsız olmasıydı. Arka plan rengini değiştirmek istatistiklerin içeriğini, açıklama metnini değiştirmek sembol sayısını etkilememeliydi.

## Kart üzerindeki küçük semboller: Bean

`Bean.vue`, kartın üzerinde küçük simgeleri tekrarlamak için oluşturduğum bileşendi. Kodda bu simgeleri *bean* olarak adlandırdım.

Bir aralık kontrolüyle simge sayısı **1 ile 10** arasında seçilebiliyordu. Ayrıca bir emoji listesi, arka plan rengi ve şeffaflık seçeneği ekledim.

Kart tarafında ise seçilen sayı kadar rozet oluşturuyordum:

```vue
<span
  v-for="n in parseInt(beanValue)"
  :key="n"
  class="badge rounded-pill bean"
  v-bind:style="[beanColourStyle]"
  v-html="beanEmoji"
></span>
```

Bu küçük özellik, tekrar eden görsel öğeler için aynı HTML'i elle çoğaltmamayı sağladı. Tek bir simgenin görsel biçimi sabit kalırken kullanıcı yalnızca kaç tane gösterileceğini, rengini ve içeriğini belirliyordu.

Prototipte emoji içeriğini `v-html` ile yerleştirdim. Kapalı bir emoji listesinde işe yarayan bu yaklaşım, dışarıdan serbest HTML kabul eden bir tasarıma dönüştürülecekse ayrıca ele alınmalıydı. Çünkü içerik ve HTML ayrımını korumak güvenlik açısından önemli.

## Vue ile bileşenler arası iletişimi denemek

Kaardz'de merkezi bir store kütüphanesi kullanmadım. Bu ölçek için Vue'nun prop ve event mekanizmasını yeterli gördüm.

Bunun bana öğrettiği şey, bileşenlere ayırmanın yalnızca dosyaları küçültmek olmadığıydı. **Verinin hangi yönde hareket edeceğini belirlemek de mimarinin bir parçasıydı.**

Düzenleyici bileşenler değişiklik üretiyor, `App.vue` ortak kart durumunu tutuyor, `Kard.vue` ise bu durumu sunuyordu. Akışın tek yönde kalması, yeni bir kontrol eklediğimde mevcut editörleri değiştirmeden ilerlememi kolaylaştırdı.

Elbette bu yapının bazı sınırları vardı. Her alt bileşenin farklı parametrelerle event göndermesi, ana bileşende çok sayıda ayrı işleyici oluşturuyordu. Daha büyük bir editörde bütün değişikliklerin ortak bir kart şeması üzerinden yönetilmesi, sıfırlama ve geri alma gibi işlemleri de kolaylaştırabilirdi.

## Kartı bir görsele dönüştürmek

Kartı ekranda düzenlemek yeterli değildi; ortaya çıkan sonucu tarayıcı dışında kullanılabilecek bir görsel haline getirme fikrini de denedim.

Bunun için `html2canvas` ekledim. `index.html` içindeki deneme, `.kard-section` sınıfına sahip kart alanını seçerek DOM görüntüsünden bir canvas oluşturuyor ve ortaya çıkan canvas'ı sayfaya ekliyordu.

```js
html2canvas(document.querySelector('.kard-section'), {
  logging: true,
  allowTaint: false,
  useCORS: true
}).then((canvas) => {
  document.body.appendChild(canvas);
});
```

Bu, gerçek anlamda bir **PNG indirme akışı** değil; kartın tarayıcıdaki görünümünü canvas yüzeyine taşıma denemesiydi. Üstelik dış kaynaktan kullanılan örnek görsel, tarayıcının CORS kurallarına bağlı olarak çıktıda sorun çıkarabilirdi.

Vue tarafında ayrıca bir `print()` metodu yazmıştım. Ancak son kodda bu metodun kullandığı `printMe` referansı ve `$html2canvas` bağlantısı tamamlanmış değildi. Bu yüzden proje sonunda doğrulayabildiğim çıktı yaklaşımı, sayfadaki bağımsız `html2canvas` deneyiydi.

Bu aşama bile önemliydi: **Düzenlenebilir bir arayüzü, üretilebilir bir görsele dönüştürmek** kart editörünün doğal bir sonraki adımıydı.

## Ortaya çıkan çalışma

Nisan 2022 boyunca Kaardz'ı küçük adımlarla geliştirdim. Önce görsel biçim ve sembol denemeleri yaptım, sonra kart istatistiklerini ekledim. İstatistiklerin adını, değerini ve rengini düzenlemeyi sağladım. Ardından bileşenleri ayırıp `Kard.vue` içinde ortak bir önizleme oluşturdum. Son olarak `html2canvas` üzerinden görsel çıktı fikrini denedim.

Ortaya çıkan şey tamamlanmış bir **kart özelleştirme prototipi** oldu. Kullanıcının kart metnini, istatistiklerini, renklerini ve sembollerini değiştirmesine yönelik bir arayüz ve bunları tek bir görsel kartta birleştiren bir yapı kurdum.

Bu projedeki en değerli deneyimim ise kart tasarlamaktan çok, **birden fazla bağımsız kontrolün tek bir görsel bileşeni nasıl yönettiğini** görmekti. Vue'daki prop'lar, olaylar ve merkezi durum yaklaşımı küçük bir araç üzerinden somut hale geldi.

## Devam etseydim neleri geliştirirdim?

İlk prototipten sonraki adımlar oldukça belirgindi: kullanıcı görseli yükleme; tamamlanmış, indirilebilir PNG çıktısı; kart tasarımlarını JSON olarak kaydetme ve geri yükleme; özelleştirilebilir istatistik sayısı; geri al/ileri al; hazır tema şablonları ve kart boyutlarının seçilebilmesi.

Teknik tarafta ise tüm kart özelliklerini tipleri belli tek bir veri modelinde toplamak, editör olaylarını standartlaştırmak, dış HTML kullanımını ortadan kaldırmak ve canvas çıktısındaki CORS sorunlarını güvenilir biçimde çözmek isterdim.

Kaardz, küçük bir fikirden başlayıp **bileşen sınırları, veri akışı ve görselleştirme** üzerine düşündüğüm bir frontend deneyi olarak yerini aldı.
