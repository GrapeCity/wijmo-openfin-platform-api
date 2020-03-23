import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as wjcChart from '@grapecity/wijmo.chart';
import { ChannelClient } from 'openfin/_v2/api/interappbus/channel/client';

import { ChannelName, ChannelTopics, Portfolio } from 'stock-core';
import { Config } from '../data/config';

@Component({
  selector: 'stock-changes-chart',
  templateUrl: './stock-changes-chart.component.html',
  styleUrls: ['./stock-changes-chart.component.css']
})
export class StockChangesChartComponent {
  _channelPromise: Promise<ChannelClient>;

  /**
   * Indicates that disconnection occured and currently connection is in progress.
   * It is used to avoid multiple connections in such cases.
   */
  _reconnecting: boolean = false;

  portfolio: Portfolio;
  currentColor: any;
  currentSymbol: string;

  @ViewChild('chart', { static: false }) chart: wjcChart.FlexChart;

  public get title(): string {
    return document.title;
  }

  constructor(
    private changeDetector: ChangeDetectorRef
  ) {
    document.title = 'Stock Changes';

    // create portfolio
    this.portfolio = new Portfolio({
      storageKey: Config.CHANGES_STGKEY,
      mapToChartData: this._mapToChartData
    });

    this._initChannel();
  }

  private _initChannel() {    
    if (typeof fin === 'undefined') {
        console.warn('Channels cannot be initialized because "fin" is undefined.');
        return;
    }

    this._channelPromise = fin.InterApplicationBus.Channel.connect(ChannelName)
      .then(channel => this._handleConnect(channel));
  }

  private _handleConnect(channel: ChannelClient): ChannelClient {
    this._reconnecting = false;
    console.log('Channels: connected');
    this._loadItems(channel);
    channel.register(ChannelTopics.CurrentChanged, symbol => this._currentChanged(symbol));
    channel.register(ChannelTopics.ItemAdded, item => this._itemAdded(item));
    channel.register(ChannelTopics.ItemRemoved, item => this._itemRemoved(item));
    channel.register(ChannelTopics.ItemChanged, item => this._itemChanged(item));
    channel.onDisconnection(channelInfo => this._handleDisconnect(channelInfo));
    return channel;
  }

  private _handleDisconnect(channelInfo) {
    if (this._reconnecting) {
      return;
    }
    this._reconnecting = true;
    // handle the channel lifecycle here - we can connect again which will return a promise
    // that will resolve if/when the channel is re-created.
    console.log('Channels: disconnected');
    this._initChannel();
  }

  private _mapToChartData(first, price) {
    const change = (price.price / first.price) - 1;
    return { 
      date: price.date, 
      price: price.price, 
      change
    };
  }

  private _parsePrices(prices: any[]): any[] {
    return prices.map(p => {
      return {
          date: new Date(p.date),
          price: p.close
      };
    });
  }

  private _loadItems(channel: ChannelClient) {
    channel.dispatch(ChannelTopics.LoadItems).then(response => {
      const current: string = response.current;
      const items: any[] = response.items;
      console.log('Channels: received response "loadItems". Items: ' + items.length);
      items.forEach(item => {
        let prices = this._parsePrices(item.prices);
        this.portfolio.addItem(item.symbol, <boolean> item.chart, item.name, item.color, prices);
      });
      window.setTimeout(() => {
        this._currentChanged(current);
      });
    });

    console.log('Channels: sent message "loadItems"');
  }

  private _itemAdded(item) {
    console.log('Channels: received message "itemAdded"');

    let prices = this._parsePrices(item.prices);
    this.portfolio.addItem(item.symbol, <boolean> item.chart, item.name, item.color, prices);
    this.changeDetector.detectChanges();
  }

  private _itemRemoved(item) {
    console.log('Channels: received message "itemRemoved"');

    this.portfolio.removeItem(item.symbol);
  }

  private _itemChanged(item) {
    console.log('Channels: received message "itemChanged"');

    this.portfolio.changeItem(item.symbol, <boolean> item.chart);
    this.changeDetector.detectChanges();
  }

  // update chart selection to match portfolio selection
  private _currentChanged(symbol) {
    console.log('Channels: received message "currentChanged"');

    if (!this.chart) {
      return;
    }

    if (!this.currentSymbol) {
      this.currentSymbol = symbol;
      this._displaySymbol(this.currentSymbol);
      return;
    }

    if (symbol == this.currentSymbol) {
      return;
    }

    this.currentSymbol = symbol;

    const chartElement = this.chart.hostElement;
    chartElement.classList.remove('fadein', 'fadeout');
    chartElement.classList.add('fadein');
  }

  handleAnimationEnd() {
    const chartElement = this.chart.hostElement;
    if (chartElement.classList.contains('fadeout')) {

      chartElement.classList.remove('fadeout');
    } else if (chartElement.classList.contains('fadein')) {

      chartElement.classList.remove('fadein');
      chartElement.style.visibility = 'hidden';

      this._displaySymbol(this.currentSymbol);

      chartElement.style.visibility = 'visible';
      chartElement.classList.add('fadeout'); 
    }
  }

  private _getColor(symbol) {
    const current = this.portfolio.view.items.find(pi => pi.symbol == symbol);
    return current ? current.color : null;
  }

  private _displaySymbol(symbol) {
    const chartSeries = this.chart.series;
    for (let i = 0; i < chartSeries.length; i++) {
      if (chartSeries[i].name == symbol) {
        this.chart.selection = chartSeries[i];
        break;
      }
    }
    this.currentColor = this._getColor(symbol);
  }

  // send notifications about portfolio selection
  async selectionChanged(sender) {
    const selectedSeries = sender.selection;
    this.currentSymbol = selectedSeries ? selectedSeries.name : null;
    this.currentColor = this._getColor(this.currentSymbol);

    const connection = await this._channelPromise;
    connection.dispatch(ChannelTopics.SelectionChanged, this.currentSymbol);

    console.log('Channels: sent message "selectionChanged"');
  }

  closeApp() {
    fin.Application.getCurrent()
        .then(app => app.getWindow())
        .then(win => win.close(false));
  }
}