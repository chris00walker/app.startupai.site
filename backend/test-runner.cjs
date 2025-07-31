// Simplified test runner for backend TDD framework validation
const fs = require('fs');
const path = require('path');

console.log('🧪 Backend TDD Framework Validation');
console.log('=====================================\n');

// Test structure validation
const testDirectories = [
  '__tests__/unit/models',
  '__tests__/unit/agents/discovery', 
  '__tests__/unit/server/utils',
  '__tests__/integration',
  '__tests__/e2e',
  '__tests__/utils'
];

const testFiles = [
  '__tests__/unit/models/artefactModel.test.js',
  '__tests__/unit/models/taskModel.test.js',
  '__tests__/unit/agents/discovery/intakeAgent.test.js',
  '__tests__/unit/server/utils/agentRunner.test.js',
  '__tests__/unit/server/utils/vectorStore.test.js',
  '__tests__/unit/server/utils/observability.test.js',
  '__tests__/integration/agentWorkflow.integration.test.js',
  '__tests__/e2e/fullWorkflow.e2e.test.js',
  '__tests__/utils/testHelpers.js'
];

const configFiles = [
  'jest.config.js',
  'jest.setup.js',
  'package.json'
];

let validationResults = {
  passed: 0,
  failed: 0,
  details: []
};

function validateFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.size > 0) {
      console.log(`✅ ${description}: ${filePath} (${stats.size} bytes)`);
      validationResults.passed++;
      return true;
    } else {
      console.log(`❌ ${description}: ${filePath} (empty file)`);
      validationResults.failed++;
      validationResults.details.push(`Empty file: ${filePath}`);
      return false;
    }
  } else {
    console.log(`❌ ${description}: ${filePath} (missing)`);
    validationResults.failed++;
    validationResults.details.push(`Missing file: ${filePath}`);
    return false;
  }
}

function validateDirectory(dirPath, description) {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}/`);
    validationResults.passed++;
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath}/ (missing)`);
    validationResults.failed++;
    validationResults.details.push(`Missing directory: ${dirPath}`);
    return false;
  }
}

// Validate test directory structure
console.log('📁 Test Directory Structure:');
testDirectories.forEach(dir => {
  validateDirectory(dir, 'Test Directory');
});

console.log('\n📄 Test Files:');
testFiles.forEach(file => {
  validateFile(file, 'Test File');
});

console.log('\n⚙️  Configuration Files:');
configFiles.forEach(file => {
  validateFile(file, 'Config File');
});

// Validate package.json test scripts
console.log('\n📦 Package.json Test Scripts:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const expectedScripts = ['test', 'test:unit', 'test:integration', 'test:e2e'];
  expectedScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`✅ Script: ${script} -> ${scripts[script]}`);
      validationResults.passed++;
    } else {
      console.log(`❌ Script: ${script} (missing)`);
      validationResults.failed++;
      validationResults.details.push(`Missing script: ${script}`);
    }
  });
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  validationResults.failed++;
}

// Validate test dependencies
console.log('\n📚 Test Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const devDeps = packageJson.devDependencies || {};
  
  const expectedDeps = ['jest', 'supertest', 'mongodb-memory-server'];
  expectedDeps.forEach(dep => {
    if (devDeps[dep]) {
      console.log(`✅ Dependency: ${dep}@${devDeps[dep]}`);
      validationResults.passed++;
    } else {
      console.log(`❌ Dependency: ${dep} (missing)`);
      validationResults.failed++;
      validationResults.details.push(`Missing dependency: ${dep}`);
    }
  });
} catch (error) {
  console.log(`❌ Error reading dependencies: ${error.message}`);
  validationResults.failed++;
}

// Test content validation
console.log('\n🔍 Test Content Validation:');

// Check if test files contain proper test structure
const testPatterns = [
  { pattern: /describe\(/g, name: 'Test Suites (describe)' },
  { pattern: /it\(/g, name: 'Test Cases (it)' },
  { pattern: /expect\(/g, name: 'Assertions (expect)' },
  { pattern: /beforeEach\(/g, name: 'Setup (beforeEach)' },
  { pattern: /afterEach\(/g, name: 'Cleanup (afterEach)' }
];

let totalTestCount = 0;
testFiles.filter(f => f.endsWith('.test.js')).forEach(testFile => {
  try {
    const content = fs.readFileSync(path.join(__dirname, testFile), 'utf8');
    let fileTestCount = 0;
    
    testPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        fileTestCount += matches.length;
      }
    });
    
    if (fileTestCount > 0) {
      console.log(`✅ ${path.basename(testFile)}: ${fileTestCount} test elements`);
      totalTestCount += fileTestCount;
      validationResults.passed++;
    } else {
      console.log(`❌ ${path.basename(testFile)}: No test elements found`);
      validationResults.failed++;
      validationResults.details.push(`No test elements in: ${testFile}`);
    }
  } catch (error) {
    console.log(`❌ Error reading ${testFile}: ${error.message}`);
    validationResults.failed++;
  }
});

// Summary
console.log('\n📊 Backend TDD Framework Validation Summary:');
console.log('==============================================');
console.log(`✅ Passed: ${validationResults.passed}`);
console.log(`❌ Failed: ${validationResults.failed}`);
console.log(`📈 Total Test Elements: ${totalTestCount}`);

const successRate = Math.round((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100);
console.log(`🎯 Success Rate: ${successRate}%`);

if (validationResults.failed === 0) {
  console.log('\n🎉 Backend TDD Framework is COMPLETE and READY!');
  console.log('✨ All test infrastructure, unit tests, integration tests, and e2e tests are in place.');
  console.log('🚀 Ready to proceed with systematic backend recovery using TDD methodology.');
} else {
  console.log('\n⚠️  Backend TDD Framework has some issues:');
  validationResults.details.forEach(detail => {
    console.log(`   • ${detail}`);
  });
}

console.log('\n🔧 Next Steps:');
console.log('1. Fix any remaining issues above');
console.log('2. Run individual test files to validate functionality');
console.log('3. Use TDD framework to systematically identify and fix backend issues');
console.log('4. Proceed with backend recovery only after tests pass');

process.exit(validationResults.failed === 0 ? 0 : 1);
