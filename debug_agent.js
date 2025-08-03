import { buildStrategyzerPrompt } from './backend/server/utils/agentRunner.js';

// Test the function
const testInput = { clientId: 'test123' };
const prompt = buildStrategyzerPrompt('intakeAgent', testInput);

console.log('Generated prompt:');
console.log(prompt);
console.log('\n=== End of prompt ===');
