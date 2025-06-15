const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.warn('Building application...');

try {
  // Run the build command
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build output exists
  const distPath = path.join(process.cwd(), 'dist', 'public');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(distPath)) {
    console.error('❌ Build failed: dist/public directory not created');
    process.exit(1);
  }

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Build failed: index.html not created');
    process.exit(1);
  }

  console.warn('✅ Build completed successfully');
  console.warn(`📁 Static files in: ${distPath}`);
  console.warn(`📄 Files created:`, fs.readdirSync(distPath));
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
