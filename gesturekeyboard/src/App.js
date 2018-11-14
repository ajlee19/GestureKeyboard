import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import LeapMotion from 'leapjs';
import TraceSVG from './Components/TraceSVG';
import firebase from 'firebase';
import FileUploader from 'react-firebase-file-uploader';

// const fingers = ["#9bcfed", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"];
const fingers = ["#9bcfed", "#FFF", "#80DEEA", "#4DD0E1", "#26C6DA"];

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
    zIndex: 10,
  }

};

const config = {
  apiKey: "AIzaSyDuiOnplJjjoh9poil-h67uFPUBw7ojJ0c",
  authDomain: "gesturekeyboard.firebaseapp.com",
  databaseURL: "https://gesturekeyboard.firebaseio.com",
  storageBucket: "gs://gesturekeyboard.appspot.com",
};
firebase.initializeApp(config);

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      frame: {},
      indexFinger: "",
      trace: new Immutable.List(),
      tracing: false,
      name: 0,
      img: "",
      isUploading: false,
      progress: 0,
      url: ""
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
          const point = new Immutable.Map({ x, y })

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

      // export svg to blob
      const svg = document.getElementById("svg");
      const svgData = (new XMLSerializer()).serializeToString(svg);
      var svgSize = svg.getBoundingClientRect();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      // initialize canvas
      var canvas = document.createElement("canvas");
      canvas.width = svgSize.width;
      canvas.height = svgSize.height;
      var ctx = canvas.getContext("2d");

      // set image info
      const imgname = this.state.name + ".png";
      var img = new Image;
      img.name = imgname;
      img.src = url;
      img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

      img.onload = function () {
        ctx.drawImage(img, 0, 0);
        const imgsrc = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = imgname;
        a.href = imgsrc;
        a.click();
      };

      try {
        this.handleUpload(svgBlob, imgname);
      } catch (e) {
        console.log("Upload error", e)
      }

      // reset state
      this.setState(prevState => ({
        // trace: new Immutable.List(),
        tracing: false,
        name: prevState.name + 1
      }))
    } else {
      console.log("START TRACKING");
      this.setState(prevState => ({
        trace: prevState.trace.push(new Immutable.List([this.state.indexFinger])),
        tracing: true
      }))
    }

  }

  handleUpload = (blob, imgname) => {
    const storageFolderRef = firebase.storage().ref().child("tracedImages");
    const fileName = imgname;
    const fileRef = storageFolderRef.child(fileName);
    // const path = fileRef.fullPath;
    // const name = fileRef.name;
    // storageFolderRef = fileRef.parent;

    fileRef.put(blob).then(
      (snapshot) => {
        // progrss 
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        this.setState({ progress });
        console.log("Progress", progress);
      }
      // (error) => {
      //   // error 
      //   console.log(error);
      // },
      // () => {
      //   console.log("Complete");
      //   firebase.storage.ref().child("tracedImages").child("fireRef").getDownloadURL().then(url => {
      //     console.log(url);
      //     this.setState({ url });
      //   })
      // }
    )
  }

  // handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });

  // handleProgress = progress => this.setState({ progress });

  // handleUploadError = error => {
  //   this.setState({ isUploading: false });
  //   console.error(error);
  // };

  // handleUploadSuccess = filename => {
  //   this.setState({ progress: 100, isUploading: false });
  //   firebase
  //     .storage()
  //     .ref("tracedImages")
  //     .child(filename)
  //     .getDownloadURL()
  //     .then(url => this.setState({ url }));
  // };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.body}>
        <canvas ref="canvas" className={classes.canvas} ></canvas>
        <TraceSVG className={classes.traceSVG} trace={this.state.trace} />
        {/* <FileUploader
          storageRef={firebase.storage().ref("tracedImages")}
          filename={this.state.name + ".png"}
          onUploadStart={this.handleUploadStart}
          onProgress={this.handleProgress}
          onUploadError={this.handleUploadError}
          onUploadSuccess={this.handleUploadSuccess}
          onProgress={this.handleProgress}
        /> */}
      </div>
    )
  }
}

App.propTypes = {

};

App.defaultProps = {

};

export default withStyles(styles)(App);
