---
title: 'BFZ Context Menu: Sağ Tık Menüsünü Kişisel Bir Geliştirici Aracına Dönüştürmek'
description: 'Chrome Extensions API ile seçili metinden hızlı bağlantılar oluşturduğum, sağ tık menüsüne geliştirme kısayolları eklediğim ve Manifest V3 mimarisini denediğim kişisel eklentinin hikâyesi.'
pubDate: 2023-01-27
lang: 'tr'
tags: ['javascript', 'browser-extensions', 'chrome', 'developer-tools', 'productivity']
draft: false
---

Bir gün içerisinde aynı işlemi onlarca kez tekrar ettiğimi fark ettiğimde genellikle önce bunun ne kadar küçük bir iş olduğunu düşünüyorum. Bir metni seçmek, kopyalamak, adres çubuğuna gitmek, bir URL'nin sonuna yapıştırmak ve Enter'a basmak... Her adım tek başına önemsiz. Ama aynı akış sürekli tekrarlanıyorsa, bu küçük adımların toplamı ciddi bir dikkat kaybına dönüşüyor.

2023 yılının Ocak ayında geliştirdiğim **BFZ Context Menu**, bu tür işlemleri tarayıcının zaten kullandığım bir alanına taşımak için yaptığım küçük bir Chrome eklentisiydi.

Amacım yeni bir yönetim paneli veya kapsamlı bir otomasyon platformu yapmak değildi. Tarayıcıda bir metin seçtiğimde ya da bağlantıya sağ tıkladığımda, o içerikle ilgili ihtiyaç duyduğum aksiyonların bir kısmı hemen karşımda olsundu.

Bu yazıda eklentinin ilk sürümünü nasıl kurduğumu, bağlam menüsünün çalışma şeklini, Manifest V3'e geçişi ve bu küçük projeden çıkardığım teknik dersleri anlatacağım.

## Problemi Yeni Bir Arayüz Ekleyerek Çözmemek

Bir tarayıcı eklentisi geliştirmek denildiğinde akla önce araç çubuğundaki ikon ve ona tıklayınca açılan bir popup gelebiliyor. Benim ihtiyacımda ise asıl veri zaten sayfanın üzerindeydi: seçtiğim metin veya üzerine geldiğim bağlantı.

Örneğin bir mağazayla ilgili tanımlayıcıyı sayfada gördüğümde bunu farklı bir ortamda açmak isteyebiliyordum. Normal akışta metni kopyalayıp ilgili adresi elle hazırlamak gerekiyordu. Bunun için ayrı bir popup tasarlamak, mevcut adıma bir tıklama daha eklemek anlamına gelecekti.

Tarayıcının **context menu** API'si burada daha doğal bir çözüm sundu. Seçili metne özel bir seçenek ekleyebilir ve kullanıcının hangi öğeye sağ tıkladığını Chrome'dan alabilirdim.

Kullanıcı etkileşimini olabildiğince kısa tutan akış şöyleydi:

```text
Sayfa üzerindeki metin
         │
         ▼
      Metni seç
         │
         ▼
     Sağ tık menüsü
         │
         ▼
   İlgili kısayolu seç
         │
         ▼
     Yeni sekme aç
```

Buradaki asıl kazanım yapılan işlemin karmaşıklığı değil, **işlemin doğru yerde başlatılmasıydı**.

## Chrome'un Bağlam Bilgisiyle Çalışmak

Chrome Extensions API'de menü öğelerini, hangi tür içerikte görüneceklerine göre tanımlayabiliyoruz. Projede özellikle iki bağlam kullandım:

- `selection`: Sayfada bir metin seçildiğinde.
- `link`: Bir bağlantının üzerinde sağ tıklandığında.

Bu ayrım önemliydi. Seçilen bir mağaza tanımlayıcısı ile bir bağlantının hedef URL'si aynı veri değildi ve farklı aksiyonlara ihtiyaç duyuyordu.

İlk aşamada kurduğum yapı, eklenti yüklendiğinde menü öğelerini kaydediyor; bir öğeye tıklandığında da ilgili aksiyonu çalıştırıyordu. Aşağıdaki örnek, kaynak koddaki temel yaklaşımın sadeleştirilmiş bir karşılığı:

```js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-store',
    title: 'Mağazayı aç',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'open-store' || !info.selectionText) {
    return;
  }

  const storeId = encodeURIComponent(info.selectionText.trim());
  chrome.tabs.create({
    url: `https://example.com/${storeId}`,
  });
});
```

*Not: Bu kod, yaklaşımı göstermek için sadeleştirilmiş ve anonimleştirilmiş bir örnek. Gerçek projede farklı geliştirme ortamlarına yönelik adresler kullanıyordum.*

`chrome.contextMenus.create()` ile menünün nerede görüneceğini belirlemek, `onClicked` ile seçimin sonucunu almak ve `chrome.tabs.create()` ile yeni bir sekme açmak, eklentinin esas çalışma modelini oluşturdu.

Böylece kullanıcının seçtiği metin, ayrı bir forma taşınmadan doğrudan işlemin girdisi olabiliyordu.

## Birden Fazla Geliştirme Ortamı İçin Kısayollar

Projenin pratik tarafı, aynı seçili metni farklı hedef adreslerle birleştirebilmesiydi.

Menüde mağaza sayfasını açmaya yönelik üç ayrı seçenek tanımladım. Bunlar farklı ortamları hedefliyordu: normal mağaza adresi, test ortamı ve yerel tema geliştirme ortamı.

Hepsinin ortak kısmı seçili metne erişmekti. Farklı olan yalnızca URL'nin nasıl oluşturulduğuydu. Bu yüzden karmaşık bir arayüz yerine ayrı menü kimlikleriyle dallanan, küçük bir JavaScript dosyası yeterli oldu.

```text
selectionText
     │
     ├── Normal ortam  ──► Sekme aç
     ├── Test ortamı   ──► Sekme aç
     └── Yerel ortam   ──► Sekme aç
```

Bu tasarımın gücü, iş akışına çok yakın olmasıydı. O sırada hangi ortamda kontrol yapacaksam yalnızca o seçeneğe tıklıyordum.

Aynı zamanda burada küçük bir teknik borç oluştu: Ortam adresleri JavaScript içinde sabit tutuluyordu. Proje büyüseydi bu adresleri konfigürasyondan okumak ve URL oluşturmayı tek bir fonksiyonda toplamak daha temiz olurdu. İlk sürümdeyse hedef, tekrarlanan adımları ortadan kaldıran en kısa yolu denemekti.

## Bağlantıya Sağ Tıklayınca Başka Bir Veri Geliyor

Seçili metin için `info.selectionText` kullandığım gibi, bağlantıya sağ tıklama senaryosunda da `info.linkUrl` verisinden yararlandım.

Bunlardan biri bağlantıyı gizli pencerede açmaya yönelikti. `chrome.windows.create()` metodunun `incognito` seçeneğini kullanarak ilgili URL'yi yeni bir pencerede açmayı denedim.

Diğer seçenek, Wikipedia bağlantıları üzerinde dönüşüm uygulamak için yazdığım bir denemeydi. Burada adresin içerisinde belirli bir metni arayıp URL üzerinde değişiklik yapıyordum. Bu bölümdeki string tabanlı URL dönüştürme yaklaşımı kırılgandı; daha güvenilir bir sürümde URL'nin parçalarını `URL` sınıfıyla ayrıştırmak gerekirdi.

Ayrıca bir menü öğesini hem `selection` hem de `link` bağlamına eklemek, her iki durumda da `linkUrl` geleceği anlamına gelmiyor. Dolayısıyla bağlantı bekleyen aksiyonlarda girdinin gerçekten mevcut olup olmadığını kontrol etmek önemliydi.

Küçük bir eklentide bile, **menünün görünür olduğu bağlamla komutun ihtiyaç duyduğu girdiyi eşleştirmek** gerektiğini bu ayrım açıkça gösteriyordu.

## Manifest V2'den Manifest V3'e Geçmek

İlk commit'te eklenti `manifest_version: 2` kullanıyordu. Arka plandaki işleyici de `background.scripts` altında tanımlanmıştı.

Ertesi gün yaptığım güncellemede Manifest V3'e geçtim, arka plan dosyasını `service_worker` olarak tanımladım ve 16, 48 ve 128 piksellik ikonları ekledim.

Sadeleştirilmiş yapı şöyle görünüyordu:

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "main.js"
  },
  "permissions": ["contextMenus", "activeTab"]
}
```

Bu küçük konfigürasyon değişikliği, aslında eklentinin çalışma ortamında önemli bir fark yaratıyordu.

Manifest V3'te arka plan kodu bir service worker içerisinde çalışıyor. Yani bunu normal bir web sayfasının JavaScript ortamıyla aynı kabul edemiyoruz. Örneğin `document` gibi DOM nesnelerine doğrudan erişim yok; eski `chrome.tabs.executeScript()` yaklaşımı da V3'ün `chrome.scripting` API'sine taşındı.

Burada yalnızca `manifest.json` dosyasını değiştirmek yetmiyordu. Eski deneysel komutları da yeni çalışma ortamının sınırlarına göre gözden geçirmek gerekiyordu.

Projenin son halindeki temel sekme açma kısayolları yeni manifest yapısına uygun API'leri kullanırken, bazı yardımcı denemelerde bu geçiş tamamlanmamıştı. Bu ayrım, eklentiyi geliştirirken aldığım önemli notlardan biri oldu.

## Çeviri Denemesi ve Sınırları

Seçili bir metni çevirmek için ayrıca bir menü seçeneği ekledim. Bu bölüm, projenin henüz deneysel kalan tarafıydı.

Kodda seçili metin alınıyor, fakat HTTP isteğine bu metin yerleştirilmiyordu; istek sabit bir örnekle hazırlanmıştı. Üstelik kullanılan `XMLHttpRequest` yaklaşımı, Manifest V3 service worker ortamıyla uyumlu değildi. Yanıtı sekme içerisinde çalıştırmak için denenen eski script yürütme API'si de aynı geçiş problemine takılıyordu.

Dolayısıyla bu özelliği tamamlanmış bir çeviri entegrasyonu olarak değerlendirmiyorum. Benim için burada daha önemli olan, bağlam menüsündeki aynı giriş noktasından farklı türde işlemler yapılabileceğini denemekti.

Gerçek bir çeviri özelliğine ilerlemek için ağ isteğini `fetch()` ile kurmak, gerekli izinleri tanımlamak, seçili metni güvenli biçimde taşımak ve sonucu kullanıcıya gösterecek ayrı bir deneyim tasarlamak gerekecekti.

## Küçük Bir Eklentinin Öğrettikleri

Projenin sonunda kapsamlı bir kullanıcı arayüzü veya genel amaçlı bir tarayıcı otomasyon sistemi elde etmedim. Ama kullanmak istediğim kısayolları tanımlayabildiğim, seçili metin ve bağlantı bağlamları üzerinden komut çalıştırma mantığını kurduğum, Manifest V3'e taşınmış küçük bir eklenti prototipi oluşturdum.

Bu çalışma bana birkaç şeyi tekrar hatırlattı.

Birincisi, otomasyonun değeri her zaman karmaşık olmasından gelmiyor. Bazen bir geliştirici aracının en iyi özelliği, sürekli tekrar ettiğiniz bir adımı ortadan kaldırması.

İkincisi, tarayıcının sunduğu mevcut etkileşim noktaları yeni arayüzler tasarlamadan da güçlü araçlara dönüşebiliyor. Kullanıcının işi sayfanın üzerinde başlıyorsa çözümü o bağlama yerleştirmek doğal geliyor.

Üçüncüsü, platform sürümü değiştiğinde yalnızca yapılandırmayı değil, çalışma ortamının varsayımlarını da yeniden değerlendirmek gerekiyor. Manifest V3'e geçişteki asıl mühendislik işi, `background.scripts` anahtarını `service_worker` yapmakla bitmiyor.

**BFZ Context Menu**, benim için küçük ama somut bir geliştirici deneyimi denemesiydi: sık kullanılan işlemleri tarayıcının sağ tık menüsünde bir araya getirerek günlük akışa daha az sürtünmeyle devam etmek.
