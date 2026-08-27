import { useCallback, useMemo, useState } from 'react'

const STORAGE_KEY = 'knowledge-atlas-completed-topics'

function readCompletedTopics() {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? '[]',
    )
    return new Set(
      Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === 'string')
        : [],
    )
  } catch {
    return new Set<string>()
  }
}

export function useLearningProgress(topicIds: readonly string[]) {
  const [completed, setCompleted] = useState<Set<string>>(readCompletedTopics)

  const toggleCompleted = useCallback((topicId: string) => {
    setCompleted((current) => {
      const next = new Set(current)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // Tiến độ vẫn tồn tại trong state của session hiện tại.
      }
      return next
    })
  }, [])

  const validCompletedCount = useMemo(
    () => topicIds.filter((topicId) => completed.has(topicId)).length,
    [completed, topicIds],
  )

  const completionPercent =
    topicIds.length === 0
      ? 0
      : Math.round((validCompletedCount / topicIds.length) * 100)

  return {
    completed,
    completedCount: validCompletedCount,
    completionPercent,
    toggleCompleted,
  }
}
