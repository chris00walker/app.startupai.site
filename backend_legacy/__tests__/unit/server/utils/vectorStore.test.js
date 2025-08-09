// Unit tests for vectorStore utility

import { mockMilvus } from '../../../utils/testHelpers.js';

// Mock Milvus client
const mockMilvusClient = {
  connectToMilvusServer: vi.fn(),
  insert: vi.fn(),
  search: vi.fn(),
  createCollection: vi.fn(),
  dropCollection: vi.fn(),
  hasCollection: vi.fn(),
  loadCollection: vi.fn()
};

vi.mock('@zilliz/milvus2-sdk-node', () => ({
  MilvusClient: vi.fn().mockImplementation(() => mockMilvusClient)
}));

// Import the functions we're testing
const { storeEmbedding, searchSimilar, initializeVectorStore } = await import('../../../../server/utils/vectorStore.js');

describe('VectorStore Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    mockMilvusClient.connectToMilvusServer.mockResolvedValue({ status: 'success' });
    mockMilvusClient.hasCollection.mockResolvedValue({ value: true });
    mockMilvusClient.loadCollection.mockResolvedValue({ status: 'success' });
    mockMilvusClient.insert.mockResolvedValue({ 
      status: 'success',
      insert_cnt: 1,
      ids: ['test-id-123']
    });
    mockMilvusClient.search.mockResolvedValue({
      status: 'success',
      results: [
        { id: 'result-1', score: 0.95, entity: { content: 'Similar content 1' } },
        { id: 'result-2', score: 0.87, entity: { content: 'Similar content 2' } }
      ]
    });
  });

  describe('storeEmbedding Function', () => {
    it('should store embedding with valid data', async () => {
      const id = 'test-embedding-123';
      const content = 'Test content for embedding';
      const metadata = { type: 'analysis', clientId: 'client-123' };

      const result = await storeEmbedding(id, content, metadata);

      expect(mockMilvusClient.insert).toHaveBeenCalledWith({
        collection_name: 'artefacts',
        data: [{
          id: id,
          content: content,
          embedding: expect.any(Array),
          metadata: JSON.stringify(metadata)
        }]
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe(id);
    });

    it('should handle missing content', async () => {
      const id = 'test-embedding-124';
      const content = '';
      const metadata = {};

      await expect(storeEmbedding(id, content, metadata)).rejects.toThrow('Content is required');
    });

    it('should handle Milvus insert errors', async () => {
      const id = 'test-embedding-125';
      const content = 'Test content';
      const metadata = {};
      const insertError = new Error('Milvus insert failed');

      mockMilvusClient.insert.mockRejectedValue(insertError);

      await expect(storeEmbedding(id, content, metadata)).rejects.toThrow('Milvus insert failed');
    });

    it('should generate embeddings for content', async () => {
      const id = 'test-embedding-126';
      const content = 'Test content for embedding generation';
      const metadata = {};

      await storeEmbedding(id, content, metadata);

      const insertCall = mockMilvusClient.insert.mock.calls[0][0];
      expect(insertCall.data[0].embedding).toEqual(expect.any(Array));
      expect(insertCall.data[0].embedding.length).toBeGreaterThan(0);
    });

    it('should stringify metadata correctly', async () => {
      const id = 'test-embedding-127';
      const content = 'Test content';
      const metadata = { 
        type: 'research',
        clientId: 'client-456',
        tags: ['important', 'analysis']
      };

      await storeEmbedding(id, content, metadata);

      const insertCall = mockMilvusClient.insert.mock.calls[0][0];
      expect(insertCall.data[0].metadata).toBe(JSON.stringify(metadata));
    });
  });

  describe('searchSimilar Function', () => {
    it('should search for similar content', async () => {
      const query = 'Find similar analysis reports';
      const limit = 5;

      const results = await searchSimilar(query, limit);

      expect(mockMilvusClient.search).toHaveBeenCalledWith({
        collection_name: 'artefacts',
        vector: expect.any(Array),
        limit: limit,
        metric_type: 'L2',
        params: { nprobe: 10 }
      });
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'result-1',
        score: 0.95,
        content: 'Similar content 1'
      });
    });

    it('should handle empty search results', async () => {
      const query = 'No matching content';
      
      mockMilvusClient.search.mockResolvedValue({
        status: 'success',
        results: []
      });

      const results = await searchSimilar(query);

      expect(results).toEqual([]);
    });

    it('should handle search errors', async () => {
      const query = 'Test query';
      const searchError = new Error('Milvus search failed');

      mockMilvusClient.search.mockRejectedValue(searchError);

      await expect(searchSimilar(query)).rejects.toThrow('Milvus search failed');
    });

    it('should use default limit when not specified', async () => {
      const query = 'Test query without limit';

      await searchSimilar(query);

      expect(mockMilvusClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5
        })
      );
    });

    it('should generate query embeddings', async () => {
      const query = 'Test query for embedding generation';

      await searchSimilar(query);

      const searchCall = mockMilvusClient.search.mock.calls[0][0];
      expect(searchCall.vector).toEqual(expect.any(Array));
      expect(searchCall.vector.length).toBeGreaterThan(0);
    });
  });

  describe('initializeVectorStore Function', () => {
    it('should initialize vector store successfully', async () => {
      mockMilvusClient.hasCollection.mockResolvedValue({ value: false });
      mockMilvusClient.createCollection.mockResolvedValue({ status: 'success' });

      const result = await initializeVectorStore();

      expect(mockMilvusClient.connectToMilvusServer).toHaveBeenCalled();
      expect(mockMilvusClient.hasCollection).toHaveBeenCalledWith({ collection_name: 'artefacts' });
      expect(mockMilvusClient.createCollection).toHaveBeenCalled();
      expect(mockMilvusClient.loadCollection).toHaveBeenCalledWith({ collection_name: 'artefacts' });
      expect(result.success).toBe(true);
    });

    it('should skip collection creation if already exists', async () => {
      mockMilvusClient.hasCollection.mockResolvedValue({ value: true });

      const result = await initializeVectorStore();

      expect(mockMilvusClient.createCollection).not.toHaveBeenCalled();
      expect(mockMilvusClient.loadCollection).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Failed to connect to Milvus');
      mockMilvusClient.connectToMilvusServer.mockRejectedValue(connectionError);

      await expect(initializeVectorStore()).rejects.toThrow('Failed to connect to Milvus');
    });

    it('should handle collection creation errors', async () => {
      mockMilvusClient.hasCollection.mockResolvedValue({ value: false });
      const createError = new Error('Failed to create collection');
      mockMilvusClient.createCollection.mockRejectedValue(createError);

      await expect(initializeVectorStore()).rejects.toThrow('Failed to create collection');
    });
  });

  describe('Connection Management', () => {
    it('should handle connection configuration', async () => {
      process.env.MILVUS_HOST = 'test-host';
      process.env.MILVUS_PORT = '19530';

      await initializeVectorStore();

      expect(mockMilvusClient.connectToMilvusServer).toHaveBeenCalledWith({
        address: 'test-host:19530'
      });
    });

    it('should use default connection settings', async () => {
      delete process.env.MILVUS_HOST;
      delete process.env.MILVUS_PORT;

      await initializeVectorStore();

      expect(mockMilvusClient.connectToMilvusServer).toHaveBeenCalledWith({
        address: 'localhost:19530'
      });
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed operations', async () => {
      mockMilvusClient.insert
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ status: 'success', insert_cnt: 1, ids: ['retry-id'] });

      const id = 'retry-test';
      const content = 'Retry test content';
      const metadata = {};

      const result = await storeEmbedding(id, content, metadata);

      expect(mockMilvusClient.insert).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should fail after max retries', async () => {
      const persistentError = new Error('Persistent failure');
      mockMilvusClient.insert.mockRejectedValue(persistentError);

      const id = 'fail-test';
      const content = 'Fail test content';
      const metadata = {};

      await expect(storeEmbedding(id, content, metadata)).rejects.toThrow('Persistent failure');
    });
  });
});
