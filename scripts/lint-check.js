import { execSync } from 'child_process';

try {
  // Run ESLint
  execSync('eslint . --ext .ts,.tsx', { stdio: 'inherit' });
  // If we get here, there were no errors
  process.stdout.write('\x1b[32m✓ Great! No linting errors found.\x1b[0m\n');
} catch {
  // ESLint found errors, exit with error code
  process.exit(1);
}
