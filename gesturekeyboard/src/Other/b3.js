import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import LeapMotion from 'leapjs';
import TraceSVG from './Components/TraceSVG';
import firebase from 'firebase';
import FileUploader from "react-firebase-file-uploader";
import request from 'request';
import { Grid } from '@material-ui/core';
import base64Img from 'base64-image';
import image from 'react-firebase-file-uploader/lib/utils/image';

// const fingers = ["#9bcfed", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"];
const fingers = ["#9bcfed", "#FFF", "#80DEEA", "#4DD0E1", "#26C6DA"];

const styles = {
  body: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
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
  },

  classification: {
    margin: '2%',
    height: '10%',
    width: '100%',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'row'
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
      indexFinger: "",
      trace: new Immutable.List(),
      tracing: false,
      name: 0,
      img: "",
      isUploading: false,
      progress: 0,
      url: "",
      classified: ""
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

      // extract svg data
      const svg = document.getElementById("svg");
      const svgData = new XMLSerializer().serializeToString(svg);
      var svgSize = svg.getBoundingClientRect();

      // initialize canvas
      var canvas = document.createElement("canvas");
      canvas.width = svgSize.width;
      canvas.height = svgSize.height;
      var ctx = canvas.getContext("2d");

      // set image info
      const key = this.state.name;
      const imgname = key + ".png";
      var img = document.createElement("img");
      img.name = imgname;
      img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

      image.onload = async function loaded() {
        const imageDrawn = await ctx.drawImage(img, 0, 0);
        const imgDataUrl = await canvas.toDataURL("image/png");
        console.log("output", imgDataUrl);
        console.log("lenght", imgDataUrl.length);
        const a = document.createElement("a");
        a.download = imgname;
        a.href = imgDataUrl;
        a.click();
        // push url encoding to database
        try {
          console.log("code", imgDataUrl);
          // this.updateDatabase(imgname, imgDataUrl);
          // this.handleUpload(svgBlob, imgname, pngBase64);
          const options = {
            method: 'POST',
            url: 'https://gesturekeyboard.firebaseio.com/Data.json',
            headers:
            {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json'
            },
            body: { imgname, imgDataUrl },
            json: true
          };

          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            // console.log(body);
          });

        } catch (e) {
          console.log(e);
        }
      }();

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
  };

  handleUpload = (blob, imgname, base64) => {
    const storageFolderRef = firebase.storage().ref();
    const fileRef = storageFolderRef.child(imgname);
    // const path = fileRef.fullPath;
    // const name = fileRef.name;
    // storageFolderRef = fileRef.parent;

    fileRef.put(blob).then(
      // (snapshot) => {
      //   // progrss 
      //   const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      //   this.setState({ progress });
      //   console.log("Progress", progress);
      // },
      // (error) => {
      //   // error 
      //   console.log(error);
      // },
      () => {
        console.log("Complete");
        fileRef.getDownloadURL().then(url => {
          console.log("url", url);
          this.setState({ url });
        })
      }
    ).then(this.updateDatabase(imgname, base64))
  }

  updateDatabase = (imgname, base64) => {
    try {
      const options = {
        method: 'POST',
        url: 'https://gesturekeyboard.firebaseio.com/Data.json',
        headers:
        {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: { imgname, base64 },
        json: true
      };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
      });
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.body}>
        <canvas ref="canvas" className={classes.canvas} ></canvas>
        <TraceSVG className={classes.traceSVG} trace={this.state.trace} />
        <div className={classes.classification} >
          <div className={classes.label}>Classified: </div>
          <div className={classes.content}>{this.state.classified}</div>
        </div>
      </div>
    )
  }
}

App.propTypes = {

};

App.defaultProps = {

};

export default withStyles(styles)(App);

      // console.log("STOP TRACKING");

      // // extract svg data
      // const svg = document.getElementById("svg");
      // const svgData = new XMLSerializer().serializeToString(svg);
      // var svgSize = svg.getBoundingClientRect();

      // // initialize canvas
      // var canvas = document.createElement("canvas");
      // canvas.width = svgSize.width;
      // canvas.height = svgSize.height;
      // var ctx = canvas.getContext("2d");

      // // set image info
      // const key = this.state.name;
      // const imgname = key + ".png";
      // var img = document.createElement("img");
      // img.name = imgname;
      // img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

      // image.onload = async function loaded() {
      //   const imageDrawn = await ctx.drawImage(img, 0, 0);
      //   const imgDataUrl = await canvas.toDataURL("image/png");
      //   console.log("output", imgDataUrl);
      //   console.log("lenght", imgDataUrl.length);
      //   const a = document.createElement("a");
      //   a.download = imgname;
      //   a.href = imgDataUrl;
      //   a.click();
      //   // push url encoding to database
      //   try {
      //     console.log("code", imgDataUrl);
      //     // this.updateDatabase(imgname, imgDataUrl);
      //     // this.handleUpload(svgBlob, imgname, pngBase64);
      //     const options = {
      //       method: 'POST',
      //       url: 'https://gesturekeyboard.firebaseio.com/Data.json',
      //       headers:
      //       {
      //         'Cache-Control': 'no-cache',
      //         'Content-Type': 'application/json'
      //       },
      //       body: { imgname, imgDataUrl },
      //       json: true
      //     };

      //     request(options, function (error, response, body) {
      //       if (error) throw new Error(error);
      //       // console.log(body);
      //     });

      //   } catch (e) {
      //     console.log(e);
      //   }
      // }();

      // // reset state
      // this.setState(prevState => ({
      //   // trace: new Immutable.List(),
      //   tracing: false,
      //   name: prevState.name + 1
      // }))

      handleUpload = (blob, imgname, base64) => {
        const storageFolderRef = firebase.storage().ref();
        const fileRef = storageFolderRef.child(imgname);
        // const path = fileRef.fullPath;
        // const name = fileRef.name;
        // storageFolderRef = fileRef.parent;
    
        fileRef.put(blob).then(
          // (snapshot) => {
          //   // progrss 
          //   const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          //   this.setState({ progress });
          //   console.log("Progress", progress);
          // },
          // (error) => {
          //   // error 
          //   console.log(error);
          // },
          () => {
            console.log("Complete");
            fileRef.getDownloadURL().then(url => {
              console.log("url", url);
              this.setState({ url });
            })
          }
        ).then(this.updateDatabase(imgname, base64))
      }
    
      updateDatabase = (imgname, base64) => {
        try {
          const options = {
            method: 'POST',
            url: 'https://gesturekeyboard.firebaseio.com/Data.json',
            headers:
            {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json'
            },
            body: { imgname, base64 },
            json: true
          };
    
          request(options, function (error, response, body) {
            if (error) throw new Error(error);
          });
        } catch (e) {
          console.log(e);
        }
      }