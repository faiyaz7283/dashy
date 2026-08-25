/**
 * Segmented control component for mutually exclusive options.
 *
 * Used in chore edit modal for assignment type selection (Open/Claimed/Assigned).
 */

/** Option for the segmented control. */
export interface SegmentedOption {
  /** Unique value. */
  value: string
  /** Display label. */
  label: string
}

/** Props for the SegmentedControl component. */
export interface SegmentedControlProps {
  /** Label displayed above the control (optional). */
  label?: string
  /** Available options. */
  options: SegmentedOption[]
  /** Currently selected value. */
  value: string
  /** Callback when selection changes. */
  onChange: (value: string) => void
}

/**
 * Segmented control for mutually exclusive options.
 *
 * @param props - Component props.
 * @returns The segmented control UI.
 */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="flex rounded-lg border border-border bg-bg p-1" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? 'bg-white text-text-primary shadow-sm dark:bg-bg-hover'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
