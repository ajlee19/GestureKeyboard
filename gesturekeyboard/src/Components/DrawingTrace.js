import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';


const styles = {
    path: {
        // position: 'absolute',
        // height: '100%',
        // width: '100%',
        // // fill: none,
        // // strokeWidth: '10px',
        // // stroke: 'black',
        // // strokeLineJoin: 'round',
        // // strokeLinecap: 'round'
    }
};

function DrawingTrace( props ) {
    const { classes, key, point } = props;
    const pathData = "M " +
      point
        .map(p => {
          return `${p.get('x')} ${p.get('y')}`;
        })
        .join("\nL ");
    
    // console.log("PATH", pathData);
  
    return <path className={classes.path} d={pathData} />;
  }

DrawingTrace.propTypes = {
    // update
};

export default withStyles(styles)(DrawingTrace);