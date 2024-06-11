const getDecimalPart = (num: number) => {
  return num - Math.trunc(num)
}

export const roundToTwoSignificantDigits = (num: number) => {
  const decimalPortion = getDecimalPart(num)
  const roundedDecimal = roundDecimalToTwoSignificantDigits(decimalPortion)
  return Math.trunc(num) + roundedDecimal
}

export const roundDecimalToTwoSignificantDigits = (num: number) => {
  if (num === 0) return 0

  const digits = Math.floor(Math.log10(Math.abs(num))) + 1
  let decimalPlaces = 2 - digits

  // For numbers where the whole part is less than 2 digits
  if (digits < 2) {
    decimalPlaces = 2 - digits // Ensures two significant digits
  } else if (digits > 2) {
    decimalPlaces = 0 // For whole numbers with more than 2 digits, no decimal places are needed
  }

  // Round the number to the necessary decimal places
  return Number(num.toFixed(decimalPlaces))
}
