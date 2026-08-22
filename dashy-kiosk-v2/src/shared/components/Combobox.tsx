/**
 * Combobox component with dynamic "+ Create" option.
 *
 * Used for category selection in chore forms. Supports searching existing
 * options and creating new ones on the fly.
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/** Option item for the combobox. */
export interface ComboboxOption {
  /** Unique identifier. */
  id: string
  /** Display label. */
  label: string
}

/** Props for the Combobox component. */
export interface ComboboxProps {
  /** Label displayed above the input. */
  label: string
  /** Available options to choose from. */
  options: ComboboxOption[]
  /** Currently selected option ID, or empty string for none. */
  value: string
  /** Callback when selection changes. */
  onChange: (optionId: string) => void
  /** Callback when user wants to create a new option. */
  onCreate?: (name: string) => void
  /** Placeholder text for the input. */
  placeholder?: string
}

/**
 * Combobox with search and dynamic create option.
 *
 * @param props - Component props.
 * @returns The combobox UI.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  onCreate,
  placeholder = 'Search or create...',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  )

  // Show "+ Create" if query doesn't match any existing option
  const showCreate =
    onCreate &&
    query.length > 0 &&
    !options.some(
      (option) => option.label.toLowerCase() === query.toLowerCase(),
    )

  const selectedOption = options.find((option) => option.id === value)

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative group">
        <input
          type="text"
          value={isOpen ? query : selectedOption?.label ?? ''}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
          placeholder={placeholder}
        />
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-lg dark:bg-bg">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setQuery('')
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover ${
                  option.id === value
                    ? 'bg-primary-light font-medium text-primary'
                    : 'text-text-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
            {showCreate && (
              <button
                type="button"
                onClick={() => {
                  onCreate?.(query)
                  setQuery('')
                  setIsOpen(false)
                }}
                className="w-full border-t border-border px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary-light"
              >
                + Create '{query}'
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
