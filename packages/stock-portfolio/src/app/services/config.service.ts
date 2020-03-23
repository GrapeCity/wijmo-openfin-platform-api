import { Injectable } from '@angular/core';

export interface AppConfig {
  name: string;
  uuid: string;
  url: string;
  icon: string;
}

@Injectable()
export class ConfigService {

  constructor() { }

  async getAppConfig(appId: string): Promise<AppConfig> {
    const appConfigUrl = `./assets/app.${appId}.json`;
    return await fetch(appConfigUrl)
      .then((response: Response) => response.json());
  }
}
