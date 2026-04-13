const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root (two levels up from apps/expo)
const projectRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

// Add monorepo support
config.watchFolders = [projectRoot];

// Resolve modules from project root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Ensure @superapp packages are resolved
config.resolver.extraNodeModules = {
  '@superapp/ui': path.resolve(projectRoot, 'packages/ui'),
  '@superapp/app': path.resolve(projectRoot, 'packages/app'),
};

module.exports = config;
