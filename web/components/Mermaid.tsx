'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load mermaid library for better performance
const loadMermaid = () => import('mermaid')

interface MermaidProps {
  chart: string
  className?: string
}

let mermaidIdCounter = 0
let mermaidInstance: any = null

// Mermaid configuration
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#c7d2fe',
    lineColor: '#94a3b8',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#f8fafc',
  },
}

export const Mermaid: React.FC<MermaidProps> = ({ chart, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [id] = useState(() => `mermaid-${++mermaidIdCounter}`)

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return

      try {
        setLoading(true)

        // Dynamically load mermaid only when needed
        if (!mermaidInstance) {
          const mermaidModule = await loadMermaid()
          mermaidInstance = mermaidModule.default
          mermaidInstance.initialize(MERMAID_CONFIG)
        }

        // Clean up the chart code
        const cleanedChart = chart.trim()

        // Validate and render
        const { svg: renderedSvg } = await mermaidInstance.render(id, cleanedChart)
        setSvg(renderedSvg)
        setError(null)
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      } finally {
        setLoading(false)
      }
    }

    renderChart()
  }, [chart, id])

  if (loading) {
    return (
      <div className={`my-6 flex justify-center items-center min-h-[200px] ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading diagram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`my-4 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600 text-sm font-medium mb-2">Diagram rendering error</p>
        <pre className="text-xs text-red-500 whitespace-pre-wrap">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-slate-500 cursor-pointer">Show source</summary>
          <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">{chart}</pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`my-6 flex justify-center overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default Mermaid
