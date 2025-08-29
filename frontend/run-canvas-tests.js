#!/usr/bin/env node

/**
 * Canvas Components Test Runner
 * 
 * Executes comprehensive TDD test suite for all ShadCN canvas components
 * Following Test-Driven Development methodology
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testSuites = [
  {
    name: 'Testing Business Ideas Canvas',
    file: 'src/__tests__/components/TestingBusinessIdeasCanvas.test.tsx',
    description: 'NEW: Complete TBI canvas with 4 tabs using ShadCN components'
  },
  {
    name: 'Value Proposition Canvas',
    file: 'src/__tests__/components/ValuePropositionCanvas.test.tsx',
    description: 'Enhanced VPC with proper ShadCN integration'
  },
  {
    name: 'Business Model Canvas',
    file: 'src/__tests__/components/BusinessModelCanvas.test.tsx',
    description: 'Enhanced BMC with all 9 building blocks'
  },
  {
    name: 'Canvas Editor Integration',
    file: 'src/__tests__/components/CanvasEditor.test.tsx',
    description: 'Integration component orchestrating all canvas types'
  },
  {
    name: 'Canvas Gallery Integration',
    file: 'src/__tests__/components/CanvasGallery.test.tsx',
    description: 'Gallery with filtering, search, and preview'
  }
];

function printHeader() {
  console.log('🎯 CANVAS COMPONENTS TEST SUITE');
  console.log('================================');
  console.log('Test-Driven Development (TDD) Methodology');
  console.log('ShadCN UI Components Integration');
  console.log('');
}

function printSummary() {
  console.log('📊 TEST SUITE OVERVIEW:');
  console.log(`• Total Test Suites: ${testSuites.length}`);
  console.log('• Framework: Jest + React Testing Library');
  console.log('• UI Library: ShadCN UI Components');
  console.log('• Methodology: Test-Driven Development');
  console.log('');
  
  testSuites.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name}`);
    console.log(`   📁 ${suite.file}`);
    console.log(`   📝 ${suite.description}`);
    console.log('');
  });
}

function checkTestFiles() {
  console.log('🔍 CHECKING TEST FILES...');
  let allFilesExist = true;
  
  testSuites.forEach(suite => {
    const filePath = path.join(__dirname, suite.file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${suite.file}`);
    } else {
      console.log(`❌ ${suite.file} - FILE NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  return allFilesExist;
}

function runIndividualTest(suite) {
  console.log(`🧪 RUNNING: ${suite.name}`);
  console.log(`📁 File: ${suite.file}`);
  console.log('─'.repeat(50));
  
  try {
    // Run the specific test file
    execSync(`npm test -- "${suite.file}" --verbose`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log(`✅ ${suite.name} - PASSED`);
    return true;
  } catch (error) {
    console.log(`❌ ${suite.name} - FAILED`);
    console.error('Error details:', error.message);
    return false;
  }
}

function runAllTests() {
  console.log('🚀 STARTING CANVAS COMPONENT TESTS...');
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    total: testSuites.length
  };
  
  testSuites.forEach(suite => {
    const success = runIndividualTest(suite);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log('');
  });
  
  return results;
}

function printResults(results) {
  console.log('🎯 TEST SUITE RESULTS');
  console.log('====================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✨ TDD Implementation Complete');
    console.log('🏆 ShadCN Components Fully Tested');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }
}

function main() {
  printHeader();
  printSummary();
  
  if (!checkTestFiles()) {
    console.log('❌ Missing test files. Please ensure all test files are created.');
    process.exit(1);
  }
  
  const results = runAllTests();
  printResults(results);
  
  // Exit with error code if tests failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testSuites,
  runAllTests,
  runIndividualTest
};
