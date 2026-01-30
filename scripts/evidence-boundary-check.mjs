// @story US-F14
import fs from 'node:fs'
import path from 'node:path'

const targetPath = path.resolve('frontend/src/hooks/useUnifiedEvidence.ts')

if (!fs.existsSync(targetPath)) {
  console.error(`[evidence-boundary-check] Missing file: ${targetPath}`)
  process.exit(1)
}

const contents = fs.readFileSync(targetPath, 'utf8')

const requiredToken = 'fetchEvidenceSources'
const forbiddenPatterns = [
  /\.from\(['"]evidence['"]\)/,
  /\.from\(['"]crewai_validation_states['"]\)/,
]

if (!contents.includes(requiredToken)) {
  console.error(
    '[evidence-boundary-check] Evidence boundary not wired: fetchEvidenceSources missing.'
  )
  process.exit(1)
}

const matches = forbiddenPatterns.filter((pattern) => pattern.test(contents))
if (matches.length > 0) {
  console.error(
    '[evidence-boundary-check] Direct Supabase access detected in useUnifiedEvidence.'
  )
  process.exit(1)
}

console.log('[evidence-boundary-check] OK')
