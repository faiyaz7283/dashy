import { colors, spacing } from '@/theme/tokens'

/**
 * Full-viewport loading skeleton that mimics the dashboard layout.
 *
 * Displays animated placeholder blocks in the positions of header, sidebar,
 * and main content areas. Provides visual feedback during initial data fetch
 * instead of a blank screen or plain "Loading..." text.
 *
 * @example
 * ```tsx
 * if (isLoading) return <LoadingSkeleton />;
 * ```
 */
export function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gridTemplateColumns: 'auto 1fr',
        height: '100vh',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* Header area */}
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          gap: `${spacing.lg}px`,
          padding: `${spacing.md}px ${spacing.xl}px`,
          background: colors.white,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <SkeletonBlock width="120px" height="24px" />
        <SkeletonBlock width="80px" height="20px" />
        <div style={{ flex: 1 }} />
        <SkeletonBlock width="100px" height="20px" />
      </div>

      {/* Sidebar area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${spacing.md}px`,
          padding: `${spacing.lg}px`,
          background: colors.white,
          borderRight: `1px solid ${colors.border}`,
          width: '200px',
        }}
      >
        <SkeletonBlock width="160px" height="20px" />
        <SkeletonBlock width="140px" height="16px" />
        <SkeletonBlock width="150px" height="16px" />
        <SkeletonBlock width="130px" height="16px" />
      </div>

      {/* Main content area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${spacing.lg}px`,
          padding: `${spacing.xl}px`,
          overflow: 'hidden',
        }}
      >
        {/* Weather widget placeholder */}
        <SkeletonBlock width="200px" height="60px" />

        {/* Calendar grid placeholder */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
          <SkeletonBlock width="100%" height="40px" />
          <SkeletonBlock width="100%" height="40px" />
          <SkeletonBlock width="100%" height="40px" />
          <SkeletonBlock width="100%" height="40px" />
        </div>
      </div>
    </div>
  )
}

/**
 * Animated placeholder block with pulsing effect.
 *
 * @param width - CSS width value (e.g., "120px", "100%").
 * @param height - CSS height value (e.g., "24px").
 */
function SkeletonBlock({ width, height }: { width: string; height: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '4px',
        background: `linear-gradient(90deg, ${colors.border} 25%, ${colors.borderLight} 50%, ${colors.border} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}
