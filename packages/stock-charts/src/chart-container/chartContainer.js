import React from 'react';
import './chartContainer.css';

class ChartContainer extends React.Component {
  
  render() {
    return (
      <div ref={this.props.chartRef}
        className="chart-container"
        onAnimationStart={this.handleAnimationStart.bind(this)}
        onAnimationEnd={this.handleAnimationEnd.bind(this)}>
        {this.props.children}
      </div>
    );
  }

  handleAnimationStart() {
    this.props.controller.handleAnimationStart();
  }

  handleAnimationEnd() {
    this.props.controller.handleAnimationEnd();
  }
}

export default ChartContainer;