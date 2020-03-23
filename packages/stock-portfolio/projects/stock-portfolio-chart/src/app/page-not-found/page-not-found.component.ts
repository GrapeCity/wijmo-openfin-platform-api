import { Component } from '@angular/core';

import { Config } from '../data/config';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent {

  public get title(): string {
    return document.title;
  }

  constructor() { 
    document.title = 'Stock Chart ' + Config.VERSION;
  }
}
