import { ChangeDetectorRef } from '@angular/core';
import { ApplicationOption } from 'openfin/_v2/api/application/applicationOption';
import { Application } from 'openfin/_v2/main';
import { MonitorInfo } from 'openfin/_v2/api/system/monitor';
import { _Window } from 'openfin/_v2/api/window/window';

import { ConfigService } from '../services/config.service';

export class AppManager {

    private _runningApps = new Map<string, ApplicationOption>();

    constructor(
        private configService: ConfigService,
        private changeDetector: ChangeDetectorRef
    ) {
        fin.Application.getCurrent()
            .then(app => app.getWindow())
            .then(win => win.addListener('close-requested', () => {
                console.log('Window event "close-requested" occured');
                const appKeys = Array.from(this._runningApps.keys());
                const appClosePromises = appKeys.map(appKey => this._closeApp(appKey));
                Promise.all(appClosePromises).then(() => win.close(true));
            }));
        this._findRunningApps().then(apps => {
            apps.forEach(app => this._addRunningApp(app));
        });
    }

    autoSizeCurrent() {
        fin.Application.getCurrent()
            .then(app => app.getWindow())
            .then(win => this._autoSizeWindow(win));
    }

    closeMain() {
        fin.Application.getCurrent()
            .then(app => app.getWindow())
            .then(win => win.close(false));
    }

    isAppRunning(appId: string): boolean {
        return this._runningApps.has(appId);
    }

    toggleApp(appId: string): void {
        if (this.isAppRunning(appId)) {
            this._closeApp(appId);
        } else {
            this._runApp(appId);
        }
    }

    private _findRunningApps(): Promise<Application[]> {
        const parentUuid = fin.Application.getCurrentSync().identity.uuid;
        return fin.System.getAllApplications()
            .then(apps => apps.filter(app => app.isRunning && app.parentUuid === parentUuid))
            .then(apps => {
                const wrapped = apps.map(app => fin.Application.wrap({ uuid: app.uuid }));
                return Promise.all(wrapped);
            });
    }

    private _addRunningApp(app: Application) {
        app.getInfo().then(info => {
            const appId = info.initialOptions['wjStockPortfolioAppId'];
            console.log(`App '${appId}' is running`);

            this._getAppOptions(appId).then(appOptions => {
                this._runningApps.set(appId, appOptions);
            });
        });
    }

    private _closeApp(appId: string): Promise<void> {
        console.log(`App '${appId}' closing ...`);

        const appOptions =  this._runningApps.get(appId);
        return fin.Application.wrap({ uuid: appOptions.uuid })
            .then(app => {
                return app.quit();
            }).then(() => {
                this._runningApps.delete(appId);
                console.log(`App '${appId}' closed successfully`);
            }).catch(err => {
                console.error(`App '${appId}' close error: `, err);
            });
    }

    private _runApp(appId: string): void {
        console.log(`App '${appId}' launching ...`);
                
        this._getAppOptions(appId)
        .then(appOptions => {
            this._runningApps.set(appId, appOptions);
            return fin.Application.start(appOptions);
        }).then(app => {
            app.once('closed', () => {
                this._runningApps.delete(appId);
                this.changeDetector.detectChanges();
                console.log(`App '${appId}' has been closed`);
            });
            app.getWindow().then(win => this._autoSizeWindow(win));
            console.log(`App '${appId}' launched successfully: `, app);
        }).catch(err => {
            this._runningApps.delete(appId);
            console.error(`App '${appId}' launch error: `, err);
        });
    }

    private async _getAppOptions(appId: string): Promise<any> {
        const winPromise = fin.Window.getCurrent();
        const winOptionsPromise = winPromise.then(win => win.getOptions());
        const appConfigPromise = this.configService.getAppConfig(appId);
        return await Promise.all([winOptionsPromise, appConfigPromise])
            .then(([winOptions, appConfig]) => {
                return {
                    wjStockPortfolioAppId: appId,
                    name: appConfig.name,
                    uuid: appConfig.uuid,
                    url: appConfig.url,
                    autoShow: true,
                    icon: appConfig.icon,
                    mainWindowOptions: {
                        taskbarIconGroup: winOptions.taskbarIconGroup
                    },
                    maximizable: false,
                    frame: false
                };
            });
    }

    private _autoSizeWindow(window: _Window) {
        fin.System.getMonitorInfo()
            .then(monitorInfo => {
                const width = this._getAutoWidth(monitorInfo);
                const height = this._getAutoHeight(monitorInfo);
                const options = {
                    moveIndependently: false
                }
                return window.resizeTo(width, height, 'top-left', options);
            })
            .catch(err => console.log(err));
    }

    private _getAutoWidth(monitorInfo: MonitorInfo): number {
        const indent = 30;
        const rect = monitorInfo.primaryMonitor.availableRect;
        const monitorWidth = rect.right - rect.left;
        const k = (monitorWidth > 1680) ? 3 : 2;
        let width = monitorWidth - indent;
        const correction =  width % k; // correction to avoid rounding error
        width -= correction;
        return width/k;
    }

    private _getAutoHeight(monitorInfo: MonitorInfo): number {
        const indent = 20;
        const rect = monitorInfo.primaryMonitor.availableRect;
        const monitorHeight = rect.bottom - rect.top;
        const k = 2;
        let height = monitorHeight - indent;
        const correction =  height % k; // correction to avoid rounding error
        height -= correction;
        return height/k;
    }
}