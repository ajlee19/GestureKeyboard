import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import LeapMotion from 'leapjs';
import TraceSVG from './Components/TraceSVG';

const fingers = ["#9bcfed", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"];

const styles = {
  body: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },

  canvas: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 10
  },

  traceSVG: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 10  
  }

};

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      frame: {},
      indexFinger: "",
      trace: new Immutable.List(),
      tracing: false
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeydown);
    this.leap = LeapMotion.loop((frame) => {
      this.setState({
        frame,
      });
      this.traceFingers(frame);
    });
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeydown);
    this.leap.disconnect();
  }

  traceFingers(frame) {
    try {
      const canvas = this.refs.canvas;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frame.pointables.forEach((pointable) => {

        if (pointable.type === 1) {
          const color = fingers[pointable.type];
          const position = pointable.stabilizedTipPosition;
          const normalized = frame.interactionBox.normalizePoint(position);
          const x = ctx.canvas.width * normalized[0];
          const y = ctx.canvas.height * (1 - normalized[1]);
          const radius = Math.min(20 / Math.abs(pointable.touchDistance), 50);          
          const point = new Immutable.Map({ x, y})

          if (this.state.tracing) {
            this.setState(prevState => ({
              // trace: prevState.trace.push(point),
              trace: prevState.trace.updateIn([prevState.trace.size - 1], line => line.push(point)),
              indexFinger: point
            }))
            // this.traceStroke(this.state.trace);
          } else {
            this.setState({
              indexFinger: point
            })
            this.drawCircle([x, y], radius, color, pointable.type === 1);
          }
        }
      });
    } catch (err) {
      console.log("ERR", err);
    }
  }

  drawCircle(center, radius, color, fill) {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.lineWidth = 10;
    if (fill) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }

  traceStroke(toTrace) {
    // console.log("TRACE", toTrace)
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");

    const cp1x = toTrace[Math.floor(toTrace.length / 3)].x;
    const cp1y = toTrace[Math.floor(toTrace.length / 3)].y;
    const cp2x = toTrace[Math.floor(2 * toTrace.length / 3)].x;
    const cp2y = toTrace[Math.floor(2 * toTrace.length / 3)].y;
    const x = toTrace[toTrace.length - 1].x;
    const y = toTrace[toTrace.length - 1].y;
    console.log("TRACE", toTrace)

    ctx.beginPath();
    ctx.moveTo(toTrace[0].center[0], toTrace[0].center[1]);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    ctx.strokeStyle = "#B2EBF2";
    ctx.lineWidth = 80;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  handleKeydown = () => {
    if (this.state.tracing) {
      console.log("STOP TRACKING");
      // export the current trace as image
      this.setState(prevState => ({
        trace: new Immutable.List(),
        tracing: true
      }))
      this.setState({
        tracing: false
      })
    } else {
      console.log("START TRACKING");
      this.setState(prevState => ({
        trace: prevState.trace.push(new Immutable.List([this.state.indexFinger])),
        tracing: true
      }))
    }

  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.body}>
        <canvas className={classes.canvas} ref="canvas"></canvas>
        <TraceSVG className={classes.traceSVG} trace={this.state.trace} /> 
      </div>
    )
  }
}

// function TraceSVG({classes, trace}) {
//   // const { classes, trace } = this.props;
//   return (
//     <svg className={classes.svg}>
//       {trace.map((point, index) => (
//         <DrawingTrace className={classes.drawingTrace} key={index} point={point} />
//       ))}
//     </svg>
//   );
// }

// function DrawingTrace({ classes, key, point }) {
//   // const { classes } = this.props;
//   const pathData = "M " +
//     point
//       .map(p => {
//         return `${p.get('x')} ${p.get('y')}`;
//       })
//       .join("\nL ");
  
//   console.log("PATH", pathData);

//   return <path className={classes.path} d={pathData} />;
// }

App.propTypes = {

};

App.defaultProps = {

};

export default withStyles(styles)(App);
