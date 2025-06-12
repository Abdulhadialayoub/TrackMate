# 🏢 TrackMate - İş Otomasyon Sistemi

## 🚀 Proje Amacı

- İş süreçlerini dijitalleştirerek verimliliği artırmak
- Birden fazla şirketin tek sistem üzerinden yönetimini sağlamak
- Güvenli ve yetkilendirilmiş bir kullanıcı yönetim sistemi oluşturmak
- Fatura ve belge işlemlerini kolaylaştırmak
- Merkezi admin paneli ile sistem yönetimini basitleştirmek

## 🎯 Hedef Kitle

TrackMate, küçük, orta ve büyük ölçekli işletmeler için geliştirilmiş bir iş otomasyon sistemidir. Özellikle:
- Holdingler
- Muhasebe departmanları
- Mobil ve web üzerinden operasyonları yönetmek isteyenler
- AI destekli karar mekanizması isteyen danışmanlar ve yöneticiler

---

## 💻 Web Uygulaması (Frontend Web)

TrackMate Web, React + Vite ile geliştirilmiştir.

### Teknoloji Yığını

- React 18
- Vite
- Material UI (MUI)
- Tailwind CSS
- React Router v6
- Axios
- Framer Motion
- ESLint
- JWT tabanlı kimlik doğrulama

### Kurulum

```bash
cd frontend-web
npm install
npm run dev
📍 http://localhost:5173

📱 Mobil Uygulama (Frontend Mobile)
React Native + Expo ile geliştirilmiştir. Mobil cihazdan çalıştırmak için QR kod ile Expo Go kullanılabilir.

Kurulum
bash
Copy
Edit
cd frontend-mobile
npm install
npx expo start
🔁 CORS sorunu için src/context.js içindeki API IP’si cihazla eşleştirilmelidir.

🧠 Yapay Zeka Özellikleri (Google Gemini API)
API Entegrasyonu
/api/ai/analyze-order – Tek sipariş analizi

/api/ai/analyze-orders – Toplu sipariş analizi

Teknik Altyapı
AIController

GoogleAIService

JWT ile güvenlik

Timeout ve hata yönetimi

Model: gemini-2.0-flash

🧱 Proje Yapısı
bash
Copy
Edit
TrackMate/
│── backend/              # ASP.NET API  
│── frontend-web/         # Web Arayüzü  
│── frontend-mobile/      # Mobil Arayüz  
│── docs/                 # Belgeler  
│── README.md             # Açıklama Dosyası
📦 Backend API (ASP.NET)
Çalıştırmak için:
bash
Copy
Edit
cd backend
dotnet restore
dotnet run
📍 http://localhost:5105

🌟 Özellikler
🌐 Çok şirketli mimari

📊 Dashboard ve istatistik panelleri

🧾 Fatura oluşturma ve PDF indirme

🔒 Rol tabanlı kullanıcı yetkilendirme

🤖 Yapay zeka destekli sipariş analizi

📧 Otomatik e-posta bildirimi

📱 Mobil ve responsive arayüz

📅 İş Takvimi
 Backend API

 Web Arayüzü

 Mobil Uygulama

 AI Entegrasyonu

📧 İletişim
Geliştirici: Abdulhadi ELEYYÜB
Danışmanlar: Öğr.Gör. Eyüp ERÖZ, Dr. Öğr. Üyesi Vahdettin Cem BAYDOĞAN
📩 abdulhadialayoub@gmail.com

🔗 Canlı Demo
🟢 TrackMate Web Uygulaması

yaml
Copy
Edit
