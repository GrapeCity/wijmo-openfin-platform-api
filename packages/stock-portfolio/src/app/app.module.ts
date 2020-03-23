import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { WjCoreModule } from '@grapecity/wijmo.angular2.core';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';

import { AppComponent } from './app.component';
import { DataService } from './services/data.service';
import { MockDataService } from './services/mock.data.service';
import { ConfigService } from './services/config.service';
import { GlbzPipe } from './pipes/GlbzPipe';

@NgModule({
  declarations: [
    AppComponent,
    GlbzPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    WjCoreModule,
    WjInputModule,
    WjGridModule
  ],
  providers: [{ provide: DataService, useClass: MockDataService }, ConfigService],
  bootstrap: [AppComponent]
})
export class AppModule { }
