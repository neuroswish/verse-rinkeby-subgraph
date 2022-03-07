import { log } from '@graphprotocol/graph-ts'
import { PairFactory, Exchange, Cryptomedia } from '../../generated/schema'
import { Exchange as ExchangeTemplate } from '../../generated/templates'
import { Cryptomedia as CryptomediaTemplate } from '../../generated/templates'

import { PairCreated } from '../../generated/PairFactory/PairFactory'
import { convertTokenToDecimal, PAIR_FACTORY_ADDRESS, ONE_BI, RESERVE_RATIO, updateMarketCap, updatePosition, ZERO_BD, ZERO_BI } from './helpers'

export function handlePairCreated(event: PairCreated): void {
  // load factory (create if first exchange)
  let pairFactory = PairFactory.load(PAIR_FACTORY_ADDRESS)
  if (pairFactory === null) {
    pairFactory = new PairFactory(PAIR_FACTORY_ADDRESS);
    pairFactory.totalVolumeETH = ZERO_BD
    pairFactory.pairCount = ZERO_BI
    pairFactory.txCount = ZERO_BI
  }
  pairFactory.save();

  // create new exchange instance
  let exchange = new Exchange(event.params.exchangeAddress.toHexString()) as Exchange
  //exchange.name = event.params.name;
  //cryptomedia.symbol = event.params.symbol;
  exchange.deployer = event.address;
  exchange.creator = event.params.creator;
  exchange.poolBalance = ZERO_BD;
  exchange.totalSupply = ZERO_BD;
  exchange.reserveRatio = RESERVE_RATIO;
  exchange.tokenPrice = ZERO_BD;
  exchange.marketCap = ZERO_BD;
  exchange.txCount = ZERO_BI;
  exchange.volumeETH = ZERO_BD;

  exchange.positions = [];
  exchange.buys = [];
  exchange.sells = [];

  // create new cryptomedia instance
  let cryptomedia = new Cryptomedia(event.params.cryptomediaAddress.toHexString()) as Cryptomedia
  //cryptomedia.name = event.params.name;
  //cryptomedia.symbol = event.params.symbol;
  cryptomedia.deployer = event.address;
  cryptomedia.creator = event.params.creator;
  // create the tracked contract based on the template
  ExchangeTemplate.create(event.params.exchangeAddress)
  CryptomediaTemplate.create(event.params.cryptomediaAddress)

  // save updated values
  exchange.save()
  cryptomedia.save()
  pairFactory.pairCount = pairFactory.pairCount.plus(ONE_BI)
  pairFactory.save()
}