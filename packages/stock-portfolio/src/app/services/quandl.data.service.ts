import { Injectable } from '@angular/core';

import * as wjcCore from '@grapecity/wijmo';

import { Company } from 'stock-core';
import { DataService } from './data.service';

/**
 * Obsolete service that uses Quandl API:
 * https://www.quandl.com/
 */

@Injectable()
export class QuandlDataService implements DataService {

  private static readonly TOKEN: string = 'rX6NsszGKZp32RUbA7SR';

  private static readonly BASE_URL: string = QuandlDataService._initializeBaseUrl();

  private static _initializeBaseUrl(): string {
    let protocol = 'https';
    if (navigator.appVersion.indexOf('MSIE 9.') !== -1) {
        // $.support.cors = true;
        protocol = 'http';
    }

    return protocol + '://www.quandl.com/api';
  }

  constructor() { }

  updateCompany(company: Company): Promise<Company> {    

    const symbol = company.symbol;
    const url = QuandlDataService.BASE_URL + '/v3/datasets/WIKI/' + symbol;
    const startDate = wjcCore.Globalize.formatDate(new Date('01/01/2008'), 'yyyy-MM-dd');
    const endDate = wjcCore.Globalize.formatDate(new Date(), 'yyyy-MM-dd');

    const promise = new Promise<Company>(resolve => {

      wjcCore.httpRequest(url, {
          data: {
              auth_token: QuandlDataService.TOKEN,
              start_date: startDate,
              end_date: endDate,
              // order: 'asc',
              column_index: 11
          },
          success: (xhr) => {
              const result = JSON.parse(xhr.response);
              const dataset = result.dataset;

              company.name = dataset.name.substring(0, dataset.name.indexOf('('));

              // store prices
              const lines = dataset.data;
              for (let i = 0; i < lines.length; i++) {
                  const item = lines[i];
                  const date = new Date(item[0].replace(/-/g, '/').trim());
                  const price = parseFloat(item[1]);
                  company.prices.push({ date, price });
              }

              resolve(company);
          }
      });
    });

    return promise;
  }

  searchCompany(query: string): Promise<any[]> {

    const url = QuandlDataService.BASE_URL + '/v2/datasets.json';

    const promise = new Promise<any[]>(resolve => {

      wjcCore.httpRequest(url, {
          data: {
              auth_token: QuandlDataService.TOKEN,
              query: query.trim(),
              page: 1,
              per_page: 20,
              source_code: 'WIKI'
          },
          success: (xhr) => {
              const result = JSON.parse(xhr.response);
              const lines = result.docs;                            
              // console.log('got result with ' + lines.length + ' matches.');

              const matches: any[] = [];
              for (let i = 0; i < lines.length; i++) {
                  const item = lines[i];
                  const symbol = item.code;
                  const name = item.name.substring(0, item.name.indexOf('('));
                  matches.push({ symbol, name });
              }

              resolve(matches);
          }
      });
    });

    return promise;
  }
}