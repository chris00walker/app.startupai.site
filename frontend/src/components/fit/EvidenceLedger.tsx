"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Search,
  Plus,
  Download,
  Eye,
  Link,
  AlertTriangle,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Filter
} from "lucide-react"

interface EvidenceItem {
  id: string
  title: string
  category: "Survey" | "Interview" | "Experiment" | "Analytics" | "Research"
  summary: string
  fullText: string
  strength: "weak" | "medium" | "strong"
  isContradiction: boolean
  fitType: "Desirability" | "Feasibility" | "Viability"
  date: string
  author: string
  source: string
  linkedAssumptions: string[]
}

interface FilterState {
  search: string
  fitType: string
  strength: string
  contradictions: string
}

const mockEvidenceData: EvidenceItem[] = [
  {
    id: "1",
    title: "Customer Interview #12",
    category: "Interview",
    summary: "Small business owner expressed frustration with current inventory tools, willing to pay $40/month for better solution.",
    fullText: "Interviewed Sarah, owner of a local boutique with 50 SKUs. Current system (Excel + manual counts) takes 4 hours weekly. Major pain points: no real-time updates, frequent stockouts, manual reorder calculations. When shown mockup, immediately interested. Price sensitivity: comfortable up to $50/month, sweet spot around $40. Prefers mobile access for on-the-go inventory checks.",
    strength: "strong",
    isContradiction: false,
    fitType: "Desirability",
    date: "2024-08-25",
    author: "Research Team",
    source: "User Interview",
    linkedAssumptions: ["Small business owners struggle with inventory management", "Price sensitivity is below $50/month"]
  },
  {
    id: "2", 
    title: "Competitor Analysis - Square",
    category: "Research",
    summary: "Square's inventory module has 2.3/5 stars, users complain about complexity and mobile limitations.",
    fullText: "Analyzed Square's inventory management features and user reviews. 847 reviews on app store with average 2.3/5 rating. Common complaints: overly complex interface (mentioned in 34% of reviews), poor mobile experience (28%), expensive for small businesses (22%). Positive mentions: integration with POS (45%), reliable syncing (31%). This validates our mobile-first, simplified approach.",
    strength: "medium",
    isContradiction: false,
    fitType: "Desirability",
    date: "2024-08-23",
    author: "Market Research",
    source: "Competitive Analysis",
    linkedAssumptions: ["Users prefer mobile-first solutions"]
  },
  {
    id: "3",
    title: "Price Sensitivity Survey Results",
    category: "Survey",
    summary: "42% of respondents indicated $50+ monthly cost would be prohibitive for their business.",
    fullText: "Survey of 150 small business owners across retail, food service, and services sectors. Price sensitivity analysis: 42% said $50+ would be too expensive, 31% comfortable with $30-50 range, 27% would pay $50+ for the right features. However, when shown feature comparison with competitors, 58% said they'd pay premium for mobile-first design and automated reordering.",
    strength: "strong",
    isContradiction: true,
    fitType: "Desirability",
    date: "2024-08-20",
    author: "Survey Team",
    source: "Customer Survey",
    linkedAssumptions: ["Price sensitivity is below $50/month"]
  },
  {
    id: "4",
    title: "Technical Architecture Review",
    category: "Research",
    summary: "Development team estimates 8-10 months for MVP delivery, not 6 months as initially planned.",
    fullText: "Detailed technical review with senior developers. Key findings: Real-time inventory syncing requires more complex architecture than anticipated. Database design for multi-location support adds 2 months. Mobile app development (iOS + Android) needs 3 months minimum. Integration with existing POS systems requires extensive testing. Revised timeline: 8-10 months for MVP, 12-14 months for full feature set.",
    strength: "strong",
    isContradiction: true,
    fitType: "Feasibility",
    date: "2024-08-18",
    author: "Tech Team",
    source: "Internal Review",
    linkedAssumptions: ["Technical team can deliver MVP in 6 months"]
  },
  {
    id: "5",
    title: "Beta User Feedback - Mobile App",
    category: "Experiment",
    summary: "Beta testers rate mobile interface 4.2/5, with 89% saying they'd recommend to other business owners.",
    fullText: "Beta test with 25 small business owners over 2 weeks. Mobile app prototype testing results: Average rating 4.2/5. Key positive feedback: intuitive interface (92% positive), quick inventory updates (88% positive), barcode scanning feature (96% positive). Areas for improvement: reporting features too basic (67% feedback), needs better low-stock alerts (54% feedback). Recommendation rate: 89% would recommend to peers.",
    strength: "strong",
    isContradiction: false,
    fitType: "Desirability",
    date: "2024-08-15",
    author: "Product Team",
    source: "Beta Testing",
    linkedAssumptions: ["Users prefer mobile-first solutions"]
  },
  {
    id: "6",
    title: "Pricing Sensitivity Analysis",
    category: "Survey",
    summary: "Market research shows 67% of target customers willing to pay $49/month, but resistance above $75/month.",
    fullText: "Comprehensive pricing study with 200 small business owners across retail, food service, and professional services. Key findings: Price acceptance at $29/month: 89%, at $49/month: 67%, at $75/month: 31%, at $99/month: 12%. Sweet spot identified at $49-59/month range. Premium features (advanced analytics, multi-location) justify $20-30 premium. Competitor analysis shows average market price of $52/month. Recommendation: Launch at $49/month with $69 premium tier.",
    strength: "strong",
    isContradiction: false,
    fitType: "Viability",
    date: "2024-08-20",
    author: "Market Research Team",
    source: "Customer Survey",
    linkedAssumptions: ["Customers will pay $75/month for premium features"]
  },
  {
    id: "7", 
    title: "Unit Economics Validation",
    category: "Analytics",
    summary: "Customer Acquisition Cost: $127, Lifetime Value: $890, payback period: 3.2 months - healthy unit economics confirmed.",
    fullText: "Detailed financial analysis based on 6 months of customer data. Customer Acquisition Cost breakdown: Marketing spend $89, sales team cost $23, onboarding cost $15 = $127 total. Customer Lifetime Value calculation: Average monthly revenue $49, gross margin 73%, average retention 18 months = $890 LTV. LTV:CAC ratio of 7:1 exceeds industry benchmark of 3:1. Payback period of 3.2 months is well within acceptable range. Monthly churn rate: 4.2%. Expansion revenue: 23% of customers upgrade within 6 months.",
    strength: "strong",
    isContradiction: false,
    fitType: "Viability",
    date: "2024-08-22",
    author: "Finance Team",
    source: "Internal Analytics",
    linkedAssumptions: ["Unit economics will be profitable with $50/month pricing"]
  },
  {
    id: "8",
    title: "Revenue Model Experiment",
    category: "Experiment", 
    summary: "A/B test shows subscription model generates 340% more revenue than one-time purchase over 12 months.",
    fullText: "Split test with 100 customers over 3 months comparing business models. Group A (50 customers): One-time purchase at $299. Group B (50 customers): Monthly subscription at $49/month. Results after 12 months: Group A total revenue: $14,950 (no recurring revenue). Group B total revenue: $23,520 (average 12-month retention). Subscription model benefits: predictable cash flow, higher customer engagement, easier upselling. Customer feedback: 78% prefer subscription for cash flow management. Churn analysis: 85% of subscribers active after 6 months vs 23% one-time purchasers still engaged.",
    strength: "strong",
    isContradiction: false,
    fitType: "Viability",
    date: "2024-08-25",
    author: "Revenue Team", 
    source: "A/B Test",
    linkedAssumptions: ["Subscription model will outperform one-time purchases"]
  },
  {
    id: "9",
    title: "Break-Even Analysis Update",
    category: "Research",
    summary: "Updated projections show break-even at 847 customers (month 14), with current growth rate achieving this by month 16.",
    fullText: "Comprehensive financial modeling based on current performance data. Fixed costs: $28,500/month (team salaries, infrastructure, overhead). Variable costs: $14/customer/month (hosting, support, payment processing). Contribution margin: $35/customer/month at $49 pricing. Break-even calculation: 847 customers needed. Current metrics: 312 customers (month 6), 18% monthly growth rate, 4.2% monthly churn. Growth projection: Month 12: 623 customers, Month 14: 847 customers, Month 16: 1,156 customers. Sensitivity analysis: 15% growth rate = break-even month 18, 22% growth rate = break-even month 12.",
    strength: "medium",
    isContradiction: true,
    fitType: "Viability", 
    date: "2024-08-28",
    author: "CFO",
    source: "Financial Model",
    linkedAssumptions: ["Break-even achievable within 12 months"]
  },
  {
    id: "10",
    title: "Cloud Infrastructure Scalability Test",
    category: "Experiment",
    summary: "Load testing confirms system can handle 10,000 concurrent users with 99.7% uptime and <200ms response times.",
    fullText: "Comprehensive infrastructure testing using AWS load testing tools. Test parameters: 10,000 concurrent users, 50,000 API calls/minute, 2TB data processing. Results: Average response time 147ms, 99th percentile 198ms, 99.7% uptime maintained. Database performance: Query optimization reduced load by 40%. Auto-scaling triggered at 70% capacity, seamlessly handled traffic spikes. Cost analysis: Infrastructure costs scale linearly at $0.12 per additional user/month. Bottlenecks identified: Image processing queue (resolved with additional workers), payment processing (upgraded to enterprise tier).",
    strength: "strong",
    isContradiction: false,
    fitType: "Feasibility",
    date: "2024-08-19",
    author: "DevOps Team",
    source: "Load Testing",
    linkedAssumptions: ["Infrastructure can scale to support 5,000+ users"]
  },
  {
    id: "11",
    title: "Distribution Channel Validation",
    category: "Survey",
    summary: "Partner channel testing shows 73% of retail software resellers interested in carrying our product with 35% margin.",
    fullText: "Market research with 150 software resellers and system integrators across North America. Key findings: 73% expressed interest in partnership, 35% margin acceptable to 89% of partners, average partner can reach 200-500 SMB customers. Channel requirements: Marketing co-op fund (3% of revenue), technical training program, dedicated partner portal. Competitive analysis: Similar products offer 30-40% margins. Revenue projection: Partner channel could generate 40% of total sales within 18 months. Implementation timeline: 3 months for partner portal, 6 months for first 10 partners onboarded.",
    strength: "strong",
    isContradiction: false,
    fitType: "Feasibility",
    date: "2024-08-21",
    author: "Sales Team",
    source: "Partner Survey",
    linkedAssumptions: ["Can establish distribution partnerships within 12 months"]
  },
  {
    id: "12",
    title: "Mobile App Development Timeline",
    category: "Research",
    summary: "Cross-platform development using React Native reduces timeline to 4 months vs 8 months for native iOS/Android.",
    fullText: "Technical feasibility study comparing development approaches. Native development: iOS (4 months) + Android (4 months) + maintenance overhead = 8+ months. React Native approach: Single codebase, 4-month timeline, 85% code reuse. Performance testing: React Native achieves 95% of native performance for our use case. Team assessment: 2 React Native developers available vs need to hire iOS/Android specialists. Cost comparison: React Native $120k total vs Native $200k+ total. Risk analysis: React Native maturity high, strong community support, Facebook backing. Recommendation: Proceed with React Native for faster market entry.",
    strength: "strong",
    isContradiction: false,
    fitType: "Feasibility",
    date: "2024-08-17",
    author: "CTO",
    source: "Technical Analysis",
    linkedAssumptions: ["Mobile app required for market success"]
  },
  {
    id: "13",
    title: "Regulatory Compliance Assessment",
    category: "Research",
    summary: "SOC 2 Type II certification achievable in 6 months, required for 67% of enterprise prospects.",
    fullText: "Compliance audit with security consulting firm. Current state: Basic security controls in place, need formal documentation and third-party audit. SOC 2 requirements: Access controls (90% complete), encryption (100% complete), monitoring (70% complete), incident response (60% complete). Timeline: 3 months preparation, 3 months audit process. Cost: $45k consulting + $15k audit fees. Market impact: 67% of enterprise prospects require SOC 2, unlocks $2M+ in potential deals. Additional benefits: GDPR compliance (included), improved security posture, competitive advantage. Risk: Audit failure would delay enterprise sales by 6+ months.",
    strength: "medium",
    isContradiction: false,
    fitType: "Feasibility",
    date: "2024-08-23",
    author: "Security Team",
    source: "Compliance Audit",
    linkedAssumptions: ["Can achieve enterprise compliance requirements"]
  }
]

const categoryIcons = {
  Survey: BarChart3,
  Interview: Users,
  Experiment: FileText,
  Analytics: BarChart3,
  Research: FileText
}

function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  const CategoryIcon = categoryIcons[evidence.category]
  
  const getStrengthColor = () => {
    switch (evidence.strength) {
      case "strong": return "bg-green-500"
      case "medium": return "bg-yellow-500"
      case "weak": return "bg-red-500"
    }
  }

  const getStrengthVariant = () => {
    switch (evidence.strength) {
      case "strong": return "default"
      case "medium": return "secondary"
      case "weak": return "outline"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{evidence.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wide">
                {evidence.category}
              </CardDescription>
            </div>
          </div>
          {evidence.isContradiction && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {evidence.summary}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStrengthVariant()} className="text-xs">
              {evidence.strength} evidence
            </Badge>
            <Badge variant="outline" className="text-xs">
              {evidence.fitType}
            </Badge>
            {evidence.isContradiction && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Contradiction
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{evidence.date}</span>
            <span>{evidence.author}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {evidence.title}
                  </DialogTitle>
                  <DialogDescription>
                    {evidence.category} • {evidence.source} • {evidence.date}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Full Evidence</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {evidence.fullText}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Metadata</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Strength:</span>
                        <Badge variant={getStrengthVariant()} className="ml-2 text-xs">
                          {evidence.strength}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fit Type:</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {evidence.fitType}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Author:</span>
                        <span className="ml-2">{evidence.author}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <span className="ml-2">{evidence.source}</span>
                      </div>
                    </div>
                  </div>

                  {evidence.linkedAssumptions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Linked Assumptions</h4>
                      <div className="space-y-2">
                        {evidence.linkedAssumptions.map((assumption, index) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            {assumption}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm">
              <Link className="h-3 w-3 mr-1" />
              Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EvidenceLedger() {
  const [filters, setFilters] = React.useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const filterParam = urlParams.get('filter')
      let fitType = "all"
      
      if (filterParam === 'desirability') fitType = 'Desirability'
      else if (filterParam === 'feasibility') fitType = 'Feasibility'  
      else if (filterParam === 'viability') fitType = 'Viability'
      
      return {
        search: "",
        fitType,
        strength: "all", 
        contradictions: "all"
      }
    }
    
    return {
      search: "",
      fitType: "all",
      strength: "all", 
      contradictions: "all"
    }
  })

  const filteredEvidence = React.useMemo(() => {
    return mockEvidenceData.filter(evidence => {
      const matchesSearch = evidence.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          evidence.summary.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesFitType = filters.fitType === "all" || evidence.fitType === filters.fitType
      const matchesStrength = filters.strength === "all" || evidence.strength === filters.strength
      const matchesContradictions = filters.contradictions === "all" || 
                                  (filters.contradictions === "contradictions" && evidence.isContradiction)
      
      return matchesSearch && matchesFitType && matchesStrength && matchesContradictions
    })
  }, [filters, mockEvidenceData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Ledger</h1>
          <p className="text-muted-foreground">
            Manage all evidence supporting or contradicting your business assumptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Evidence Pack
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Evidence
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search evidence..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Fit Type</label>
              <Select 
                value={filters.fitType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, fitType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Desirability">Desirability</SelectItem>
                  <SelectItem value="Feasibility">Feasibility</SelectItem>
                  <SelectItem value="Viability">Viability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Evidence Strength</label>
              <Select 
                value={filters.strength} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, strength: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strengths</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contradictions</label>
              <Select 
                value={filters.contradictions} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, contradictions: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Evidence</SelectItem>
                  <SelectItem value="contradictions">Only Contradictions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Grid */}
      {filteredEvidence.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidence.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No evidence found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.search || filters.fitType !== "all" || filters.strength !== "all" || filters.contradictions !== "all"
                ? "Try adjusting your filters to see more evidence."
                : "Start building your evidence base by adding your first piece of evidence."
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Evidence
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
