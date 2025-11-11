/**
 * Quick test script to verify OpenAI API connectivity
 * This will help us identify if the API key works and if the model is accessible
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API...');
    console.log('Model:', process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini');

    const model = openai(process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini');

    const result = await generateText({
      model,
      prompt: 'Say "API test successful" if you can read this.',
      maxTokens: 50,
    });

    console.log('✅ SUCCESS!');
    console.log('Response:', result.text);
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    process.exit(1);
  }
}

testOpenAI();
