import 'bootswatch/cyborg/bootstrap.min.css';
import '@grapecity/wijmo.styles/themes/wijmo.theme.cyborg.css';
import './index.css';

import * as wjCore from '@grapecity/wijmo';
import { LicenseKey } from 'stock-core';

// apply Wijmo license key
wjCore.setLicenseKey(LicenseKey);

import '@grapecity/wijmo.webcomponents.grid';

import * as wjGrid from '@grapecity/wijmo.grid';

import Config from './config';

window.onload = function () {

    // set title
    document.title = 'Stock Trading';

    // control panel
    var customCells = true;
    var autoUpdate = true;
    var interval = 100; // update interval in ms: 1000, 500, 100, 10, 1
    var batchSize = 5; // items to update: 100, 50, 10, 5, 1

    // find and bind the grid
    const theGrid = <any>document.getElementById('theGrid');
    theGrid.itemsSource = data;
    theGrid.rowHeaders.columns[0].width = 80;

    // cellElements object keeps track of grid's cell elements
    var clearCells = false;
    var cellElements = {};
    theGrid.updatingView.addHandler(function (s, e) {
        clearCells = true; // clear cell elements on next formatItem
    });

    // formatItem hander displays cells and keeps track of cell elements
    theGrid.formatItem.addHandler(function (s: any, e: wjGrid.FormatItemEventArgs) {

        // show logo in top left corner
        if (e.panel == s.topLeftCells) {
            e.cell.innerHTML = '<img src="assets/webcomponents.png" alt="web components logo" />';
        }

        // show symbols in row headers
        if (e.panel == s.rowHeaders && e.col == 0) {
            e.cell.textContent = item = s.rows[e.row].dataItem.symbol;
        }

        // regular cells
        if (e.panel == s.cells) {
            var col = s.columns[e.col],
                item = s.rows[e.row].dataItem;

            // clear cell elements
            if (clearCells) {
                clearCells = false;
                cellElements = {};
            }

            // store cell element
            if (!cellElements[item.symbol]) {
                cellElements[item.symbol] = { item: item };
            }
            cellElements[item.symbol][col.binding] = e.cell;

            // custom painting
            formatCell(e.cell, item, col, false);
        }
    });
    
    // show tooltip in top left corner
    const topleft = theGrid.hostElement.querySelector('.wj-topleft');
    const tt = new wjCore.Tooltip();
    tt.setTooltip(topleft, 'Built using Web components');

    // custom cell painting
    function formatCell(cell, item, col, flare) {
        if (customCells) {
            switch (col.binding) {
                case 'bid':
                    formatDynamicCell(cell, item, col, 'bidHistory', flare);
                    break;
                case 'ask':
                    formatDynamicCell(cell, item, col, 'askHistory', flare);
                    break;
                case 'lastSale':
                    formatDynamicCell(cell, item, col, 'saleHistory', flare);
                    break;
                default:
                    cell.textContent = wjCore.Globalize.format(item[col.binding], col.format);
                    break;
            }
        } else {
            cell.textContent = wjCore.Globalize.format(item[col.binding], col.format);
        }
    }

    function formatDynamicCell(cell, item, col, history, flare) {

        // cell template
        var html = '<div class="ticker chg-{dir} flare-{fdir}"> ' +
                '<div class="value">{value}</div >' +
                '<div class="chg">{chg}</div>' +
                '<div class="glyph"><span class="wj-glyph-{glyph}"></span></div>' +
                '<div class="spark">{spark}</div>' +
            '</div>';

        // value
        html = html.replace('{value}', wjCore.Globalize.format(item[col.binding], col.format));

        // % change
        var hist = item[history];
        var chg = hist.length > 1 ? hist[hist.length - 1] / hist[hist.length - 2] - 1 : 0;
        html = html.replace('{chg}', wjCore.Globalize.format(chg * 100, 'n1') + '%');

        // up/down glyph
        var glyph = chg > +0.001 ? 'up' : chg < -0.001 ? 'down' : 'circle';
        html = html.replace('{glyph}', glyph);

        // sparklines
        html = html.replace('{spark}', getSparklines(item[history]));

        // change direction
        var dir = glyph == 'circle' ? 'none' : glyph;
        html = html.replace('{dir}', dir);

        // flare direction
        var flareDir = flare ? dir : 'none';
        html = html.replace('{fdir}', flareDir);

        // done
        cell.innerHTML = html;
    }

    // update grid cells when items change
    function updateGrid(changedItems) {
        for (var symbol in changedItems) {
            var itemCells = cellElements[symbol];
            if (itemCells) {
                var item = itemCells.item;
                theGrid.columns.forEach(function (col) {
                    var cell = itemCells[col.binding];
                    if (cell) {
                        formatCell(cell, item, col, true);
                    }
                })
            }
        }
    }

    // simulate updates/notifications
    updateTrades();
    function updateTrades() {
        var now = new Date();
        var changedItems = {};
        for (var i = 0; i < batchSize; i++) {

            // select an item
            var item = data[randBetween(0, data.length - 1)];

            // update current data
            item.bid = item.bid * (1 + (Math.random() * .11 - .05));
            item.ask = item.ask * (1 + (Math.random() * .11 - .05));
            item.bidSize = randBetween(10, 1000);
            item.askSize = randBetween(10, 1000);
            var sale = (item.ask + item.bid) / 2;
            item.lastSale = sale;
            item.lastSize = Math.floor((item.askSize + item.bidSize) / 2);
            item.quoteTime = now;
            item.tradeTime = new Date(Date.now() + randBetween(0, 60000));

            // update history data
            addHistory(item.askHistory, item.ask);
            addHistory(item.bidHistory, item.bid);
            addHistory(item.saleHistory, item.lastSale);

            // keep track of changed items
            changedItems[item.symbol] = true;
        }

        // update the grid
        if (autoUpdate) {
            updateGrid(changedItems);
        }

        // and schedule the next batch
        setTimeout(updateTrades, interval);
    }
};

// add a value to a history array
function addHistory(array, data) {
    array.push(data);
    if (array.length > 10) { // limit history length
        array.splice(0, 1);
    }
}

// Companies in the Financial Times Stock Exchange 100 Index
// https://en.wikipedia.org/wiki/FTSE_100_Index
// mcap: market capitalization (in billion pounds)
// emp: employees (thousands)
var companies = [
    { symbol: 'RDSA', name: 'Royal Dutch Shell', sector: 'Oil and gas', mcap: 160.12, emp: 90 },
    { symbol: 'ULVR', name: 'Unilever', sector: 'Consumer goods', mcap: 90.42, emp: 171 },
    { symbol: 'HSBA', name: 'HSBC', sector: 'Banking', mcap: 88.11, emp: 267 },
    { symbol: 'BATS', name: 'British American Tobacco', sector: 'Tobacco', mcap: 71.4, emp: 87 },
    { symbol: 'GSK', name: 'GlaxoSmithKline', sector: 'Pharmaceuticals', mcap: 67.38, emp: 97 },
    { symbol: 'SAB', name: 'SABMiller', sector: 'Beverages', mcap: 67.32, emp: 70 },
    { symbol: 'BP', name: 'BP', sector: 'Oil and gas', mcap: 63.13, emp: 97 },
    { symbol: 'VOD', name: 'Vodafone Group', sector: 'Telecomms', mcap: 56.55, emp: 86 },
    { symbol: 'AZN', name: 'AstraZeneca', sector: 'Pharmaceuticals', mcap: 51.23, emp: 57 },
    { symbol: 'RB', name: 'Reckitt Benckiser', sector: 'Consumer goods', mcap: 46.32, emp: 32 },
    { symbol: 'DGE', name: 'Diageo', sector: 'Beverages', mcap: 46.01, emp: 25 },
    { symbol: 'BT.A', name: 'BT Group', sector: 'Telecomms', mcap: 45.61, emp: 89 },
    { symbol: 'LLOY', name: 'Lloyds Banking Group', sector: 'Banking', mcap: 44.11, emp: 120 },
    { symbol: 'BLT', name: 'BHP Billiton', sector: 'Mining', mcap: 41.88, emp: 46 },
    { symbol: 'NG', name: 'National Grid plc', sector: 'Energy', mcap: 36.14, emp: 27 },
    { symbol: 'IMB', name: 'Imperial Brands', sector: 'Tobacco', mcap: 35.78, emp: 38 },
    { symbol: 'RIO', name: 'Rio Tinto Group', sector: 'Mining', mcap: 34.84, emp: 67 },
    { symbol: 'PRU', name: 'Prudential plc', sector: 'Finance', mcap: 31.63, emp: 25 },
    { symbol: 'RBS', name: 'Royal Bank of Scotland Group', sector: 'Banking', mcap: 28.6, emp: 150 },
    { symbol: 'BARC', name: 'Barclays', sector: 'Banking', mcap: 27.18, emp: 150 },
    { symbol: 'ABF', name: 'Associated British Foods', sector: 'Food', mcap: 25.77, emp: 102 },
    { symbol: 'REL', name: 'RELX Group', sector: 'Publishing', mcap: 25.54, emp: 28 },
    { symbol: 'REX', name: 'Rexam', sector: 'Packaging', mcap: 25.54, emp: 19 },
    { symbol: 'CCL', name: 'Carnival Corporation & plc', sector: 'Leisure', mcap: 24.85, emp: 86 },
    { symbol: 'SHP', name: 'Shire plc', sector: 'Pharmaceuticals', mcap: 22.52, emp: 4 },
    { symbol: 'CPG', name: 'Compass Group', sector: 'Food', mcap: 20.21, emp: 471 },
    { symbol: 'WPP', name: 'WPP plc', sector: 'Media', mcap: 19.01, emp: 162 },
    { symbol: 'AV.', name: 'Aviva', sector: 'Insurance', mcap: 17.69, emp: 40 },
    { symbol: 'SKY', name: 'Sky plc', sector: 'Media', mcap: 17.5, emp: 22 },
    { symbol: 'GLEN', name: 'Glencore', sector: 'Mining', mcap: 16.96, emp: 57 },
    { symbol: 'BA.', name: 'BAE Systems', sector: 'Military', mcap: 16.01, emp: 107 },
    { symbol: 'TSCO', name: 'Tesco', sector: 'Supermarket', mcap: 14.92, emp: 519 },
    { symbol: 'SSE', name: 'SSE plc', sector: 'Energy', mcap: 14.03, emp: 19 },
    { symbol: 'STAN', name: 'Standard Chartered', sector: 'Banking', mcap: 13.52, emp: 86 },
    { symbol: 'LGEN', name: 'Legal & General', sector: 'Insurance', mcap: 13.21, emp: 9 },
    { symbol: 'ARM', name: 'ARM Holdings', sector: 'Engineering', mcap: 13.2, emp: 2 },
    { symbol: 'RR.', name: 'Rolls-Royce Holdings', sector: 'Manufacturing', mcap: 11.8, emp: 55 },
    { symbol: 'EXPN', name: 'Experian', sector: 'Information', mcap: 11.1, emp: 17 },
    { symbol: 'IAG', name: 'International Consolidated Airlines Group SA', sector: 'Travel', mcap: 11.01, emp: 58 },
    { symbol: 'CRH', name: 'CRH plc', sector: 'Building materials', mcap: 10.9, emp: 76 },
    { symbol: 'CNA', name: 'Centrica', sector: 'Energy', mcap: 10.72, emp: 40 },
    { symbol: 'SN.', name: 'Smith & Nephew', sector: 'Medical', mcap: 10.27, emp: 11 },
    { symbol: 'ITV', name: 'ITV plc', sector: 'Media', mcap: 10.15, emp: 4 },
    { symbol: 'WOS', name: 'Wolseley plc', sector: 'Building materials', mcap: 9.2, emp: 44 },
    { symbol: 'OML', name: 'Old Mutual', sector: 'Insurance', mcap: 8.45, emp: 54 },
    { symbol: 'LAND', name: 'Land Securities', sector: 'Property', mcap: 8.19, emp: 0 },
    { symbol: 'LSE', name: 'London Stock Exchange Group', sector: 'Finance', mcap: 8.06, emp: 4 },
    { symbol: 'KGF', name: 'Kingfisher plc', sector: 'Retail homeware', mcap: 7.8, emp: 80 },
    { symbol: 'CPI', name: 'Capita', sector: 'Support Services', mcap: 7.38, emp: 46 },
    { symbol: 'BLND', name: 'British Land', sector: 'Property', mcap: 7.13, emp: 0 },
    { symbol: 'WTB', name: 'Whitbread', sector: 'Retail hospitality', mcap: 7.09, emp: 86 },
    { symbol: 'MKS', name: 'Marks & Spencer', sector: 'Retailer', mcap: 7.01, emp: 81 },
    { symbol: 'FRES', name: 'Fresnillo plc', sector: 'Mining', mcap: 6.99, emp: 2 },
    { symbol: 'NXT', name: 'Next plc', sector: 'Retail clothing', mcap: 6.9, emp: 58 },
    { symbol: 'SDR', name: 'Schroders', sector: 'Fund management', mcap: 6.63, emp: 3 },
    { symbol: 'SL', name: 'Standard Life', sector: 'Fund management', mcap: 6.63, emp: 10 },
    { symbol: 'PSON', name: 'Pearson PLC', sector: 'Education', mcap: 6.52, emp: 37 },
    { symbol: 'BNZL', name: 'Bunzl', sector: 'Industrial products', mcap: 6.38, emp: 12 },
    { symbol: 'MNDI', name: 'Mondi', sector: 'Manufacturing', mcap: 6.37, emp: 26 },
    { symbol: 'UU', name: 'United Utilities', sector: 'Water', mcap: 6.36, emp: 5 },
    { symbol: 'PSN', name: 'Persimmon plc', sector: 'Building', mcap: 6.34, emp: 2 },
    { symbol: 'SGE', name: 'Sage Group', sector: 'IT', mcap: 6.26, emp: 12 },
    { symbol: 'EZJ', name: 'EasyJet', sector: 'Travel', mcap: 6.17, emp: 11 },
    { symbol: 'AAL', name: 'Anglo American plc', sector: 'Mining', mcap: 6.09, emp: 100 },
    { symbol: 'TW.', name: 'Taylor Wimpey', sector: 'Building', mcap: 5.99, emp: 3 },
    { symbol: 'TUI', name: 'TUI Group', sector: 'Leisure', mcap: 5.99, emp: 76 },
    { symbol: 'WPG', name: 'Worldpay', sector: 'Payment services', mcap: 5.9, emp: 4 },
    { symbol: 'RRS', name: 'Randgold Resources', sector: 'Mining', mcap: 5.89, emp: 6 },
    { symbol: 'HL', name: 'Hargreaves Lansdown', sector: 'Finance', mcap: 5.87, emp: 0 },
    { symbol: 'BDEV', name: 'Barratt Developments', sector: 'Building', mcap: 5.86, emp: 5 },
    { symbol: 'IHG', name: 'InterContinental Hotels Group', sector: 'Hotels', mcap: 5.75, emp: 345 },
    { symbol: 'BRBY', name: 'Burberry', sector: 'Fashion', mcap: 5.65, emp: 10 },
    { symbol: 'DC.', name: 'Dixons Carphone', sector: 'Retail', mcap: 5.16, emp: 40 },
    { symbol: 'DLG', name: 'Direct Line Group', sector: 'Insurance', mcap: 5.15, emp: 13 },
    { symbol: 'CCH', name: 'Coca-Cola HBC AG', sector: 'Consumer', mcap: 5.1, emp: 38 },
    { symbol: 'SVT', name: 'Severn Trent', sector: 'Water', mcap: 5.04, emp: 8 },
    { symbol: 'DCC', name: 'DCC plc', sector: 'Investments', mcap: 5.03, emp: 9 },
    { symbol: 'SBRY', name: 'Sainsbury\'s', sector: 'Supermarket', mcap: 5.02, emp: 150 },
    { symbol: 'ADM', name: 'Admiral Group', sector: 'Insurance', mcap: 4.91, emp: 2 },
    { symbol: 'GKN', name: 'GKN', sector: 'Manufacturing', mcap: 4.79, emp: 50 },
    { symbol: 'JMAT', name: 'Johnson Matthey', sector: 'Chemicals', mcap: 4.79, emp: 9 },
    { symbol: 'PFG', name: 'Provident Financial', sector: 'Finance', mcap: 4.74, emp: 3 },
    { symbol: 'ANTO', name: 'Antofagasta', sector: 'Mining', mcap: 4.71, emp: 4 },
    { symbol: 'STJ', name: 'St. James\'s Place plc', sector: 'Finance', mcap: 4.68, emp: 1 },
    { symbol: 'ITRK', name: 'Intertek', sector: 'Product testing', mcap: 4.67, emp: 33 },
    { symbol: 'BAB', name: 'Babcock International', sector: 'Engineering', mcap: 4.65, emp: 34 },
    { symbol: 'BKG', name: 'Berkeley Group Holdings', sector: 'Building', mcap: 4.6, emp: 2 },
    { symbol: 'ISAT', name: 'Inmarsat', sector: 'Telecomms', mcap: 4.47, emp: 1 },
    { symbol: 'TPK', name: 'Travis Perkins', sector: 'Retailer', mcap: 4.46, emp: 24 },
    { symbol: 'HMSO', name: 'Hammerson', sector: 'Property', mcap: 4.42, emp: 0 },
    { symbol: 'MERL', name: 'Merlin Entertainments', sector: 'Leisure', mcap: 4.42, emp: 28 },
    { symbol: 'RMG', name: 'Royal Mail', sector: 'Delivery', mcap: 4.41, emp: 150 },
    { symbol: 'AHT', name: 'Ashtead Group', sector: 'Equipment rental', mcap: 4.26, emp: 12 },
    { symbol: 'RSA', name: 'RSA Insurance Group', sector: 'Insurance', mcap: 4.16, emp: 21 },
    { symbol: 'III', name: '3i', sector: 'Private equity', mcap: 4.06, emp: 0 },
    { symbol: 'INTU', name: 'Intu Properties', sector: 'Property', mcap: 3.89, emp: 2 },
    { symbol: 'SMIN', name: 'Smiths Group', sector: 'Engineering', mcap: 3.84, emp: 23 },
    { symbol: 'HIK', name: 'Hikma Pharmaceuticals', sector: 'Manufacturing', mcap: 3.71, emp: 6 },
    { symbol: 'ADN', name: 'Aberdeen Asset Management', sector: 'Fund management', mcap: 3.14, emp: 1 },
    { symbol: 'SPD', name: 'Sports Direct', sector: 'Retail', mcap: 2.4, emp: 17 }
];

// Trading Market Data
// http://en.wikipedia.org/wiki/Market_data
var data = [],
    now = new Date();
companies.forEach(function (company) {
    var bid = randBetween(1, 100000) / 100,
        ask = bid + randBetween(0, 100) / 100;
    data.push({
        symbol: company.symbol,
        name: company.name,
        bid: bid,
        ask: ask,
        lastSale: bid,
        bidSize: randBetween(10, 500),
        askSize: randBetween(10, 500),
        lastSize: randBetween(10, 500),
        volume: randBetween(10000, 20000),
        quoteTime: now,
        tradeTime: now,
        askHistory: [ask, ask],
        bidHistory: [bid, bid],
        saleHistory: [bid, bid]
    });
});

// get a random number within a given interval
function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// generate sparklines as SVG
function getSparklines(data) {
    var svg = '',
        min = Math.min.apply(Math, data),
        max = Math.max.apply(Math, data),
        x1 = 0,
        y1 = scaleY(data[0], min, max);
    for (var i = 1; i < data.length; i++) {
        var x2 = Math.round((i) / (data.length - 1) * 100);
        var y2 = scaleY(data[i], min, max);
        svg += '<line x1=' + x1 + '% y1=' + y1 + '% x2=' + x2 + '% y2=' + y2 + '% />';
        x1 = x2;
        y1 = y2;
    }
    return '<svg><g>' + svg + '</g></svg>';
}

function scaleY(value, min, max) {
    return max > min ? 100 - Math.round((value - min) / (max - min) * 100) : 0;
}
