/**
 * Difficulty slider component with numeric badge.
 *
 * Used in chore forms to set difficulty level (1-5).
 * Shows current value in a badge next to the slider.
 */

/** Props for the DifficultySlider component. */
export interface DifficultySliderProps {
  /** Label displayed above the slider. */
  label: string
  /** Current difficulty value (1-5). */
  value: number
  /** Callback when value changes. */
  onChange: (value: number) => void
}

/**
 * Difficulty slider with numeric badge.
 *
 * @param props - Component props.
 * @returns The difficulty slider UI.
 */
export function DifficultySlider({ label, value, onChange }: DifficultySliderProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
        <span className="w-5 rounded bg-bg-hover px-1 py-0.5 text-center text-xs font-semibold text-text-primary">
          {value}
        </span>
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
      </div>
    </div>
  )
}
