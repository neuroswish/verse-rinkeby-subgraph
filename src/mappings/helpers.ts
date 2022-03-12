import { log, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { PairFactory, Exchange, User, Position, Buy, Sell } from "../../generated/schema"
import { PairFactory as PairFactoryContract } from '../../generated/templates/Exchange/PairFactory'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const PAIR_FACTORY_ADDRESS = '0x7A4aA32A375aCbE448cD40bEc04F5F942B2A5956'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let RESERVE_RATIO = BigInt.fromString('242424')
export let MAX_RATIO = BigInt.fromString('1000000')

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BigInt.fromString('18')))
}

export function convertTokenToDecimal(token: BigInt): BigDecimal {
  return token.toBigDecimal().div(exponentToBigDecimal(BigInt.fromString('18')))
}

export function updatePosition(exchangeAddress: Address, user: Address, amount: BigInt): void {
  let id = exchangeAddress.toHexString().concat('-').concat(user.toHexString())
  let position = Position.load(id)
  if (position === null) {
    position = new Position(id)
    position.balance = amount
    position.exchange = exchangeAddress.toHexString()
    position.user = user.toHexString()
    position.save()
  } else {
    position.balance = amount
    position.save()
  }
}


export function setUser(userAddress: Address): void {
  let user = User.load(userAddress.toHexString())
  if (user === null) {
    user = new User(userAddress.toHexString())
    user.save()
  }
}

export function updateTokenPrice(exchangeAddress: Address, poolBalance: BigInt, reserveRatio: BigInt, totalSupply: BigInt): void {
  let id = exchangeAddress.toHexString()
  let exchange = Exchange.load(id)
  if (exchange === null) {
    log.error('Exchange is null', [id])
    throw new Error("Exchange is null")
  }
  const priceNumerator = (poolBalance.times(MAX_RATIO)).toString()
  const priceDenominator = (reserveRatio.times(totalSupply)).toString()
  
  exchange.tokenPriceNumerator = priceNumerator
  exchange.tokenPriceDenominator = priceDenominator
  exchange.save()
}

