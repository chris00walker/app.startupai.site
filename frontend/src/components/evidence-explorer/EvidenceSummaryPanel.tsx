'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Heart,
  Cog,
  DollarSign,
  TrendingUp,
  Bot,
  User,
  AlertTriangle,
  Info,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { EvidenceSummary, TrendDataPoint } from '@/types/evidence-explorer'
import { DIMENSION_CONFIG, STRENGTH_CONFIG } from '@/types/evidence-explorer'

interface EvidenceSummaryPanelProps {
  summary: EvidenceSummary
  trendData: TrendDataPoint[]
  className?: string
}

export function EvidenceSummaryPanel({
  summary,
  trendData,
  className,
}: EvidenceSummaryPanelProps) {
  const hasData = summary.total > 0
  const hasTrendData = trendData.length > 1

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Evidence Distribution Card */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evidence Distribution
          </CardTitle>
          <CardDescription>
            {summary.total} total evidence items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* By Dimension */}
          <div className="space-y-2">
            <DimensionBar
              dimension="desirability"
              count={summary.byDimension.desirability}
              total={summary.total}
              icon={Heart}
              color="bg-pink-500"
            />
            <DimensionBar
              dimension="feasibility"
              count={summary.byDimension.feasibility}
              total={summary.total}
              icon={Cog}
              color="bg-blue-500"
            />
            <DimensionBar
              dimension="viability"
              count={summary.byDimension.viability}
              total={summary.total}
              icon={DollarSign}
              color="bg-green-500"
            />
          </div>

          {/* By Source */}
          <div className="flex items-center gap-4 pt-2 border-t text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium">{summary.bySource.user}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">AI:</span>
              <span className="font-medium">{summary.bySource.ai}</span>
            </div>
          </div>

          {/* Contradictions Warning */}
          {summary.contradictions > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {summary.contradictions} contradiction{summary.contradictions > 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strength Distribution Card */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Evidence Strength
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  <p className="text-xs">
                    Strong = behavioral commitment, Medium = some signal, Weak = early indicators
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Quality of evidence collected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StrengthBar
            label="Strong"
            count={summary.byStrength.strong}
            total={summary.total}
            color="bg-green-500"
          />
          <StrengthBar
            label="Medium"
            count={summary.byStrength.medium}
            total={summary.total}
            color="bg-yellow-500"
          />
          <StrengthBar
            label="Weak"
            count={summary.byStrength.weak}
            total={summary.total}
            color="bg-red-500"
          />

          {/* Quality Score */}
          {hasData && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Evidence Quality Score</span>
                <QualityBadge summary={summary} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signal Trends Chart */}
      <Card className="col-span-1 lg:col-span-1 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Signal Trends
          </CardTitle>
          <CardDescription>D-F-V signal progression over time</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTrendData ? (
            <SignalTrendChart data={trendData} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              <p>Run CrewAI analysis to see signal trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =======================================================================================
// SUB-COMPONENTS
// =======================================================================================

function DimensionBar({
  dimension,
  count,
  total,
  icon: Icon,
  color,
}: {
  dimension: string
  count: number
  total: number
  icon: typeof Heart
  color: string
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', DIMENSION_CONFIG[dimension as keyof typeof DIMENSION_CONFIG].color)} />
          <span className="capitalize">{dimension}</span>
        </div>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <Progress value={percentage} className={cn('h-2', `[&>div]:${color}`)} />
    </div>
  )
}

function StrengthBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className={cn('h-3 w-3 rounded-full', color)} />
      <span className="text-sm w-16">{label}</span>
      <Progress value={percentage} className="flex-1 h-2" />
      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
    </div>
  )
}

function QualityBadge({ summary }: { summary: EvidenceSummary }) {
  // Calculate quality score: weighted by strength
  const weights = { strong: 3, medium: 2, weak: 1 }
  const totalWeight =
    summary.byStrength.strong * weights.strong +
    summary.byStrength.medium * weights.medium +
    summary.byStrength.weak * weights.weak
  const maxWeight = summary.total * 3
  const score = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0

  const variant =
    score >= 70 ? 'default' :
    score >= 40 ? 'secondary' : 'outline'

  const label =
    score >= 70 ? 'High' :
    score >= 40 ? 'Medium' : 'Low'

  return (
    <Badge variant={variant} className="text-xs">
      {label} ({score}%)
    </Badge>
  )
}

function SignalTrendChart({ data }: { data: TrendDataPoint[] }) {
  const signalLabels = ['', 'Low', 'Med', 'High']

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(value) => signalLabels[value] || ''}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={40}
          />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="line"
            formatter={(value) => <span className="text-xs capitalize">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="desirability"
            name="Desirability"
            stroke="#ec4899"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="feasibility"
            name="Feasibility"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="viability"
            name="Viability"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}) {
  if (!active || !payload) return null

  const signalLabels = ['No Signal', 'Low', 'Medium', 'High']

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{signalLabels[entry.value] || 'Unknown'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EvidenceSummaryPanel
