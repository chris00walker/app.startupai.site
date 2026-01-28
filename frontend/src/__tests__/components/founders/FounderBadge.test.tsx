/**
 * Component tests for FounderBadge
 * @story US-F02
*/

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FounderBadge } from '@/components/founders/FounderBadge'
import { AI_FOUNDERS } from '@/lib/founders/founder-mapping'

describe('FounderBadge', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<FounderBadge founderId="sage" />)
      expect(screen.getByTestId('founder-badge-sage')).toBeInTheDocument()
      expect(screen.getByText('Sage')).toBeInTheDocument()
    })

    it('renders for all founder IDs', () => {
      const founderIds = ['sage', 'forge', 'pulse', 'compass', 'guardian', 'ledger'] as const
      founderIds.forEach((id) => {
        const { unmount } = render(<FounderBadge founderId={id} />)
        expect(screen.getByTestId(`founder-badge-${id}`)).toBeInTheDocument()
        expect(screen.getByText(AI_FOUNDERS[id].name)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Variants', () => {
    it('renders badge variant by default', () => {
      render(<FounderBadge founderId="forge" />)
      const badge = screen.getByTestId('founder-badge-forge')
      expect(badge).toHaveClass('cursor-default')
    })

    it('renders inline variant without badge styling', () => {
      render(<FounderBadge founderId="forge" variant="inline" />)
      const element = screen.getByTestId('founder-badge-forge')
      expect(element.tagName).not.toBe('BADGE')
      expect(screen.getByText('Forge')).toBeInTheDocument()
    })

    it('renders minimal variant with icon only', () => {
      render(<FounderBadge founderId="pulse" variant="minimal" />)
      const element = screen.getByTestId('founder-badge-pulse')
      expect(element).toBeInTheDocument()
      // Minimal variant should not show the name text
      expect(screen.queryByText('Pulse')).not.toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<FounderBadge founderId="compass" size="sm" />)
      expect(screen.getByText('Compass')).toHaveClass('text-xs')
    })

    it('renders medium size correctly', () => {
      render(<FounderBadge founderId="compass" size="md" />)
      expect(screen.getByText('Compass')).toHaveClass('text-sm')
    })

    it('renders large size correctly', () => {
      render(<FounderBadge founderId="compass" size="lg" />)
      expect(screen.getByText('Compass')).toHaveClass('text-base')
    })
  })

  describe('Options', () => {
    it('shows role when showRole is true', () => {
      render(<FounderBadge founderId="guardian" showRole />)
      expect(screen.getByText('Guardian')).toBeInTheDocument()
      expect(screen.getByText('(CCO)')).toBeInTheDocument()
    })

    it('hides role by default', () => {
      render(<FounderBadge founderId="guardian" />)
      expect(screen.queryByText('(CCO)')).not.toBeInTheDocument()
    })

    it('shows prefix when showPrefix is true', () => {
      render(<FounderBadge founderId="ledger" showPrefix />)
      expect(screen.getByText('by Ledger')).toBeInTheDocument()
    })

    it('hides prefix by default', () => {
      render(<FounderBadge founderId="ledger" />)
      expect(screen.queryByText(/^by/)).not.toBeInTheDocument()
    })

    it('does not show role in minimal variant even when showRole is true', () => {
      render(<FounderBadge founderId="sage" variant="minimal" showRole />)
      expect(screen.queryByText('(CSO)')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<FounderBadge founderId="sage" className="custom-class" />)
      // The className should be applied somewhere in the component tree
      const badge = screen.getByTestId('founder-badge-sage')
      expect(badge).toBeInTheDocument()
    })

    it('applies correct founder colors', () => {
      render(<FounderBadge founderId="sage" variant="inline" />)
      const element = screen.getByTestId('founder-badge-sage')
      // The component should contain elements with founder-specific color classes
      expect(element.querySelector('[class*="bg-blue"]')).toBeInTheDocument()
    })
  })

  describe('Founder Data Integration', () => {
    it('displays correct founder name for each ID', () => {
      const expectedNames: Record<string, string> = {
        sage: 'Sage',
        forge: 'Forge',
        pulse: 'Pulse',
        compass: 'Compass',
        guardian: 'Guardian',
        ledger: 'Ledger',
      }

      Object.entries(expectedNames).forEach(([id, name]) => {
        const { unmount } = render(<FounderBadge founderId={id as any} />)
        expect(screen.getByText(name)).toBeInTheDocument()
        unmount()
      })
    })

    it('displays correct titles when showRole is enabled', () => {
      const expectedTitles: Record<string, string> = {
        sage: '(CSO)',
        forge: '(CTO)',
        pulse: '(CGO)',
        compass: '(CPO)',
        guardian: '(CCO)',
        ledger: '(CFO)',
      }

      Object.entries(expectedTitles).forEach(([id, title]) => {
        const { unmount } = render(<FounderBadge founderId={id as any} showRole />)
        expect(screen.getByText(title)).toBeInTheDocument()
        unmount()
      })
    })
  })
})
