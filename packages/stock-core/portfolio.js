import * as wjcCore from '@grapecity/wijmo';
import { ChartPeriod } from './chart';
import { Company } from './company';

/**
 * Represents a portfolio composed of items.
 */
export class Portfolio {

    constructor(options) {
        this._options = options;

        // initialize items collection/view
        this._items = new wjcCore.ObservableArray();
        this._cv = new wjcCore.CollectionView(this._items);
        this._cv.collectionChanged.addHandler(this._viewChanged.bind(this));

        this._chartPeriod = ChartPeriod.m12;
        this._updating = false;
        this._toChange = null;

        // load the portfolio from storage
        this._loadFromStorage();

        // save portfolio when unloading
        const self = this;
        window.addEventListener('unload', () => self._saveToStorage());
    }

    // gets the view with the portfolio items
    get view() {
        return this._cv;
    }

    // gets or sets the chart period
    get chartPeriod() {
        return this._chartPeriod;
    }

    set chartPeriod(value) {
        this._chartPeriod = value;
        this._updateChartData();
        this._viewChanged();
    }

    // add an item to the portfolio
    addItem(symbol, chart = true, name, color, prices) {
        if (!symbol) {
            return;
        }

        const index = this._indexOf(symbol);
        if (index > -1) {
            return;
        }
        
        const company = new Company(symbol);
        company.name = name;
        company.color = color;
        company.prices = prices;
        const item = new PortfolioItem(company, chart);
        this._items.push(item);
        this._updateChartData();
    }

    // remove an item from the portfolio
    removeItem(symbol) {
        const index = this._indexOf(symbol);
        if (index > -1) {
            this._items.splice(index, 1);
        }
    }

    changeItem(symbol, newChart) {
        const index = this._indexOf(symbol);
        if (index > -1) {
            this._items[index].updateChart(newChart);
            this._viewChanged();
        }
    }

    // load data from local storage
    _loadFromStorage() {
        try {
            const key = this._options.storageKey;
            let data = localStorage != null ? localStorage[key] : null;
            if (data != null && JSON != null) {
                data = JSON.parse(data);
                this.chartPeriod = data.chartPeriod;
            }
        } catch (err) { }
    }

    // save data to local storage
    _saveToStorage() {
        try {
            if (localStorage != null && JSON != null) {
                const key = this._options.storageKey;
                let data = {
                    chartPeriod: this.chartPeriod
                };
                localStorage[key] = JSON.stringify(data);
            }
        } catch (err) { }
    }

    _viewChanged() {
        const self = this;
        if (!self._updating) {
            self._updating = true;
            if (self._toChange) {
                window.clearTimeout(self._toChange);
            }
            self._toChange = window.setTimeout(() => {
                self._updateChartData();
                self._cv.refresh();
                self._updating = false;
            }, 250);
        }
    }

    // updates the chart data for all items
    _updateChartData() {
        for (let i = 0; i < this._items.length; i++) {
            const startDate = this._getChartStartDate();
            const mapToChartData = this._options.mapToChartData;
            this._items[i].updateChartData(startDate, mapToChartData);
        }
    }

    // gets the chart start date based on the current date and chart period
    _getChartStartDate() {
        const dt = new Date();
        switch (this.chartPeriod) {
            case ChartPeriod.All:
                return new Date(2005, 1, 1);
            case ChartPeriod.YTD:
                return new Date(dt.getFullYear(), 0, 1);
            case ChartPeriod.w2:
                dt.setDate(dt.getDate() - 14);
                return dt;
            case ChartPeriod.m1:
                dt.setMonth(dt.getMonth() - 1);
                return dt;
            case ChartPeriod.m3:
                dt.setMonth(dt.getMonth() - 3);
                return dt;
            case ChartPeriod.m6:
                dt.setMonth(dt.getMonth() - 6);
                return dt;
            case ChartPeriod.m12:
                dt.setFullYear(dt.getFullYear() - 1);
                return dt;
            case ChartPeriod.m24:
                dt.setFullYear(dt.getFullYear() - 2);
                return dt;
            case ChartPeriod.m36:
                dt.setFullYear(dt.getFullYear() - 3);
                return dt;
            default:
                // unknown period, use the last 12 months
                dt.setFullYear(dt.getFullYear() - 1);
                return dt;
        }
    }

    // gets the index of an item in the portfolio given a symbol
    _indexOf(symbol) {
        if (symbol) {
            symbol = symbol.toUpperCase();
            for (let i = 0; i < this._items.length; i++) {
                /* eslint-disable-next-line eqeqeq */
                if (this._items[i].symbol == symbol) {
                    return i;
                }
            }
        }
        return -1;
    }
}

/**
 * Represents a portfolio item.
 */
export class PortfolioItem {

    constructor(company, chart) {
        this._company = company;
        this._chart = chart;
        this._chartData = [];
    }

    get symbol() {
        return this._company.symbol;
    }
    get name() {
        return this._company.name;
    }
    get color() {
        return this._company.color;
    }
    get chart() {
        return this._chart;
    }
    get chartData() {
        return this._chartData;
    }

    updateChart(chart) {
        this._chart = chart;
    }

    // updates the data to be shown on the chart
    updateChartData(startDate, mapToChartData) {
        let first = null;
        let chartData = [];
        const prices = this._company.prices;

        // calculate prices as variation relative to the first value
        // note: prices array starts with the current date
        for (let i = prices.length - 1; i >= 0; i--) {
            const p = prices[i];

            // skip entries that are not within the period
            if (p.date.getTime() < startDate.getTime()) {
                continue;
            }

            // set price
            if (first === null) {
                first = p;
            }

            chartData.push(mapToChartData(first, p));
        }

        // save chart data
        this._chartData = chartData;
        // console.log('updated chart data for ' + this.symbol + ' ' + this.chartData.length + ' items');
    }
}
