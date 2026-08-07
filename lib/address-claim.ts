export interface AddressClaimInput {
  address: string
  address2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}

export interface AddressClaimCandidate {
  id: string
  address: string
  address2?: string | null
  zipCode?: string | null
  city: {
    name: string
    state: string
  }
  community?: {
    name: string
  } | null
}

export interface RankedAddressCandidate<TCandidate extends AddressClaimCandidate = AddressClaimCandidate> {
  candidate: TCandidate
  score: number
}

const streetReplacements = new Map([
  ['street', 'st'],
  ['st.', 'st'],
  ['avenue', 'ave'],
  ['ave.', 'ave'],
  ['road', 'rd'],
  ['rd.', 'rd'],
  ['drive', 'dr'],
  ['dr.', 'dr'],
  ['lane', 'ln'],
  ['ln.', 'ln'],
  ['court', 'ct'],
  ['ct.', 'ct'],
  ['circle', 'cir'],
  ['cir.', 'cir'],
  ['boulevard', 'blvd'],
  ['blvd.', 'blvd'],
  ['terrace', 'ter'],
  ['ter.', 'ter'],
  ['place', 'pl'],
  ['pl.', 'pl'],
  ['parkway', 'pkwy'],
  ['pkwy.', 'pkwy'],
  ['highway', 'hwy'],
  ['hwy.', 'hwy'],
  ['north', 'n'],
  ['south', 's'],
  ['east', 'e'],
  ['west', 'w'],
])

export function normalizeAddressText(value?: string | null) {
  const words = (value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[#,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)

  return words.map((word) => streetReplacements.get(word) ?? word).join(' ')
}

export function normalizeZipCode(value?: string | null) {
  return (value ?? '').replace(/\D/g, '').slice(0, 5)
}

export function extractHouseNumber(value?: string | null) {
  return normalizeAddressText(value).match(/^(\d+[a-z]?)/)?.[1] ?? null
}

function levenshtein(left: string, right: string) {
  const rows = left.length + 1
  const cols = right.length + 1
  const distances = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let row = 0; row < rows; row += 1) distances[row][0] = row
  for (let col = 0; col < cols; col += 1) distances[0][col] = col

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1
      distances[row][col] = Math.min(
        distances[row - 1][col] + 1,
        distances[row][col - 1] + 1,
        distances[row - 1][col - 1] + cost,
      )
    }
  }

  return distances[left.length][right.length]
}

function similarity(leftValue?: string | null, rightValue?: string | null) {
  const left = normalizeAddressText(leftValue)
  const right = normalizeAddressText(rightValue)
  if (!left && !right) return 1
  if (!left || !right) return 0
  if (left === right) return 1

  const maxLength = Math.max(left.length, right.length)
  return Math.max(0, 1 - levenshtein(left, right) / maxLength)
}

export function address2Compatible(candidateValue?: string | null, inputValue?: string | null) {
  const candidate = normalizeAddressText(candidateValue)
  const input = normalizeAddressText(inputValue)
  if (!candidate && !input) return true
  if (candidate && !input) return false
  return candidate === input
}

export function scoreAddressCandidate(input: AddressClaimInput, candidate: AddressClaimCandidate) {
  const inputHouseNumber = extractHouseNumber(input.address)
  const candidateHouseNumber = extractHouseNumber(candidate.address)
  if (inputHouseNumber && candidateHouseNumber && inputHouseNumber !== candidateHouseNumber) {
    return 0
  }

  if (!address2Compatible(candidate.address2, input.address2)) {
    return 0
  }

  const addressScore = similarity(input.address, candidate.address)
  const cityScore = input.city ? similarity(input.city, candidate.city.name) : 0.5
  const stateScore = input.state
    ? normalizeAddressText(input.state) === normalizeAddressText(candidate.city.state)
      ? 1
      : 0
    : 0.5

  const inputZip = normalizeZipCode(input.zipCode)
  const candidateZip = normalizeZipCode(candidate.zipCode)
  const zipScore = inputZip && candidateZip ? similarity(inputZip, candidateZip) : 0.5

  return addressScore * 0.52 + cityScore * 0.22 + stateScore * 0.16 + zipScore * 0.1
}

export function rankAddressCandidates<TCandidate extends AddressClaimCandidate>(
  input: AddressClaimInput,
  candidates: TCandidate[],
  minimumScore = 0.55,
): RankedAddressCandidate<TCandidate>[] {
  return candidates
    .map((candidate) => ({ candidate, score: scoreAddressCandidate(input, candidate) }))
    .filter((ranked) => ranked.score >= minimumScore)
    .sort((left, right) => right.score - left.score)
}
