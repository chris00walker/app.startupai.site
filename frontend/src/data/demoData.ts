// Demo data for Interactive Demo Mode
// Sample client: TechStart Inc. - AI-powered fitness app

export const demoClient = {
  id: "demo-techstart",
  name: "TechStart Inc.",
  industry: "Health & Fitness Technology",
  description: "AI-powered personalized fitness coaching app",
  stage: "validation",
  createdAt: "2024-01-15",
}

// Value Proposition Canvas Demo Data
export const demoValuePropositionCanvas = {
  id: "demo-vpc-1",
  clientId: "demo-techstart",
  title: "TechStart Inc. - AI Fitness Coach VPC",
  type: "vpc" as const,
  status: "completed" as const,
  createdAt: "2024-01-15",
  updatedAt: "2024-01-20",
  data: {
    customerSegment: {
      customerJobs: [
        "Stay fit and healthy",
        "Track workout progress",
        "Get personalized fitness guidance",
        "Maintain motivation and consistency",
        "Learn proper exercise techniques"
      ],
      pains: [
        "Lack of personalized workout plans",
        "Difficulty staying motivated",
        "Expensive personal trainers",
        "Confusing fitness information online",
        "Time constraints for gym visits",
        "Fear of injury from improper form"
      ],
      gains: [
        "Improved physical fitness",
        "Increased energy levels",
        "Better health metrics",
        "Confidence in workouts",
        "Flexible workout scheduling",
        "Cost-effective fitness solution"
      ]
    },
    valueProposition: {
      products: [
        "AI-powered workout generator",
        "Real-time form correction",
        "Progress tracking dashboard",
        "Nutrition recommendations",
        "Community challenges",
        "Wearable device integration"
      ],
      painRelievers: [
        "Personalized AI coaching eliminates generic programs",
        "Gamification features boost motivation",
        "Affordable alternative to personal trainers",
        "Curated, science-backed fitness content",
        "Home workout options save time",
        "Computer vision prevents injury"
      ],
      gainCreators: [
        "Adaptive AI learns user preferences",
        "Real-time biometric feedback",
        "Comprehensive health analytics",
        "Expert-validated exercise library",
        "Flexible scheduling system",
        "Premium features at fraction of trainer cost"
      ]
    }
  },
  qualityScore: 92,
  aiInsights: [
    "Strong alignment between customer pains and pain relievers",
    "AI differentiation creates clear competitive advantage",
    "Multiple revenue streams possible (freemium, premium, corporate)",
    "High scalability potential with digital-first approach"
  ]
}

// Business Model Canvas Demo Data
export const demoBusinessModelCanvas = {
  id: "demo-bmc-1",
  clientId: "demo-techstart",
  title: "TechStart Inc. - AI Fitness Coach BMC",
  type: "bmc" as const,
  status: "completed" as const,
  createdAt: "2024-01-16",
  updatedAt: "2024-01-22",
  data: {
    keyPartners: [
      "Wearable device manufacturers (Apple, Fitbit, Garmin)",
      "Fitness equipment brands",
      "Nutrition supplement companies",
      "Health insurance providers",
      "Corporate wellness programs",
      "Fitness influencers and trainers"
    ],
    keyActivities: [
      "AI algorithm development and training",
      "Mobile app development and maintenance",
      "User data analysis and insights",
      "Content creation (workouts, nutrition)",
      "Customer support and community management",
      "Partnership development and integration"
    ],
    keyResources: [
      "Proprietary AI fitness algorithms",
      "Large dataset of workout and health data",
      "Mobile development team",
      "AI/ML engineering expertise",
      "Brand and user community",
      "Technology infrastructure (cloud, APIs)"
    ],
    valuePropositions: [
      "Personalized AI fitness coaching at scale",
      "Real-time form correction and injury prevention",
      "Adaptive workout plans based on progress",
      "Comprehensive health and fitness tracking",
      "Affordable alternative to personal trainers",
      "Flexible, anywhere, anytime fitness solution"
    ],
    customerRelationships: [
      "Automated AI-driven personalization",
      "Community-driven support and motivation",
      "Regular app updates and new features",
      "Customer success and onboarding programs",
      "Social features and challenges",
      "Premium customer support tiers"
    ],
    channels: [
      "Mobile app stores (iOS, Android)",
      "Digital marketing (social media, Google Ads)",
      "Influencer partnerships and endorsements",
      "Corporate wellness program partnerships",
      "Referral and word-of-mouth programs",
      "Health and fitness trade shows"
    ],
    customerSegments: [
      "Busy professionals (25-45) seeking efficient workouts",
      "Fitness beginners needing guidance and motivation",
      "Budget-conscious individuals avoiding gym costs",
      "Remote workers lacking gym access",
      "Health-conscious individuals tracking metrics",
      "Corporate employees in wellness programs"
    ],
    costStructure: [
      "AI/ML development and infrastructure (40%)",
      "Mobile app development and maintenance (25%)",
      "Customer acquisition and marketing (20%)",
      "Personnel costs (engineering, support) (10%)",
      "Third-party integrations and APIs (3%)",
      "Legal, compliance, and administrative (2%)"
    ],
    revenueStreams: [
      "Freemium subscription model ($9.99/month premium)",
      "Corporate wellness program licensing ($5/employee/month)",
      "In-app purchases (specialized programs, nutrition plans)",
      "Affiliate commissions (equipment, supplements)",
      "Data insights licensing (anonymized, aggregated)",
      "White-label licensing to gyms and trainers"
    ]
  },
  qualityScore: 89,
  aiInsights: [
    "Strong recurring revenue potential with subscription model",
    "Multiple customer segments reduce market risk",
    "AI differentiation creates defensible competitive moat",
    "Scalable business model with high gross margins",
    "Partnership opportunities enhance value proposition"
  ]
}

// Testing Business Ideas Demo Data
export const demoTestingBusinessIdeas = {
  id: "demo-tbi-1",
  clientId: "demo-techstart",
  title: "TechStart Inc. - AI Fitness Coach Validation",
  type: "tbi" as const,
  status: "in-progress" as const,
  createdAt: "2024-01-18",
  updatedAt: "2024-01-25",
  data: {
    hypotheses: [
      {
        id: "h1",
        category: "Desirability",
        hypothesis: "Busy professionals will pay $9.99/month for AI-powered personalized fitness coaching",
        testMethod: "Landing page conversion test",
        successCriteria: ">3% conversion rate from landing page to email signup",
        status: "validated",
        results: "4.2% conversion rate, 1,247 email signups in 2 weeks",
        confidence: "high",
        evidence: ["Landing page analytics", "User survey responses", "Email engagement rates"]
      },
      {
        id: "h2",
        category: "Feasibility",
        hypothesis: "Computer vision can accurately detect exercise form with 90%+ accuracy",
        testMethod: "Technical prototype testing",
        successCriteria: ">90% accuracy in form detection across 20 common exercises",
        status: "validated",
        results: "92.3% average accuracy across test exercises",
        confidence: "high",
        evidence: ["Technical testing results", "Beta user feedback", "Expert trainer validation"]
      },
      {
        id: "h3",
        category: "Viability",
        hypothesis: "Customer acquisition cost will be under $25 per user",
        testMethod: "Paid advertising campaigns",
        successCriteria: "CAC < $25 with LTV:CAC ratio > 3:1",
        status: "testing",
        results: "Current CAC: $31, testing optimization strategies",
        confidence: "medium",
        evidence: ["Facebook Ads performance", "Google Ads analytics", "Organic acquisition data"]
      },
      {
        id: "h4",
        category: "Desirability",
        hypothesis: "Users will engage with the app 3+ times per week consistently",
        testMethod: "Beta user behavior analysis",
        successCriteria: ">60% of users maintain 3+ sessions/week after 30 days",
        status: "validated",
        results: "67% of beta users maintain target engagement",
        confidence: "high",
        evidence: ["App analytics", "User retention data", "Engagement surveys"]
      },
      {
        id: "h5",
        category: "Viability",
        hypothesis: "Corporate wellness programs will pay $5/employee/month",
        testMethod: "B2B pilot program",
        successCriteria: "3+ corporate clients sign pilot agreements",
        status: "testing",
        results: "2 pilot agreements signed, 3 more in negotiation",
        confidence: "medium",
        evidence: ["Pilot agreements", "Corporate feedback", "Pricing sensitivity analysis"]
      }
    ],
    experiments: [
      {
        id: "e1",
        name: "Landing Page Conversion Test",
        hypothesis: "h1",
        startDate: "2024-01-10",
        endDate: "2024-01-24",
        status: "completed",
        budget: 2500,
        results: {
          visitors: 29650,
          conversions: 1247,
          conversionRate: 4.2,
          insights: ["Value proposition resonates with target audience", "Price point acceptable", "AI coaching concept generates interest"]
        }
      },
      {
        id: "e2",
        name: "Form Detection Prototype",
        hypothesis: "h2",
        startDate: "2024-01-05",
        endDate: "2024-01-20",
        status: "completed",
        budget: 15000,
        results: {
          accuracy: 92.3,
          exercisesTested: 20,
          testSessions: 500,
          insights: ["Computer vision highly accurate for major exercises", "Lighting conditions affect accuracy", "User feedback positive on form corrections"]
        }
      },
      {
        id: "e3",
        name: "Paid Acquisition Optimization",
        hypothesis: "h3",
        startDate: "2024-01-15",
        endDate: "2024-02-15",
        status: "running",
        budget: 10000,
        results: {
          currentCAC: 31,
          targetCAC: 25,
          optimizationsAttempted: 8,
          insights: ["Facebook performs better than Google for this audience", "Video ads outperform static images", "Targeting refinement needed"]
        }
      }
    ],
    riskAssessment: {
      high: [
        "Customer acquisition costs higher than projected",
        "Competition from established fitness apps"
      ],
      medium: [
        "Technical challenges with computer vision accuracy",
        "User retention after initial enthusiasm"
      ],
      low: [
        "Regulatory compliance for health data",
        "Scaling infrastructure costs"
      ]
    },
    nextSteps: [
      "Optimize paid acquisition campaigns to reduce CAC",
      "Launch corporate wellness pilot programs",
      "Develop advanced AI features for competitive differentiation",
      "Prepare for Series A funding round"
    ]
  },
  qualityScore: 87,
  aiInsights: [
    "Strong validation on desirability and feasibility",
    "Viability concerns around customer acquisition costs need attention",
    "Corporate B2B channel shows promise for revenue diversification",
    "Technical differentiation validated, creates competitive advantage"
  ]
}

// Demo Dashboard Metrics
export const demoMetrics = {
  activeClients: 1,
  canvasGenerated: 3,
  workflowSuccessRate: 94,
  costEfficiency: 1.2,
  avgGenerationTime: "1.8s",
  clientSatisfaction: 4.8
}

// Demo Active Workflows
export const demoActiveWorkflows = [
  {
    id: "demo-workflow-1",
    client: "TechStart Inc.",
    type: "Testing Business Ideas",
    progress: 75,
    status: "running" as const,
    estimatedCompletion: "2 hours",
    agent: "Validation Agent",
    description: "Running hypothesis validation experiments"
  },
  {
    id: "demo-workflow-2",
    client: "TechStart Inc.",
    type: "Market Analysis",
    progress: 100,
    status: "completed" as const,
    estimatedCompletion: "Completed",
    agent: "Research Agent",
    description: "Competitive landscape analysis complete"
  }
]

// Demo Recent Activity
export const demoRecentActivity = [
  {
    id: "demo-activity-1",
    type: "canvas_generated",
    title: "Business Model Canvas completed",
    client: "TechStart Inc.",
    timestamp: "2 hours ago",
    status: "success"
  },
  {
    id: "demo-activity-2",
    type: "hypothesis_validated",
    title: "Desirability hypothesis validated",
    client: "TechStart Inc.",
    timestamp: "4 hours ago",
    status: "success"
  },
  {
    id: "demo-activity-3",
    type: "experiment_completed",
    title: "Landing page conversion test completed",
    client: "TechStart Inc.",
    timestamp: "1 day ago",
    status: "success"
  },
  {
    id: "demo-activity-4",
    type: "canvas_generated",
    title: "Value Proposition Canvas completed",
    client: "TechStart Inc.",
    timestamp: "2 days ago",
    status: "success"
  }
]
