import { type HTMLAttributes, forwardRef } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra padding variant — default 'md' */
  padding?: 'sm' | 'md' | 'lg' | 'none'
  /** Hover lift effect */
  hoverable?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

/**
 * Reusable glassmorphism panel.
 * All coin cards, info panels, and stat boxes use this component.
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ padding = 'md', hoverable = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'glass rounded-[var(--radius-md)]',
          paddingMap[padding],
          hoverable
            ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
