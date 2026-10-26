import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 18080;

const gateway = spawn(process.execPath, ['gateway.mjs'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), UGARIT_PORT: '14177', ALMARSA_PORT: '13000' },
  stdio: 'pipe',
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitReady() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const hub = await fetch(`http://127.0.0.1:${PORT}/`);
      if (hub.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error('Gateway did not start');
}

function stop() {
  gateway.kill('SIGTERM');
}

process.on('exit', stop);

try {
  await waitReady();

  const hub = await fetch(`http://127.0.0.1:${PORT}/`);
  assert.equal(hub.status, 200);
  assert.match(await hub.text(), /MARINACO/i);

  const ugaritMenu = await fetch(`http://127.0.0.1:${PORT}/ugarit/api/menu`);
  assert.equal(ugaritMenu.status, 200);
  const ugaritJson = await ugaritMenu.json();
  assert.ok(Array.isArray(ugaritJson.sections));

  const almarsaMenu = await fetch(`http://127.0.0.1:${PORT}/almarsa/api/menu`);
  assert.equal(almarsaMenu.status, 200);
  assert.ok(Array.isArray(await almarsaMenu.json()));

  const blocked = await fetch(`http://127.0.0.1:${PORT}/api/menu`);
  assert.equal(blocked.status, 404);

  console.log('gateway smoke tests passed');
} finally {
  stop();
}
