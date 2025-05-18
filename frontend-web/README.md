# 🌐 TrackMate Frontend Web

## 📌 Proje Hakkında

**TrackMate Frontend Web**, TrackMate iş yönetim sisteminin kullanıcı arayüzüdür. **React** ve **Material UI** kullanılarak geliştirilmiş bu modern web uygulaması, işletmelerin sipariş takibi, müşteri yönetimi, fatura oluşturma ve diğer önemli iş süreçlerini kolaylaştırmak için tasarlanmıştır.

---

## 🧰 Teknoloji Yığını

- 🔄 **Framework**: React 18
- 🏗️ **Build Tool**: Vite
- 🎨 **UI Kütüphanesi**: Material UI (MUI)
- 🖌️ **CSS Framework**: Tailwind CSS
- 🧭 **Routing**: React Router v6
- 🌐 **HTTP İstemcisi**: Axios
- ✨ **Animasyon**: Framer Motion
- 🧠 **AI Entegrasyonu**: Gradio Client
- 🧹 **Linting**: ESLint

---

## ⚙️ Kurulum ve Çalıştırma

### 📝 Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn
- Backend API'nin çalışır durumda olması

### 🪜 Adımlar

1. 📥 Projeyi klonlayın
2. 📦 Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. 🚀 Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
4. 🌐 Tarayıcınızda `http://localhost:5173` adresine gidin

### 🔨 Derleme

Projeyi production için derlemek:
```bash
npm run build
```

---

## 🗂️ Proje Yapısı

- 🖼️ **src/assets**: Statik kaynaklar (görseller, fontlar, vs.)
- 🧩 **src/components**: Yeniden kullanılabilir UI bileşenleri
  - 🔄 **src/components/common**: Ortak UI bileşenleri
  - 📐 **src/components/layout**: Sayfa düzeni bileşenleri
- 🔄 **src/context**: React context API ile durum yönetimi
- 📄 **src/pages**: Ana sayfa bileşenleri
- 🔌 **src/services**: API ile iletişim kuran servisler
- 🛠️ **src/utils**: Yardımcı fonksiyonlar ve araçlar

---

## ✨ Ana Özellikler

### 📊 Dashboard

- İş performansına genel bakış
- Satış, sipariş ve fatura istatistikleri
- Son etkinlikler ve bildirimler

### 📦 Sipariş Yönetimi

- Yeni sipariş oluşturma ve düzenleme
- Sipariş durumu takibi
- Sipariş analizi (AI destekli)
- Sipariş arama ve filtreleme

### 👥 Müşteri Yönetimi

- Müşteri bilgilerini kaydetme ve düzenleme
- Müşteri geçmişi görüntüleme
- İletişim kaydı tutma

### 🛒 Ürün ve Kategori Yönetimi

- Ürün kataloğu oluşturma
- Kategorileri yönetme
- Stok takibi

### 🧾 Fatura İşlemleri

- Siparişlerden otomatik fatura oluşturma
- PDF fatura indirme
- E-posta ile fatura gönderme

### 💬 Mesajlaşma ve İletişim

- Müşteri mesajlaşma sistemi
- Otomatik mesaj yanıtlama (AI destekli)
- İletişim geçmişi

### 👤 Kullanıcı Yönetimi

- Kullanıcı profili ve ayarları
- Rol tabanlı erişim kontrolü
- Kullanıcı yetkilendirme

### ⚙️ Ayarlar ve Konfigürasyon

- Şirket bilgileri yapılandırma
- E-posta şablonları
- Sistem ayarları

---

## 🔄 API Entegrasyonu

Frontend, `/src/services/api.js` aracılığıyla TrackMate.API ile iletişim kurar. Tüm API istekleri, JWT token kimlik doğrulaması kullanılarak güvenli bir şekilde yapılır.

---

## 🔐 Rol Tabanlı Erişim

Uygulama, farklı kullanıcı rolleri için özelleştirilmiş erişim sağlar:

- 👑 **Admin**: Tam sistem erişimi
- 🧑‍💼 **Manager**: İş süreçleri ve kullanıcı yönetimi
- 👤 **User**: Temel operasyonlar
- 👁️ **Viewer**: Salt görüntüleme erişimi
- 🧑‍💻 **Dev**: Geliştirici özellikleri

---

## 🎨 Theme ve Tasarım

Uygulama, özelleştirilmiş bir Material UI teması kullanır:

- Modern ve temiz UI tasarımı
- Duyarlı (responsive) tasarım
- 🌙 Koyu mod desteği
- 🎭 Özelleştirilebilir renk paleti

---

## 👨‍💻 Geliştirme ve Katkıda Bulunma

1. Projeyi forklayın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun
