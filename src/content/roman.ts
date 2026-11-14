const NUMERALS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** Cifre romane pentru numerotarea sălilor. Întotdeauna însoțite de varianta arabă pentru cititoarele de ecran. */
export function toRoman(value: number): string {
  let rest = Math.max(1, Math.floor(value))
  let out = ''
  for (const [amount, numeral] of NUMERALS) {
    while (rest >= amount) {
      out += numeral
      rest -= amount
    }
  }
  return out
}
