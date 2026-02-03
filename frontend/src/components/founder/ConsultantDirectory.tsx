/**
 * ConsultantDirectory Component
 *
 * Directory for founders to browse verified consultants.
 * Shows consultant profiles with expertise and verification status.
 *
 * @story US-FM01, US-FM02
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Building2, CheckCircle, Clock, Users, RefreshCw } from 'lucide-react';
import { RELATIONSHIP_TYPES } from '@/components/consultant/InviteClientModal';

interface Consultant {
  id: string;
  name: string;
  organization: string;
  expertiseAreas: string[];
  bioSummary: string;
  verificationBadge: 'verified' | 'grace';
  relationshipTypesOffered: string;
  connectionCount: number;
}

interface ConsultantDirectoryProps {
  onRequestConnection?: (consultantId: string) => void;
}

export function ConsultantDirectory({ onRequestConnection }: ConsultantDirectoryProps) {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [relationshipType, setRelationshipType] = useState('');
  const [industry, setIndustry] = useState('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchConsultants = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (relationshipType) params.set('relationship_type', relationshipType);
      if (industry) params.set('industry', industry);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/founder/consultants?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load consultants');
      }

      const data = await response.json();
      setConsultants(data.consultants);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultants');
    } finally {
      setIsLoading(false);
    }
  };

  // TASK-026: Fix race condition by combining filter/pagination logic
  useEffect(() => {
    fetchConsultants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Reset offset and fetch when filters change
  useEffect(() => {
    if (offset === 0) {
      fetchConsultants();
    } else {
      setOffset(0); // This will trigger the above effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipType, industry]);

  const getTypeLabel = (type: string) => {
    const found = RELATIONSHIP_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger aria-label="Filter by type of help">
                  <SelectValue placeholder="Type of help" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger aria-label="Filter by industry expertise">
                  <SelectValue placeholder="Industry expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="B2C">B2C</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="EdTech">EdTech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={fetchConsultants} aria-label="Refresh consultant list">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && consultants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No consultants match your filters. Try broadening your search.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consultant Cards */}
      {!isLoading && consultants.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {consultants.map((consultant) => (
            <Card key={consultant.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {consultant.name}
                      {consultant.verificationBadge === 'verified' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3" />
                      {consultant.organization || 'Independent Consultant'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {getTypeLabel(consultant.relationshipTypesOffered)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultant.bioSummary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {consultant.bioSummary}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {consultant.expertiseAreas.slice(0, 5).map((area, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {consultant.expertiseAreas.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{consultant.expertiseAreas.length - 5} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {consultant.connectionCount} active connections
                  </span>
                  {onRequestConnection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestConnection(consultant.id)}
                    >
                      Request Connection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} consultants
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantDirectory;
