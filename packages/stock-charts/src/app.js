import React from 'react';
import * as wijmo from '@grapecity/wijmo';
import { ChartPeriod } from 'stock-core';
import Config from './config';
import AppContext from './appContext';
import ChartContainer from './chart-container/chartContainer';
import HlocChart from './hloc-chart/chart';
import TrendlineChart from './trendline-chart/chart';
import { HlocChartController } from './hloc-chart/chartController';
import { TrendlineChartController } from './trendline-chart/chartController';
import './app.css';
import financeLogo from './assets/finance.png';
import reactLogo from './assets/react.svg';

const fin = window.fin;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.initialized = false;
    
    this.state = {
      chartPeriod: ChartPeriod.m12,
      current: null
    };

    const context = new AppContext();
    context.chartName.then(this.initialize.bind(this));
  }

  componentDidUpdate() {
    if (this.initialized && !this.tt) {
      this.tt = new wijmo.Tooltip();
      this.tt.setTooltip('.framework-logo', 'Built on React framework');
    }
  }

  initialize(chartName) {    
    this.initialized = true;
    this.chartRef = React.createRef();
    this.controller = this.createController(chartName);    

    document.title = this.getTitle(chartName);
    this.setState({
      chartPeriod: this.controller.getChartPeriod(),
      chartName: chartName,
      title: document.title
    });
  }

  createController(chartName) {
    const props = {
      chartRef: this.chartRef,
      handleCurrentChange: this.handleCurrentChange.bind(this)
    };
    switch (chartName) {
      case 'hloc':
        return new HlocChartController(props);
      
      case 'trendline':
        return new TrendlineChartController(props);

      default:
        return null;
    }
  }

  getTitle(chartName) {
    switch (chartName) {
      case 'hloc':
        return 'Stock HLOC';
      
      case 'trendline':
        return 'Stock Trendline';

      default:
        return document.title;
    }
  }

  renderChartButtons() {
    return Object.keys(ChartPeriod).map(key => {
      const chartPeriod = ChartPeriod[key];
      return (
        <button key={key} 
                type="button" 
                className={"btn btn-default " + (this.isActiveChartPeriod(chartPeriod) ? 'active' : '')}
                onClick={() => this.changeChartPeriod(chartPeriod)}>
          {key}
        </button>
      );
    });
  }

  renderWindowButtons() {
    return (
      <div className="window-buttons">
          <button type="button" className="close" onClick={() => this.closeApp()}>&times;</button>
      </div>
    );
  }

  renderChart() {
    switch(this.state.chartName) {
      case 'hloc':
        return <HlocChart current={this.state.current} />;

      case 'trendline':
        return <TrendlineChart current={this.state.current} />;

      default:
        return null;          
    }
  }

  render() {
    if (!this.initialized) {
      return (
        <div className="panel panel-default"></div>
      );
    }

    const current = this.state.current;
    const headerStyle = {
      backgroundColor: current ? current.color : null
    };
    return (
      <div className="panel panel-default">        
        <div className={"panel-heading " + (current !== null ? 'selected' : '')} style={headerStyle}>
          <div className="align-center">
          </div>
          <div className="align-center">
            <div className="btn-group btn-group-xs">
              {this.renderChartButtons()}
            </div>
            <div className="window-buttons">
            </div>
          </div>
          <div className="align-center">
          </div>
        </div>
        
        <div className="panel-body">
          <ChartContainer chartRef={this.chartRef} controller={this.controller}>
            {this.renderChart()}
          </ChartContainer>
        </div>
        <div><img className="h-16 framework-logo" src={reactLogo} alt="react logo" /></div>
      </div>
    );
  }

  isActiveChartPeriod(value) {
    return this.state.chartPeriod === value;
  }

  changeChartPeriod(value) {
    this.controller.setChartPeriod(value);
    this.setState({
      chartPeriod: value
    });
  }

  handleCurrentChange(value) {
    this.setState({
      current: value
    });
  }

  closeApp() {
    fin.Application.getCurrent()
      .then(app => app.getWindow())
      .then(win => win.close(false));
  }
}

export default App;
