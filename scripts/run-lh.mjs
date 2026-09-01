import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const routes = [
    { name: '/programs', url: 'http://localhost:3005/programs' },
    { name: '/programs/builder', url: 'http://localhost:3005/programs/builder' },
    { name: '/goals', url: 'http://localhost:3005/goals' },
    { name: '/challenges', url: 'http://localhost:3005/challenges' },
  ];

  console.log('Launching Chrome via chrome-launcher...');
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  };

  const results = [];

  try {
    for (const r of routes) {
      console.log(`Auditing ${r.name} (${r.url})...`);
      const runnerResult = await lighthouse(r.url, options);
      const cats = runnerResult.lhr.categories;

      const perf = Math.round((cats.performance?.score || 0) * 100);
      const a11y = Math.round((cats.accessibility?.score || 0) * 100);
      const bp = Math.round((cats['best-practices']?.score || 0) * 100);
      const pass = perf >= 90 && a11y >= 95 && bp >= 95;

      const resObj = {
        route: r.name,
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        status: pass ? 'PASS' : 'FAIL',
      };
      results.push(resObj);
      console.log(`[${r.name}] Performance: ${perf} | Accessibility: ${a11y} | Best Practices: ${bp} | Result: ${resObj.status}`);
    }
  } finally {
    try {
      await chrome.kill();
    } catch (e) {
      // ignore
    }
  }

  console.log('\n================ LIGHTHOUSE FINAL AUDIT RESULTS ================');
  console.table(results);
  fs.writeFileSync(path.join(__dirname, '../lh-final-results.json'), JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
