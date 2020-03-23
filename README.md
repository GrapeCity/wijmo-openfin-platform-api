# Introduction

A financial sample that demonstrates the usage of Wijmo controls in OpenFin application

# System requirements

Node.js version 10.9.0 or later

# Usage

First, you need to install dependencies:

    npm install

## How to run OpenFin application

Run command as follows:

    npm start

This command will run development web servers for corresponding apps, and then will run OpenFin application.

## How to build distrubution package

Run command as follows:

    npm run build-package

Then you can test package by running command:

    npm run test-package

# Directory Structure

This project is organized in the following way:

```text
./
├── packages/
│   ├── stock-charts/
│   ├── stock-core/
│   ├── stock-portfolio/
│   └── stock-trading/
├── resources/
```

Directory `./packages` includes different projects that act as a building blocks for this sample application:
* Directory `stock-core` contains a codebase shared between other projects.
* Directory `stock-portfolio` holds the main web application project. This project is built on Angular framework.
* Directory `stock-charts` defines a location for the project that represents charts web application built on React framework.
* Directory `stock-trading` holds the project that demonstrates the usage of Wijmo web components in building live trading web application.

Directory `./resources` includes different resources basically required for building this sample application.

# About Wijmo StockPortfolio sample

Shows how to build portfolios and watch their performance using our controls. This sample was inspired by the Google Finance site.

The application allows users to select stocks and build portfolios, optionally including 
purchase quantity and price paid for each stock.

The application retrieves financial data from Quandl and calculates the current 
value and change for each stock. It also creates charts comparing the evolution in stock
value for each company.

The portfolios built are stored locally using the HTML5 localStorage object.

The main Wijmo controls used in this application are:

FlexChart: Used to show the evolution of the stock values over time. The user may select the
stocks that should be displayed and the period (from 6 months to all data since 2008).

AutoComplete: Used to search for companies to add to the portfolio. The control provides
as-you-type searching with query highlighting. The AutoComplete control is better than
a simple ComboBox in this case because the number of items is large, so the search is 
handled on the server.

InputNumber: Used to enter the number of shares and amount paid for each share. The 
control ensures that values entered are valid and properly formatted. Null values are
allowed, meaning the user is tracking the stock but has not actually purchased it.

In addition to controls, this application uses a CollectionView to hold the portfolio
items. Using a CollectionView provides a standard way to handle sorting and currency.
The application defines an 'app-sorter' directive that allows users to sort the 
portfolio items by name, symbol, value, etc.

# About OpenFin

Everything that you want to know about OpenFin is available here:

https://openfin.co/
