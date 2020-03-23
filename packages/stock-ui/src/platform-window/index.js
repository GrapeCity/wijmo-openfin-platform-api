import 'bootswatch/cyborg/bootstrap.min.css';
import './index.css';

import { html, render } from 'lit-html/lit-html.js';

import * as core from 'stock-core';

class PlatformWindow extends HTMLElement {
  constructor() {
    super();

    this.render = this.render.bind(this);
    this.close = this.close.bind(this);

    this.render();
  }

  async render() {
      const platformWindow = html`
        <div class="container-fluid">
          <div class="panel panel-default">
            <div id="title-bar" class="panel-heading">
              <div class="align-center">
                <img class="h-16" src="assets/finance.png" alt="app logo" />&nbsp;&nbsp;<span id="theTitle">Stock Portfolio ${core.Version}</span>
              </div>
              <div class="align-center">
                <div class="window-buttons">
                  <button type="button" class="close" id="theCloseApp" @click=${() => this.close().catch(console.error)}>&times;</button>
                </div>
              </div>
            </div>
            <div class="panel-body">
              <div id="layout-container"></div>
            </div>
          </div>
        </div>`;
      return render(platformWindow, this);
  }

  async close() {
    const platform = await fin.Platform.getCurrent();
    platform.quit();
  }
}

customElements.define('platform-window', PlatformWindow);