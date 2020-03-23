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
            style={{ stroke: '#ff4700' }}
            altStyle={{ stroke: '#00ff75' }}>
        </wjChart.FlexChartSeries>,
        <wjChartAnalysis.FlexChartMovingAverage
            key="movingAverage"
            itemsSource={this.props.current.chartData}
            name="Moving Average"
            binding="close"
            style={{ stroke: 'white' }}
            period={6}
            type="Simple">
        </wjChartAnalysis.FlexChartMovingAverage>
      ];
    }
    return [];
  }

  render() {
    return (
      <wjChart.FlexChart chartType="HighLowOpenClose" binding="high,low,open,close" bindingX="date">
        {this.renderChartContent()}
        <wjChart.FlexChartAxis wjProperty="axisY" format="n0" majorGrid={true} majorTickMarks={0}></wjChart.FlexChartAxis>
        <wjChart.FlexChartAxis wjProperty="axisX" format="MMM-yyyy" majorGrid={true} majorTickMarks={0}></wjChart.FlexChartAxis>
        <wjChart.FlexChartLegend position="None"></wjChart.FlexChartLegend>
      </wjChart.FlexChart>
    );
  }
}

export default Chart;