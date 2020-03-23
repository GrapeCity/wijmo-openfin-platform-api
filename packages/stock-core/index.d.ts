import * as wjcCore from '@grapecity/wijmo';

export declare const Version: string;

export declare const LicenseKey: string;

export declare const ChannelName: string;

export declare class ChannelTopics {
    static readonly LoadItems: string;
    static readonly CurrentChanged: string;
    static readonly SelectionChanged: string;
    static readonly ItemAdded: string;
    static readonly ItemRemoved: string;
    static readonly ItemChanged: string;
}

export declare enum ChartPeriod {
    YTD = 0,
    m1 = 1,
    m3 = 2,
    m6 = 3,
    m12 = 4,
    m24 = 5,
    m36 = 6,
    All = 7
}

export declare class Company {
    name: string;
    symbol: string;
    color: string;
    prices: any[];

    constructor(symbol: string);
}

export declare interface IPortfolioOptions {
    storageKey: string;
    mapToChartData: (first: any, price: any) => any;
}

export declare class Portfolio {    
    readonly view: wjcCore.CollectionView;
    chartPeriod: ChartPeriod;

    constructor(options: IPortfolioOptions);

    addItem(symbol: string, chart: boolean, name: string, color: string, prices: any[]): void;
    removeItem(symbol: string): void;
    changeItem(symbol: string, newChart: boolean): void;
}

export declare class PortfolioItem {
    readonly name: string;
    readonly symbol: string;
    readonly color: string;
    readonly chartData: any[];
    readonly chart: boolean;

    constructor(portfolio: Portfolio, company: Company, chart: boolean);
}