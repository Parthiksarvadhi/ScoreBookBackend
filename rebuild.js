#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔨 Building TypeScript...');

try {
  execSync('npx tsc', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Build complete!');
  console.log('');
  console.log('Now run: npm start');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}
