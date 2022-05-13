import BigNumber from 'bignumber.js'

import { CurrencySymbols } from './currency-symbols'

type BigNumberIsh =
  | BigNumber
  | string
  | number

type AmountLike =
  | Amount
  | BigNumberIsh

export default class Amount {
  public readonly value?: BigNumber

  public constructor (value: BigNumberIsh) {
    this.value = value === ''
      ? undefined
      : new BigNumber(value)
  }

  static zero (): Amount {
    return new Amount('0')
  }

  static empty (): Amount {
    return new Amount('')
  }

  plus (value: AmountLike): Amount {
    if (value instanceof Amount) {
      return this.plus(value.value || '')
    }

    if (value === '') {
      return this
    } else if (this.value === undefined) {
      return new Amount(value)
    }

    return new Amount(this.value.plus(value))
  }

  times (value: AmountLike): Amount {
    if (value instanceof Amount) {
      return this.times(value.value || '')
    }

    if (value === '' || this.value === undefined) {
      return Amount.empty()
    }

    return new Amount(this.value.times(value))
  }

  div (value: AmountLike): Amount {
    if (value instanceof Amount) {
      return this.div(value.value || '')
    }

    if (value === '' || this.value === undefined) {
      return Amount.empty()
    }

    if (new BigNumber(value).isZero()) {
      return Amount.empty()
    }

    return new Amount(this.value.div(value))
  }

  divideByDecimals (decimals: number): Amount {
    if (this.value === undefined) {
      return Amount.empty()
    }

    return new Amount(this.value.dividedBy(10 ** decimals))
  }

  multiplyByDecimals (decimals: number): Amount {
    if (this.value === undefined) {
      return Amount.empty()
    }

    return new Amount(this.value.multipliedBy(10 ** decimals))
  }

  gt (amount: AmountLike): boolean {
    if (this.value === undefined) {
      return false
    }

    if (amount instanceof Amount) {
      return this.gt(amount.value || '')
    }

    if (amount === '') {
      return true
    }

    return this.value.gt(amount)
  }

  gte (amount: AmountLike): boolean {
    return this.gt(amount) || this.eq(amount)
  }

  lt (amount: AmountLike): boolean {
    if (amount === '') {
      return false
    }

    if (amount instanceof Amount) {
      return this.lt(amount.value || '')
    }

    if (this.value === undefined) {
      return true
    }

    return this.value.lt(amount)
  }

  lte (amount: AmountLike): boolean {
    return this.lt(amount) || this.eq(amount)
  }

  eq (amount: AmountLike): boolean {
    if (amount instanceof Amount) {
      return this.eq(amount.value || '')
    }

    if (this.value === undefined && amount === '') {
      return true
    }

    if (this.value !== undefined && amount !== '') {
      return this.value.eq(amount)
    }

    return false
  }

  /**
   * Returns the normalized string of the given numeric value.
   *
   * This function is typically used for converting a hex value to
   * numeric value.
   *
   * Invalid values return an empty string.
   *
   * @param value Numeric value to normalize.
   */
  static normalize (value: string): string {
    if (value === '') {
      return ''
    }

    const amount = new Amount(value)
    if (amount.value !== undefined && amount.value.isNaN()) {
      return ''
    }

    if (amount.isZero()) {
      return '0'
    }

    return amount.format()
  }

  private static formatAmountWithCommas (value: string, commas: boolean): string {
    // Remove trailing zeros, including the decimal separator if necessary.
    // Example: 1.0000000000 becomes 1.
    const trimmedResult = value.replace(/\.0*$|(\.\d*[1-9])0+$/, '$1')

    // Format number with commas.
    // https://stackoverflow.com/a/2901298/1946230
    return commas
      ? trimmedResult.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
      : trimmedResult
  }

  format (significantDigits?: number, commas: boolean = false): string {
    if (this.value === undefined || this.value.isNaN()) {
      return ''
    }

    if (significantDigits === undefined) {
      return Amount.formatAmountWithCommas(
        this.value.toFixed(),
        commas
      )
    }

    // Handle the case where the value is large enough that formatting with
    // significant figures will result in an undesirable loss of precision.
    const desiredDecimalPlaces = 2
    if (this.value.isGreaterThanOrEqualTo(10 ** (significantDigits - desiredDecimalPlaces))) {
      return Amount.formatAmountWithCommas(
        this.value.toFixed(desiredDecimalPlaces),
        commas
      )
    }

    return Amount.formatAmountWithCommas(
      this.value.precision(significantDigits).toFixed(),
      commas
    )
  }

  formatAsAsset (significantDigits?: number, symbol?: string): string {
    const result = this.format(significantDigits, true)
    if (!symbol) {
      return result
    }

    return result === ''
      ? ''
      : `${result} ${symbol}`
  }

  formatAsFiat (currency?: string): string {
    const fmt = {
      decimalSeparator: '.',
      groupSeparator: ',',
      groupSize: 3
    } as BigNumber.Format

    let result
    if (this.value === undefined || this.value.isNaN()) {
      result = ''
    } else if (this.value.isZero()) {
      result = '0.00'
    } else if (this.value.decimalPlaces() < 2) {
      result = this.value.toFormat(2, BigNumber.ROUND_UP, fmt)
    } else if (this.value.isGreaterThanOrEqualTo(10)) {
      result = this.value.toFormat(2, BigNumber.ROUND_UP, fmt)
    } else if (this.value.isGreaterThanOrEqualTo(1)) {
      result = this.value.toFormat(3, BigNumber.ROUND_UP, fmt)
    } else {
      result = this.format(4, true)
    }

    if (!result) {
      return ''
    }

    return currency !== undefined
      ? `${CurrencySymbols[currency]}${result}`
      : result
  }

  toHex (): string {
    if (this.value === undefined) {
      return ''
    }

    if (this.value.isNaN()) {
      return '0x0'
    }

    return `0x${this.value.toString(16)}`
  }

  toNumber (): number {
    if (this.value === undefined || this.value.isNaN()) {
      return 0
    }

    return this.value.toNumber()
  }

  isUndefined (): boolean {
    return this.value === undefined
  }

  isNaN (): boolean {
    return this.value !== undefined && this.value.isNaN()
  }

  isZero (): boolean {
    return this.value !== undefined && this.value.isZero()
  }

  isPositive (): boolean {
    return this.value !== undefined && this.value.isPositive()
  }

  isNegative (): boolean {
    return this.value !== undefined && this.value.isNegative()
  }

  // Abbreviate number in units of 1000 e.g., 100000 becomes 100k
  abbreviate (decimals: number, currency?: string): string {
    const min = 1e3 // 1000

    if (this.value === undefined) {
      return ''
    }

    if (this.value.lt(min)) {
      return currency !== undefined
        ? `${CurrencySymbols[currency]}${this.value.toFixed(decimals)}`
        : this.value.toFixed(decimals).toString()
    }

    const units = ['k', 'M', 'B', 'T']
    const order = Math.floor(Math.log(this.value.toNumber()) / Math.log(1000))
    const unit = units[order - 1]
    const amount = this.div(1000 ** order)

    if (amount.value) {
      const result = amount.value.toFixed(decimals)

      return currency !== undefined
        ? `${CurrencySymbols[currency]}${result}${unit}`
        : `${result}${unit}`
    }

    return ''
  }
}
