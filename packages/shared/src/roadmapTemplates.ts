export interface RoadmapTemplateNode {
  title: string;
  children?: RoadmapTemplateNode[];
}

// Madde 9 (roadmap.sh keşif eki, piyasa araştırması — WebFetch, roadmap.sh
// ana sayfa + /frontend + /frontend/projects) — gerçek proje fikri
// kartlarının format: zorluk + kategori etiketi + kısa başlık + tek
// cümlelik açıklama. İçerik roadmap.sh'ten KOPYALANMADI, kendi yazıldı.
export interface RoadmapProjectIdea {
  title: string;
  difficulty: "Başlangıç" | "Orta" | "İleri";
  category: string;
  description: string;
}

export interface RoadmapTemplate {
  key: string;
  name: string;
  // roadmap.sh'in gerçek 2 katmanlı ayrımı (rol-bazlı kariyer yolları vs.
  // beceri-bazlı konu haritaları) + üçüncü katman olarak proje fikirleri
  // (aşağıdaki projectIdeas). Şu an 4 şablonun 4'ü de rol-bazlı — beceri-
  // bazlı bir şablon eklendiğinde "skill" değeri kullanılabilir.
  category: "role" | "skill";
  // "New" rozeti için — bkz. RoadmapTemplatePicker.tsx (30 günden yeni ise
  // gösteriliyor, roadmap.sh'teki gibi statik bir liste değil, tarihe göre
  // otomatik hesaplanıyor).
  addedDate: string;
  projectIdeas?: RoadmapProjectIdea[];
  nodes: RoadmapTemplateNode[];
}

// roadmap.sh'teki (piyasa araştırması) "dallanan yol haritası" fikrinden
// ilham alan, kendi yazdığımız düğüm ağaçları — roadmap.sh'in kodu/
// içeriği birebir kopyalanmadı, endüstri genelinde bilinen standart konu
// başlıkları kullanıldı.
//
// 2026-08-26: kullanıcının roadmap.sh'in gerçek yapısına dayanarak verdiği
// çok daha detaylı 4 hiyerarşiyle (Frontend 20, Backend 20, Mobil 18,
// DevOps 18 ana başlık) eski, basit ~11-12 ana başlıklı sürümlerin yerine
// güncellendi — sadece İÇERİK değişti, `RoadmapTemplateNode` tipi (title +
// children, tek seviye alt dal) ve `materializeRoadmapTemplate`/
// `flattenTemplateNodes` (packages/shared/src/supabase/roadmaps.ts)
// hiç dokunulmadan aynı kaldı, zaten bu şekli destekliyordu. Bazı ana/alt
// başlıklardaki uzun parantez içi marka listeleri, düğüm kutucuklarının
// tek satırda (whitespace-nowrap, saracak şekilde tasarlanmamış) taşmaması
// için kısaltıldı — anlam korunarak.
export const FRONTEND_ROADMAP_TEMPLATE: RoadmapTemplate = {
  key: "frontend",
  name: "Frontend Geliştirme",
  category: "role",
  addedDate: "2026-08-26",
  projectIdeas: [
    {
      title: "Quiz Uygulaması",
      difficulty: "Başlangıç",
      category: "JavaScript",
      description: "Kullanıcının cevapladığı çoktan seçmeli bir bilgi yarışması, sonunda puan gösteren.",
    },
    {
      title: "Hava Durumu Paneli",
      difficulty: "Orta",
      category: "API",
      description: "Girilen şehir için gerçek bir hava durumu API'sinden veri çekip gösteren bir arayüz.",
    },
    {
      title: "Kanban Pano",
      difficulty: "Orta",
      category: "React",
      description: "Sürükle-bırakla kart taşınabilen, tarayıcıda kalıcı saklanan basit bir görev panosu.",
    },
    {
      title: "Kişisel Portföy Sitesi",
      difficulty: "Başlangıç",
      category: "CSS",
      description: "Responsive, karanlık/aydınlık tema destekli tek sayfalık bir tanıtım sitesi.",
    },
    {
      title: "Gerçek Zamanlı Sohbet Arayüzü",
      difficulty: "İleri",
      category: "WebSocket",
      description: "WebSocket ile anlık mesajlaşan, yazıyor göstergesi olan bir sohbet ekranı.",
    },
  ],
  nodes: [
    {
      title: "İnternet",
      children: [
        { title: "İnternet Nasıl Çalışır?" },
        { title: "HTTP Nedir?" },
        { title: "Alan Adı (Domain) Nedir?" },
        { title: "Hosting Nedir?" },
        { title: "DNS ve Nasıl Çalışır?" },
        { title: "Tarayıcılar Nasıl Çalışır?" },
      ],
    },
    {
      title: "HTML",
      children: [
        { title: "Temel Etiketler" },
        { title: "Semantic HTML" },
        { title: "Formlar ve Doğrulama" },
        { title: "Erişilebilirlik (a11y)" },
        { title: "SEO Temelleri" },
      ],
    },
    {
      title: "CSS",
      children: [
        { title: "Temel Sözdizimi ve Seçiciler" },
        { title: "Box Model" },
        { title: "Flexbox" },
        { title: "Grid" },
        { title: "Responsive Tasarım" },
        { title: "CSS Değişkenleri" },
      ],
    },
    {
      title: "JavaScript",
      children: [
        { title: "Temel Sözdizimi" },
        { title: "DOM Manipülasyonu" },
        { title: "ES6+ Özellikleri" },
        { title: "Fetch API / AJAX" },
        { title: "Async/Await, Promises" },
        { title: "Closures ve Scope" },
        { title: "Event Loop" },
      ],
    },
    {
      title: "Versiyon Kontrolü",
      children: [
        { title: "Git Temelleri" },
        { title: "GitHub / GitLab" },
        { title: "Branching Stratejileri" },
      ],
    },
    {
      title: "Paket Yöneticileri",
      children: [{ title: "npm" }, { title: "pnpm / Yarn" }],
    },
    {
      title: "Bir Framework Seç",
      children: [{ title: "React" }, { title: "Vue" }, { title: "Angular" }, { title: "Svelte" }],
    },
    {
      title: "TypeScript",
      children: [
        { title: "Temel Tipler" },
        { title: "Interface / Type" },
        { title: "Generics" },
        { title: "Utility Types" },
      ],
    },
    {
      title: "CSS Yazma Yaklaşımları",
      children: [
        { title: "Tailwind CSS" },
        { title: "Sass" },
        { title: "CSS-in-JS" },
        { title: "CSS Modules" },
        { title: "BEM Metodolojisi" },
      ],
    },
    {
      title: "Build Araçları",
      children: [
        { title: "Modül Bundler'lar (Vite, Webpack)" },
        { title: "Task Runner'lar" },
        { title: "Linter / Formatter" },
      ],
    },
    {
      title: "Test",
      children: [
        { title: "Unit Test (Vitest, Jest)" },
        { title: "Component / Integration Test" },
        { title: "E2E Test (Playwright, Cypress)" },
      ],
    },
    {
      title: "Kimlik Doğrulama Stratejileri",
      children: [{ title: "JWT" }, { title: "OAuth" }, { title: "Session Tabanlı" }, { title: "SSO" }],
    },
    {
      title: "Web Güvenliği",
      children: [
        { title: "CORS" },
        { title: "CSP (Content Security Policy)" },
        { title: "HTTPS / SSL" },
        { title: "OWASP Temel Riskleri" },
      ],
    },
    {
      title: "Web Component'ler",
      children: [{ title: "Shadow DOM" }, { title: "Custom Elements" }, { title: "HTML Templates" }],
    },
    {
      title: "Server-Side Rendering",
      children: [{ title: "Next.js" }, { title: "Nuxt.js" }, { title: "Remix" }],
    },
    {
      title: "Statik Site Üretimi",
      children: [{ title: "Astro" }, { title: "Gatsby" }, { title: "Eleventy" }],
    },
    {
      title: "GraphQL",
      children: [{ title: "Temel Kavramlar" }, { title: "Apollo Client" }, { title: "urql" }],
    },
    {
      title: "Progressive Web Apps",
      children: [
        { title: "Service Worker" },
        { title: "Web App Manifest" },
        { title: "Offline Stratejileri" },
      ],
    },
    {
      title: "Mobil / Masaüstü Geliştirme",
      children: [{ title: "React Native / Flutter" }, { title: "Electron / Tauri" }],
    },
    {
      title: "İleri Seviye Performans",
      children: [
        { title: "Core Web Vitals" },
        { title: "Code Splitting / Lazy Loading" },
        { title: "Görsel Optimizasyonu" },
        { title: "WebAssembly (Giriş)" },
      ],
    },
  ],
};

export const BACKEND_ROADMAP_TEMPLATE: RoadmapTemplate = {
  key: "backend",
  name: "Backend Geliştirme",
  category: "role",
  addedDate: "2026-08-26",
  projectIdeas: [
    {
      title: "URL Kısaltıcı",
      difficulty: "Başlangıç",
      category: "API",
      description: "Uzun bir bağlantıyı kısa bir koda çevirip yönlendiren basit bir servis.",
    },
    {
      title: "Görev Kuyruğu",
      difficulty: "Orta",
      category: "Mesajlaşma",
      description: "Arka planda çalışan işleri bir kuyruğa alıp sırayla işleyen küçük bir sistem.",
    },
    {
      title: "Kimlik Doğrulama API'si",
      difficulty: "Orta",
      category: "Güvenlik",
      description: "Kayıt/giriş, token yenileme ve şifre sıfırlama akışlarını içeren bir REST API.",
    },
    {
      title: "Oran Sınırlayıcı Ara Katman",
      difficulty: "İleri",
      category: "Mimari",
      description: "Belirli bir süre içinde kaç istek yapılabileceğini sınırlayan bir middleware.",
    },
    {
      title: "Dosya Yükleme Servisi",
      difficulty: "Orta",
      category: "Depolama",
      description: "Boyut/tür doğrulaması yapan, dosyaları nesne depolamaya kaydeden bir uç nokta.",
    },
  ],
  nodes: [
    {
      title: "İnternet Temelleri",
      children: [
        { title: "İnternet Nasıl Çalışır?" },
        { title: "HTTP / HTTPS" },
        { title: "DNS ve Hosting" },
        { title: "Tarayıcı-Sunucu İletişimi" },
      ],
    },
    {
      title: "Bir Dil Seç",
      children: [
        { title: "JavaScript (Node.js)" },
        { title: "Python" },
        { title: "Java" },
        { title: "Go" },
        { title: "C#" },
        { title: "PHP" },
        { title: "Ruby" },
      ],
    },
    {
      title: "Versiyon Kontrolü",
      children: [{ title: "Git Temelleri" }, { title: "GitHub / GitLab" }],
    },
    {
      title: "API'ler Hakkında Bilgi",
      children: [
        { title: "REST" },
        { title: "JSON API'ler" },
        { title: "gRPC" },
        { title: "GraphQL" },
        { title: "Kimlik Doğrulama (OAuth, JWT)" },
      ],
    },
    {
      title: "Önbellekleme",
      children: [
        { title: "CDN" },
        { title: "Server-side (Redis, Memcached)" },
        { title: "Client-side Caching" },
      ],
    },
    {
      title: "Veritabanları",
      children: [
        { title: "İlişkisel (PostgreSQL, MySQL)" },
        { title: "İlişkisel Olmayan (NoSQL)" },
        { title: "ORM'ler" },
        { title: "ACID Prensipleri" },
        { title: "İndeksleme" },
        { title: "Normalizasyon" },
        { title: "Migration Yönetimi" },
        { title: "Transaction'lar" },
      ],
    },
    {
      title: "Veritabanı Ölçeklendirme",
      children: [{ title: "Replikasyon" }, { title: "Sharding" }, { title: "CAP Teoremi" }],
    },
    {
      title: "Web Güvenliği",
      children: [
        { title: "Şifreleme (bcrypt, SHA)" },
        { title: "HTTPS / SSL" },
        { title: "CORS" },
        { title: "OWASP Güvenlik Riskleri" },
        { title: "Content Security Policy" },
        { title: "Sunucu Güvenliği" },
      ],
    },
    {
      title: "Test",
      children: [{ title: "Unit Test" }, { title: "Integration Test" }, { title: "Functional / E2E Test" }],
    },
    {
      title: "CI/CD",
      children: [
        { title: "Otomatik Build/Deploy Pipeline'ları" },
        { title: "GitHub Actions / GitLab CI" },
        { title: "Bulut Sağlayıcıları (AWS/GCP/Azure)" },
      ],
    },
    {
      title: "Tasarım Prensipleri",
      children: [{ title: "SOLID" }, { title: "KISS" }, { title: "DRY" }, { title: "YAGNI" }],
    },
    {
      title: "Mimari Desenler",
      children: [
        { title: "MVC" },
        { title: "Katmanlı Mimari" },
        { title: "Monolitik vs Mikroservis" },
        { title: "SOA" },
        { title: "Serverless Mimari" },
      ],
    },
    {
      title: "Mesaj Kuyrukları",
      children: [{ title: "RabbitMQ" }, { title: "Apache Kafka" }],
    },
    {
      title: "Konteynerleştirme",
      children: [
        { title: "Docker" },
        { title: "Docker Compose" },
        { title: "Konteyner vs Sanallaştırma" },
      ],
    },
    {
      title: "Web Sunucuları",
      children: [{ title: "Nginx" }, { title: "Apache" }, { title: "Caddy" }],
    },
    {
      title: "Ölçeklenebilirlik",
      children: [
        { title: "Yatay / Dikey Ölçeklendirme" },
        { title: "Load Balancing" },
        { title: "CDN Kullanımı" },
      ],
    },
    {
      title: "İleri Seviye Mimari",
      children: [
        { title: "Domain-Driven Design" },
        { title: "Test-Driven Development" },
        { title: "Event Sourcing" },
        { title: "CQRS" },
      ],
    },
    {
      title: "Gerçek Zamanlı İletişim",
      children: [{ title: "WebSockets" }, { title: "Socket.io" }, { title: "Server-Sent Events" }],
    },
    {
      title: "Arama Motorları",
      children: [{ title: "Elasticsearch" }, { title: "Solr / Meilisearch" }],
    },
    {
      title: "GraphQL (İleri Seviye)",
      children: [{ title: "Apollo Server" }, { title: "Schema Design" }, { title: "Resolver Optimizasyonu" }],
    },
  ],
};

export const MOBILE_ROADMAP_TEMPLATE: RoadmapTemplate = {
  key: "mobil",
  name: "Mobil Geliştirme",
  category: "role",
  addedDate: "2026-08-26",
  projectIdeas: [
    {
      title: "Alışkanlık Takip Uygulaması",
      difficulty: "Başlangıç",
      category: "Yerel Depolama",
      description: "Günlük alışkanlıkları işaretleyip seriyi (streak) yerelde saklayan basit bir uygulama.",
    },
    {
      title: "Konum Tabanlı Not Defteri",
      difficulty: "Orta",
      category: "Konum",
      description: "Notları kaydedilen konuma göre haritada işaretleyen bir uygulama.",
    },
    {
      title: "Çevrimdışı Öncelikli Alışveriş Listesi",
      difficulty: "Orta",
      category: "Yerel Veritabanı",
      description: "İnternet olmadan da çalışan, bağlantı gelince senkronize olan bir liste uygulaması.",
    },
    {
      title: "Push Bildirim Hatırlatıcı",
      difficulty: "İleri",
      category: "Bildirimler",
      description: "Belirlenen saatte yerel push bildirimi tetikleyen bir hatırlatıcı uygulaması.",
    },
  ],
  nodes: [
    {
      title: "Yol Seçimi",
      children: [{ title: "Native (Android / iOS)" }, { title: "Cross-platform (RN, Flutter, Ionic)" }],
    },
    {
      title: "Programlama Dili Temelleri",
      children: [
        { title: "Temel Kavramlar (Değişkenler, OOP)" },
        { title: "JavaScript / TypeScript" },
        { title: "Kotlin (Android)" },
        { title: "Swift (iOS)" },
        { title: "Dart (Flutter)" },
      ],
    },
    {
      title: "Versiyon Kontrolü",
      children: [{ title: "Git Temelleri" }, { title: "GitHub / GitLab" }],
    },
    {
      title: "React Native Temelleri",
      children: [
        { title: "Component Yapısı" },
        { title: "JSX" },
        { title: "Props / State" },
        { title: "Expo Framework" },
      ],
    },
    {
      title: "UI Tasarım Prensipleri",
      children: [
        { title: "Material Design" },
        { title: "Human Interface Guidelines" },
        { title: "Responsive / Adaptive Layout" },
        { title: "Flexbox" },
        { title: "Erişilebilirlik" },
      ],
    },
    {
      title: "State Yönetimi",
      children: [
        { title: "Context API" },
        { title: "Redux / Redux Toolkit" },
        { title: "Zustand" },
        { title: "Recoil" },
      ],
    },
    {
      title: "Navigasyon",
      children: [{ title: "React Navigation" }, { title: "Stack / Tab / Drawer" }, { title: "Deep Linking" }],
    },
    {
      title: "Ağ İstekleri",
      children: [
        { title: "REST API Tüketimi" },
        { title: "GraphQL (Mobilde)" },
        { title: "WebSockets" },
        { title: "Offline-first Stratejiler" },
      ],
    },
    {
      title: "Yerel Depolama",
      children: [
        { title: "AsyncStorage" },
        { title: "SecureStore" },
        { title: "SQLite (expo-sqlite)" },
        { title: "Realm" },
      ],
    },
    {
      title: "Native Modüller",
      children: [
        { title: "Native Module Yazma" },
        { title: "Expo Modules API" },
        { title: "Platform-specific Kod" },
        { title: "Uygulama İçi Satın Alma" },
      ],
    },
    {
      title: "Push Bildirimleri",
      children: [
        { title: "Firebase Cloud Messaging" },
        { title: "Apple Push Notification" },
        { title: "Expo Notifications" },
      ],
    },
    {
      title: "Cihaz Özellikleri Erişimi",
      children: [
        { title: "Kamera" },
        { title: "Konum (GPS)" },
        { title: "Biyometrik Kimlik Doğrulama" },
        { title: "Sensörler" },
      ],
    },
    {
      title: "Test",
      children: [
        { title: "Unit Test (Jest)" },
        { title: "Component Test" },
        { title: "E2E Test (Detox, Maestro)" },
      ],
    },
    {
      title: "Performans Optimizasyonu",
      children: [
        { title: "Bellek Yönetimi" },
        { title: "Bundle Boyutu Küçültme" },
        { title: "Görsel Optimizasyonu" },
        { title: "Liste Sanallaştırma" },
      ],
    },
    {
      title: "Güvenlik",
      children: [
        { title: "Güvenli Depolama" },
        { title: "Certificate Pinning" },
        { title: "Kod Gizleme (Obfuscation)" },
      ],
    },
    {
      title: "Yayınlama",
      children: [
        { title: "Google Play Store Süreci" },
        { title: "Apple App Store Süreci" },
        { title: "Code Signing" },
        { title: "EAS Build (Expo)" },
        { title: "Fastlane" },
        { title: "Sürüm Yönetimi" },
      ],
    },
    {
      title: "Analitik ve Hata Takibi",
      children: [{ title: "Firebase Analytics" }, { title: "Crashlytics" }, { title: "Sentry" }],
    },
    {
      title: "Alternatif Framework'ler",
      children: [
        { title: "Flutter (Dart)" },
        { title: "Native Android (Kotlin)" },
        { title: "Native iOS (Swift)" },
      ],
    },
  ],
};

export const DEVOPS_ROADMAP_TEMPLATE: RoadmapTemplate = {
  key: "devops",
  name: "DevOps",
  category: "role",
  addedDate: "2026-08-26",
  projectIdeas: [
    {
      title: "Basit CI Hattı",
      difficulty: "Başlangıç",
      category: "CI/CD",
      description: "Her push'ta testleri otomatik çalıştıran bir CI iş akışı kurma.",
    },
    {
      title: "Konteynerleştirilmiş Web Uygulaması",
      difficulty: "Orta",
      category: "Docker",
      description: "Bir web uygulamasını Docker imajına paketleyip yerelde çalıştırma.",
    },
    {
      title: "Altyapı Kod Olarak (IaC)",
      difficulty: "İleri",
      category: "Terraform",
      description: "Bir sunucu ortamını kod ile tanımlayıp otomatik kuran bir IaC şablonu.",
    },
    {
      title: "İzleme Panosu",
      difficulty: "Orta",
      category: "İzleme",
      description: "Sistem metriklerini toplayıp görselleştiren basit bir izleme kurulumu.",
    },
  ],
  nodes: [
    {
      title: "Bir Dil Seç (Scripting)",
      children: [{ title: "Python" }, { title: "Go" }, { title: "Bash" }],
    },
    {
      title: "İşletim Sistemi Temelleri",
      children: [
        { title: "Linux Temelleri" },
        { title: "Process Yönetimi" },
        { title: "Paket Yöneticileri" },
        { title: "systemd" },
      ],
    },
    {
      title: "Terminal Kullanımı",
      children: [{ title: "Bash Scripting" }, { title: "Metin İşleme (grep, sed, awk)" }],
    },
    {
      title: "Ağ",
      children: [
        { title: "OSI Modeli" },
        { title: "TCP/IP" },
        { title: "DNS" },
        { title: "HTTP / HTTPS" },
        { title: "TLS / SSL" },
        { title: "Load Balancer'lar" },
        { title: "Firewall" },
        { title: "Reverse Proxy" },
      ],
    },
    {
      title: "Versiyon Kontrolü",
      children: [{ title: "Git" }, { title: "Trunk-based Development" }, { title: "Git Flow" }],
    },
    {
      title: "Provisioning",
      children: [
        { title: "Infrastructure as Code" },
        { title: "Terraform" },
        { title: "Pulumi" },
        { title: "CloudFormation" },
      ],
    },
    {
      title: "Sunucular",
      children: [
        { title: "Fiziksel Makineler" },
        { title: "Sanal Makineler (VM)" },
        { title: "Bulut / VPS Sağlayıcıları" },
      ],
    },
    {
      title: "Konteynerler",
      children: [{ title: "Docker" }, { title: "Docker Compose" }, { title: "Konteyner Registry'leri" }],
    },
    {
      title: "Konteyner Orkestrasyon",
      children: [
        { title: "Kubernetes" },
        { title: "Docker Swarm" },
        { title: "Nomad" },
        { title: "Mikroservis Mimarisi" },
        { title: "Service Mesh" },
      ],
    },
    {
      title: "CI/CD",
      children: [
        { title: "Jenkins" },
        { title: "GitHub Actions" },
        { title: "GitLab CI" },
        { title: "CircleCI" },
        { title: "ArgoCD (GitOps)" },
      ],
    },
    {
      title: "İzleme",
      children: [{ title: "Prometheus" }, { title: "Grafana" }, { title: "ELK Stack" }, { title: "Datadog" }],
    },
    {
      title: "Bulut Sağlayıcıları",
      children: [{ title: "AWS Temel Servisleri" }, { title: "GCP Temelleri" }, { title: "Azure Temelleri" }],
    },
    {
      title: "Bulut Tasarım Desenleri",
      children: [
        { title: "Otomatik Ölçeklendirme" },
        { title: "Yüksek Erişilebilirlik" },
        { title: "Maliyet Optimizasyonu" },
      ],
    },
    {
      title: "Güvenlik",
      children: [
        { title: "Secret Yönetimi (Vault)" },
        { title: "IAM" },
        { title: "Ağ Politikaları" },
      ],
    },
    {
      title: "Konfigürasyon Yönetimi",
      children: [{ title: "Ansible" }, { title: "Chef" }, { title: "Puppet" }, { title: "SaltStack" }],
    },
    {
      title: "Serverless",
      children: [
        { title: "AWS Lambda" },
        { title: "Google Cloud Functions" },
        { title: "Azure Functions" },
      ],
    },
    {
      title: "Artifact Yönetimi",
      children: [{ title: "Nexus" }, { title: "Artifactory" }, { title: "Docker Hub" }],
    },
    {
      title: "GitOps",
      children: [{ title: "ArgoCD" }, { title: "Flux" }],
    },
  ],
};

export const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  FRONTEND_ROADMAP_TEMPLATE,
  BACKEND_ROADMAP_TEMPLATE,
  MOBILE_ROADMAP_TEMPLATE,
  DEVOPS_ROADMAP_TEMPLATE,
];
