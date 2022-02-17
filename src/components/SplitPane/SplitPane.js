import * as React from 'react';
import cn from 'bem-cn-lite';

import {useMeasure} from 'react-use';
const block = cn('split');

import './SplitPane.scss';

const animationDuration = 200;

function Pane({className, children, size, split, style, hide, innerRef}) {
    const [animate, setAnimate] = React.useState(hide === true);
    const [hideInner, setHide] = React.useState(hide === true);

    const secondary = size === undefined;

    React.useLayoutEffect(() => {
        setAnimate(true);
        setHide(hide === true);
        const timerId = window.setTimeout(() => setAnimate(false), animationDuration);
        return () => {
            clearTimeout(timerId);
        };
    }, [hide]);

    const PaneStyle = {
        ...style,
        ...(secondary
            ? undefined
            : {
                  [split === 'vertical' ? 'width' : 'height']: hideInner ? 0 : size,
                  opacity: hideInner ? 0 : 1,
              }),
        ...(animate
            ? {
                  overflow: 'hidden',
                  transition: `${
                      split === 'vertical' ? 'width' : 'height'
                  } ${animationDuration}ms, opacity ${animationDuration}ms`,
              }
            : undefined),
    };
    return (
        <div
            ref={innerRef}
            className={block(
                'pane',
                {secondary, hide: !secondary && hide},
                classes(className, split),
            )}
            style={PaneStyle}
        >
            {children}
        </div>
    );
}

function Resizer({
    className,
    split,
    style,
    onClick,
    onDoubleClick,
    onMouseDown,
    onTouchEnd,
    onTouchStart,
    allowResize,
    active,
}) {
    return (
        <span
            role="presentation"
            className={block(
                'resizer',
                classes(className, split, allowResize ? '' : 'disabled', active ? 'active' : ''),
            )}
            style={style}
            onMouseDown={(event) => onMouseDown(event)}
            onTouchStart={(event) => {
                event.preventDefault();
                onTouchStart(event);
            }}
            onTouchEnd={(event) => {
                event.preventDefault();
                onTouchEnd(event);
            }}
            onClick={(event) => {
                if (onClick) {
                    event.preventDefault();
                    onClick(event);
                }
            }}
            onDoubleClick={(event) => {
                if (onDoubleClick) {
                    event.preventDefault();
                    onDoubleClick(event);
                }
            }}
        />
    );
}

export default function SplitPane({
    className,
    children,
    split = 'vertical',
    style,
    size,
    minSize = 50,
    maxSize = -8,
    defaultSize,
    step,
    primary = 'first',
    allowResize = true,
    hidePane,
    onResizerClick,
    onResizerDoubleClick,
    onChange,
    onDragStarted,
    onDragFinished,
    paneStyle,
    pane1Style,
    pane2Style,
    paneClassName,
    pane1ClassName,
    pane2ClassName,
    resizerClassName,
    resizerStyle,
}) {
    const [containerRef, {width, height}] = useMeasure();
    const pane1Ref = React.useRef(null);
    const pane2Ref = React.useRef(null);
    const [paneSize, setPaneSize] = React.useState(() =>
        size === undefined
            ? getDefaultSize(split, {width, height}, defaultSize, minSize, maxSize)
            : size,
    );
    const [active, setActive] = React.useState(false);
    const draggedSizeRef = React.useRef();
    const defaultSizeRef = React.useRef();
    const minSizeRef = React.useRef();
    const maxSizeRef = React.useRef();
    const positionRef = React.useRef(0);
    const slackRef = React.useRef(0);

    defaultSizeRef.current = defaultSize;
    minSizeRef.current = minSize;
    maxSizeRef.current = maxSize;

    React.useLayoutEffect(() => {
        if (!active) {
            const newSize =
                size === undefined
                    ? getDefaultSize(
                          split,
                          {width, height},
                          defaultSizeRef.current,
                          minSizeRef.current,
                          maxSizeRef.current,
                          draggedSizeRef.current,
                      )
                    : size;

            if (size !== undefined) {
                draggedSizeRef.current = size;
            }

            setPaneSize(newSize);
        }
    }, [size, defaultSize, split, width, height, active]);

    function onTouchStart(event) {
        if (allowResize) {
            unFocus(window);
            positionRef.current =
                split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
            slackRef.current = 0;

            if (typeof onDragStarted === 'function') {
                onDragStarted();
            }
            setActive(true);
        }
    }

    function onTouchMove(event) {
        if (allowResize && active) {
            unFocus(window);
            const isPrimaryFirst = primary === 'first';
            const node = isPrimaryFirst ? pane1Ref.current : pane2Ref.current;
            const node2 = isPrimaryFirst ? pane2Ref.current : pane1Ref.current;
            if (node && node2) {
                if (node.getBoundingClientRect) {
                    const newPosition =
                        split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
                    let positionDelta = positionRef.current - newPosition;
                    if (step) {
                        if (Math.abs(positionDelta) < step) {
                            return;
                        }
                        positionDelta = Math.floor(positionDelta / step) * step;
                    }
                    let sizeDelta = isPrimaryFirst ? positionDelta : -positionDelta;

                    const pane1Order = parseInt(window.getComputedStyle(node).order, 10);
                    const pane2Order = parseInt(window.getComputedStyle(node2).order, 10);
                    if (pane1Order > pane2Order) {
                        sizeDelta = -sizeDelta;
                    }

                    const effectiveMaxSize = getEffectiveMaxSize(split, {width, height}, maxSize);

                    const {width: currentWidth, height: currentHeight} =
                        node.getBoundingClientRect();
                    const currentSize = split === 'vertical' ? currentWidth : currentHeight;
                    let newSize = slackRef.current + currentSize - sizeDelta;
                    positionRef.current = positionRef.current - positionDelta;

                    if (newSize < minSize) {
                        slackRef.current = newSize - minSize;
                        newSize = minSize;
                    } else if (effectiveMaxSize !== undefined && newSize > effectiveMaxSize) {
                        slackRef.current = newSize - effectiveMaxSize;
                        newSize = effectiveMaxSize;
                    } else {
                        slackRef.current = 0;
                    }

                    if (onChange) onChange(newSize);

                    draggedSizeRef.current = newSize;
                    setPaneSize(newSize);
                }
            }
        }
    }
    const onTouchMoveRef = React.useRef(onTouchMove);
    onTouchMoveRef.current = onTouchMove;

    function onMouseMove(event) {
        const eventWithTouches = Object.assign({}, event, {
            touches: [{clientX: event.clientX, clientY: event.clientY}],
        });
        //@ts-ignore
        onTouchMove(eventWithTouches);
    }
    const onMouseMoveRef = React.useRef(onMouseMove);
    onMouseMoveRef.current = onMouseMove;

    function onTouchEnd() {
        if (allowResize && active) {
            if (typeof onDragFinished === 'function') {
                if (typeof paneSize === 'number') {
                    onDragFinished(paneSize);
                }
            }
            setActive(false);
        }
    }
    const onTouchEndRef = React.useRef(onTouchEnd);
    onTouchEndRef.current = onTouchEnd;

    function onMouseDown(event) {
        const eventWithTouches = Object.assign({}, event, {
            touches: [{clientX: event.clientX, clientY: event.clientY}],
        });
        //@ts-ignore
        onTouchStart(eventWithTouches);
    }

    React.useEffect(() => {
        function onTouchEndInner() {
            // eslint-disable-next-line no-unused-expressions
            onTouchEndRef.current?.();
        }
        function onMouseMoveInner(e) {
            // eslint-disable-next-line no-unused-expressions
            onMouseMoveRef.current?.(e);
        }
        function onTouchMoveInner(e) {
            // eslint-disable-next-line no-unused-expressions
            onTouchMoveRef.current?.(e);
        }
        document.addEventListener('mouseup', onTouchEndInner);
        document.addEventListener('mousemove', onMouseMoveInner);
        document.addEventListener('touchmove', onTouchMoveInner);
        return () => {
            document.removeEventListener('mouseup', onTouchEndInner);
            document.removeEventListener('mousemove', onMouseMoveInner);
            document.removeEventListener('touchmove', onTouchMoveInner);
        };
    }, []);
    const notNullChildren = React.Children.toArray(children).filter(Boolean);

    return (
        <div
            className={block(null, classes(className, split, allowResize ? '' : 'disabled'))}
            ref={containerRef}
            style={style}
        >
            <Pane
                innerRef={pane1Ref}
                className={classes(paneClassName, pane1ClassName)}
                split={split}
                style={{...paneStyle, ...pane1Style}}
                size={primary === 'first' ? paneSize : undefined}
                hide={hidePane}
            >
                {notNullChildren[0]}
            </Pane>
            <Resizer
                className={resizerClassName}
                style={resizerStyle}
                onClick={onResizerClick}
                onDoubleClick={onResizerDoubleClick}
                onMouseDown={onMouseDown}
                onTouchEnd={onTouchEnd}
                onTouchStart={onTouchStart}
                split={split}
                allowResize={allowResize && !hidePane}
                active={active}
            />
            <Pane
                innerRef={pane2Ref}
                className={classes(paneClassName, pane2ClassName)}
                split={split}
                style={{...paneStyle, ...pane2Style}}
                size={primary === 'second' ? paneSize : undefined}
                hide={hidePane}
            >
                {notNullChildren[1]}
            </Pane>
        </div>
    );
}

function classes(...classList) {
    return classList.filter(Boolean).join(' ');
}

function unFocus(window) {
    // eslint-disable-next-line no-unused-expressions
    window.getSelection()?.removeAllRanges();
}

function getDefaultSize(split, bound, defaultSize, minSize = 50, maxSize, draggedSize) {
    const min = minSize;
    const max = getEffectiveMaxSize(split, bound, maxSize);
    if (typeof draggedSize === 'number') {
        return Math.max(min, Math.min(max, draggedSize));
    }
    if (defaultSize !== undefined) {
        if (typeof defaultSize === 'number') {
            return Math.max(min, Math.min(max, defaultSize));
        }
        return defaultSize;
    }
    return min;
}

function getEffectiveMaxSize(split, bound, maxSize) {
    const boundSize = split === 'vertical' ? bound.width : bound.height;
    let effectiveMaxSize = boundSize;
    if (typeof maxSize === 'number') {
        effectiveMaxSize = maxSize >= 0 ? maxSize : boundSize + maxSize;
    }
    return Math.min(effectiveMaxSize, boundSize);
}
