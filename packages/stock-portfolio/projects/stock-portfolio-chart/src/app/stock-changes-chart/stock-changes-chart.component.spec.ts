import { TestBed, async } from '@angular/core/testing';
import { StockChangesChartComponent } from './stock-changes-chart.component';

describe('StockChangesChartComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        StockChangesChartComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(StockChangesChartComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'stock-portfolio-chart'`, () => {
    const fixture = TestBed.createComponent(StockChangesChartComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('stock-portfolio-chart');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(StockChangesChartComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('stock-portfolio-chart app is running!');
  });
});
