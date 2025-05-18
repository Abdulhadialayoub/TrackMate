# 🚀 TrackMate.API

## 📌 Proje Hakkında

**TrackMate.API**, işletmeler için geliştirilmiş kapsamlı bir **sipariş takip**, **müşteri yönetimi** ve **fatura oluşturma** sistemidir. Bu API, modern ve güvenli bir **.NET 8** altyapısı kullanılarak geliştirilmiştir.

---

## 🧰 Teknoloji Yığını

- 🖥 **Framework**: ASP.NET Core 8.0  
- 🗄 **Veritabanı**: SQL Server  
- 🔄 **ORM**: Entity Framework Core  
- 📚 **API Dokümantasyonu**: Swagger  
- 🔐 **Kimlik Doğrulama**: JWT (JSON Web Tokens)  
- ✅ **Veri Doğrulama**: FluentValidation  
- 📄 **PDF Oluşturma**: QuestPDF  
- 🔧 **Nesne Eşleştirme**: Mapster  
- 📊 **Excel İşlemleri**: ClosedXML  
- 🧠 **AI Entegrasyonu**: Google AI (Gemini) 

---

## ⚙️ Kurulum ve Çalıştırma

### 📝 Gereksinimler

- .NET 8.0 SDK veya üzeri  
- SQL Server (Local veya Express)  
- Visual Studio 2022 veya JetBrains Rider  

### 🪜 Adımlar

1. 📥 Projeyi klonlayın  
2. 🔧 `appsettings.json` dosyasındaki veritabanı bağlantı dizesini kendi SQL Server kurulumunuza göre düzenleyin  
3. 🧱 Aşağıdaki komutları çalıştırın:
   ```bash
   Update-Database
   ```

4. ▶️ Projeyi başlatın:
   ```bash
   dotnet run
   ```
5. 🌐 Swagger arayüzüne erişmek için:
   `https://localhost:5001/swagger`

---

## 🗂 Proje Yapısı

* 📁 **Controllers**: API endpoint'leri
* 🧱 **Models**: Veri modelleri (Entities ve DTOs)
* 🧠 **Services**: İş mantığı
* 📦 **Repositories**: Veritabanı erişimi
* 💾 **Data**: DbContext & konfigürasyon
* 🧩 **Extensions**: Başlangıç ayarları
* 🧱 **Middleware**: Özel middleware'ler
* ✅ **Validators**: Veri doğrulama sınıfları
* 🔐 **Security**: Kimlik doğrulama & yetkilendirme
* 🛠 **Helpers**: Yardımcı sınıflar
* 🧰 **Tools**: Araçlar

---

## 🌐 API Endpoint'leri

### 🔐 Kimlik Doğrulama

* `POST /api/auth/login` – Giriş yap
* `POST /api/auth/register` – Kayıt ol
* `POST /api/auth/refresh-token` – Token yenile

### 📦 Siparişler

* `GET /api/orders` – Tüm siparişler
* `GET /api/orders/{id}` – Sipariş detay
* `POST /api/orders` – Yeni sipariş
* `PUT /api/orders/{id}` – Sipariş güncelle
* `DELETE /api/orders/{id}` – Siparişi sil

### 👥 Müşteriler

* `GET /api/customers` – Tüm müşteriler
* `GET /api/customers/{id}` – Müşteri detay
* `POST /api/customers` – Yeni müşteri
* `PUT /api/customers/{id}` – Müşteri güncelle
* `DELETE /api/customers/{id}` – Müşteriyi sil

### 🛒 Ürünler

* `GET /api/products` – Tüm ürünler
* `GET /api/products/{id}` – Ürün detay
* `POST /api/products` – Yeni ürün
* `PUT /api/products/{id}` – Ürün güncelle
* `DELETE /api/products/{id}` – Ürünü sil

### 🧾 Faturalar

* `GET /api/invoices` – Tüm faturalar
* `GET /api/invoices/{id}` – Fatura detay
* `POST /api/invoices` – Yeni fatura
* `GET /api/invoices/{id}/download` – Fatura PDF indir
* `POST /api/invoices/{id}/send` – Faturayı e-posta ile gönder

### ✉️ E-posta

* `POST /api/email/send` – E-posta gönder
* `GET /api/email/logs` – Gönderim geçmişi

### 🤖 AI Entegrasyonu

* `POST /api/ai/analyze-order` – Sipariş metinlerini analiz et
* `POST /api/ai/generate-response` – Otomatik müşteri yanıtı oluştur

### 📊 Dashboard

* `GET /api/dashboard/stats` – Genel istatistikler
* `GET /api/dashboard/revenue` – Gelir verisi
* `GET /api/dashboard/latest-orders` – Son siparişler

### 📈 Rapor ve Analiz

* `GET /api/reports/sales` – Satış raporu
* `GET /api/reports/customers` – Müşteri analizi
* `GET /api/reports/export` – Raporları dışa aktar

---

## 🛡 Güvenlik ve Kimlik Doğrulama

API, **JWT tabanlı** kimlik doğrulama kullanır.
🔑 `login` ve `register` dışındaki tüm endpoint'ler için token gereklidir.

İsteklerde şu şekilde kullanılmalıdır:

```
Authorization: Bearer {token}
```

---

## ❌ Hata Yönetimi

* Hatalar standart JSON formatında döner
* Kodlar ve mesajlar tutarlıdır
* Validation hataları detaylı geri bildirim içerir

---

## ⚙️ Konfigürasyon

`appsettings.json` ile yapılandırılabilir:

* 🗄 Veritabanı bağlantı bilgileri
* 🔐 JWT ayarları
* 📬 SMTP ayarları
* 🧠 AI servis konfigürasyonları
* 🌍 CORS politikaları
