import { log, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { PairFactory, Exchange, Cryptomedia } from '../../generated/schema'
import { Exchange as ExchangeTemplate } from '../../generated/templates'
import { Cryptomedia as CryptomediaTemplate } from '../../generated/templates'

import { PairCreated } from '../../generated/PairFactory/PairFactory'
import { convertTokenToDecimal, PAIR_FACTORY_ADDRESS, ONE_BI, RESERVE_RATIO, updatePosition, ZERO_BD, ZERO_BI } from './helpers'

export function handlePairCreated(event: PairCreated): void {
  // load factory (create if first exchange)
  let pairFactory = PairFactory.load(PAIR_FACTORY_ADDRESS)
  if (pairFactory === null) {
    pairFactory = new PairFactory(PAIR_FACTORY_ADDRESS);
    pairFactory.totalVolumeETH = ZERO_BI
    pairFactory.pairCount = ZERO_BI
    pairFactory.txCount = ZERO_BI
  }
  pairFactory.pairCount = pairFactory.pairCount.plus(ONE_BI)
  pairFactory.save();

  // create new exchange instance
  let exchange = new Exchange(event.params.exchangeAddress.toHexString()) as Exchange
  exchange.name = event.params.name;
  exchange.symbol = event.params.symbol;
  exchange.deployer = event.address;
  exchange.creator = event.params.creator;
  exchange.poolBalance = ZERO_BI;
  exchange.totalSupply = ZERO_BI;
  exchange.reserveRatio = RESERVE_RATIO;
  exchange.tokenPriceNumerator = '0';
  exchange.tokenPriceDenominator = '0';
  exchange.txCount = ZERO_BI;
  exchange.volumeETH = ZERO_BI;

  // create new cryptomedia instance
  let cryptomedia = new Cryptomedia(event.params.cryptomediaAddress.toHexString()) as Cryptomedia
  cryptomedia.name = event.params.name;
  cryptomedia.symbol = event.params.symbol;
  cryptomedia.deployer = event.address;
  cryptomedia.creator = event.params.creator;

  // create the tracked contract based on the template
  ExchangeTemplate.create(event.params.exchangeAddress)
  CryptomediaTemplate.create(event.params.cryptomediaAddress)

  // save updated values
  exchange.save()
  cryptomedia.save()
  pairFactory.save()
}