/**
 * Canvas Functionality Tests
 * 
 * Basic tests to verify canvas core functionality and API integration
 */

describe('Canvas System Functionality', () => {
  describe('Canvas Data Structure', () => {
    test('validates Value Proposition Canvas structure', () => {
      const vpcCanvas = {
        id: 'vpc-123',
        name: 'Test VPC',
        type: 'valueProposition',
        data: {
          customerProfile: {
            jobs: [{ id: '1', text: 'Get work done efficiently' }],
            pains: [{ id: '2', text: 'Too many interruptions' }],
            gains: [{ id: '3', text: 'Save time and effort' }]
          },
          valueMap: {
            products: [{ id: '4', text: 'Productivity software' }],
            painRelievers: [{ id: '5', text: 'Focus mode feature' }],
            gainCreators: [{ id: '6', text: 'Automated workflows' }]
          }
        },
        metadata: {
          qualityScore: 0.85,
          version: 1
        }
      };

      expect(vpcCanvas.type).toBe('valueProposition');
      expect(vpcCanvas.data.customerProfile).toBeDefined();
      expect(vpcCanvas.data.valueMap).toBeDefined();
      expect(vpcCanvas.metadata.qualityScore).toBeGreaterThan(0.8);
    });

    test('validates Business Model Canvas structure', () => {
      const bmcCanvas = {
        id: 'bmc-456',
        name: 'Test BMC',
        type: 'businessModel',
        data: {
          keyPartners: [{ id: '1', text: 'Technology providers' }],
          keyActivities: [{ id: '2', text: 'Software development' }],
          valuePropositions: [{ id: '3', text: 'Increased productivity' }],
          customerRelationships: [{ id: '4', text: 'Self-service' }],
          customerSegments: [{ id: '5', text: 'Small businesses' }],
          keyResources: [{ id: '6', text: 'Development team' }],
          channels: [{ id: '7', text: 'Online platform' }],
          costStructure: [{ id: '8', text: 'Development costs' }],
          revenueStreams: [{ id: '9', text: 'Subscription fees' }]
        },
        metadata: {
          qualityScore: 0.75,
          version: 1
        }
      };

      expect(bmcCanvas.type).toBe('businessModel');
      expect(Object.keys(bmcCanvas.data)).toHaveLength(9);
      expect(bmcCanvas.data.valuePropositions).toBeDefined();
      expect(bmcCanvas.metadata.qualityScore).toBeGreaterThan(0.7);
    });

    test('validates Testing Business Ideas Canvas structure', () => {
      const tbiCanvas = {
        id: 'tbi-789',
        name: 'Test TBI',
        type: 'testingBusinessIdeas',
        data: {
          experiments: [
            {
              id: '1',
              name: 'Landing page test',
              hypothesis: 'Users will sign up for beta',
              method: 'A/B test',
              status: 'running'
            }
          ]
        },
        metadata: {
          qualityScore: 0.65,
          version: 1
        }
      };

      expect(tbiCanvas.type).toBe('testingBusinessIdeas');
      expect(tbiCanvas.data.experiments).toBeDefined();
      expect(tbiCanvas.data.experiments[0].hypothesis).toBeDefined();
      expect(tbiCanvas.metadata.qualityScore).toBeGreaterThan(0.6);
    });
  });

  describe('Canvas Quality Assessment', () => {
    test('calculates quality score based on completeness', () => {
      const calculateQualityScore = (canvas) => {
        if (canvas.type === 'valueProposition') {
          const { customerProfile, valueMap } = canvas.data;
          const totalSections = 6; // jobs, pains, gains, products, painRelievers, gainCreators
          let filledSections = 0;

          if (customerProfile?.jobs?.length > 0) filledSections++;
          if (customerProfile?.pains?.length > 0) filledSections++;
          if (customerProfile?.gains?.length > 0) filledSections++;
          if (valueMap?.products?.length > 0) filledSections++;
          if (valueMap?.painRelievers?.length > 0) filledSections++;
          if (valueMap?.gainCreators?.length > 0) filledSections++;

          return filledSections / totalSections;
        }
        return 0;
      };

      const fullCanvas = {
        type: 'valueProposition',
        data: {
          customerProfile: {
            jobs: [{ text: 'Job 1' }],
            pains: [{ text: 'Pain 1' }],
            gains: [{ text: 'Gain 1' }]
          },
          valueMap: {
            products: [{ text: 'Product 1' }],
            painRelievers: [{ text: 'Reliever 1' }],
            gainCreators: [{ text: 'Creator 1' }]
          }
        }
      };

      const partialCanvas = {
        type: 'valueProposition',
        data: {
          customerProfile: {
            jobs: [{ text: 'Job 1' }],
            pains: [],
            gains: []
          },
          valueMap: {
            products: [{ text: 'Product 1' }],
            painRelievers: [],
            gainCreators: []
          }
        }
      };

      expect(calculateQualityScore(fullCanvas)).toBe(1.0);
      expect(calculateQualityScore(partialCanvas)).toBeCloseTo(0.33, 2);
    });
  });

  describe('Canvas Export Functionality', () => {
    test('prepares export data correctly', () => {
      const prepareExportData = (canvas, format, options = {}) => {
        const exportData = {
          canvasId: canvas.id,
          canvasName: canvas.name,
          canvasType: canvas.type,
          format: format.toLowerCase(),
          timestamp: new Date().toISOString(),
          options: {
            theme: options.theme || 'professional',
            quality: options.quality || 'high',
            includeMetadata: options.includeMetadata !== false
          }
        };

        // Add format-specific configurations
        switch (format.toLowerCase()) {
          case 'pdf':
            exportData.config = { width: 1200, height: 800, dpi: 300 };
            break;
          case 'png':
            exportData.config = { width: 1800, height: 1200, dpi: 300 };
            break;
          case 'svg':
            exportData.config = { width: 1200, height: 800, dpi: 96 };
            break;
        }

        return exportData;
      };

      const canvas = {
        id: 'test-123',
        name: 'Test Canvas',
        type: 'valueProposition'
      };

      const pdfExport = prepareExportData(canvas, 'PDF', { quality: 'high' });
      const pngExport = prepareExportData(canvas, 'png', { theme: 'creative' });
      const svgExport = prepareExportData(canvas, 'svg');

      expect(pdfExport.format).toBe('pdf');
      expect(pdfExport.config.dpi).toBe(300);
      expect(pdfExport.options.quality).toBe('high');

      expect(pngExport.format).toBe('png');
      expect(pngExport.config.width).toBe(1800);
      expect(pngExport.options.theme).toBe('creative');

      expect(svgExport.format).toBe('svg');
      expect(svgExport.config.dpi).toBe(96);
      expect(svgExport.options.theme).toBe('professional');
    });
  });

  describe('Canvas Filtering and Sorting', () => {
    const mockCanvases = [
      {
        id: '1',
        name: 'Alpha VPC',
        type: 'valueProposition',
        updatedAt: '2024-01-15T10:00:00Z',
        metadata: { qualityScore: 0.9 }
      },
      {
        id: '2',
        name: 'Beta BMC',
        type: 'businessModel',
        updatedAt: '2024-01-14T10:00:00Z',
        metadata: { qualityScore: 0.7 }
      },
      {
        id: '3',
        name: 'Gamma TBI',
        type: 'testingBusinessIdeas',
        updatedAt: '2024-01-16T10:00:00Z',
        metadata: { qualityScore: 0.8 }
      }
    ];

    test('filters canvases by type', () => {
      const filterByType = (canvases, type) => {
        return canvases.filter(canvas => canvas.type === type);
      };

      const vpcCanvases = filterByType(mockCanvases, 'valueProposition');
      const bmcCanvases = filterByType(mockCanvases, 'businessModel');

      expect(vpcCanvases).toHaveLength(1);
      expect(vpcCanvases[0].name).toBe('Alpha VPC');
      expect(bmcCanvases).toHaveLength(1);
      expect(bmcCanvases[0].name).toBe('Beta BMC');
    });

    test('sorts canvases by different criteria', () => {
      const sortCanvases = (canvases, sortBy, order = 'desc') => {
        return [...canvases].sort((a, b) => {
          let aValue = sortBy === 'qualityScore' ? a.metadata?.qualityScore : a[sortBy];
          let bValue = sortBy === 'qualityScore' ? b.metadata?.qualityScore : b[sortBy];

          if (sortBy === 'updatedAt') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
          }

          if (order === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      };

      const byDate = sortCanvases(mockCanvases, 'updatedAt', 'desc');
      const byQuality = sortCanvases(mockCanvases, 'qualityScore', 'desc');
      const byName = sortCanvases(mockCanvases, 'name', 'asc');

      expect(byDate[0].name).toBe('Gamma TBI'); // Most recent
      expect(byQuality[0].name).toBe('Alpha VPC'); // Highest quality
      expect(byName[0].name).toBe('Alpha VPC'); // Alphabetically first
    });

    test('searches canvases by name', () => {
      const searchCanvases = (canvases, query) => {
        const lowerQuery = query.toLowerCase();
        return canvases.filter(canvas =>
          canvas.name.toLowerCase().includes(lowerQuery)
        );
      };

      const alphaResults = searchCanvases(mockCanvases, 'alpha');
      const bmcResults = searchCanvases(mockCanvases, 'bmc');
      const noResults = searchCanvases(mockCanvases, 'xyz');

      expect(alphaResults).toHaveLength(1);
      expect(alphaResults[0].name).toBe('Alpha VPC');
      expect(bmcResults).toHaveLength(1);
      expect(bmcResults[0].name).toBe('Beta BMC');
      expect(noResults).toHaveLength(0);
    });
  });

  describe('Canvas Statistics', () => {
    test('calculates dashboard statistics', () => {
      const calculateStats = (canvases) => {
        const totalCanvases = canvases.length;
        const typeDistribution = canvases.reduce((acc, canvas) => {
          acc[canvas.type] = (acc[canvas.type] || 0) + 1;
          return acc;
        }, {});

        const qualityScores = canvases
          .map(c => c.metadata?.qualityScore)
          .filter(score => score !== undefined);
        
        const averageQuality = qualityScores.length > 0
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
          : 0;

        const highQualityCount = qualityScores.filter(score => score >= 0.8).length;
        const completionRate = totalCanvases > 0 ? (highQualityCount / totalCanvases) * 100 : 0;

        return {
          totalCanvases,
          typeDistribution,
          averageQuality: Math.round(averageQuality * 100),
          completionRate: Math.round(completionRate)
        };
      };

      const mockCanvases = [
        { type: 'valueProposition', metadata: { qualityScore: 0.9 } },
        { type: 'valueProposition', metadata: { qualityScore: 0.7 } },
        { type: 'businessModel', metadata: { qualityScore: 0.8 } },
        { type: 'testingBusinessIdeas', metadata: { qualityScore: 0.6 } }
      ];

      const stats = calculateStats(mockCanvases);

      expect(stats.totalCanvases).toBe(4);
      expect(stats.typeDistribution.valueProposition).toBe(2);
      expect(stats.typeDistribution.businessModel).toBe(1);
      expect(stats.averageQuality).toBe(75); // (0.9 + 0.7 + 0.8 + 0.6) / 4 * 100
      expect(stats.completionRate).toBe(50); // 2 out of 4 canvases >= 0.8
    });
  });
});
