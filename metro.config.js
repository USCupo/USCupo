const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fuentes de la web en WOFF2 recortado a latín (assets/fonts).
config.resolver.assetExts.push('woff2');

module.exports = config;
