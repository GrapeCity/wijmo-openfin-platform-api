import React from 'react';
import * as wjChart from "@grapecity/wijmo.react.chart";
import * as wjChartAnalysis from "@grapecity/wijmo.react.chart.analytics";
import './chart.css';

class Chart extends React.Component {

  renderChartContent() {
    if (this.props.current) {
      return [
        <wjChart.FlexChartSeries
            key="series"
            itemsSource={this.props.current.chartData}
            name={this.props.current.symbol}
            style={{ stroke: this.props.current.color }}>
        </wjChart.FlexChartSeries>,
        <wjChartAnalysis.FlexChartTrendLine
            key="trendline"
            itemsSource={this.props.current.chartData}
            name="Linear Trendline"
            style={{ stroke: 'white' }}
            fitType="Linear">
        </wjChartAnalysis.FlexChartTrendLine>
      ];
    }
    return [];
  }

  render() {
    return (  
      <wjChart.FlexChart chartType="Line" binding="price" bindingX="date">
        {this.renderChartContent()}
        <wjChart.FlexChartAxis wjProperty="axisY" format="n0" majorGrid={true} majorTickMarks={0}></wjChart.FlexChartAxis>
        <wjChart.FlexChartAxis wjProperty="axisX" format="MMM-yyyy" majorGrid={true} majorTickMarks={0}></wjChart.FlexChartAxis>
        <wjChart.FlexChartLegend position="None"></wjChart.FlexChartLegend>
      </wjChart.FlexChart>
    );
  }
}

export default Chart;