import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import DrawingTrace from './DrawingTrace';

const styles = {
    svg: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'black'
    },

    DrawingTrace: {
        position: 'absolute',
        height: '100%',
        width: '100%',
    }
};

function TraceSVG(props) {
    const { classes, trace } = props;
    return (
        <svg
            id = "svg"
            className={classes.svg}
            fill={'none'}
            strokeWidth={'30px'}
            stroke={"#FFF"}
            strokeLinejoin={'round'}
            strokeLinecap={'round'}
        >
            {trace.map((points, index) => ( 
                (index === trace.size -1) ? <DrawingTrace className={classes.DrawingTrace} key={index} points={points} />
                : <div></div>
            ))}
        </svg>
    );
}

TraceSVG.propTypes = {
    // update
};

export default withStyles(styles)(TraceSVG);