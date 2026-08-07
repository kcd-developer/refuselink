const ADDRESS_UPPERCASE = new Set([
  'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw',
  'us', 'po',
])

function titleCaseWord(word: string) {
  const lower = word.toLocaleLowerCase()

  if (/^mc[a-z]/.test(lower)) {
    return `Mc${lower.charAt(2).toLocaleUpperCase()}${lower.slice(3)}`
  }

  return lower.replace(/(^|['’-])([a-z])/g, (_, separator: string, letter: string) =>
    `${separator}${letter.toLocaleUpperCase()}`,
  )
}

export function formatPersonName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(titleCaseWord)
    .join(' ')
}

export const formatTitleCase = formatPersonName

export function formatStreetAddress(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const punctuation = word.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/)
      const prefix = punctuation?.[1] ?? ''
      const core = punctuation?.[2] ?? word
      const suffix = punctuation?.[3] ?? ''
      const lower = core.toLocaleLowerCase()
      const formatted = ADDRESS_UPPERCASE.has(lower) ? lower.toLocaleUpperCase() : titleCaseWord(core)
      return `${prefix}${formatted}${suffix}`
    })
    .join(' ')
}

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
