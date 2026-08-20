const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo desteği: workspace kökündeki (packages/shared gibi) sembolik
// bağlı paketleri Metro'nun izlemesi için.
//
// Not: Daha önce burada react/react-dom/react-native'i apps/mobile'ın
// kendi node_modules'una zorlayan bir extraNodeModules override'ı vardı.
// Kaldırıldı — kök sebep, iki farklı React sürümünün (web 19.2.8, mobil
// 19.1.0) aynı anda var olması ve npm'in hangisini nereye hoist ettiğine
// bağlı olarak farklı bileşenlerin farklı kopyaları yüklemesiydi
// ("Cannot read properties of null (reading 'useState')"). Kök
// package.json'daki react/react-dom artık mobilinkiyle AYNI sürüme
// (19.1.0) sabitlendi, böylece tüm repo'da tek bir React kopyası var —
// hangi yoldan çözülürse çözülsün artık fark etmiyor.
config.watchFolders = [workspaceRoot];

module.exports = config;
