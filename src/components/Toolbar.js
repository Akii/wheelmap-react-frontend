// @flow
import { hsl } from 'd3-color';
import uniq from 'lodash/uniq';
import includes from 'lodash/includes';
import styled from 'styled-components';
import debounce from 'lodash/debounce';
import Swipeable from 'react-swipeable';
import * as React from 'react';
import type { AnyReactElement } from 'react-flow-types';
import colors from '../lib/colors';

type Props = {
  className: string,
  children: AnyReactElement,
  hidden?: boolean,
  inert?: boolean,
  role?: string,
  ariaLabel?: string,
  ariaDescribedBy?: string,
  minimalHeight?: number,
  isSwipeable?: boolean,
  isModal?: boolean,
  enableTransitions?: boolean,
  startTopOffset?: number,
};


type State = {
  topOffset: number,
  lastTopOffset: number;
  scrollTop: number,
  isSwiping: boolean,
  viewportSize: {
    width: number,
    height: number,
  }
};


/**
 * A toolbar that shows as a card that you can swipe up and down on small viewports, and that has
 * a fixed position on bigger viewports.
 *
 * Automatically becomes scrollable when fully visible.
 *
 * Can be modal and is not swipeable then.
*/

class Toolbar extends React.Component<Props, State> {
  static defaultProps = {
    hidden: false,
    minimalHeight: 145,
    isSwipeable: true,
    isModal: false,
    role: '',
    enableTransitions: true,
  };

  props: Props;

  scrollElement: ?HTMLElement;

  state = {
    lastTopOffset: 0,
    topOffset: 0,
    scrollTop: 0,
    isSwiping: false,
    viewportSize: {
      width: -1,
      height: -1,
    },
  };


  onWindowResize = debounce(() => {
    this.onResize();
  }, 200);


  componentWillMount() {
    this.onResize();
    window.addEventListener('resize', this.onWindowResize);
  }


  componentDidMount() {
    console.log('Toolbar did mount.');
    this.onResize(this.props.startTopOffset);
    if (this.props.isModal) this.ensureFullVisibility();
    setTimeout(() => this.onResize(this.props.startTopOffset), 100);
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }


  componentWillReceiveProps(newProps: Props) {
    if (newProps.isModal !== this.props.isModal) {
      console.log('Toolbar became modal.');
      this.ensureFullVisibility();
    }
  }


  /** Moves the toolbar to show as much of its content as possible. */
  ensureFullVisibility() {
    console.log('Ensuring full toolbar visibility');
    setTimeout(() => {
      this.setState({ topOffset: 0 });
      this.onResize();
    }, 150);
  }


  onResize(preferredTopOffset: number = this.state.topOffset) {
    this.setState({
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    const topOffset = this.getNearestStopForTopOffset(preferredTopOffset);
    this.setState({
      topOffset,
      lastTopOffset: topOffset,
    });
  }


  onSwiping(e: TouchEvent, deltaX: number, deltaY: number) {
    if (!this.props.isSwipeable || this.props.isModal) {
      return;
    }
    if (this.scrollElement && this.scrollElement.scrollTop > 0) {
      this.setState({ scrollTop: this.state.scrollTop || this.scrollElement.scrollTop });
      return;
    }

    if (this.state.lastTopOffset !== 0) {
      e.preventDefault();
      e.stopPropagation();
    }

    this.setState({ isSwiping: true });
    this.setState({
      topOffset: Math.max(0, this.state.lastTopOffset - deltaY - this.state.scrollTop),
    });
  }


  onSwiped(e: TouchEvent, deltaX: number, deltaY: number, isFlick: boolean) {
    if (!this.props.isSwipeable || this.props.isModal) {
      return;
    }
    this.setState({ isSwiping: false, scrollTop: 0 });
    if (isFlick && !this.state.scrollTop) {
      const isSwipingUp = deltaY > 0;
      const stops = this.getStops();
      const newIndex = isSwipingUp ? 0 : (stops.length - 1);
      this.setState({
        lastTopOffset: stops[newIndex],
        topOffset: 0,
      });
      return;
    }
    const newStop = this.getNearestStopForTopOffset(this.state.topOffset);
    this.setState({
      lastTopOffset: newStop,
      topOffset: 0,
    });
  }


  /** @returns the next preferred stop position */

  getNearestStopForTopOffset(topOffset: number): number {
    const stops = this.getStops();
    function distanceTo(position) {
      return Math.abs(position - topOffset);
    }
    let result = stops[0];
    let distance = distanceTo(result);
    stops.forEach((stop: number) => {
      if (distanceTo(stop) < distance) {
        distance = distanceTo(stop);
        result = stop;
      }
    });
    console.log('Nearest offset for preferred offset', topOffset, 'is', result, '- stops:', stops);
    return result;
  }


  /** @returns the maximal top position for the toolbar to stay interactable. */

  getMaximalTopPosition(): number {
    let toolbarHeight = 0;
    if (this.scrollElement) {
      const style = window.getComputedStyle(this.scrollElement);
      toolbarHeight = parseFloat(style.marginTop) +
        parseFloat(style.marginBottom) +
        (this.scrollElement ? this.scrollElement.scrollHeight : 0);
    }
    return Math.max(60, this.state.viewportSize.height - toolbarHeight - 60);
  }


  /** @returns An array of top position offsets that the toolbar is allowed to stop on. */

  getStops(): number[] {
    const maximalTopPosition = this.getMaximalTopPosition();
    const stops = uniq([
      maximalTopPosition,
      Math.max(maximalTopPosition, Math.floor(this.state.viewportSize.height / 2)),
      this.state.viewportSize.height - (this.props.minimalHeight || 0),
    ]);
    return stops;
  }


  isFullyExpanded() {
    const stops = this.getStops();
    return this.state.topOffset === stops[0];
  }


  getStyle(): { transform: string, touchAction: string, transition: string } {
    const lastTopOffset = this.state.lastTopOffset;

    let topOffset = this.state.topOffset || this.state.lastTopOffset;
    topOffset = Math.max(this.getMaximalTopPosition(), topOffset);
    const isLandscape = this.state.viewportSize.width > this.state.viewportSize.height;
    const isBigViewport = this.state.viewportSize.width > 512;
    if (isLandscape || isBigViewport) {
      topOffset = 0;
    }

    const defaultTransitions = 'opacity 0.3s ease-out';
    const isSwiping = this.state.isSwiping;
    const { enableTransitions } = this.props;
    return {
      touchAction: lastTopOffset === this.getMaximalTopPosition() ? 'inherit' : 'none',
      transition: enableTransitions ? (isSwiping ? defaultTransitions : `${defaultTransitions}, transform 0.3s ease-out`) : '',
      transform: `translate3d(0, ${topOffset}px, 0)`,
    };
  }


  render() {
    const xModels = ['iPhone10,3', 'iPhone10,6', 'x86_64'];
    const isIphoneX = window.device && window.device.model && includes(xModels, window.device.model);
    const classNames = [
      'toolbar',
      isIphoneX ? 'toolbar-iphone-x' : null,
      this.props.hidden ? 'toolbar-hidden' : null,
      this.props.isModal ? 'toolbar-is-modal' : null,
      this.props.className,
    ];
    const className = classNames.filter(Boolean).join(' ');
    return (<Swipeable
      onSwiping={(e, deltaX, deltaY) => this.onSwiping(e, deltaX, deltaY)}
      onSwiped={(e, deltaX, deltaY, isFlick) => this.onSwiped(e, deltaX, deltaY, isFlick)}
    >
      <section
        className={className}
        style={this.getStyle()}
        ref={(nav) => { this.scrollElement = nav; }}
        aria-hidden={this.props.inert}
        role={this.props.role}
        aria-label={this.props.ariaLabel}
        aria-describedby={this.props.ariaDescribedBy}
      >
        {(this.props.isSwipeable && !this.props.isModal) ?
          <button
            className="grab-handle"
            aria-hidden="true"
            onClick={() => {
              if (this.isFullyExpanded()) {
                const stops = this.getStops();
                const offset = stops[stops.length - 1];
                this.setState({ lastTopOffset: offset, topOffset: offset });
              } else {
                this.ensureFullVisibility();
              }
            }}
            />
          : null}
        {this.props.children}
      </section>
    </Swipeable>);
  }
}

const StyledToolbar = styled(Toolbar)`
  position: fixed;
  left: 0;
  left: constant(safe-area-inset-left);
  left: env(safe-area-inset-left);
  width: 320px;
  min-width: 320px;
  top: 50px;
  max-height: calc(100% - 80px);
  &.toolbar-is-modal {
    @media (max-height: 512px), (max-width: 512px) {
      top: 0px;
      max-height: 100%;
    }
  }
  margin: 10px;
  padding: 12px 15px 5px 15px;

  &.toolbar-iphone-x {
    border-bottom-left-radius: 25px;
    border-bottom-right-radius: 25px;
  }

  box-sizing: border-box;
  overflow: auto;
  overflow-x: hidden;
  -ms-overflow-style: -ms-autohiding-scrollbar;

  transform: translate3d(0, 0);

  font-size: 16px;
  border-radius: 5px;

  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2), 0 1px 5px rgba(0, 0, 0, 0.1);
  background-color: ${colors.colorizedBackgroundColor};
  outline: none;

  & {
     -webkit-overflow-scrolling: touch;
  }

  & { /* switch on 3D acceleration for the panel */
    transform: scale3d(1, 1, 1);
  }

  @media (max-width: 768px) {
    width: width: calc(55%);
    min-width: 250px;
  }

  .grab-handle {
    display: none;
    border: none;
    outline: none;
  }

  @media (max-width: 512px) {
    width: calc(100% - 20px);
    min-width: 250px;

    border-top: ${colors.colorizedBackgroundColor} 8px solid;

    .grab-handle {
      margin: -10px 0 -20px 0;
      padding: 15px;
      transform: translateZ(0);
      position: relative;
      width: 100%;
      height: 10px;
      display: block;
      background-color: transparent;
      touch-action: none;
      &:before {
        display: block;
        position: absolute;
        margin: 0 auto;
        top: 0px;
        left: calc(50% - 20px);
        content: '';
        width: 44px;
        height: 5px;
        border-radius: 2.5px;
        background-color: rgba(0, 0, 0, 0.2);
      }
    }
  }

  .link-button {
    display: block;
    font-size: 16px;
    padding: 10px;
    text-decoration: none;
    border-radius: 4px;
    margin: 0 -10px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    outline: none;
    color: ${colors.linkColor};

    @media (hover), (-moz-touch-enabled: 0) {
      &:hover {
        background-color: ${colors.linkBackgroundColorTransparent};
      }
    }

    &:focus&:not(.primary-button) {
      background-color: ${colors.linkBackgroundColorTransparent};
    }

    &:disabled {
      opacity: 0.15;
    }
  }

  button.link-button.full-width-button {
    width: calc(100% + 20px);
    text-align: left;
  }

  .primary-button {
    color: white;
    background-color: ${colors.linkColor};
    min-width: 8em;

    @media (hover), (-moz-touch-enabled: 0) {
      &:hover {
        background-color: ${hsl(colors.linkColor).brighter(0.2)};
      }
    }
    &:active {
      background-color: ${hsl(colors.linkColor).darker(0.2)};
    }

    &.focus-ring {
      box-shadow: 0px 0px 0px 4px ${colors.selectedColorLight};
      transition: box-shadow 0.2s;
    }
  }

  .negative-button {
    color: ${hsl(colors.negativeColor).darker(1)};
    @media (hover), (-moz-touch-enabled: 0) {
      &:hover, &:focus {
        background-color: ${colors.negativeBackgroundColorTransparent};
      }
    }
    &:active {
      background-color: ${hsl(colors.negativeBackgroundColorTransparent).darker(1)};
    }
  }

  &.toolbar-hidden {
    opacity: 0;
    pointer-events: none;
  }
`;

export default StyledToolbar;
