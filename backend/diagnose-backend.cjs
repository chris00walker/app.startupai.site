// Backend Diagnostic Script - Systematic Issue Identification
const fs = require('fs');
const path = require('path');

console.log('🔍 Backend Systematic Issue Identification');
console.log('==========================================\n');

let diagnosticResults = {
  critical: [],
  warnings: [],
  passed: [],
  suggestions: []
};

function logIssue(type, component, issue, suggestion = '') {
  const entry = { component, issue, suggestion };
  diagnosticResults[type].push(entry);
  
  const icons = { critical: '❌', warnings: '⚠️', passed: '✅' };
  console.log(`${icons[type]} ${component}: ${issue}`);
  if (suggestion) console.log(`   💡 ${suggestion}`);
}

// 1. Check Backend File Structure
console.log('📁 Backend File Structure Analysis:');

const requiredFiles = [
  'server.js',
  'package.json',
  'models/artefactModel.js',
  'models/taskModel.js',
  'server/utils/agentRunner.js',
  'server/utils/vectorStore.js',
  'server/utils/observability.js',
  'agents/discovery/intakeAgent.js'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.size > 0) {
      logIssue('passed', 'File Structure', `${file} exists (${stats.size} bytes)`);
    } else {
      logIssue('critical', 'File Structure', `${file} is empty`, 'File needs content');
    }
  } else {
    logIssue('critical', 'File Structure', `${file} missing`, 'Create missing file');
  }
});

// 2. Check Package.json Dependencies
console.log('\n📦 Dependency Analysis:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const criticalDeps = [
    'express', 'mongoose', 'openai', '@zilliz/milvus2-sdk-node'
  ];
  
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  criticalDeps.forEach(dep => {
    if (deps[dep]) {
      logIssue('passed', 'Dependencies', `${dep}@${deps[dep]} installed`);
    } else {
      logIssue('critical', 'Dependencies', `${dep} missing`, 'npm install ' + dep);
    }
  });
  
  // Check for ES modules configuration
  if (packageJson.type === 'module') {
    logIssue('warnings', 'Configuration', 'ES modules enabled - may cause compatibility issues', 'Consider CommonJS for backend services');
  }
  
} catch (error) {
  logIssue('critical', 'Package.json', `Cannot read package.json: ${error.message}`, 'Fix package.json syntax');
}

// 3. Check Environment Variables
console.log('\n🔧 Environment Configuration:');
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'MONGODB_URI',
  'MILVUS_HOST',
  'MILVUS_PORT'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    logIssue('passed', 'Environment', `${envVar} is set`);
  } else {
    logIssue('warnings', 'Environment', `${envVar} not set`, 'Add to .env file or environment');
  }
});

// 4. Analyze Code Files for Common Issues
console.log('\n🔍 Code Analysis:');

function analyzeFile(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for import/export syntax issues
    const hasImports = content.includes('import ');
    const hasRequires = content.includes('require(');
    const hasExports = content.includes('export ');
    const hasModuleExports = content.includes('module.exports');
    
    if (hasImports && hasRequires) {
      logIssue('critical', fileName, 'Mixed import/require syntax', 'Use consistent module system');
    } else if (hasImports || hasExports) {
      logIssue('warnings', fileName, 'Uses ES modules', 'Ensure compatibility with Node.js setup');
    }
    
    // Check for missing error handling
    if (!content.includes('try') && !content.includes('catch')) {
      logIssue('warnings', fileName, 'No error handling detected', 'Add try/catch blocks');
    }
    
    // Check for hardcoded values
    if (content.includes('localhost') && !fileName.includes('test')) {
      logIssue('warnings', fileName, 'Hardcoded localhost detected', 'Use environment variables');
    }
    
    logIssue('passed', fileName, `File analyzed (${content.length} chars)`);
    
  } catch (error) {
    logIssue('critical', fileName, `Cannot read file: ${error.message}`, 'Fix file permissions or syntax');
  }
}

// Analyze key backend files
const filesToAnalyze = [
  'server.js',
  'models/artefactModel.js',
  'server/utils/agentRunner.js'
];

filesToAnalyze.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    analyzeFile(fullPath, file);
  }
});

// 5. Check Docker Configuration
console.log('\n🐳 Docker Configuration:');
const dockerFiles = ['Dockerfile', 'docker-compose.yaml'];

dockerFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    logIssue('passed', 'Docker', `${file} exists`);
  } else {
    logIssue('warnings', 'Docker', `${file} missing`, 'Create Docker configuration');
  }
});

// 6. Generate Summary and Recommendations
console.log('\n📊 Diagnostic Summary:');
console.log('====================');
console.log(`❌ Critical Issues: ${diagnosticResults.critical.length}`);
console.log(`⚠️  Warnings: ${diagnosticResults.warnings.length}`);
console.log(`✅ Passed Checks: ${diagnosticResults.passed.length}`);

if (diagnosticResults.critical.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES TO FIX FIRST:');
  diagnosticResults.critical.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.component}: ${issue.issue}`);
    if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
  });
}

if (diagnosticResults.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS TO ADDRESS:');
  diagnosticResults.warnings.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.component}: ${issue.issue}`);
    if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
  });
}

console.log('\n🎯 RECOMMENDED NEXT STEPS:');
console.log('1. Fix all critical issues first (file structure, dependencies)');
console.log('2. Address ES modules compatibility issues');
console.log('3. Add proper error handling and environment configuration');
console.log('4. Test backend service startup manually');
console.log('5. Validate API endpoints individually');

// Exit with appropriate code
const exitCode = diagnosticResults.critical.length > 0 ? 1 : 0;
process.exit(exitCode);
