#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔨 Building TypeScript...');

try {
  execSync('npx tsc', { 
    cwd: new URL('.', import.meta.url).pathname,
    stdio: 'inherit'
  });
  console.log('✅ Build complete!');
  console.log('');
  console.log('Now run: npm start');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}
