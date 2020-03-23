import Config from '../config';
import { ChartController } from '../chartController';

export class HlocChartController extends ChartController {
  constructor(props) {
    super({storageKey: Config.HLOC_STGKEY, ...props});
  }

  mapToChartData(first, price) {
    return {
      date: price.date,
      high: price.high,
      low: price.low,
      open: price.open,
      close: price.close
    };
  }

  parsePrices(prices) {
    return prices.map(p => {
      return {
          date: new Date(p.date),
          high: p.high,
          low: p.low,
          open: p.open,
          close: p.close
      };
    });
  }
}