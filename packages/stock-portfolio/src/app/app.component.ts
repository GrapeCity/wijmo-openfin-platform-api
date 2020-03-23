import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as wjcInput from '@grapecity/wijmo.input';
import { ChannelProvider } from 'openfin/_v2/api/interappbus/channel/provider';
import * as Notifications from 'openfin-notifications';

import { ChannelName, ChannelTopics } from 'stock-core';
import { Config } from './data/config';
import { DataService } from './services/data.service';
import { ConfigService } from './services/config.service';
import { AppManager } from './app.manager';
import { Portfolio, PortfolioItem } from './portfolio';

'use strict';

// The application root component.
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {

    private _cache = {};

    private _channelPromise: Promise<ChannelProvider>;

    appManager: AppManager;

    portfolio: Portfolio;

    @ViewChild('autocomplete', { static: false }) autocomplete: wjcInput.AutoComplete;

    searchCompany: Function;

    formatCompany: Function;    

    public get title(): string {
        return document.title;
    }

    constructor(
        private dataService: DataService,
        configService: ConfigService,
        changeDetector: ChangeDetectorRef
    ) {
        document.title = Config.NAME;

        // create portfolio
        this.portfolio = new Portfolio(this.dataService);
        this.portfolio.view.currentChanged.addHandler(this._currentChanged, this);
        this.portfolio.itemAdded.addHandler(async (item: PortfolioItem) => {
            try {
                const connection = await this._channelPromise;
                connection.publish(ChannelTopics.ItemAdded, this._mapToPayload(item));
                console.log('Channels: sent message "itemAdded"');
            } catch (error) {
                console.log('Cannot publish message "itemAdded". Error: ' + error);
            }
        });
        this.portfolio.itemRemoved.addHandler(async (item: PortfolioItem) => {
            try {
                const connection = await this._channelPromise;
                connection.publish(ChannelTopics.ItemRemoved, {
                    symbol: item.symbol
                });
                console.log('Channels: sent message "itemRemoved"');
            } catch (error) {
                console.log('Cannot publish message "itemRemoved". Error: ' + error);
            }
        });
        this.portfolio.itemChanged.addHandler(async (item: PortfolioItem) => {
            try {
                const connection = await this._channelPromise;
                connection.publish(ChannelTopics.ItemChanged, {
                    symbol: item.symbol,
                    chart: item.chart
                });
                console.log('Channels: sent message "itemChanged"');
            } catch (error) {
                console.log('Cannot publish message "itemChanged". Error: ' + error);
            }
        });

        // create app manager
        this.appManager = new AppManager(configService, changeDetector);
        this.appManager.autoSizeCurrent();

        this.searchCompany = this._searchCompany.bind(this);
        this.formatCompany = this._formatCompany.bind(this);

        this._initChannel();
    }

    getChangeClass(amount: number): string {
        return amount < -0.01 ? 'chg-cell-down' : amount > 0.01 ? 'chg-cell-up' : 'chg-cell-none';
    }

    getChangeGlyphClass(amount: number): string {
        return amount < -0.01 ? 'wj-glyph-down' : amount > 0.01 ? 'wj-glyph-up' : 'wj-glyph-circle';
    }

    addNewItem() {
        const symbol = this.portfolio.newItemSymbol;
        this.portfolio.addNewItem();
        this._displayNotification(`Stock ${symbol} has been added`);
    }

    removeExistingItem(symbol) {
        this.portfolio.removeItem(symbol);
        this._displayNotification(`Stock ${symbol} has been removed`);
    }

    private _displayNotification(message: string) {
        Notifications.create({
            title: 'Portfolio History',
            body: message,
            category: 'Portfolio History',
            icon: 'favicon.ico'
        });
    }

    private _initChannel() {
        if (typeof fin === 'undefined') {
            console.warn('Channels cannot be initialized because "fin" is undefined.');
            this._channelPromise = Promise.reject('Channels API is unavailable');
            return;
        }

        this._channelPromise = fin.InterApplicationBus.Channel.create(ChannelName)
            .then(channel => this._handleCreate(channel));

        window.addEventListener('unload', () => {
            console.log('unload');            
            this._disconnect();
        });
    }

    private _disconnect() {
        this._channelPromise.then(connection => {
            console.log('Channels: disconnecting');
            return connection.destroy();
        }).then(() => {
            console.log('Channels: disconnected');
        }).catch(err => {
            console.error('Channels: disconnection failed', err);
        });
    }

    private _handleCreate(channel: ChannelProvider): ChannelProvider {
        console.log('Channels: connected');
        channel.register(ChannelTopics.SelectionChanged, symbol => this._selectionChanged(symbol));
        channel.register(ChannelTopics.LoadItems, () => this._loadItems());
        channel.onConnection((identity, payload) => this._handleConnect(identity, payload));
        channel.onDisconnection(channelInfo => this._handleDisconnect(channelInfo));
        return channel;
    }

    private _handleConnect(identity, payload) {
        // can reject a connection here by throwing an error
        console.log('Channels: client connected');
    }

    private _handleDisconnect(channelInfo) {
        console.log('Channels: disconnected');
    }

    private _loadItems() {
        console.log('Channels: received message "loadItems"');
        const p = this.portfolio;
        const symbol = p ? p.view.currentItem ? p.view.currentItem.symbol : null : null;
        return {
            current: symbol,
            items: this.portfolio.view.items.map(this._mapToPayload)
        };
    }

    private _mapToPayload(item: PortfolioItem) {
        return {
            symbol: item.symbol,
            chart: item.chart,
            name: item.name,
            color: item.color,
            prices: item.prices
        };
    }

    // send notifications about portfolio selection
    private async _currentChanged() {
        const p = this.portfolio;
        
        if (p) {
            const symbol = p.view.currentItem ? p.view.currentItem.symbol : null;
         
            try {    
                const connection = await this._channelPromise;
                connection.publish(ChannelTopics.CurrentChanged, symbol);
                console.log('Channels: sent message "currentChanged"');
            } catch (error) {
                console.log('Cannot publish message "currentChanged". Error: ' + error);
            }
        }
    }

    // update grid selection to match portfolio selection
    private async _selectionChanged(symbol) {
        console.log('Channels: received message "currentChanged"');

        const p = this.portfolio;
        for (let i = 0; i < p.view.items.length; i++) {
            if (p.view.items[i].symbol == symbol) {
                p.view.moveCurrentToPosition(i);
                break;
            }
        }
    }

    private _searchCompany(query: string, max: number, callback: Function) {

        // try getting the result from the cache
        const result = this._cache[query];
        if (result) {
            callback(result);
            return;
        }

        this.dataService.searchCompany(query)
            .then(
                matches => matches,
                errorMessage => {
                    console.error('Can\'t find company (query=\'' + query + ')\'. Error:');
                    console.error(errorMessage);

                    return null; // << no point in trying this query again
                }
            )
            .then(matches => {
                // store result in cache
                this._cache[query] = matches;

                // and return the result
                callback(matches);
            });
    }

    private _formatCompany(index, content) {
        let company = this.autocomplete.collectionView.items[index];
        return `<b>${company.symbol}</b>&nbsp;${company.name}`;
    }
}
