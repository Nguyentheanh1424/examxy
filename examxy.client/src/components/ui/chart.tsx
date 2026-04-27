import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export type ChartConfig = {
  [key: string]: {
    label?: ReactNode
    color?: string
  }
}

interface ChartSeries {
  dataKey: string
  type?: 'bar' | 'line'
}

interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  data?: Array<Record<string, number | string>>
  series?: ChartSeries[]
  xKey?: string
}

function getSeriesColor(config: ChartConfig, key: string, fallbackIndex: number) {
  const fallbackColors = [
    'var(--color-brand)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-danger)',
  ]

  return config[key]?.color ?? fallbackColors[fallbackIndex % fallbackColors.length]
}

export function ChartContainer({
  children,
  className,
  config,
  data = [],
  series = [],
  xKey = 'label',
  ...props
}: ChartContainerProps) {
  const activeSeries = series.length > 0
    ? series
    : Object.keys(config).map((key) => ({ dataKey: key, type: 'bar' as const }))
  const values = data.flatMap((item) =>
    activeSeries.map((seriesItem) => Number(item[seriesItem.dataKey] ?? 0)),
  )
  const maxValue = Math.max(1, ...values)

  return (
    <div
      {...props}
      className={cn(
        'rounded-[var(--radius-panel)] border border-line/80 bg-panel p-5',
        className,
      )}
    >
      {children}

      {data.length > 0 ? (
        <svg
          aria-label="Chart"
          className="mt-4 h-64 w-full"
          role="img"
          viewBox="0 0 100 70"
        >
          {data.map((item, index) => {
            const x = 10 + index * (80 / Math.max(1, data.length))
            return activeSeries.map((seriesItem, seriesIndex) => {
              const value = Number(item[seriesItem.dataKey] ?? 0)
              const barHeight = (value / maxValue) * 44
              const width = 8 / Math.max(1, activeSeries.length)
              const offset = seriesIndex * (width + 1)

              if (seriesItem.type === 'line') {
                const nextItem = data[index + 1]
                if (!nextItem) {
                  return null
                }

                const nextValue = Number(nextItem[seriesItem.dataKey] ?? 0)
                const nextX = 10 + (index + 1) * (80 / Math.max(1, data.length))
                const y = 56 - barHeight
                const nextY = 56 - (nextValue / maxValue) * 44

                return (
                  <line
                    key={`${seriesItem.dataKey}-${index}`}
                    stroke={getSeriesColor(config, seriesItem.dataKey, seriesIndex)}
                    strokeWidth="1.5"
                    x1={x + 4}
                    x2={nextX + 4}
                    y1={y}
                    y2={nextY}
                  />
                )
              }

              return (
                <rect
                  fill={getSeriesColor(config, seriesItem.dataKey, seriesIndex)}
                  height={barHeight}
                  key={`${seriesItem.dataKey}-${index}`}
                  rx="1.5"
                  width={width}
                  x={x + offset}
                  y={56 - barHeight}
                />
              )
            })
          })}

          {data.map((item, index) => (
            <text
              fill="var(--color-muted)"
              fontSize="3"
              key={`label-${index}`}
              textAnchor="middle"
              x={14 + index * (80 / Math.max(1, data.length))}
              y="64"
            >
              {String(item[xKey] ?? '')}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  )
}

export function ChartTooltip({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function ChartTooltipContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('rounded-[calc(var(--radius-input)-0.25rem)] border border-line bg-surface px-3 py-2 text-sm text-muted shadow-sm', className)}
    />
  )
}

export function ChartLegend({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-4 flex flex-wrap items-center gap-3', className)} />
}

export function ChartLegendContent({
  className,
  config,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
}) {
  return (
    <div {...props} className={cn('mt-4 flex flex-wrap items-center gap-3', className)}>
      {Object.entries(config).map(([key, value], index) => (
        <div className="inline-flex items-center gap-2 text-sm text-muted" key={key}>
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: getSeriesColor(config, key, index) } as CSSProperties}
          />
          <span>{value.label ?? key}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartStyle() {
  return null
}
