import { log, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { PairFactory, Exchange, Cryptomedia, User, Position, Buy, Sell } from "../../generated/schema"
import { PairFactory as PairFactoryContract } from '../../generated/templates/Exchange/PairFactory'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const CRYPTOMEDIA_FACTORY_ADDRESS = '0xc7aA721d75df123247b46cb3Fa99cd4EE78b6c1F'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let RESERVE_RATIO = BigInt.fromString('333333')
export let MAX_RATIO = BigDecimal.fromString('1000000')

export let factoryContract = PairFactoryContract.bind(Address.fromString(CRYPTOMEDIA_FACTORY_ADDRESS));

// utility

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
  return token.toBigDecimal().div(exponentToBigDecimal(BigInt.fromString('6')))
}

// export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
//   if (exchangeDecimals == ZERO_BI) {
//     return tokenAmount.toBigDecimal()
//   }
//   return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
// }

// update

export function updatePosition(exchangeAddress: Address, user: Address, amount: BigDecimal): void {
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
  if (position === null) {
    log.error('Position is null', [id])
    throw new Error("Position is null")
  }
  let exchange = Exchange.load(exchangeAddress.toHexString())
  if (exchange === null) {
    log.error('Position is null', [id])
    throw new Error("Position is null")
  }
  exchange.positions.push(position.id)
  exchange.save()
}

export function setUser(userAddress: Address): void {
  let user = User.load(userAddress.toHexString())
  if (user === null) {
    user = new User(userAddress.toHexString())
    user.save()
  }
}

export function updatePoolBalance(exchangeAddress: Address, newBalance: BigDecimal): void {
  let id = exchangeAddress.toHexString()
  let exchange = Exchange.load(id)
  if (exchange === null) {
    log.error('Exchange is null', [id])
    throw new Error("Exchange is null")
  }
  exchange.poolBalance = newBalance
  exchange.save()
}

export function updateTotalSupply(exchangeAddress: Address, newTotalSupply: BigDecimal): void {
  let id = exchangeAddress.toHexString()
  let exchange = Exchange.load(id)
  if (exchange === null) {
    log.error('Exchange is null', [id])
    throw new Error("Exchange is null")
  }
  exchange.totalSupply = newTotalSupply
  exchange.save()
}

export function updateTokenPrice(exchangeAddress: Address, poolBalance: BigDecimal, reserveRatio: BigInt, totalSupply: BigDecimal): BigDecimal {
  let id = exchangeAddress.toHexString()
  let exchange = Exchange.load(id)
  if (exchange === null) {
    log.error('Exchange is null', [id])
    throw new Error("Exchange is null")
  }
  exchange.tokenPrice = (poolBalance).div((reserveRatio.toBigDecimal().div(MAX_RATIO)).times(totalSupply))
  exchange.save()
  let price = exchange.tokenPrice
  return price
}

export function updateMarketCap(exchangeAddress: Address, price: BigDecimal, totalSupply: BigDecimal): void {
  let id = exchangeAddress.toHexString()
  let exchange = Exchange.load(id)
  if (exchange === null) {
    log.error('Exchange is null', [id])
    throw new Error("Exchange is null")
  }
  exchange.marketCap = price.times(totalSupply)
  exchange.save()
}

