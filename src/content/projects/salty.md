---
title: 'Salty - Yeni Projeler İçin Bir Design System Geliştirmek'
description: 'Yeni projelerde ortak bir arayüz dili oluşturmak için Lit, TypeScript, Web Components ve tasarım token’larıyla geliştirdiğim design system prototipi.'
summary: 'Merkezi tasarım token’ları, framework bağımsız Web Components bileşenleri, Sass ile üretilen renk ve boyut varyantları ve Storybook örnekleriyle yeni projeler için ortak bir arayüz temeli.'
startDate: 2023-10-20
cover: './salty.svg'
coverAlt: 'Salty proje kapağı: kırmızı çerçeve içinde kart, metin alanı, onay kutusu ve buton gibi arayüz bileşenleri'
stack: ['Lit', 'TypeScript', 'Web Components', 'Sass', 'Storybook', 'esbuild']
role: 'Kişisel proje'
featured: true
order: 7
---

Yeni bir projeye başladığımızda arayüzü oluşturan parçalar çoğunlukla birbirine benziyor: butonlar, metin alanları, seçim kutuları, durum etiketleri, ilerleme çubukları… Ancak bunların her projede aynı şekilde geliştirileceğinin bir garantisi yok.

Bir projede butonun boyutları biraz farklı oluyor. Başka bir projede aynı durum için farklı bir renk kullanılıyor. Bir form elemanının devre dışı görünümü tasarlanmışken diğerinde bu durum unutulabiliyor. Küçük kararlar birikince aynı ekip tarafından geliştirilen uygulamalar bile birbirinden farklı hissettirmeye başlıyor.

2023 yılında, önümüzdeki yeni projeler için ortak bir arayüz altyapısını nasıl kurabileceğimizi denemek istedim. Bunun için **Salty** adında ayrı bir proje oluşturdum.

Salty'yi mevcut uygulamaların arayüzlerini bir gecede değiştirecek bir sistem olarak düşünmedim. Amacım, gelecekteki projelerde kullanabileceğimiz **ortak tasarım kararlarının ve yeniden kullanılabilir bileşenlerin teknik temelini** geliştirmekti. Başka bir deyişle bu, belirli bir uygulamaya ait olmayan, tamamladığım bir *design system proof of concept* çalışmasıydı.

Bu yazıda Salty'yi hangi ihtiyaçla geliştirdiğimi, neden Lit ve Web Components kullandığımı ve tasarım kararlarını kod seviyesinde nasıl bir araya getirdiğimi anlatacağım.

## Design System ile Bileşen Kütüphanesi Arasındaki Fark

İlk bakışta böyle bir projeyi birkaç ortak bileşeni bir araya toplamak gibi görmek kolay. Ancak benim çözmek istediğim problem biraz daha genişti.

Bir butonun nasıl görüneceği yalnızca kendi CSS dosyasına bağlı olmamalı. Renkler, yazı boyutları, boşluklar ve kenar yuvarlaklıkları ortak kurallara dayanmalı. Aynı görsel karar farklı bileşenlerde tekrar kullanıldığında birbirinden farklı sonuçlar üretmemeli.

Bu nedenle işe yalnızca bileşen yazarak başlamadım. Tasarımda tekrar eden değerleri merkezi hale getirdim:

- Birden fazla ton içeren renk paletleri
- Tipografi boyutları ve kalınlıkları
- Boşluk ölçeği
- Kenar yuvarlaklıkları
- Etkileşim durumları için ortak yaklaşım

Bileşenler bu kararların somut uygulamaları oldu. Böylece Salty'nin bir tarafında **tasarımın dili**, diğer tarafında bu dili kullanan **arayüz elemanları** yer aldı.

## Neden Lit ve Web Components?

Yeni projelerin tamamının aynı JavaScript framework'ünü kullanacağını varsaymak istemedim.

React ile geliştirilen bir uygulamanın yanında farklı teknoloji kullanan bir başka uygulama da olabilir. Ortak bir arayüz altyapısı geliştireceksek, bunu mümkün olduğunca tek bir framework'e bağımlı hale getirmemek benim için önemliydi.

Bu nedenle tarayıcının **Custom Elements** ve **Shadow DOM** gibi özelliklerini temel alan Web Components yaklaşımını seçtim. Bileşenleri geliştirmek için de **Lit** kullandım.

Lit'in sunduğu deklaratif şablon yapısı, özelliklerin yönetilmesi ve güncellemelerin uygulanması, bu denemeyi doğrudan Web Components API'leriyle sıfırdan yazmaya göre kolaylaştırdı.

Örneğin bir buton, kullanıldığı sayfada sıradan bir HTML elemanı gibi görünebiliyor:

```html
<salty-button variant="primary" color="blue" size="medium">
  Kaydet
</salty-button>
```

Bu kullanımda tüketici tarafının bileşenin içeride Lit ile yazıldığını bilmesine gerek yok. Dışarıdan anlaşılması gereken sözleşme; elemanın adı, özellikleri ve desteklediği davranışlar.

Bileşen stillerini Shadow DOM içerisinde tanımlayarak uygulamanın genel CSS kurallarıyla oluşabilecek çakışmaları da azaltabiliyorum. Ancak bunun doğal bir karşılığı var: Dışarıdan yönetilmesi gereken tasarım değerlerinin bileşenlere aktarılacağı açık bir yol tanımlamak gerekiyor. Tasarım token'ları burada da devreye giriyor.

## Tasarım Kararlarını Token'lara Taşımak

Salty'de renkleri tek tek bileşenlerin içine yazmak yerine merkezi CSS değişkenleri tanımladım. Aynı yaklaşımı yazı boyutları, boşluklar ve kenar yuvarlaklıkları için de kullandım.

Örneğin tasarım sistemindeki bazı değerler şöyle tanımlanıyor:

```css
:root {
  --st-color-blue-500: #2563EB;
  --st-color-blue-700: #0D3690;

  --st-font-size-m: 0.875rem;
  --st-spacing-m: 1rem;
  --st-border-radius-m: 0.25rem;
}
```

Burada amaç yalnızca CSS dosyalarını daha okunabilir hale getirmek değil. Bir değerin neyi temsil ettiğini de tanımlamak.

Örneğin bir bileşenin iç boşluğunun `16px` olması yerine bir spacing token'ına bağlı olması, farklı bileşenleri aynı ölçü sistemi içerisinde tutuyor. Bir renk paletinin açık, ana ve koyu tonlarının bulunması da normal, hover ve disabled durumları arasında tutarlılık kurmayı kolaylaştırıyor.

Bu tasarım kararlarını bileşenlerin stillerinde `var(...)` ile kullanıyorum. Böylece görünümle ilgili önemli değerler bileşenin TypeScript koduna taşınmadan yönetilebiliyor.

## İlk Bileşen Olarak Buton

Salty'nin ilk ciddi bileşeni butondu. Bunun iyi bir başlangıç olduğunu düşündüm çünkü küçük görünmesine rağmen birçok kombinasyonu var.

Bir butonun yalnızca rengi değişmiyor. Boyutu, görsel önceliği, üzerine gelindiğindeki davranışı ve devre dışı durumu da değişebiliyor.

Bu nedenle butonu üç görsel varyantla tasarladım:

- **Primary:** Ana eylemin öne çıktığı dolu buton
- **Secondary:** Kenarlıklı, daha düşük görsel ağırlığa sahip buton
- **Tertiary:** Minimum görsel ağırlıkla sunulan eylem

Bunlara küçük, orta ve büyük boyutları; farklı renk seçeneklerini ve disabled durumunu ekledim.

Bu özellikleri bileşenin dışarıdan aldığı parametreler olarak tanımladım:

```ts
@property({ type: String, reflect: true })
size?: string = 'medium';

@property({ type: String, reflect: true })
color?: string = 'blue';

@property({ type: String, reflect: true })
variant?: string = 'primary';

@property({ type: Boolean, reflect: true })
disabled = false;
```

`reflect: true` kullanımı önemli. Böylece TypeScript tarafındaki özellikler HTML attribute'larına da yansıyor. CSS içerisinde `:host([size='small'])` veya `:host([color='red'])` gibi seçicilerle bileşenin görünümünü düzenleyebiliyorum.

Bunun sonucunda her renk ve boyut kombinasyonu için ayrı bir buton sınıfı yazmam gerekmiyor. Tek bir bileşen, tanımladığım seçenekler üzerinden farklı görünümler üretebiliyor.

### Sass ile tekrarları azaltmak

Renk seçenekleri arttığında her bir durumun CSS'ini elle yazmanın doğru olmadığını gördüm. Örneğin primary butonun normal ve hover renkleri, farklı renk paletlerinde benzer kuralları izliyor.

Bu tekrarları **Sass** döngüleriyle oluşturdum.

```scss
$color-list: 'blue', 'purple', 'red', 'orange',
             'yellow', 'green', 'teal', 'gray', 'black';

@each $value in $color-list {
  :host([color="#{$value}"]) .button.primary {
    background-color: var(--st-color-#{$value}-500);
    border-color: var(--st-color-#{$value}-500);

    &:hover {
      background-color: var(--st-color-#{$value}-700);
    }
  }
}
```

Bu örnek, gerçek SCSS yaklaşımının kısaltılmış bir parçası. Böylece aynı kuralı dokuz farklı renk için elle tekrar etmek yerine tek yerde tanımlayabiliyorum. Yeni bir renk eklemek istediğimde de mevcut kuralları yeniden yazmak gerekmiyor.

## Bileşen Kütüphanesini Genişletmek

Butondaki yaklaşımı netleştirdikten sonra diğer temel arayüz elemanlarına geçtim. Input, badge, checkbox, radio, switch, text, icon ve progress bileşenlerini de geliştirdim.

Her bileşenin farklı bir problemi vardı.

Input için normal, valid, invalid ve disabled gibi durumları göstermek önemliydi. Checkbox ve radio için seçili ve seçili olmayan durumların, devre dışı kullanımlarla birlikte ele alınması gerekiyordu. Switch için metin etiketiyle kontrolün aynı parça olarak kullanılmasını; progress içinse değer, boyut ve renk özelliklerini bir araya getirmeyi denedim.

Bileşenleri ayrı klasörlerde tutarak TypeScript ile görünüm stilini de birbirinden ayırdım. Ortak dışa aktarım dosyasında topladığım bileşenler, projeyi kullanan taraf için tek bir giriş noktası oluşturdu.

Bu noktada önemli bir karar daha verdim: Bileşenlerin içine mümkün olduğunca ürünlere özgü kurallar yerleştirmemek.

Örneğin bir input alanının e-posta mı, ürün adı mı, yoksa arama metni mi aldığı Salty'nin konusu değil. Salty'nin sorumluluğu, o alanın arayüz davranışını ve görünüm sözleşmesini sunmak.

Bu sınır, bileşenleri başka projelerde yeniden kullanabilmek açısından önemliydi.

## Bileşeni Yazmak Yetmiyor, Görmek de Gerekiyor

Bileşen geliştirme sırasında karşılaştığım başka bir problem de kombinasyonların sayısıydı. Bir butonun tek bir örneğinin doğru görünmesi, bütün renk ve boyut seçeneklerinin doğru olduğu anlamına gelmiyor.

Bu nedenle proje içerisinde geniş bir deneme sayfası oluşturdum. Bileşenlerin farklı boyutlarını, renklerini, seçili ve disabled durumlarını yan yana görebiliyordum.

Daha sonra **Storybook** ekleyerek bu yaklaşımı daha düzenli hale getirdim. İlk Storybook çalışmasını buton üzerinden yaptım: varyantları, boyutları ve renkleri ayrı örneklerde gösterebildim. Bileşenin seçeneklerini kontrol etmeye uygun bir arayüz elde ettim.

Bu, Salty'nin tüm bileşenleri için eksiksiz bir dokümantasyon portalı oluşturduğum anlamına gelmiyor. Ancak yalnızca kaynak koda bakarak geliştirmek yerine, **bileşenleri görünür ve karşılaştırılabilir hale getiren** bir çalışma ortamı kurmuş oldum.

## Geliştirme Araçlarını da Ortaklaştırmak

Bir design system üzerinde çalışırken yalnızca bileşenleri düzenlemek yeterli değil. Yeni bir bileşenin hangi dosyalarla başlayacağı ve nasıl derleneceği de tekrarlanan bir süreç.

Bu nedenle küçük bir bileşen oluşturma script'i yazdım. Yeni bileşenin klasörünü, TypeScript dosyasını ve stil dosyasını hazırlayan; ayrıca ortak export dosyasına ekleme yapan bir başlangıç yapısı oluşturdum.

Derleme tarafında TypeScript ve Sass kullanırken, CSS'in Lit bileşenlerine aktarılması ve tarayıcıda denenebilmesi için **esbuild** tabanlı bir akış oluşturdum. `dev` alanı, hazırladığım bileşenleri farklı kombinasyonlarda açıp kontrol edebildiğim yer haline geldi.

Bu çalışmaların sonucunda Salty yalnızca bir bileşen klasörü olmaktan çıktı. Yeni bileşen geliştirmenin ve mevcut bileşenleri karşılaştırmanın da belirli bir yolu oluştu.

## Çalışmanın Sonunda

Temmuz 2023'te başladığım çalışmayı Ekim ayında progress bileşeni ve renk düzenlemeleriyle tamamladığımda elimde şu parçalar vardı: merkezi tasarım token'ları, temel Web Components bileşenleri, renk/boyut/varyant sistemleri, Sass üzerinden stil üretimi, tarayıcıda çalışan bir geliştirme vitrini ve buton için Storybook örnekleri.

Böylece ilk hedeflediğim şeyi gerçekleştirmiş oldum: **Yeni projelerde ortak arayüz bileşenleri geliştirmek için kullanılabilecek teknik bir temel oluşturmak.**

Burada kapsamı doğru tarif etmek önemli. Salty'yi bütün projelere dağıtılmış, sürümlenmiş ve üretim ortamında kullanılmaya başlanmış bir kurumsal paket olarak tamamlamadım. Çalışmanın tamamlanan kısmı, bu yaklaşımın teknolojilerini, bileşen sözleşmelerini ve geliştirme akışını somut olarak deneyebildiğim prototipti.

Bundan sonraki aşamada bu yapıyı gerçek projelerde kullanmak isteseydik otomatik test kapsamını artırmamız, klavye erişilebilirliğini ve form elemanlarının olay/özellik senkronizasyonunu daha ayrıntılı ele almamız, paketleme ve sürüm yönetimini netleştirmemiz gerekecekti. Dokümantasyonun tamamlanması da ayrı bir iş olurdu.

## Sonuç

Salty üzerinde çalışırken asıl öğrendiğim şey, design system geliştirmenin tek tek güzel bileşenler tasarlamaktan ibaret olmadığıydı.

Bir butonun rengini belirlemek kolay. Aynı kararın bütün buton varyantlarında, farklı boyutlarda, etkileşim durumlarında ve başka bileşenlerde tutarlı çalışmasını sağlamak daha zor.

Bir checkbox geliştirmek de mümkün. Ama onu başka bir proje kullandığında neye güvenebileceğini tanımlamak, ayrı bir mühendislik problemi.

Bu çalışma sayesinde tasarım kararlarını token'larla temsil etmeyi, bileşenlerin dışarıya sunduğu API'leri düşünmeyi ve framework bağımlılığını azaltan bir yapı kurmayı deneyimledim.

**Salty'nin çıktısı yalnızca bir dizi arayüz bileşeni değil, yeni projelere başlamadan önce ortak bir dil oluşturmanın neden önemli olduğunu gösteren tamamlanmış bir teknik çalışmaydı.**
