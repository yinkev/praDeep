export interface KnowledgeBaseListItem {
  name: string
  is_default?: boolean
}

export function parseKnowledgeBaseList(data: unknown): KnowledgeBaseListItem[] {
  if (!Array.isArray(data)) return []

  const results: KnowledgeBaseListItem[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const name = typeof record.name === 'string' ? record.name : null
    if (!name) continue
    const is_default = typeof record.is_default === 'boolean' ? record.is_default : undefined
    results.push({ name, is_default })
  }
  return results
}
