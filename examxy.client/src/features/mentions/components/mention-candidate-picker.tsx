import { useMemo, useState } from 'react'
import { Search, UserRound } from 'lucide-react'

import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils/cn'
import type { ClassMentionCandidate } from '@/types/class-content'

interface MentionCandidatePickerProps {
  candidates: ClassMentionCandidate[]
  selectedUserIds: string[]
  onChange: (nextUserIds: string[]) => void
  disabled?: boolean
}

export function MentionCandidatePicker({
  candidates,
  disabled = false,
  onChange,
  selectedUserIds,
}: MentionCandidatePickerProps) {
  const [query, setQuery] = useState('')

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return candidates
    }

    return candidates.filter((candidate) => {
      return (
        candidate.displayName.toLowerCase().includes(normalizedQuery) ||
        candidate.email.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [candidates, query])

  return (
    <div className="space-y-3">
      <TextField
        disabled={disabled}
        label="Tag users"
        leftIcon={<Search className="size-4" />}
        onChange={(event) => {
          setQuery(event.target.value)
        }}
        placeholder="Search class participants"
        value={query}
      />

      <div className="max-h-48 space-y-2 overflow-y-auto rounded-[var(--radius-input)] border border-line bg-surface p-3">
        {filteredCandidates.length === 0 ? (
          <p className="text-sm leading-6 text-muted">No matching participants.</p>
        ) : (
          filteredCandidates.map((candidate) => {
            const isSelected = selectedUserIds.includes(candidate.userId)

            return (
              <button
                className={cn(
                  'focus-ring flex min-h-11 w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition motion-reduce:transition-none',
                  isSelected
                    ? 'border-brand bg-brand-soft/70'
                    : 'border-line bg-panel hover:border-brand/30 hover:bg-brand-soft/45',
                )}
                disabled={disabled}
                key={candidate.userId}
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedUserIds.filter((id) => id !== candidate.userId))
                    return
                  }

                  onChange([...selectedUserIds, candidate.userId])
                }}
                type="button"
              >
                <span className="inline-flex min-w-0 items-start gap-2">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-brand-strong" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {candidate.displayName}
                    </span>
                    <span className="block truncate text-sm leading-6 text-muted">
                      {candidate.email}
                    </span>
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                    isSelected
                      ? 'border-brand bg-brand text-white'
                      : 'border-line bg-surface text-muted',
                  )}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
