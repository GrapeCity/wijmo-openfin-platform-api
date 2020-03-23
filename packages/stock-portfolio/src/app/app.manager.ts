import { ChangeDetectorRef } from '@angular/core';
import { ViewCreationOptions } from 'openfin/_v2/api/view/view';

import { ConfigService } from './services/config.service';


export class AppManager {
  
  private _views = new Map<string, ViewCreationOptions>();

  constructor(
    private configService: ConfigService,
    private changeDetector: ChangeDetectorRef
  ) {
    this._initializeViews();
  }

  autoSizeCurrent() {
    // do nothing here
  }

  isAppRunning(appId: string): boolean {
    const viewName = this._getViewName(appId);
    return this._views.has(viewName);
  }

  toggleApp(appId: string): Promise<void> {
    if (this.isAppRunning(appId)) {
        return this._closeApp(appId);
    } else {
        return this._runApp(appId);
    }
  }

  private _initializeViews(): Promise<void> {
    return fin.Application.getCurrent()
      .then(app => {
        return app.getViews();
      }).then(views => {
        const options = views.map(v => v.getOptions());
        return Promise.all(options);
      }).then(options => {
        options.forEach(option => { 
          const name = option.name;
          console.log(`View '${name}' found`);
          this._views.set(name, option);
        });
      }).catch(err => {
        console.error('Error occurred while initilizating views: ', err);
      });
  }

  private _closeApp(appId: string): Promise<void> {
    const viewName = this._getViewName(appId);
    console.log(`View '${viewName}' closing ...`);

    return fin.Platform.getCurrent()
      .then(platform => {
        const viewIdentity = this._getViewIdentity(appId);
        return platform.closeView(viewIdentity);
      }).then(() => {
        this._views.delete(viewName);
        console.log(`View '${viewName}' closed successfully`);
      }).catch(err => {
        console.error(`View '${viewName}' close error: `, err);
      });
  }

private _runApp(appId: string): Promise<void> {
  const viewName = this._getViewName(appId);
  console.log(`View '${viewName}' opening ...`);

  const platformPromise = fin.Platform.getCurrent();
  const viewOptionsPromise = this._getViewOptions(appId, viewName);
  return Promise.all([platformPromise, viewOptionsPromise])
    .then(([platform, viewOptions]) => {
      this._views.set(viewName, viewOptions);
      // opens view in new window
      return platform.createView(viewOptions, undefined);
    }).then(view => {
      console.log(`View '${viewName}' opened successfully: `, view);
    }).catch(err => {
      this._views.delete(viewName);
      console.error(`View '${viewName}' open error: `, err);
    });
  }

  private _getViewOptions(appId: string, name: string): Promise<any> {
    return this.configService.getAppConfig(appId)
      .then(appConfig => {
        return {
          name,
          url: appConfig.url
        };
      });
  }

  private _getViewName(appId: string): string {
    switch (appId) {
      case 'trading':
        return 'component_stock_trading';

      case 'changes':
        return 'component_stock_changes_chart';

      case 'hloc':
        return 'component_stock_hloc_chart';

      case 'trendline':
        return 'component_stock_trendline_chart';

      default:
        return '';
    }
  }

  private _getViewIdentity(appId: string): any {
    return {
      uuid: 'stock_portfolio_platform_api_test',
      name: this._getViewName(appId)
    };
  }
}