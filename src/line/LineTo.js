import React, { Component } from 'react';
import PropTypes from 'prop-types';

const defaultAnchor = { x: 0.5, y: 0.5 };

function parseAnchor(value) {
  if (!value) {
    return defaultAnchor;
  }
  const parts = value.split(' ');
  if (parts.length > 2) {
    throw new Error('LinkTo anchor format is "<x> <y>"');
  }
  const [x, y] = parts;
  return Object.assign(
    {},
    defaultAnchor,
    x ? parseAnchorText(x) || { x: parseAnchorPercent(x) } : {},
    y ? parseAnchorText(y) || { y: parseAnchorPercent(y) } : {},
  );
}

function parseAnchorText(value) {
  // Try to infer the relevant axis.
  switch (value) {
    case 'top':
      return { y: 0 };
    case 'left':
      return { x: 0 };
    case 'middle':
      return { y: 0.5 };
    case 'center':
      return { x: 0.5 };
    case 'bottom':
      return { y: 1 };
    case 'right':
      return { x: 1 };
  }
  return null;
}

function parseAnchorPercent(value) {
  const percent = parseFloat(value) / 100;
  if (isNaN(percent) || !isFinite(percent)) {
    throw new Error(`LinkTo could not parse percent value "${value}"`);
  }
  return percent;
}

let staticFromAnchor, staticToAnchor;

export default class LineTo extends Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
    fromAnchor: PropTypes.string,
    toAnchor: PropTypes.string,
    offset: PropTypes.object,
  };

  static defaultProps = {
    className: '',
    style: {},
    offset: { x: 0, y: 0 },
  };

  static getDerivedStateFromProps(nextProps, state) {
    let newState = {};
    if (nextProps.fromAnchor !== state.fromAnchor) {
      staticFromAnchor = parseAnchor(nextProps.fromAnchor);
      newState.fromAnchor = nextProps.fromAnchor;
    }
    if (nextProps.toAnchor !== state.toAnchor) {
      staticToAnchor = parseAnchor(nextProps.toAnchor);
      newState.toAnchor = nextProps.toAnchor;
    }
    return newState;
  }

  constructor(props) {
    super(props);

    this.state = {
      fromAnchor: props.fromAnchor,
      toAnchor: props.toAnchor,
    };

    staticFromAnchor = parseAnchor(props.fromAnchor);
    staticToAnchor = parseAnchor(props.toAnchor);
  }

  componentWillUnmount() {
    if (this.t) {
      clearTimeout(this.t);
      this.t = null;
    }
  }

  detect() {
    const { from, to, offset } = this.props;

    if (!from || !to) {
      return;
    }

    const anchor0 = staticFromAnchor;
    const anchor1 = staticToAnchor;

    const box0 = from.getBoundingClientRect();
    const box1 = to.getBoundingClientRect();

    const offsetX = window.pageXOffset - offset.x;
    const offsetY = window.pageYOffset - offset.y;

    const x0 = box0.left + box0.width * anchor0.x + offsetX;
    const x1 = box1.left + box1.width * anchor1.x + offsetX;
    const y0 = box0.top + box0.height * anchor0.y + offsetY;
    const y1 = box1.top + box1.height * anchor1.y + offsetY;

    return { x0, y0, x1, y1 };
  }

  render() {
    const points = this.detect();
    return points ? <Line {...points} {...this.props} /> : null;
  }
}
