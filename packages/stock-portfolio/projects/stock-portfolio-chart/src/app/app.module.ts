import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { WjCoreModule } from '@grapecity/wijmo.angular2.core';
import { WjChartModule } from '@grapecity/wijmo.angular2.chart';

import { AppComponent } from './app.component';
import { StockChangesChartComponent } from './stock-changes-chart/stock-changes-chart.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'changes', component: StockChangesChartComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    StockChangesChartComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
    WjCoreModule,
    WjChartModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
