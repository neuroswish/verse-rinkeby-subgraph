import { log, BigInt, BigDecimal, store, Address } from '@graphprotocol/graph-ts'
import {
  PairFactory,
  Exchange,
  Cryptomedia,
  User,
  Position,
  Buy as BuyEvent,
  Sell as SellEvent,
  Redeem as RedeemEvent,
} from "../../generated/schema"

import { Buy, Sell, Redeem, Exchange as ExchangeContract } from '../../generated/templates/Exchange/Exchange'
import { Cryptomedia as CryptomediaContract } from '../../generated/templates/Cryptomedia/Cryptomedia'
import { updateExchangeHourData, updateExchangeDayData, updateVerseDayData } from './dayUpdates'
import {
  ADDRESS_ZERO,
  PAIR_FACTORY_ADDRESS,
  ZERO_BD,
  RESERVE_RATIO,
  MAX_RATIO,
  updatePosition,
  setUser,
  convertTokenToDecimal,
  BI_18,
  convertEthToDecimal,
  updatePoolBalance,
  updateTotalSupply,
  updateTokenPrice,
  updateMarketCap,
  ONE_BI
} from './helpers'

// buy events
export function handleBuy(event: Buy): void {
  // buyer stats
  let buyer = event.params.buyer
  setUser(buyer)

  // get exchange object from schema 
  let exchange = Exchange.load(event.address.toHexString())
  if (exchange === null) {
    log.error('Exchange is null', [event.address.toHexString()])
    throw new Error("Exchange is null")
  }
  let verse = PairFactory.load(PAIR_FACTORY_ADDRESS)
  if (verse === null) {
    log.error('Pair Factory is null', [event.address.toHexString()])
    throw new Error("Pair Factory is null")
  }
  // get exchange contract from chain
  let exchangeContract = ExchangeContract.bind(event.address)

  // get amount of tokens being bought
  let amount = convertTokenToDecimal(event.params.tokens)
  // get price of tokens bought
  let price = convertEthToDecimal(event.params.price)

  // get list of buys from saved exchange object
  let buys = exchange.buys
  let buy = new BuyEvent(event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(buys.length).toString()))
  buy.blockNumber = event.block.number
  buy.timestamp = event.block.timestamp
  buy.exchange = exchange.id
  buy.amount = amount
  buy.price = price
  buy.buyer = buyer
  buy.save()
  // push new buy event to exchange object buys list
  buys.push(buy.id)

  // update calculated and derived fields based on data pulled directly from contract
  updatePosition(event.address, buyer, convertTokenToDecimal(exchangeContract.balanceOf(buyer)))
  updatePoolBalance(event.address, convertEthToDecimal(exchangeContract.poolBalance()))
  updateTotalSupply(event.address, convertTokenToDecimal(exchangeContract.totalSupply()))
  let poolBalance = convertEthToDecimal(exchangeContract.poolBalance())
  let reserveRatio = exchangeContract.reserveRatio()
  let totalSupply = convertTokenToDecimal(exchangeContract.totalSupply())
  let tokenPrice = updateTokenPrice(event.address, poolBalance, reserveRatio, totalSupply)
  updateMarketCap(event.address, tokenPrice, totalSupply)

  // update hourly, daily, and global values
  // global verse
  verse.totalVolumeETH = verse.totalVolumeETH.plus(price)
  verse.txCount = verse.txCount.plus(ONE_BI)
  verse.save()

  // daily verse
  let verseDayData = updateVerseDayData(event)
  verseDayData.dailyVolumeETH = verseDayData.dailyVolumeETH.plus(price)
  verseDayData.txCount
  verseDayData.save()

  // exchange
  exchange.volumeETH = exchange.volumeETH.plus(price)
  exchange.txCount = exchange.txCount.plus(ONE_BI)
  exchange.save()
  
  // daily exchange
  let exchangeDayData = updateExchangeDayData(event)
  exchangeDayData.dailyVolumeETH = exchangeDayData.dailyVolumeETH.plus(price)
  exchangeDayData.dailyVolumeToken = exchangeDayData.dailyVolumeToken.plus(amount)
  exchangeDayData.tokenPrice = tokenPrice
  exchangeDayData.save()

  // hourly exchange
  let exchangeHourData = updateExchangeHourData(event)
  exchangeHourData.hourlyVolumeETH = exchangeHourData.hourlyVolumeETH.plus(price)
  exchangeHourData.hourlyVolumeToken = exchangeHourData.hourlyVolumeToken.plus(amount)
  exchangeHourData.tokenPrice = tokenPrice
  exchangeHourData.save()
}

export function handleSell(event: Sell): void {
  // seller stats
  let seller = event.params.seller
  setUser(seller)

  // get exchange object from schema 
  let exchange = Exchange.load(event.address.toHexString())
  if (exchange === null) {
    log.error('Exchange is null', [event.address.toHexString()])
    throw new Error("Exchange is null")
  }
  let verse = PairFactory.load(PAIR_FACTORY_ADDRESS)
  if (verse === null) {
    log.error('Pair Factory is null', [event.address.toHexString()])
    throw new Error("Pair Factory is null")
  }
  // get exchange contract from chain
  let exchangeContract = ExchangeContract.bind(event.address)

  // get amount of tokens being sold
  let amount = convertTokenToDecimal(event.params.tokens)
  // get price of tokens sold
  let price = convertEthToDecimal(event.params.eth)

  // get list of sells from saved exchange object
  let sells = exchange.sells
  let sell = new SellEvent(event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(sells.length).toString()))
  sell.blockNumber = event.block.number
  sell.timestamp = event.block.timestamp
  sell.exchange = exchange.id
  sell.amount = amount
  sell.price = price
  sell.seller = seller
  sell.save()
  // push new sell event to exchange object sells list
  sells.push(sell.id)

  // update calculated and derived fields based on data pulled directly from contract
  updatePosition(event.address, seller, convertTokenToDecimal(exchangeContract.balanceOf(seller)))
  updatePoolBalance(event.address, convertEthToDecimal(exchangeContract.poolBalance()))
  updateTotalSupply(event.address, convertTokenToDecimal(exchangeContract.totalSupply()))
  let poolBalance = convertEthToDecimal(exchangeContract.poolBalance())
  let reserveRatio = exchangeContract.reserveRatio()
  let totalSupply = convertTokenToDecimal(exchangeContract.totalSupply())
  let tokenPrice = updateTokenPrice(event.address, poolBalance, reserveRatio, totalSupply)
  updateMarketCap(event.address, tokenPrice, totalSupply)

  // update hourly, daily, and global values
  // global verse
  verse.totalVolumeETH = verse.totalVolumeETH.plus(price)
  verse.txCount = verse.txCount.plus(ONE_BI)
  verse.save()

  // daily verse
  let verseDayData = updateVerseDayData(event)
  verseDayData.dailyVolumeETH = verseDayData.dailyVolumeETH.plus(price)
  verseDayData.txCount
  verseDayData.save()

  // exchange
  exchange.volumeETH = exchange.volumeETH.plus(price)
  exchange.txCount = exchange.txCount.plus(ONE_BI)
  exchange.save()
  
  // daily exchange
  let exchangeDayData = updateExchangeDayData(event)
  exchangeDayData.dailyVolumeETH = exchangeDayData.dailyVolumeETH.plus(price)
  exchangeDayData.dailyVolumeToken = exchangeDayData.dailyVolumeToken.plus(amount)
  exchangeDayData.tokenPrice = tokenPrice
  exchangeDayData.save()

  // hourly cryptomedia
  let exchangeHourData = updateExchangeHourData(event)
  exchangeHourData.hourlyVolumeETH = exchangeHourData.hourlyVolumeETH.plus(price)
  exchangeHourData.hourlyVolumeToken = exchangeHourData.hourlyVolumeToken.plus(amount)
  exchangeHourData.tokenPrice = tokenPrice
  exchangeHourData.save()
}

export function handleRedeem(event: Redeem): void {
  // redeemer stats
  let redeemer = event.params.redeemer
  setUser(redeemer)

  // get exchange object from schema 
  let exchange = Exchange.load(event.address.toHexString())
  if (exchange === null) {
    log.error('Exchange is null', [event.address.toHexString()])
    throw new Error("Exchange is null")
  }
  let verse = PairFactory.load(PAIR_FACTORY_ADDRESS)
  if (verse === null) {
    log.error('Pair Factory is null', [event.address.toHexString()])
    throw new Error("Pair Factory is null")
  }
  // get exchange contract from chain
  let exchangeContract = ExchangeContract.bind(event.address)

  // get list of sells from saved exchange object
  let redemptions = exchange.redemptions
  let redemption = new RedeemEvent(event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(redemptions.length).toString()))
  redemption.blockNumber = event.block.number
  redemption.timestamp = event.block.timestamp
  redemption.exchange = exchange.id
  redemption.redeemer = redeemer
  redemption.save()
  // push new sell event to exchange object sells list
  redemptions.push(redemption.id)

  // update calculated and derived fields based on data pulled directly from contract
  updatePosition(event.address, redeemer, convertTokenToDecimal(exchangeContract.balanceOf(redeemer)))
}

