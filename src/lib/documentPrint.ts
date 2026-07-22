export const blankValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

export const displayValue = (value: unknown, fallback = '') => {
  const text = blankValue(value).trim()
  return text || fallback
}

export const formatDocumentDate = (value: string) => {
  const dateText = value?.slice(0, 10) ?? ''
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date)
}

export const formatCompactDate = (value: string) => {
  const dateText = value?.slice(0, 10) ?? ''
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)

const smallNumberWords = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const tensNumberWords = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

const underThousandToWords = (value: number) => {
  const number = Math.floor(value)
  const parts: string[] = []
  const hundreds = Math.floor(number / 100)
  const remainder = number % 100
  if (hundreds > 0) parts.push(`${smallNumberWords[hundreds]} Hundred`)
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(smallNumberWords[remainder])
    } else {
      const tens = Math.floor(remainder / 10)
      const ones = remainder % 10
      parts.push(
        ones > 0
          ? `${tensNumberWords[tens]} ${smallNumberWords[ones]}`
          : tensNumberWords[tens],
      )
    }
  }
  return parts.join(' ')
}

export const amountToWords = (amount: number) => {
  const number = Math.floor(Math.max(0, Number(amount) || 0))
  if (number === 0) return 'Zero Rupees Only'
  const parts: string[] = []
  let remaining = number
  const chunks = [
    { label: 'Crore', divisor: 10000000 },
    { label: 'Lakh', divisor: 100000 },
    { label: 'Thousand', divisor: 1000 },
    { label: 'Hundred', divisor: 100 },
  ]
  chunks.forEach((chunk) => {
    const quotient = Math.floor(remaining / chunk.divisor)
    if (quotient > 0) {
      parts.push(
        chunk.label === 'Hundred'
          ? `${smallNumberWords[quotient]} Hundred`
          : `${underThousandToWords(quotient)} ${chunk.label}`,
      )
      remaining %= chunk.divisor
    }
  })
  if (remaining > 0) parts.push(underThousandToWords(remaining))
  return `${parts.join(' ')} Rupees Only`
}

export const getTodayInputValue = () => {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}
