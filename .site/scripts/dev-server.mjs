import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const VAULT_ROOT = path.resolve(SITE_ROOT, '..');
const PREPARE_SCRIPT = path.join(__dirname, 'prepare-data.mjs');
const NODE_MODULES_DIR = path.join(SITE_ROOT, 'node_modules');

// 0. Auto-install dependencies in .site/node_modules if missing or updated
if (
  !fs.existsSync(NODE_MODULES_DIR) ||
  !fs.existsSync(path.join(NODE_MODULES_DIR, 'highlight.js'))
) {
  console.log('📦 正在检查并安装 .site 依赖...');
  execSync('npm install', { cwd: SITE_ROOT, stdio: 'inherit' });
}

function runPrepare() {
  try {
    execFileSync(process.execPath, [PREPARE_SCRIPT], {
      cwd: SITE_ROOT,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('[dev-server] Failed to prepare Obsidian data:', err.message);
  }
}

// 1. Initial build of generated.json
console.log('🔄 正在同步 Obsidian 笔记与配置...');
runPrepare();

// 2. Watch Obsidian vault (.md files and publish.config.yml) for live reload
let debounceTimer = null;
function schedulePrepare(changedPath) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`\n📝 检测到文件变更 (${changedPath})，正在热更新...`);
    runPrepare();
  }, 300);
}

try {
  fs.watch(VAULT_ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const norm = filename.split(path.sep).join('/');
    // Ignore hidden directories (.git, .obsidian, .site) and tmp
    if (
      norm.startsWith('.') ||
      norm.includes('/.') ||
      norm.startsWith('tmp/')
    ) {
      return;
    }
    if (
      norm === 'publish.config.yml' ||
      norm.toLowerCase().endsWith('.md') ||
      norm.startsWith('static/image/')
    ) {
      schedulePrepare(norm);
    }
  });
  console.log('👀 已开启 Obsidian 笔记与 publish.config.yml 实时监听');
} catch (err) {
  console.warn('[dev-server] File watcher warning:', err.message);
}

// 3. Start Astro dev server and open browser
console.log('🚀 正在启动本地预览服务 (http://localhost:4321)...');
const astroBin = path.join(SITE_ROOT, 'node_modules', 'astro', 'astro.js');
const child = spawn(process.execPath, [astroBin, 'dev', '--open'], {
  cwd: SITE_ROOT,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
