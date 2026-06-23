import { currencyConfig } from "@/config/currency"

export function formatPrice(
  amount:number
) {

  const value =
    amount.toFixed(currencyConfig.decimals)

  if(currencyConfig.position === "before"){
    return `${currencyConfig.symbol} ${value}`
  }

  return `${value} ${currencyConfig.symbol}`
}