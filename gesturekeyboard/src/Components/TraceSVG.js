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
            className={classes.svg}
            fill={'none'}
            strokeWidth={'10px'}
            stroke={"#B2EBF2"}
            strokeLinejoin={'round'}
            strokeLinecap={'round'}
        >
            {trace.map((point, index) => (
                <DrawingTrace className={classes.DrawingTrace} key={index} point={point} />
            ))}
        </svg>
    );
}

TraceSVG.propTypes = {
    // update
};

export default withStyles(styles)(TraceSVG);