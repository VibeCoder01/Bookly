const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

const version = getPackageVersion();
const commit = getGitCommit();
console.log(`Bookly version: ${version} (commit ${commit})`);
