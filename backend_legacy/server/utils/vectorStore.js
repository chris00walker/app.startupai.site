// Vector store client for Chroma/Milvus
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

// Milvus vector store client
const milvusClient = new MilvusClient(
  process.env.MILVUS_ADDRESS || 'localhost:19530'
);
const COLLECTION_NAME = 'artefacts';

/**
 * Upserts a vector embedding into the Milvus collection.
 * TODO: implement collection creation and insert logic.
 */
/**
 * Store an embedding in the vector database under a given id.
 * @param {string} id - Unique identifier for this embedding.
 * @param {number[]} embedding - The vector embedding array.
 * @param {object} metadata - Arbitrary metadata to store with the vector.
 */
export async function storeEmbedding(id, content, metadata = {}) {
  if (!content) {
    throw new Error('Content is required');
  }
  // Simple embedding generation (e.g., char code representation)
  const embedding = Array.from(content).map((c) => c.charCodeAt(0));
  const payload = {
    collection_name: COLLECTION_NAME,
    data: [
      {
        id: id,
        content,
        embedding,
        metadata: JSON.stringify(metadata),
      },
    ],
  };
  const maxRetries = 1;
  let attempt = 0;
  let insertResult;
  while (true) {
    try {
      insertResult = await milvusClient.insert(payload);
      break;
    } catch (err) {
      if (attempt >= maxRetries) {
        throw err;
      }
      attempt++;
    }
  }
  return { success: insertResult.status === 'success', id };
}

/**
 * Search the vector database for the k most similar embeddings to the query vector.
 * @param {number[]} query - The query embedding.
 * @param {number} k - Number of nearest neighbors to retrieve.
 * @returns {Promise<Array<{ id: string, score: number, metadata: object }>>}
 */
export async function searchSimilar(query, k = 5) {
  // Simple embedding generation for query
  const vector = Array.from(query).map((c) => c.charCodeAt(0));
  try {
    const searchResult = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vector,
      limit: k,
      metric_type: 'L2',
      params: { nprobe: 10 },
    });
    const { results } = searchResult;
    return results.map((r) => ({
      id: r.id,
      score: r.score,
      content: r.entity.content,
    }));
  } catch (err) {
    throw err;
  }
}

/**
 * Connects to Milvus, ensures collection exists, and loads it into memory.
 * @returns {Promise<{success: boolean}>}
 */
export async function initializeVectorStore() {
  const host = process.env.MILVUS_HOST || 'localhost';
  const port = process.env.MILVUS_PORT || '19530';
  await milvusClient.connectToMilvusServer({ address: `${host}:${port}` });
  const has = await milvusClient.hasCollection({ collection_name: COLLECTION_NAME });
  if (!has.value) {
    await milvusClient.createCollection({ collection_name: COLLECTION_NAME });
  }
  await milvusClient.loadCollection({ collection_name: COLLECTION_NAME });
  return { success: true };
}
