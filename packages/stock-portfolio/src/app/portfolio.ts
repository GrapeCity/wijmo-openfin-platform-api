import * as wjcCore from '@grapecity/wijmo';

import { Company } from 'stock-core';
import { palette } from './data/palette';
import { Config } from './data/config';
import { DataService } from './services/data.service';

/**
 * Represents a portfolio composed of items.
 */
export class Portfolio {
    private static _companyCache = {};
    private static _companyCtr = 0;

    private _items: wjcCore.ObservableArray;
    private _cv: wjcCore.CollectionView;
    private _newItemSymbol: string;
    private _updating: boolean;
    private _toChange: number;

    constructor(
        private dataService: DataService
    ) {
        // initialize items collection/view
        this._items = new wjcCore.ObservableArray();
        this._cv = new wjcCore.CollectionView(this._items);
        this._cv.collectionChanged.addHandler(this.viewChanged.bind(this));

        // load the portfolio from storage
        this.loadItems();

        // if we have no items, add a few now
        if (this._items.length === 0) {
            this.addItem('AMZN');
            this.addItem('AAPL');
            this.addItem('GOOG');
            this.addItem('FB');
            this.addItem('GM');
        }

        // save portfolio when unloading
        const self = this;
        window.addEventListener('unload', () => self.saveItems());
    }

    itemAdded = new wjcCore.Event();

    itemRemoved = new wjcCore.Event();

    get itemChanged() {
        return PortfolioItem.itemChanged;
    }

    // gets the view with the portfolio items
    get view() {
        return this._cv;
    }

    get newItemSymbol(): string {
        return this._newItemSymbol;
    }

    set newItemSymbol(value: string) {
        this._newItemSymbol = value;
    }

    canAddNewItem(): boolean {
        return this.newItemSymbol && this.indexOf(this.newItemSymbol) < 0;
    }

    // add new item
    addNewItem() {
        if (this.newItemSymbol != null) {
            this.addItem(this.newItemSymbol);
            this.newItemSymbol = null;
        }
    }

    // remove an item from the portfolio
    removeItem(symbol: string) {
        const index = this.indexOf(symbol);
        if (index > -1) {
            let item = this._items[index];
            this._items.splice(index, 1);
            this.itemRemoved.raise(item);
        }
    }

    // load items from local storage
    private loadItems() {
        try {
            let data = localStorage != null ? localStorage[Config.STGKEY] : null;
            if (data != null && JSON != null) {
                data = JSON.parse(data);
                for (let i = 0; i < data.items.length; i++) {
                    const item = <PortfolioItem> data.items[i];
                    this.addItem(item.symbol, item.chart);
                }
                if (data.sort) {
                    const sd = new wjcCore.SortDescription(data.sort.property, data.sort.ascending);
                    this.view.sortDescriptions.push(sd);
                }
            }
        } catch (err) { 
            console.error('Error occured while loading items');
        }
    }

    // save items to local storage
    private saveItems() {
        try {
            if (localStorage != null && JSON != null) {
                let data = {
                    sort: null,
                    items: [],
                };
                if (this.view.sortDescriptions.length > 0) {
                    const sd = this.view.sortDescriptions[0];
                    data.sort = { property: sd.property, ascending: sd.ascending };
                }
                for (let i = 0; i < this._cv.items.length; i++) {
                    const item = this._cv.items[i];
                    const newItem = {
                        symbol: item.symbol,
                        chart: item.chart
                    };
                    data.items.push(newItem);
                }
                localStorage[Config.STGKEY] = JSON.stringify(data);
            }
        } catch (err) { 
            console.error('Error occured while saving items');
        }
    }

    // add an item to the portfolio
    private addItem(symbol: string, chart = true) {
        if (!symbol) {
            return;            
        }

        const index = this.indexOf(symbol);
        if (index > -1) {
            return;
        }
        
        const company = new Company(symbol);
        company.color = palette[Portfolio._companyCtr % palette.length];
        Portfolio._companyCtr++;

        const item = new PortfolioItem(company, chart);
        this._items.push(item);

        const self = this;
        this.updateCompany(company)
            .then(() => {
                self.itemAdded.raise(item);
                self.moveCurrentTo(item);
                self.viewChanged();
            })
            .catch(errorMessage => {                
                console.error('Can\'t update company (symbol=\'' + symbol + ')\'. Error:');
                console.error(errorMessage);
            });
    }

    // gets the index of an item in the portfolio given a symbol
    private indexOf(symbol: string): number {
        if (symbol) {
            symbol = symbol.toUpperCase();
            for (let i = 0; i < this._items.length; i++) {
                if (this._items[i].symbol == symbol) {
                    return i;
                }
            }
        }
        return -1;
    }

    private viewChanged() {
        const self = this;
        if (!self._updating) {
            self._updating = true;
            if (self._toChange) {
                window.clearTimeout(self._toChange);
            }
            self._toChange = window.setTimeout(() => {
                self._cv.refresh();
                self._updating = false;
            }, 250);
        }
    }

    private moveCurrentTo(item: PortfolioItem): void {
        if (this.view.currentItem) {
            return;
        }

        this.view.moveCurrentTo(item);
    }

    // get a company from the global cache or load it if necessary
    private updateCompany(company: Company): Promise<Company> {
        
        const symbol  = company.symbol;
        const cachedCompany: Company = Portfolio._companyCache[symbol];
        if (cachedCompany != null) {
            company.name = cachedCompany.name;
            company.prices = cachedCompany.prices;
            return Promise.resolve(company);
        }

        // company not in cache? fetch now, then place into cache
        return this.dataService.updateCompany(company)
            .then(company => {
                Portfolio._companyCache[symbol] = company;
                return company;
            });
    }
}

/**
 * Represents a portfolio item.
 */
export class PortfolioItem {

    static itemChanged = new wjcCore.Event();

    _company: Company;
    _chart: boolean;

    constructor(company: Company, chart: boolean) {
        this._company = company;
        this._chart = chart;
    }

    get prices(): any[] {
        return this._company.prices;
    }
    get symbol(): string {
        return this._company.symbol;
    }
    get name(): string {
        return this._company.name;
    }
    get color(): string {
        return this._company.color;
    }
    get chart(): boolean {
        return this._chart;
    }
    set chart(value: boolean) {
        if (this._chart !== value) {
            this._chart = value;
            PortfolioItem.itemChanged.raise(this);
        }
    }
    get lastPrice(): number {
        if (this._company && this._company.prices && this._company.prices.length > 0) {
            const p = this._company.prices;
            return p[0].close;
        }
        return null;
    }
    get change(): number {
        if (this._company && this._company.prices && this._company.prices.length > 1) {
            const p = this._company.prices;
            return p[0].close - p[1].close;
        }
        return null;
    }
    get changePercent(): number {
        if (this._company && this._company.prices && this._company.prices.length > 1) {
            const p = this._company.prices;
            if (p[1].close != 0) {
                return p[0].close / p[1].close - 1;
            }
        }
        return null;
    }
}
