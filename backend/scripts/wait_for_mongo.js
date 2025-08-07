#!/usr/bin/env node
/*
  wait_for_mongo.js (backend)
  Purpose: Poll MongoDB until ready, with timeout and retries.
  Usage:
    MONGODB_URI=mongodb://127.0.0.1:27017 node scripts/wait_for_mongo.js [--timeoutMs 60000] [--intervalMs 1000]
*/

const mongoose = require('mongoose');

function getArg(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return Number(process.argv[idx + 1]);
  return def;
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const timeoutMs = getArg('timeoutMs', 60000);
const intervalMs = getArg('intervalMs', 1000);

if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(2);
}

async function pingOnce() {
  try {
    const admin = mongoose.connection.db.admin();
    const res = await admin.command({ ping: 1 });
    return res && res.ok === 1;
  } catch {
    return false;
  }
}

(async function main() {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      const ok = await pingOnce();
      await mongoose.disconnect();
      if (ok) {
        console.log(`✅ MongoDB is ready at ${uri}`);
        process.exit(0);
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.error('❌ Timed out waiting for MongoDB readiness');
  if (lastErr) console.error(String(lastErr));
  process.exit(1);
})();
