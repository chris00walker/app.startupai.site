/**
 * Test production API endpoint to diagnose the silent failure
 */

async function testProductionAPI() {
  const productionURL = 'https://app-startupai-site.netlify.app';

  try {
    console.log('Testing /api/chat endpoint...');

    // Test with a minimal request
    const response = await fetch(`${productionURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        sessionId: 'test-diagnostic-session',
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return;
    }

    // Try to read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    let totalChunks = 0;

    if (reader) {
      console.log('Stream started, reading chunks...');

      const timeout = setTimeout(() => {
        console.log('⚠️  Stream timeout after 10 seconds');
        reader.cancel();
      }, 10000);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            clearTimeout(timeout);
            console.log('Stream ended');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          totalChunks++;
          chunks.push(chunk);

          console.log(`Chunk ${totalChunks}:`, chunk.substring(0, 100));
        }
      } catch (readError) {
        clearTimeout(timeout);
        console.error('Error reading stream:', readError);
      }
    }

    console.log('Total chunks received:', totalChunks);
    console.log('Total content length:', chunks.join('').length);

    if (totalChunks === 0) {
      console.log('❌ ISSUE FOUND: Stream returned 200 OK but no chunks were sent!');
    } else {
      console.log('✅ Stream working correctly');
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  }
}

testProductionAPI();
