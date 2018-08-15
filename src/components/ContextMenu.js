/* global: window */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import styles from './styles';
import eventManager from '../util/eventManager';

const KEY = {
  ENTER: 13,
  ESC: 27
};

class ContextMenu extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    theme: PropTypes.string,
    animation: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    style: {},
    theme: null,
    animation: null
  };

  state = {
    x: 0,
    y: 0,
    visible: false,
    nativeEvent: null
  };

  menu = null;
  refsFromProvider = null;
  unsub = [];
  hideTimeout = null;

  componentDidMount() {
    // console.log ("ContextMenu.js - componentDidMountPROPS: ", this.props);
    this.unsub.push(eventManager.on(`display::${this.props.id}`, this.show));
    this.unsub.push(eventManager.on('hideAll', this.hide));
  }

  componentWillUnmount() {
    this.unsub.forEach(cb => cb());
    this.unBindWindowEvent();
  }

  bindWindowEvent = () => {
    window.addEventListener('resize', this.hide);
    window.addEventListener('contextmenu', this.hide);
    window.addEventListener('mousedown', this.hide);
    window.addEventListener('click', this.hide);
    window.addEventListener('scroll', this.hide);
    window.addEventListener('keydown', this.handleKeyboard);
  };

  unBindWindowEvent = () => {
    window.removeEventListener('resize', this.hide);
    window.removeEventListener('contextmenu', this.hide);
    window.removeEventListener('mousedown', this.hide);
    window.removeEventListener('click', this.hide);
    window.removeEventListener('scroll', this.hide);
    window.removeEventListener('keydown', this.handleKeyboard);
  };

  onMouseEnter = () => window.removeEventListener('mousedown', this.hide);

  onMouseLeave = () => window.addEventListener('mousedown', this.hide);

  hide = e => {
    if (
      typeof e !== 'undefined' &&
      e.button === 2 &&
      e.type !== 'contextmenu'
    ) {
      return;
    }
    // Safari trigger a click event when you ctrl + trackpad
    if (
      typeof e !== 'undefined' &&
      e.ctrlKey === true &&
      e.type !== 'contextmenu'
    ) {
      return;
    }
    this.unBindWindowEvent();
    this.setState({ visible: false });
    // console.log ("About to call callback")
    // this.props.callback && this.props.callback();
  };

  handleKeyboard = e => {
    if (e.keyCode === KEY.ENTER || e.keyCode === KEY.ESC) {
      this.unBindWindowEvent();
      this.setState({ visible: false });
      this.props.callback && this.props.callback();
    }
  };

  setRef = ref => {
    this.menu = ref;
  };

  setMenuPosition() {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = this.menu;
    let { x, y } = this.state;

    if (x + menuWidth > windowWidth) {
      x -= x + menuWidth - windowWidth;
    }

    if (y + menuHeight > windowHeight) {
      y -= y + menuHeight - windowHeight;
    }

    const leftX = this.state.nativeEvent.srcElement.getClientRects()[0].x;
    const top = this.state.nativeEvent.srcElement.getClientRects()[0].top;
    const height = this.state.nativeEvent.srcElement.getClientRects()[0].height;
    const width = this.state.nativeEvent.srcElement.getClientRects()[0].width;
    const rightX = (1280 - leftX - width);

    const { position } = this.props;
    const offsetX = (position && position.offsetX) || 0;
    const offsetY = (position && position.offsetY) || 0;
    const align = (position && position.align) || null;
    
    const coords = {
      x: position && align === 'right' ? rightX  : leftX,
      y: position && (top + height)
    }
    coords.x += offsetX;
    coords.y += offsetY;

    /*
    If a POSITION prop is found in the form of position={{ align: right, offsetX: 0, offsetY: 0 }} then 
    the coordinate of the element that was clicked will be used to determine the position of the context menu (instead 
    of the coordinate of the mouse cursor). offsetX and offsetY will also be factored in if found.
    */

    this.setState(
      {
        x: position ? coords.x : x,
        y: position ? coords.y : y
      },
      this.bindWindowEvent
    );
  }

  getMousePosition(e) {
    const pos = {
      x: e.clientX,
      y: e.clientY
    };

    if (
      e.type === 'touchend' &&
      (pos.x === null || pos.y === null) &&
      (e.changedTouches !== null && e.changedTouches.length > 0)
    ) {
      pos.x = e.changedTouches[0].clientX;
      pos.y = e.changedTouches[0].clientY;
    }

    if (pos.x === null || pos.x < 0) {
      pos.x = 0;
    }

    if (pos.y === null || pos.y < 0) {
      pos.y = 0;
    }

    return pos;
  }

  getMenuItem() {
    const children = React.Children.toArray(this.props.children).filter(child =>
      Boolean(child)
    );

    return React.Children.map(children, item =>
      React.cloneElement(item, {
        nativeEvent: this.state.nativeEvent,
        refsFromProvider: this.refsFromProvider,
        dataFromProvider: this.dataFromProvider
      })
    );
  }

  show = (e, refsFromProvider, data) => {
    e.stopPropagation();
    eventManager.emit('hideAll');

    // store for later use
    this.refsFromProvider = refsFromProvider;
    this.dataFromProvider = data;

    const { x, y } = this.getMousePosition(e);

    this.setState(
      {
        visible: true,
        x,
        y,
        nativeEvent: e
      },
      this.setMenuPosition
    );
  };

  render() {
    const { theme, animation, style, className, position, callback } = this.props;
    const cssClasses = cx(styles.menu, className, {
      [styles.theme + theme]: theme !== null,
      [styles.animationWillEnter + animation]: animation !== null
    });
    const menuStyle = {
      ...style,
      left: this.state.x,
      top: this.state.y + 1,
      opacity: 1
    };

    return (
      this.state.visible && (
        <div
          className={cssClasses}
          style={menuStyle}
          ref={this.setRef}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        >
          <div>{this.getMenuItem()}</div>
        </div>
      )
    );
  }
}

export default ContextMenu;
