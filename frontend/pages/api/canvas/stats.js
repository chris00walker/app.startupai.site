/**
 * Canvas Stats API Route
 * 
 * Provides dashboard statistics for canvas management
 */

import { Canvas } from '@/lib/models/Canvas';
import { Client } from '@/lib/models/Client';
import { connectDB } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  await connectDB();

  try {
    // Get date ranges
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalCanvases,
      recentActivity,
      totalClients,
      qualityStats,
      typeDistribution,
      recentCanvases
    ] = await Promise.all([
      // Total canvases
      Canvas.countDocuments(),
      
      // Recent activity (canvases updated in last week)
      Canvas.countDocuments({ 
        updatedAt: { $gte: lastWeek } 
      }),
      
      // Total clients with canvases
      Canvas.distinct('clientId').then(clientIds => clientIds.length),
      
      // Quality statistics
      Canvas.aggregate([
        {
          $group: {
            _id: null,
            avgQuality: { $avg: '$metadata.qualityScore' },
            highQuality: {
              $sum: {
                $cond: [{ $gte: ['$metadata.qualityScore', 0.8] }, 1, 0]
              }
            },
            totalWithQuality: {
              $sum: {
                $cond: [{ $exists: '$metadata.qualityScore' }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Canvas type distribution
      Canvas.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent canvases for activity feed
      Canvas.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('clientId', 'name')
        .select('name type updatedAt clientId metadata.qualityScore')
        .lean()
    ]);

    // Calculate completion rate (high quality canvases / total canvases)
    const qualityData = qualityStats[0] || { avgQuality: 0, highQuality: 0, totalWithQuality: 0 };
    const completionRate = totalCanvases > 0 
      ? Math.round((qualityData.highQuality / totalCanvases) * 100)
      : 0;

    // Format type distribution
    const typeStats = typeDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Format recent activity
    const activityFeed = recentCanvases.map(canvas => ({
      id: canvas._id,
      name: canvas.name,
      type: canvas.type,
      clientName: canvas.clientId?.name || 'Unknown Client',
      updatedAt: canvas.updatedAt,
      qualityScore: canvas.metadata?.qualityScore || 0
    }));

    const stats = {
      totalCanvases,
      recentActivity,
      collaborators: totalClients,
      completionRate,
      averageQuality: Math.round((qualityData.avgQuality || 0) * 100),
      typeDistribution: {
        valueProposition: typeStats.valueProposition || 0,
        businessModel: typeStats.businessModel || 0,
        testingBusinessIdeas: typeStats.testingBusinessIdeas || 0
      },
      activityFeed,
      trends: {
        canvasGrowth: await calculateGrowthRate('canvas', lastMonth),
        qualityImprovement: await calculateQualityTrend(lastMonth),
        clientEngagement: await calculateEngagementRate(lastWeek)
      }
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching canvas stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
}

// Helper function to calculate growth rate
async function calculateGrowthRate(type, fromDate) {
  try {
    const currentCount = await Canvas.countDocuments({
      createdAt: { $gte: fromDate }
    });
    
    const previousPeriod = new Date(fromDate.getTime() - (Date.now() - fromDate.getTime()));
    const previousCount = await Canvas.countDocuments({
      createdAt: { 
        $gte: previousPeriod,
        $lt: fromDate
      }
    });

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    
    return Math.round(((currentCount - previousCount) / previousCount) * 100);
  } catch (error) {
    console.error('Error calculating growth rate:', error);
    return 0;
  }
}

// Helper function to calculate quality trend
async function calculateQualityTrend(fromDate) {
  try {
    const recentQuality = await Canvas.aggregate([
      {
        $match: {
          updatedAt: { $gte: fromDate },
          'metadata.qualityScore': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$metadata.qualityScore' }
        }
      }
    ]);

    const previousPeriod = new Date(fromDate.getTime() - (Date.now() - fromDate.getTime()));
    const previousQuality = await Canvas.aggregate([
      {
        $match: {
          updatedAt: { 
            $gte: previousPeriod,
            $lt: fromDate
          },
          'metadata.qualityScore': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$metadata.qualityScore' }
        }
      }
    ]);

    const current = recentQuality[0]?.avgQuality || 0;
    const previous = previousQuality[0]?.avgQuality || 0;

    if (previous === 0) return current > 0 ? 100 : 0;
    
    return Math.round(((current - previous) / previous) * 100);
  } catch (error) {
    console.error('Error calculating quality trend:', error);
    return 0;
  }
}

// Helper function to calculate engagement rate
async function calculateEngagementRate(fromDate) {
  try {
    const activeClients = await Canvas.distinct('clientId', {
      updatedAt: { $gte: fromDate }
    });
    
    const totalClients = await Canvas.distinct('clientId');
    
    if (totalClients.length === 0) return 0;
    
    return Math.round((activeClients.length / totalClients.length) * 100);
  } catch (error) {
    console.error('Error calculating engagement rate:', error);
    return 0;
  }
}
