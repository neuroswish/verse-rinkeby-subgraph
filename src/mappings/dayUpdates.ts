import { log, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ExchangeHourData, ExchangeDayData, VerseDayData, PairFactory, Exchange } from "../../generated/schema";
import { PAIR_FACTORY_ADDRESS, ONE_BI, ZERO_BD, ZERO_BI, MAX_RATIO } from "./helpers";

export function updateVerseDayData(event: ethereum.Event): VerseDayData {
    let verse = PairFactory.load(PAIR_FACTORY_ADDRESS)
    if (verse === null) {
        log.error('Pair Factory is null', [event.address.toHexString()])
        throw new Error("Pair Factory is null")
    }
    let timestamp = event.block.timestamp.toI32()
    let dayID = timestamp / 86400
    let dayStartTimestamp = dayID * 86400
    let verseDayData = VerseDayData.load(dayID.toString())
    if (verseDayData === null) {
        verseDayData = new VerseDayData(dayID.toString())
        verseDayData.date = dayStartTimestamp
        verseDayData.dailyVolumeETH = ZERO_BI
        verseDayData.totalVolumeETH = ZERO_BI
    }

    verseDayData.txCount = verse.txCount
    verseDayData.save()

    return verseDayData as VerseDayData
}

export function updateExchangeHourData(event: ethereum.Event): ExchangeHourData {
    let timestamp = event.block.timestamp.toI32()
    let hourIndex = timestamp / 3600 // get unique hour within unix history
    let hourStartUnix = hourIndex * 3600 // want the rounded effect
    let hourExchangeId = event.address.toHexString().concat("-").concat(BigInt.fromI32(hourIndex).toString())
    let exchange = Exchange.load(event.address.toHexString())
    if (exchange === null) {
        log.error('Exchange is null', [event.address.toHexString()])
        throw new Error("Exchange is null")
    }
    let exchangeHourData = ExchangeHourData.load(hourExchangeId)
    if (exchangeHourData === null) {
        exchangeHourData = new ExchangeHourData(hourExchangeId)
        exchangeHourData.hourStartUnix = hourStartUnix
        exchangeHourData.exchange = event.address.toHexString()
        exchangeHourData.hourlyVolumeETH = ZERO_BI
        exchangeHourData.hourlyVolumeToken = ZERO_BI
        exchangeHourData.hourlyTxns = ZERO_BI
    }
    exchangeHourData.totalSupply = exchange.totalSupply
    let poolBalance = exchange.poolBalance
    let totalSupply = exchange.totalSupply
    let reserveRatio = exchange.reserveRatio
    exchangeHourData.tokenPriceNumerator = (poolBalance).times(MAX_RATIO)
    exchangeHourData.tokenPriceDenominator = (totalSupply).times(reserveRatio)
    exchangeHourData.hourlyTxns = exchangeHourData.hourlyTxns.plus(ONE_BI)
    exchangeHourData.save()

    return exchangeHourData as ExchangeHourData
}

export function updateExchangeDayData(event: ethereum.Event): ExchangeDayData {
    let timestamp = event.block.timestamp.toI32()
    let dayId = timestamp / 86400
    let dayStartTimestamp = dayId * 86400
    let dayExchangeId = event.address.toHexString().concat('-').concat(BigInt.fromI32(dayId).toString())
    let exchange = Exchange.load(event.address.toHexString())
    if (exchange === null) {
        log.error('Exchange is null', [event.address.toHexString()])
        throw new Error("Exchange is null")
    }
    let exchangeDayData = ExchangeDayData.load(dayExchangeId)
    if (exchangeDayData === null) {
        exchangeDayData = new ExchangeDayData(dayExchangeId)
        exchangeDayData.date = dayStartTimestamp
        exchangeDayData.exchange = event.address.toHexString()
        exchangeDayData.dailyVolumeETH = ZERO_BI
        exchangeDayData.dailyVolumeToken = ZERO_BI
        exchangeDayData.dailyTxns = ZERO_BI
    }

    exchangeDayData.totalSupply = exchange.totalSupply
    let poolBalance = exchange.poolBalance
    let totalSupply = exchange.totalSupply
    let reserveRatio = exchange.reserveRatio
    exchangeDayData.tokenPriceNumerator = (poolBalance).times(MAX_RATIO)
    exchangeDayData.tokenPriceDenominator = (totalSupply).times(reserveRatio)
    exchangeDayData.dailyTxns = exchangeDayData.dailyTxns.plus(ONE_BI)
    exchangeDayData.save()
    exchangeDayData.save()

    return exchangeDayData as ExchangeDayData
}