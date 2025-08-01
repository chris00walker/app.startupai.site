// Vector store client using MongoDB
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chris00walker:tQXBjF1qJ6UKKBwJ@cluster0.xodhvph.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'agents';
const COLLECTION_NAME = 'embeddings';

let db;
let client;

/**
 * Initialize MongoDB connection
 */
export async function initializeVectorStore() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create index for efficient similarity search
    await db.collection(COLLECTION_NAME).createIndex({ embedding: "2dsphere" });
    
    console.log('✅ MongoDB vector store initialized');
    return { success: true };
  } catch (err) {
    console.error('❌ MongoDB initialization failed:', err.message);
    return { success: false };
  }
}

/**
 * Simple cosine similarity calculation
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Store an embedding in the vector database under a given id.
 * @param {string} id - Unique identifier for this embedding.
 * @param {string} content - The content to be embedded.
 * @param {object} metadata - Arbitrary metadata to store with the vector.
 */
export async function storeEmbedding(id, content, metadata = {}) {
  if (!content) {
    throw new Error('Content is required');
  }

  // Simple embedding generation (e.g., char code representation)
  const embedding = Array.from(content).map(c => c.charCodeAt(0));
  
  try {
    const collection = db.collection(COLLECTION_NAME);
    await collection.updateOne(
      { id },
      { 
        $set: { 
          id,
          content,
          embedding,
          metadata,
          createdAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    return { success: true, id };
  } catch (err) {
    console.error('❌ Failed to store embedding:', err.message);
    throw err;
  }
}

/**
 * Search the vector database for the k most similar embeddings to the query vector.
 * @param {string} query - The query string.
 * @param {number} k - Number of nearest neighbors to retrieve.
 * @returns {Promise<Array<{ id: string, score: number, content: string }>>}
 */
export async function searchSimilar(query, k = 5) {
  if (!db) {
    throw new Error('Vector store not initialized');
  }
  
  // Simple embedding generation for query
  const queryVector = Array.from(query).map(c => c.charCodeAt(0));
  
  try {
    const collection = db.collection(COLLECTION_NAME);
    const allEmbeddings = await collection.find({}).toArray();
    
    // Calculate similarities
    const similarities = allEmbeddings.map(item => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      score: cosineSimilarity(queryVector, item.embedding)
    }));
    
    // Sort by similarity and return top k
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, k);
  } catch (err) {
    console.error('❌ Failed to search similar embeddings:', err.message);
    throw err;
  }
}

/**
 * Close the database connection
 */
export async function closeVectorStore() {
  if (client) {
    await client.close();
  }
}
