import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = 'http://127.0.0.1:8765/';
const out = 'docs/showcase';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 440, height: 920 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
page.on('pageerror', error => console.warn('Browser error:', error.message));
await page.goto(base, { waitUntil: 'load' });
await page.locator('#page-home').waitFor({ state: 'visible' });
await page.screenshot({ path: path.join(out, '01-home.jpg'), type: 'jpeg', quality: 88 });

await page.evaluate(() => go('record'));
await page.locator('#page-record').waitFor({ state: 'visible' });
await page.screenshot({ path: path.join(out, '02-record.jpg'), type: 'jpeg', quality: 88 });

const stamp = new Date();
const y = stamp.getFullYear(), m = String(stamp.getMonth()+1).padStart(2,'0'), d = String(stamp.getDate()).padStart(2,'0');
const date = y + '-' + m + '-' + d;
const entries = [
  { mood: '平静', intensity: 5, energy: '一般', interest: '还不错', sleep: 8, note: '今天把想做的事情慢慢完成了。', hh: '09:20' },
  { mood: '有点累', intensity: 4, energy: '偏低', interest: '一般', sleep: 7, note: '下午有点疲惫，想好好休息一会儿。', hh: '14:30' },
  { mood: '开心', intensity: 8, energy: '还不错', interest: '很有兴趣', sleep: 7.5, note: '傍晚和朋友聊了会儿天 ♡', hh: '19:40' }
].map((r,i) => ({ id: 'showcase-' + i, time: date + 'T' + r.hh + ':00', mood: r.mood, intensity:r.intensity, energy:r.energy, interest:r.interest, sleep:r.sleep, note:r.note, photo:'' }));
// The entries exist only inside this isolated CI browser, never in the public application.
await page.evaluate(records => localStorage.setItem('rongrong_records_v3', JSON.stringify(records)), entries);
await page.reload({ waitUntil:'load' });
await page.evaluate(() => { setTheme('purple'); go('timeline'); });
await page.screenshot({ path:path.join(out, '03-memory-timeline.jpg'), type:'jpeg', quality:88 });

await page.evaluate(() => go('stats'));
await page.screenshot({ path:path.join(out, '04-stats.jpg'), type:'jpeg', quality:88 });

await page.evaluate(() => go('themes'));
await page.screenshot({ path:path.join(out, '05-themes.jpg'), type:'jpeg', quality:88 });

await page.evaluate(() => { $('filter-date').value = '2001-01-01'; go('timeline'); });
await page.screenshot({ path:path.join(out, '06-empty-state.jpg'), type:'jpeg', quality:88 });

// Make a single designed overview directly in Chromium.
const images = [];
for (const f of ['01-home.jpg','02-record.jpg','03-memory-timeline.jpg','04-stats.jpg','05-themes.jpg']) {
  const bytes = await readFile(path.join(out, f));
  images.push('data:image/jpeg;base64,' + bytes.toString('base64'));
}
const collage = await context.newPage();
await collage.setViewportSize({ width: 1450, height: 880 });
const cards = images.map((src,i) => '<div class="card"><img src="' + src + '"><span>' + ['小屋 · Home','记录 · Journal','回忆 · Memories','统计 · Insights','主题 · Themes'][i] + '</span></div>').join('');
await collage.setContent('<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% 20%,#fff4e4,transparent 46%),linear-gradient(125deg,#fef9f1,#fbe9ed 55%,#eee8f8);font-family:Arial,"Microsoft YaHei",sans-serif;color:#805a50;overflow:hidden}.heading{margin:35px 0 22px;text-align:center;font-size:40px;font-weight:800}.sub{text-align:center;margin:-10px 0 34px;color:#b18e88;font-size:18px}.grid{display:flex;justify-content:center;gap:22px}.card{width:245px;border-radius:25px;box-shadow:0 18px 38px #a8787628;background:#fffaf4;border:8px solid #fffdf7;overflow:hidden}.card img{display:block;width:100%;height:620px;object-fit:cover;object-position:top}.card span{height:48px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700}</style><h1 class="heading">绒绒的小屋 <span style="color:#e8a1a4">♡</span></h1><p class="sub">给每一种心情，一个柔软的小窝</p><div class="grid">' + cards + '</div>');
await collage.screenshot({ path:path.join(out,'00-overview.jpg'), type:'jpeg',quality:88 });
await browser.close();
console.log('Six real browser screenshots generated; test data isolated to CI browser.');
