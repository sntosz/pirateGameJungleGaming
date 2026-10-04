import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,300)));
p.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0,400)));
p.on('requestfailed', r => console.log('REQFAIL', r.url(), r.failure()?.errorText));
await p.goto('http://localhost:4173');
await p.waitForTimeout(4000);
await b.close();
