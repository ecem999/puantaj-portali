# DS Smith & Sardunya Puantaj Yönetim Portalı

Bu web uygulaması, DS Smith ve Sardunya Catering aylık yemek sayılarını otomatik olarak `son.xlsx` ana dosyasıyla birleştiren, eksik günleri güncelleyen ve tek tıkla en son halini indirmenizi sağlayan güvenli portaldır.

---

## 🚀 Giriş Bilgileri

* **Kullanıcı Adı:** `hüseyin`
* **Şifre:** `hüseyin123`

---

## 📂 Dosya Yapısı

* `index.html`: Web arayüzü (TailwindCSS, Lucide Icons, modern ve duyarlı tasarım).
* `app.js`: Excel yükleme, tarih eşleme, otomatik veri aktarımı ve IndexedDB veritabanı mantığı.
* `base_excel.js`: Başlangıçtaki güncel `son.xlsx` dosyasının gömülü tabanı.
* `son.xlsx`: Ocak - Ekim arası oluşturulmuş ana puantaj Excel dosyası.

---

## 🌐 GitHub'a Yükleme ve GitHub Pages ile Yayınlama (Adım Adım)

1. **GitHub'da Yeni Repo Açın:**
   * [github.com](https://github.com) adresine gidin.
   * **New repository** butonuna tıklayın (örn: `puantaj-portali`).
   * Repository'i **Public** olarak seçin.

2. **Dosyaları Yükleyin:**
   * Bu klasördeki dosyaları (`index.html`, `app.js`, `base_excel.js`, `son.xlsx`, `README.md`) reponuza yükleyin (`git push` veya GitHub arayüzünden *Upload files*).

3. **GitHub Pages'i Açın:**
   * Reponuzun üst menüsünden **Settings** (Ayarlar) sekmesine tıklayın.
   * Sol menüden **Pages** bölümüne gelin.
   * **Build and deployment > Branch** kısmından `main` (veya `master`) dalını ve `/ (root)` klasörünü seçip **Save** butonuna tıklayın.

4. **Kullanmaya Başlayın:**
   * 1-2 dakika sonra sayfanın üstünde size özel link belirecektir:
     `https://<kullanici-adiniz>.github.io/<repo-adiniz>/`
   * Bu linke tıklayarak cep telefonunuzdan, tabletinizden veya bilgisayarınızdan doğrudan girebilirsiniz!

---

## 💡 Nasıl Kullanılır?

1. `hüseyin` / `hüseyin123` bilgileriyle giriş yapın.
2. Karşınıza 10 ayın (Ocak – Ekim) mevcut doluluk durumu çıkar.
3. Elinize eksik günlere ait yeni bir mail dosyası (örn. Haziran sonu, Temmuz sonu veya Ekim sonu Excel'i) ulaştığında, o dosyayı **"Yeni Mail Dosyası Yükle"** alanına sürükleyin.
4. Sistem tarihleri otomatik olarak tespit edip `son.xlsx` içine işler ve tüm formülleri günceller.
5. **"Güncel Dosyayı İndir (son.xlsx)"** butonuna basarak dosyanın en son halini indirin.
