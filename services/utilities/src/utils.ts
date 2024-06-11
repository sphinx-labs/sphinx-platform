export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const fetchHardcodedCurrencyPrice = (currency: string) => {
  if (currency === 'CRAB') {
    return 0
  } else {
    return
  }
}
