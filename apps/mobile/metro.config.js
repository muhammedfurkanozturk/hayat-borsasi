const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo desteği: workspace kökündeki (packages/shared gibi) sembolik
// bağlı paketleri de Metro'nun izlemesi/çözebilmesi için.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Kritik: Metro'nun react/react-dom gibi paketleri kökteki (web uygulamasının
// kullandığı, farklı sürümdeki) node_modules'tan bulup "duplicate React
// instance" (useEffect null hatası) üretmesini engeller — önce her zaman
// bu uygulamanın kendi node_modules'una bakar, sadece gerçekten sadece kökte
// var olan (workspace) paketler için yukarı çıkar.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
