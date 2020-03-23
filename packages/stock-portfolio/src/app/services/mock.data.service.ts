import { Injectable } from '@angular/core';

import { Company } from 'stock-core';
import { DataService } from './data.service';
import { stocks } from '../data/stocks';

@Injectable()
export class MockDataService implements DataService {

  constructor() { }

  updateCompany(company: Company): Promise<Company> {
    //console.log('Called method \'updateCompany\'');
    
    const stock = stocks.find(s => s.symbol == company.symbol);
    
    company.name = stock.name;

    const prices = this.randomPrices();
    company.prices = prices.reverse(); // last price should go first

    return Promise.resolve(company);
  }

  searchCompany(query: string): Promise<any[]> {
    //console.log('Called method \'searchCompany\'');

    const symbolRx = new RegExp('^' + query, 'i');
    const nameRx = new RegExp(query, 'i');

    const res = stocks.filter(
        item => symbolRx.test(item.symbol) || nameRx.test(item.name)
    );

    return Promise.resolve(res);
  }

  private randomPrices(): any[] {
      const generator = new StockPricesGenerator(1000, 200);
      return generator.generate();
  }
}

/**
 * Generates a series of random prices
 */
class StockPricesGenerator {
  private static readonly MSEC_IN_DAY = 86400000;
  private static readonly MEAN = 0.1;
  private static readonly STD_DEVIATION = 1;

  private numberOfDays: number;
  private firstDate: Date;
  private firstPrice: number;

  constructor(numberOfDays: number, firstPrice: number) {
    this.numberOfDays = numberOfDays;

    const timeOffset = numberOfDays*StockPricesGenerator.MSEC_IN_DAY;
    this.firstDate = new Date(new Date().getTime() - timeOffset);
    this.firstPrice = firstPrice;
  }

  generate(): any[] {
      const prices = [];
      
      const gaussian = new GaussianGenerator(
        StockPricesGenerator.MEAN, 
        StockPricesGenerator.STD_DEVIATION);

      let date = this.firstDate;
      let price = this.firstPrice;

      for (let i = 0; i < this.numberOfDays; i++) {
        date = new Date(date.getTime() + StockPricesGenerator.MSEC_IN_DAY);
        price += gaussian.generate();
        const max = 1 + 2*Math.random();
        const offset = max*Math.random();
        prices.push({ 
          date, 
          high: price + offset,
          low: price + offset - max,
          open: price + offset - max*Math.random(),
          close: price
        });
      }

      return prices;
  }
}

/**
 * Implementation of Marsaglia polar method for generating gaussian pseudo random numbers
 */
class GaussianGenerator {

  private readonly mean: number;
  private readonly stdDev: number;

  private spare: number = 0;
  private hasSpare: boolean = false;

  constructor(mean: number, stdDev: number) {
    this.mean = mean;
    this.stdDev = stdDev;
  }

  generate() {
    if (this.hasSpare) {          
      this.hasSpare = false;
      return this.mean + this.stdDev * this.spare;
    } 
    
    let u = 0;
    let v = 0;
    let s = 0;          
    do {
        u = 2.0 * Math.random() - 1.0;
        v = 2.0 * Math.random() - 1.0;
        s = u * u + v * v;
    } while (s >= 1 || s == 0);

    s = Math.sqrt(-2.0 * Math.log(s) / s);
    
    this.spare = v * s;
    this.hasSpare = true;

    return this.mean + this.stdDev * u * s;
  }
}