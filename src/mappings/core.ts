import { log, BigInt, BigDecimal, store, Address } from '@graphprotocol/graph-ts'
import {
  PairFactory,
  Exchange,
  User,
  Position,
  Buy as BuyEvent,
  Sell as SellEvent,
  Redeem as RedeemEvent,
} from "../../generated/schema"

import { Buy, Sell, Redeem, Exchange as ExchangeContract } from '../../generated/templates/Exchange/Exchange'
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
  updateTokenPrice,
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
  //let amount = convertTokenToDecimal(event.params.tokens)
  let amount = event.params.tokens
  // get price of tokens bought
  //let price = convertEthToDecimal(event.params.price)
  let price = event.params.price

  // get list of buys from saved exchange object
  //let buys = exchange.buys
  let buy = new BuyEvent(event.transaction.hash
    .toHexString())
  buy.blockNumber = event.block.number
  buy.timestamp = event.block.timestamp
  buy.exchange = exchange.id
  buy.amount = amount
  buy.price = price
  buy.buyer = buyer
  buy.save()

  // update calculated and derived fields based on data pulled directly from contract
  // updatePosition(event.address, buyer, exchangeContract.balanceOf(buyer))
  let poolBalance = exchangeContract.poolBalance()
  let reserveRatio = exchangeContract.reserveRatio()
  let totalSupply = exchangeContract.totalSupply()
  updateTokenPrice(event.address, poolBalance, reserveRatio, totalSupply)
  //updateMarketCap(event.address, tokenPrice, totalSupply)

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
  exchangeDayData.tokenPriceNumerator = exchange.tokenPriceNumerator
  exchangeDayData.tokenPriceDenominator = exchange.tokenPriceDenominator
  exchangeDayData.save()

  // hourly exchange
  let exchangeHourData = updateExchangeHourData(event)
  exchangeHourData.hourlyVolumeETH = exchangeHourData.hourlyVolumeETH.plus(price)
  exchangeHourData.hourlyVolumeToken = exchangeHourData.hourlyVolumeToken.plus(amount)
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
  let amount = event.params.tokens
  // get price of tokens sold
  let price = event.params.eth

  // get list of sells from saved exchange object
  //let sells = exchange.sells
  let sell = new SellEvent(event.transaction.hash
    .toHexString())
  sell.blockNumber = event.block.number
  sell.timestamp = event.block.timestamp
  sell.exchange = exchange.id
  sell.amount = amount
  sell.price = price
  sell.seller = seller
  sell.save()
  // push new sell event to exchange object sells list
  //sells.push(sell.id)

  // update calculated and derived fields based on data pulled directly from contract
  updatePosition(event.address, seller, exchangeContract.balanceOf(seller))
  // updatePoolBalance(event.address, convertEthToDecimal(exchangeContract.poolBalance()))
  // updateTotalSupply(event.address, convertTokenToDecimal(exchangeContract.totalSupply()))
  let poolBalance = exchangeContract.poolBalance()
  let reserveRatio = exchangeContract.reserveRatio()
  let totalSupply = exchangeContract.totalSupply()
  updateTokenPrice(event.address, poolBalance, reserveRatio, totalSupply)
  //updateMarketCap(event.address, tokenPrice, totalSupply)

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
  exchangeDayData.tokenPriceNumerator = exchange.tokenPriceNumerator
  exchangeDayData.tokenPriceDenominator = exchange.tokenPriceDenominator
  exchangeDayData.save()

  // hourly cryptomedia
  let exchangeHourData = updateExchangeHourData(event)
  exchangeHourData.hourlyVolumeETH = exchangeHourData.hourlyVolumeETH.plus(price)
  exchangeHourData.hourlyVolumeToken = exchangeHourData.hourlyVolumeToken.plus(amount)
  exchangeDayData.tokenPriceNumerator = exchange.tokenPriceNumerator
  exchangeDayData.tokenPriceDenominator = exchange.tokenPriceDenominator
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

  // get list of redemptions from saved exchange object
  let redemption = new RedeemEvent(event.transaction.hash
    .toHexString())
  redemption.blockNumber = event.block.number
  redemption.timestamp = event.block.timestamp
  redemption.exchange = exchange.id
  redemption.redeemer = redeemer
  redemption.save()
  // update calculated and derived fields based on data pulled directly from contract
  updatePosition(event.address, redeemer, exchangeContract.balanceOf(redeemer))
}

