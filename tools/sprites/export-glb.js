/**
 * Exports a hotel's 3D model as .glb via the dev route /export.
 * Usage: node tools/sprites/export-glb.js <hotel> <outDir> [levels=0,1,2,3,4,6,7,10]
 * Writes <outDir>/<hotel>-L<level>.glb for every level, -doors.glb (level 1, doors
 * open) and -chars.glb (all guest/staff models in every pose and direction).
 * Set ONLY=chars to export just the character sheet.
 * Needs the Expo web dev server on :8081 and Playwright (Chromium).
 */
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const [hotel = 'nachtruh', outDir = '.', levels = '0,1,2,3,4,6,7,10'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  let jobs = levels.split(',').map(l => [l, '', `${hotel}-L${l}.glb`]);
  jobs.push(['1', 'open', `${hotel}-doors.glb`]);
  jobs.push(['1', 'chars', `${hotel}-chars.glb`]);
  if (process.env.ONLY === 'chars') jobs = jobs.slice(-1);
  for (const [level, doors, name] of jobs) {
    const q = doors === 'chars' ? 'chars=1' : `doors=${doors}`;
    await page.goto(`http://localhost:8081/export?hotel=${hotel}&level=${level}&${q}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.__exportReady, null, { timeout: 180000 });
    await page.waitForTimeout(1200);
    const b64 = await page.evaluate(() => window.__exportGLB('hotel'));
    const out = `${outDir}/${name}`;
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log('wrote', out, fs.statSync(out).size, 'bytes');
  }
  await browser.close();
})();
