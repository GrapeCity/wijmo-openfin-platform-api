/**
 * Represents a publicly traded company.
 * The class contains the company name, ticker symbol, price history,
 * and the color used to represent the company in the UI.
 */
export class Company {
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    get symbol() {
        return this._symbol;
    }
    set symbol(value) {
        this._symbol = value;
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
    }
    get prices() {
        return this._prices;
    }
    set prices(value) {
        this._prices = value;
    }

    constructor(symbol) {
        this.symbol = symbol;
        this.prices = [];
    }
}