/**
 * Combobox component with dynamic "+ Create" option.
 *
 * Used for category selection in chore forms. Supports searching existing
 * options and creating new ones on the fly.
 *
 * Built on HeadlessUI Combobox for full keyboard navigation and ARIA support.
 */

import { useState, Fragment } from 'react'
import { Combobox as HeadlessCombobox, Transition } from '@headlessui/react'
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
 * Uses HeadlessUI Combobox for keyboard navigation and ARIA.
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
  const [query, setQuery] = useState('')

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  )

  const showCreate =
    onCreate &&
    query.length > 0 &&
    !options.some(
      (option) => option.label.toLowerCase() === query.toLowerCase(),
    )

  const selectedOption = options.find((option) => option.id === value) ?? null

  return (
    <div>
      <HeadlessCombobox value={selectedOption} onChange={(option: ComboboxOption | null) => {
        if (option) onChange(option.id)
      }}>
        <div className="relative">
          <HeadlessCombobox.Label className="mb-1.5 block text-xs font-medium text-text-secondary">
            {label}
          </HeadlessCombobox.Label>
          <div className="relative group">
            <HeadlessCombobox.Input
              onChange={(e) => setQuery(e.target.value)}
              displayValue={(option: ComboboxOption | null) => option?.label ?? ''}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              placeholder={placeholder}
            />
            <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2.5">
              <ChevronDown className="pointer-events-none h-4 w-4 text-text-faint" />
            </HeadlessCombobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <HeadlessCombobox.Options className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-lg dark:bg-bg">
              {filteredOptions.length === 0 && !showCreate ? (
                <div className="px-3 py-2 text-sm text-text-muted">No options found.</div>
              ) : (
                <>
                  {filteredOptions.map((option) => (
                    <HeadlessCombobox.Option
                      key={option.id}
                      value={option}
                      className={({ active }) =>
                        `cursor-pointer px-3 py-2 text-left text-sm ${
                          active ? 'bg-bg-hover' : 'text-text-primary'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? 'font-medium text-primary' : ''}`}>
                          {option.label}
                        </span>
                      )}
                    </HeadlessCombobox.Option>
                  ))}
                  {showCreate && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onCreate?.(query)
                        setQuery('')
                      }}
                      className="w-full border-t border-border px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary-light cursor-pointer"
                    >
                      + Create '{query}'
                    </button>
                  )}
                </>
              )}
            </HeadlessCombobox.Options>
          </Transition>
        </div>
      </HeadlessCombobox>
    </div>
  )
}
