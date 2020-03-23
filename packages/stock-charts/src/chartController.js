import { ChannelName, ChannelTopics, Portfolio } from 'stock-core';

const fin = window.fin;

export class ChartController {

  _channelPromise;

  /**
   * Indicates that disconnection occured and currently connection is in progress.
   * It is used to avoid multiple connections in such cases.
   */
  _reconnecting = false;

  constructor(props) {
    this.props = props;    
    this.currentSymbol = null;

    // create portfolio
    this.portfolio = new Portfolio({
      storageKey: this.props.storageKey,
      mapToChartData: this.mapToChartData
    });

    this._initChannel();
  }

  getChartPeriod() {
    return this.portfolio.chartPeriod;
  }

  setChartPeriod(period) {
    this.portfolio.chartPeriod = period;
  }

  _initChannel() {
    if (typeof fin === 'undefined') {
        console.warn('Channels cannot be initialized because "fin" is undefined.');
        return;
    }

    this._channelPromise = fin.InterApplicationBus.Channel.connect(ChannelName)
      .then(channel => this._handleConnect(channel));
  }

  _handleConnect(channel) {
    this._reconnecting = false;            
    console.log('Channels: connected');
    this._loadItems(channel);
    channel.register(ChannelTopics.CurrentChanged, symbol => this._currentChanged(symbol));
    channel.register(ChannelTopics.ItemAdded, item => this._itemAdded(item));
    channel.register(ChannelTopics.ItemRemoved, item => this._itemRemoved(item));
    channel.register(ChannelTopics.ItemChanged, item => { /* do nothing */ });
    channel.onDisconnection(channelInfo => this._handleDisconnect(channelInfo));
    return channel;
  }

  _handleDisconnect(channelInfo) {
    if (this._reconnecting) {
      return;
    }
    this._reconnecting = true;
    // handle the channel lifecycle here - we can connect again which will return a promise
    // that will resolve if/when the channel is re-created.
    console.log('Channels: disconnected');
    this._initChannel();
  }

  _loadItems(channel) {
    channel.dispatch(ChannelTopics.LoadItems).then(response => {
      const current = response.current;
      const items = response.items;
      console.log('Channels: received response "loadItems". Items: ' + items.length);
      items.forEach(item => {
        let prices = this.parsePrices(item.prices);
        this.portfolio.addItem(item.symbol, item.chart, item.name, item.color, prices);
      });
      window.setTimeout(() => {
        this._currentChanged(current);
      });
    });

    console.log('Channels: sent message "loadItems"');
  }

  _itemAdded(item) {
    console.log('Channels: received message "itemAdded"');

    let prices = this.parsePrices(item.prices);
    this.portfolio.addItem(item.symbol, item.chart, item.name, item.color, prices);
  }

  _itemRemoved(item) {
    console.log('Channels: received message "itemRemoved"');

    this.portfolio.removeItem(item.symbol);
  }

  // update chart selection to match portfolio selection
  _currentChanged(symbol) {
    console.log('Channels: received message "currentChanged"');

    const chartElement = this.props.chartRef.current;
    if (!chartElement) {
      return;
    }

    if (!this.currentSymbol) {
      this.currentSymbol = symbol;
      this.changeCurrent(this.currentSymbol);
      return;
    }

    /* eslint-disable-next-line eqeqeq */
    if (symbol == this.currentSymbol) {
      return;
    }

    this.currentSymbol = symbol;

    chartElement.classList.remove('fadein', 'fadeout');
    chartElement.classList.add('fadein');
  }

  mapToChartData(first, price) {
    return price;
  }

  parsePrices(prices) {
    return prices;
  }

  handleAnimationStart() {
    // do nothing here
  }

  handleAnimationEnd() {
    const chartElement = this.props.chartRef.current;
    if (chartElement.classList.contains('fadeout')) {

      chartElement.classList.remove('fadeout');
    } else if (chartElement.classList.contains('fadein')) {

  	  chartElement.classList.remove('fadein');
      chartElement.style.visibility = 'hidden';

      this.changeCurrent(this.currentSymbol);

      chartElement.style.visibility = 'visible';
      chartElement.classList.add('fadeout');
    }
  }

  changeCurrent(symbol) {
    /* eslint-disable-next-line eqeqeq */
    const current = this.portfolio.view.items.find(pi => pi.symbol == symbol);    
    this.props.handleCurrentChange(current);
  }
}