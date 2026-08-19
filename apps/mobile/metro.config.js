const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo desteği: workspace kökündeki (packages/shared gibi) sembolik
// bağlı paketleri Metro'nun izlemesi için. Hiyerarşik arama AÇIK bırakılıyor
// (Node'un normal node_modules yukarı-tırmanma davranışı) — bu, apps/mobile
// dışına hoist edilmiş native paketlerin (örn. react-native-svg) kendi
// içindeki relative import'larını (örn. "./fabric") sorunsuz çözmesi için
// gerekli; disableHierarchicalLookup açıkken bu tür paketlerde
// "Unable to resolve ./fabric" hatası çıkıyordu.
config.watchFolders = [workspaceRoot];

// Bunun yerine SADECE React/React Native'in mutlaka bu uygulamanın kendi
// node_modules'undaki (doğru sürüm) kopyasından gelmesini zorluyoruz —
// aksi halde hiyerarşik arama, root'taki (web'in kullandığı, farklı
// sürümdeki) kopyayı bulup "duplicate React instance" (useEffect null)
// hatası üretiyordu.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = config;
