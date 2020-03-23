import Config from '../config';
import { ChartController } from '../chartController';

export class TrendlineChartController extends ChartController {
  constructor(props) {
    super({storageKey: Config.TRENDLINE_STGKEY, ...props});
  }

  mapToChartData(first, price) {
    return { 
      date: price.date,
      price: price.price
    };
  }

  parsePrices(prices) {
    return prices.map(p => {
      return {
          date: new Date(p.date),
          price: p.close
      };
    });
  }
}