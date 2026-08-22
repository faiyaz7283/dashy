/**
 * Tag input component with removable chips.
 *
 * Used for tag selection in chore forms. Users can type to add tags,
 * see selected tags as removable chips, and hover to see all associated tags.
 */

import { useState, useRef } from 'react'
import { X } from 'lucide-react'

/** Tag item. */
export interface TagItem {
  /** Unique identifier. */
  id: string
  /** Display label. */
  label: string
}

/** Props for the TagInput component. */
export interface TagInputProps {
  /** Label displayed above the input. */
  label: string
  /** Available tags to choose from. */
  availableTags: TagItem[]
  /** Currently selected tag IDs. */
  value: string[]
  /** Callback when tag selection changes. */
  onChange: (tagIds: string[]) => void
  /** Callback when user wants to create a new tag. */
  onCreate?: (name: string) => void
  /** Placeholder text for the input. */
  placeholder?: string
}

/**
 * Tag input with removable chips and hover popup.
 *
 * @param props - Component props.
 * @returns The tag input UI.
 */
export function TagInput({
  label,
  availableTags,
  value,
  onChange,
  onCreate,
  placeholder = 'Type and press Enter...',
}: TagInputProps) {
  const [query, setQuery] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get selected tag objects
  const selectedTags = availableTags.filter((tag) => value.includes(tag.id))

  // Get unselected tags for the popup
  const unselectedTags = availableTags.filter((tag) => !value.includes(tag.id))

  // Handle adding a tag
  const addTag = (tagId: string) => {
    if (!value.includes(tagId)) {
      onChange([...value, tagId])
    }
    setQuery('')
    inputRef.current?.focus()
  }

  // Handle removing a tag
  const removeTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId))
  }

  // Handle Enter key to add tag
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      // Check if query matches an existing tag
      const existingTag = availableTags.find(
        (tag) => tag.label.toLowerCase() === query.trim().toLowerCase(),
      )
      if (existingTag) {
        addTag(existingTag.id)
      } else if (onCreate) {
        onCreate(query.trim())
        setQuery('')
      }
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 transition-colors hover:border-border-dark">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-medium text-primary"
          >
            {tag.label}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="text-primary/60 hover:text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-[40px] flex-1 bg-transparent text-sm text-text-primary placeholder-text-faint focus:outline-none"
          placeholder={selectedTags.length === 0 ? placeholder : ''}
        />
      </div>

      {/* Hover popup showing all tags */}
      {showPopup && unselectedTags.length > 0 && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-lg border border-border bg-white p-3 shadow-lg dark:bg-bg">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-faint">
            Available tags
          </p>
          <div className="flex flex-wrap gap-1">
            {unselectedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag.id)}
                className="inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5 text-[10px] font-medium text-text-muted hover:bg-primary-light hover:text-primary"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
