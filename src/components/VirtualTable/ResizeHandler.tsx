import React from 'react';

import {b} from './shared';
import {calculateColumnWidth, rafThrottle} from './utils';

interface ResizeHandlerProps {
    maxWidth?: number;
    minWidth?: number;
    getCurrentColumnWidth: () => number | undefined;
    onResize?: (width: number) => void;
}

export function ResizeHandler({
    minWidth,
    maxWidth,
    getCurrentColumnWidth,
    onResize,
}: ResizeHandlerProps) {
    const elementRef = React.useRef<HTMLElement>(null);

    const [resizing, setResizing] = React.useState(false);

    React.useEffect(() => {
        const element = elementRef.current;

        if (!element) {
            return undefined;
        }

        let mouseXPosition: number | undefined;
        let initialColumnWidth: number | undefined;
        let currentColumnWidth: number | undefined;

        const onMouseMove = rafThrottle((e: MouseEvent) => {
            restrictMouseEvent(e);

            if (typeof mouseXPosition !== 'number' || typeof initialColumnWidth !== 'number') {
                return;
            }

            const xDiff = e.clientX - mouseXPosition;

            const newWidth = calculateColumnWidth(initialColumnWidth + xDiff, minWidth, maxWidth);

            if (newWidth === currentColumnWidth) {
                return;
            }

            currentColumnWidth = newWidth;

            onResize?.(currentColumnWidth);
        });

        const onMouseUp = (e: MouseEvent) => {
            restrictMouseEvent(e);

            if (currentColumnWidth !== undefined) {
                onResize?.(currentColumnWidth);
            }

            setResizing(false);
            mouseXPosition = undefined;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onMouseDown = (e: MouseEvent) => {
            initialColumnWidth = getCurrentColumnWidth();

            restrictMouseEvent(e);

            mouseXPosition = e.clientX;

            setResizing(true);

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        element.addEventListener('mousedown', onMouseDown);

        return () => {
            element.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [onResize, minWidth, maxWidth, getCurrentColumnWidth]);

    return (
        <span
            ref={elementRef}
            className={b('resize-handler', {resizing})}
            // Prevent sort trigger on resize
            onClick={(e) => restrictMouseEvent(e)}
        />
    );
}

// Prevent sort trigger and text selection on resize
function restrictMouseEvent<
    T extends {preventDefault: VoidFunction; stopPropagation: VoidFunction},
>(e: T) {
    e.preventDefault();
    e.stopPropagation();
}
