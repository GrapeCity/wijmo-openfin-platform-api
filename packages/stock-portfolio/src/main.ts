import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { setLicenseKey } from '@grapecity/wijmo';
import { LicenseKey } from 'stock-core';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

setLicenseKey(LicenseKey);

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
