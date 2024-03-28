import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import throttle from 'lodash/throttle';

import {basename as appBasename} from '../../../store/index';
import routes, {createHref} from '../../../routes';

const b = cn('heatmap');
const defaultDimensions = {width: 0, height: 0};

const TABLET_SIZE = 10;
const TABLET_PADDING = 2;

export const HeatmapCanvas = (props) => {
    const [dimensions, setDimensions] = useState(defaultDimensions);
    const {tablets} = props;
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    function drawTablet(ctx) {
        return (tablet, index) => {
            const {columnsCount} = dimensions;
            const rectX = (index % columnsCount) * (TABLET_SIZE + TABLET_PADDING);
            const rectY = Math.floor(index / columnsCount) * (TABLET_SIZE + TABLET_PADDING);

            ctx.fillStyle = tablet.color || 'grey';
            ctx.fillRect(rectX, rectY, TABLET_SIZE, TABLET_SIZE);
        };
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        tablets.map(drawTablet(ctx));
    });

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (container) {
            const width = container.offsetWidth - 15;
            const columnsCount = Math.floor(width / (TABLET_SIZE + TABLET_PADDING));
            const rowsCount = Math.ceil(tablets.length / columnsCount);
            const height = rowsCount * (TABLET_SIZE + TABLET_PADDING);

            setDimensions({
                width,
                height,
                columnsCount,
                rowsCount,
            });
        }
    }, []);

    const getOffsetTop = () => {
        let element = canvasRef.current;
        let offsetTop = 0;
        while (element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return offsetTop;
    };

    const getOffsetLeft = () => {
        let element = canvasRef.current;
        let offsetLeft = 0;
        while (element) {
            offsetLeft += element.offsetLeft;
            element = element.offsetParent;
        }
        return offsetLeft;
    };

    const getTabletIndex = (x, y) => {
        const {columnsCount} = dimensions;
        const colStep = TABLET_SIZE + TABLET_PADDING;
        const rowStep = TABLET_SIZE + TABLET_PADDING;

        const xCol = Math.floor(x / colStep);
        const yRow = Math.floor(y / rowStep);
        const index = columnsCount * yRow + xCol;

        return index;
    };
    const generateTabletExternalLink = (tablet) => {
        const {TabletId: id} = tablet;
        const hostname = window.location.hostname;
        const path = createHref(routes.tablet, {id});
        const protocol = 'https://';
        const href = [hostname, appBasename, path]
            .map((item) => (item.startsWith('/') ? item.slice(1) : item))
            .filter(Boolean)
            .join('/');

        return `${protocol}${href}`;
    };
    const _onCanvasClick = (e) => {
        const parent = props.parentRef.current;
        const x = e.clientX - getOffsetLeft() + parent.scrollLeft;
        const y = e.clientY - getOffsetTop() + parent.scrollTop;

        const tabletIndex = getTabletIndex(x, y);
        const tablet = tablets[tabletIndex];

        if (tablet) {
            window.open(generateTabletExternalLink(tablet), '_blank');
        }
    };
    const _onCanvasMouseLeave = () => {
        // Timeout is needed to surely hide tooltip. In _onCanvasMouseMove method is is used "throttle"
        // and it can cause tooltip render function after canvas field is actually leaved.
        //So we use in timeout we use a delay greater then delay in throttle.
        setTimeout(() => {
            props.hideTooltip();
        }, 40);
    };
    const _onCanvasMouseMove = throttle((x, y) => {
        //this is needed to force ReduxPopup rerender
        const event = new CustomEvent('scroll');
        window.dispatchEvent(event);
        const parent = props.parentRef.current;
        const xPos = x - getOffsetLeft() + parent.scrollLeft;
        const yPos = y - getOffsetTop() + parent.scrollTop;

        const tabletIndex = getTabletIndex(xPos, yPos);
        const tablet = tablets[tabletIndex];
        if (tablet) {
            const additionalData = {
                name: tablet.currentMetric,
                value: tablet.formattedValue,
            };
            props.showTooltip(undefined, tablet, 'tablet', additionalData, {
                left: x - 20,
                top: y - 20,
            });
        } else {
            props.hideTooltip();
        }
    }, 20);

    return (
        <div
            ref={containerRef}
            className={b('canvas-container')}
            onMouseLeave={_onCanvasMouseLeave}
        >
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onClick={_onCanvasClick}
                onMouseMove={(e) => _onCanvasMouseMove(e.clientX, e.clientY)}
            />
        </div>
    );
};

HeatmapCanvas.propTypes = {
    tablets: PropTypes.array,
    parentRef: PropTypes.object,
    showTooltip: PropTypes.func,
    hideTooltip: PropTypes.func,
    currentMetric: PropTypes.string,
};
