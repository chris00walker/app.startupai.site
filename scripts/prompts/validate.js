#!/usr/bin/env node
/* Simple validator for docs/prompts packs/templates front‑matter */
const fs = require('fs');
const path = require('path');

function listMarkdownFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && p.endsWith('.md')) out.push(p);
    }
  })(dir);
  return out;
}

function extractFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : null;
}

function parseSimpleYaml(y) {
  // Minimal YAML: key: value; arrays via - item
  const obj = {};
  let currentKey = null;
  y.split('\n').forEach((line) => {
    if (!line.trim()) return;
    const arr = line.match(/^\s*-\s+(.*)$/);
    if (arr && currentKey) {
      if (!Array.isArray(obj[currentKey])) obj[currentKey] = [];
      obj[currentKey].push(arr[1]);
      return;
    }
    const kv = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2];
      if (val === '') { obj[key] = []; currentKey = key; }
      else { obj[key] = val; currentKey = key; }
    }
  });
  return obj;
}

function fileExistsMaybeAnchor(p) {
  const noAnchor = p.split('#')[0];
  if (!noAnchor) return true;
  const abs = path.isAbsolute(noAnchor) ? noAnchor : path.join(process.cwd(), noAnchor);
  return fs.existsSync(abs);
}

function validate() {
  const root = path.join(process.cwd(), 'docs', 'prompts');
  const packsDir = path.join(root, 'packs');
  const templatesDir = path.join(root, 'templates');
  const files = [...listMarkdownFiles(packsDir), ...listMarkdownFiles(templatesDir)];
  const errors = [];
  const ids = new Set();

  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const fm = extractFrontMatter(txt);
    if (!fm) { errors.push(`${f}: missing front‑matter`); continue; }
    const meta = parseSimpleYaml(fm);
    const where = `${f}`;

    // Required keys
    const isPack = (meta.kind || '').toLowerCase() === 'pack';
    const required = ['id', 'title', 'objective', 'outputs', 'definition_of_done', 'acceptance_criteria', 'constraints', 'plan', 'changed_files'];
    if (isPack) required.push('inputs');
    // New recommended fields for deterministic execution
    if (isPack) {
      required.push('file_contracts');
      required.push('timebox_hours');
      required.push('abort_conditions');
      required.push('stage_gates');
    }
    for (const k of required) {
      if (!(k in meta)) errors.push(`${where}: missing key '${k}'`);
    }

    // ID uniqueness
    if (meta.id) {
      if (ids.has(meta.id)) errors.push(`${where}: duplicate id '${meta.id}'`);
      ids.add(meta.id);
    }

    // Inputs paths exist (best effort)
    const inputs = Array.isArray(meta.inputs) ? meta.inputs : [];
    for (const p of inputs) {
      if (typeof p === 'string' && p.startsWith('docs/')) {
        if (!fileExistsMaybeAnchor(p)) errors.push(`${where}: input path not found '${p}'`);
      }
    }

    // Acceptance contains at least one of rubrics/slo/client_deliverables
    const ac = meta.acceptance_criteria;
    const acOk = (() => {
      if (!ac) return false;
      // If parsed as array of strings (our simple YAML), search tokens
      if (Array.isArray(ac)) {
        return ac.some((s) => typeof s === 'string' && /^(rubrics|slo|client_deliverables)\s*:/.test(s));
      }
      // If parsed as object, check keys
      if (typeof ac === 'object') {
        const keys = Object.keys(ac);
        return keys.some((k) => ['rubrics', 'slo', 'client_deliverables'].includes(k));
      }
      // If string, allow but warn
      if (typeof ac === 'string') return /rubrics|slo|client_deliverables/.test(ac);
      return false;
    })();
    if (!acOk) {
      errors.push(`${where}: acceptance_criteria should include rubrics/slo/client_deliverables`);
    }
  }

  if (errors.length) {
    console.error('Prompt validation failed:\n' + errors.map((e) => ` - ${e}`).join('\n'));
    process.exit(1);
  } else {
    console.log('Prompt validation passed. Files checked:', files.length);
  }
}

validate();
