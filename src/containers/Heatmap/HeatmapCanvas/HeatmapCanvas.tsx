import React from 'react';

import throttle from 'lodash/throttle';

import {useTabletPagePath} from '../../../routes';
import {basename as appBasename} from '../../../store/index';
import type {IHeatmapTabletData} from '../../../types/store/heatmap';
import {cn} from '../../../utils/cn';

const b = cn('heatmap');

const TABLET_SIZE = 10;
const TABLET_PADDING = 2;

interface HeatmapCanvasDimensions {
    width: number;
    height: number;
    columnsCount: number;
    rowsCount: number;
}

const defaultDimensions: HeatmapCanvasDimensions = {
    width: 0,
    height: 0,
    columnsCount: 0,
    rowsCount: 0,
};

type HeatmapCanvasTablet = IHeatmapTabletData & {
    color?: string;
};

interface HeatmapCanvasProps {
    tablets: HeatmapCanvasTablet[];
    parentRef: React.RefObject<HTMLDivElement>;
    onShowTabletTooltip: (
        tablet: IHeatmapTabletData,
        position: {left: number; top: number},
    ) => void;
    onHideTabletTooltip: () => void;
}

export const HeatmapCanvas = (props: HeatmapCanvasProps) => {
    const [dimensions, setDimensions] = React.useState<HeatmapCanvasDimensions>(defaultDimensions);
    const {tablets, onShowTabletTooltip, onHideTabletTooltip} = props;
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const getTabletPagePath = useTabletPagePath();

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const drawTablet = (tablet: HeatmapCanvasTablet, index: number) => {
            const {columnsCount} = dimensions;
            const rectX = (index % columnsCount) * (TABLET_SIZE + TABLET_PADDING);
            const rectY = Math.floor(index / columnsCount) * (TABLET_SIZE + TABLET_PADDING);

            ctx.fillStyle = tablet.color || 'grey';
            ctx.fillRect(rectX, rectY, TABLET_SIZE, TABLET_SIZE);
        };

        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        tablets.forEach(drawTablet);
    }, [tablets, dimensions]);

    const tabletsLength = tablets.length;

    React.useLayoutEffect(() => {
        const container = containerRef.current;

        if (container) {
            const width = container.offsetWidth - 15;
            const columnsCount = Math.floor(width / (TABLET_SIZE + TABLET_PADDING));
            const rowsCount = Math.ceil(tabletsLength / columnsCount);
            const height = rowsCount * (TABLET_SIZE + TABLET_PADDING);

            setDimensions({
                width,
                height,
                columnsCount,
                rowsCount,
            });
        }
    }, [tabletsLength]);

    const getOffsetTop = () => {
        let element: HTMLElement | null = canvasRef.current;
        let offsetTop = 0;

        while (element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent as HTMLElement | null;
        }

        return offsetTop;
    };

    const getOffsetLeft = () => {
        let element: HTMLElement | null = canvasRef.current;
        let offsetLeft = 0;

        while (element) {
            offsetLeft += element.offsetLeft;
            element = element.offsetParent as HTMLElement | null;
        }

        return offsetLeft;
    };

    const getTabletIndex = (x: number, y: number) => {
        const {columnsCount} = dimensions;
        const colStep = TABLET_SIZE + TABLET_PADDING;
        const rowStep = TABLET_SIZE + TABLET_PADDING;

        const xCol = Math.floor(x / colStep);
        const yRow = Math.floor(y / rowStep);
        const index = columnsCount * yRow + xCol;

        return index;
    };

    const generateTabletExternalLink = (tablet: HeatmapCanvasTablet) => {
        const {TabletId} = tablet;
        if (!TabletId) {
            return '#';
        }

        const hostname = window.location.hostname;
        const path = getTabletPagePath(TabletId);
        const protocol = 'https://';
        const href = [hostname, appBasename, path]
            .map((item) => (item.startsWith('/') ? item.slice(1) : item))
            .filter(Boolean)
            .join('/');

        return `${protocol}${href}`;
    };

    const _onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const parent = props.parentRef.current;
        if (!parent) {
            return;
        }

        const x = e.clientX - getOffsetLeft() + parent.scrollLeft;
        const y = e.clientY - getOffsetTop() + parent.scrollTop;

        const tabletIndex = getTabletIndex(x, y);
        const tablet = tablets[tabletIndex];

        if (tablet) {
            window.open(generateTabletExternalLink(tablet), '_blank');
        }
    };

    const _onCanvasMouseLeave = () => {
        setTimeout(() => {
            onHideTabletTooltip();
        }, 40);
    };

    const _onCanvasMouseMove = throttle((x: number, y: number) => {
        const parent = props.parentRef.current;
        if (!parent) {
            return;
        }

        const xPos = x - getOffsetLeft() + parent.scrollLeft;
        const yPos = y - getOffsetTop() + parent.scrollTop;

        const tabletIndex = getTabletIndex(xPos, yPos);
        const tablet = tablets[tabletIndex];

        if (tablet) {
            const {columnsCount} = dimensions;
            if (!columnsCount) {
                return;
            }
            const colIndex = tabletIndex % columnsCount;
            const rowIndex = Math.floor(tabletIndex / columnsCount);

            const rectX = colIndex * (TABLET_SIZE + TABLET_PADDING);
            const rectY = rowIndex * (TABLET_SIZE + TABLET_PADDING);

            const left = rectX + TABLET_SIZE / 2;
            const top = rectY + TABLET_SIZE / 2;

            onShowTabletTooltip(tablet, {left, top});
        } else {
            onHideTabletTooltip();
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
