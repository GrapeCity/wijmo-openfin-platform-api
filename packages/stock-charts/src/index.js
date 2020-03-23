import React from 'react';
import ReactDOM from 'react-dom';
import { setLicenseKey } from '@grapecity/wijmo';
import { LicenseKey } from 'stock-core';
import * as serviceWorker from './serviceWorker';
import App from './app';

import 'bootswatch/cyborg/bootstrap.min.css';
import '@grapecity/wijmo.styles/themes/wijmo.theme.cyborg.css';
import './index.css';

setLicenseKey(LicenseKey);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
