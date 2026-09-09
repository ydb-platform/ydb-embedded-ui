import React from 'react';

import {cn} from '../../../utils/cn';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDiskSvg} from '../PDisk/PDiskSvg';
import type {StorageViewContext} from '../types';
import {isPdiskActive} from '../utils';

import './PDisksCompact.scss';

const b = cn('ydb-storage-pdisks-compact');

const PDISK_MIN_WIDTH = 165;
const PDISK_GAP = 10;
const PDISK_HEIGHT = 40;
const HORIZONTAL_OVERSCAN = 2;
const INITIAL_RENDERED_PDISKS = 8;
const VERTICAL_ROOT_MARGIN = '50% 0px';

interface PDisksCompactProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
    scrollContainerRef?: React.RefObject<HTMLElement>;
    inverted?: boolean;
}

interface ViewportState {
    scrollLeft: number;
    width: number;
    measured: boolean;
}

function getRange({
    scrollLeft,
    viewportWidth,
    measured,
    itemStep,
    count,
}: {
    scrollLeft: number;
    viewportWidth: number;
    measured: boolean;
    itemStep: number;
    count: number;
}) {
    if (!count) {
        return {start: 0, end: -1};
    }

    if (!measured) {
        return {start: 0, end: Math.min(INITIAL_RENDERED_PDISKS - 1, count - 1)};
    }

    if (viewportWidth <= 0) {
        return {start: 0, end: -1};
    }

    const start = Math.max(Math.floor(scrollLeft / itemStep) - HORIZONTAL_OVERSCAN, 0);
    const end = Math.min(
        Math.ceil((scrollLeft + viewportWidth) / itemStep) + HORIZONTAL_OVERSCAN,
        count - 1,
    );

    return {start, end};
}

function getVisibleViewport(element: HTMLElement, scrollContainer?: HTMLElement): ViewportState {
    const elementRect = element.getBoundingClientRect();
    const rootRect = scrollContainer?.getBoundingClientRect();
    const rootLeft = rootRect?.left ?? 0;
    const rootRight = rootRect?.right ?? window.innerWidth;
    const visibleLeft = Math.max(rootLeft - elementRect.left, 0);
    const visibleRight = Math.min(rootRight - elementRect.left, elementRect.width);

    return {
        scrollLeft: visibleLeft,
        width: Math.max(visibleRight - visibleLeft, 0),
        measured: true,
    };
}

function useIsNearViewport(
    ref: React.RefObject<HTMLElement>,
    scrollContainerRef?: React.RefObject<HTMLElement>,
) {
    const [isNearViewport, setIsNearViewport] = React.useState(false);

    React.useEffect(() => {
        const element = ref.current;
        const root = scrollContainerRef?.current;

        if (!element || typeof IntersectionObserver === 'undefined') {
            setIsNearViewport(true);

            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsNearViewport(Boolean(entry?.isIntersecting));
            },
            {
                root,
                rootMargin: VERTICAL_ROOT_MARGIN,
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref, scrollContainerRef]);

    return isNearViewport;
}

function useVisibleViewport(
    ref: React.RefObject<HTMLElement>,
    scrollContainerRef?: React.RefObject<HTMLElement>,
) {
    const [viewport, setViewport] = React.useState<ViewportState>({
        scrollLeft: 0,
        width: 0,
        measured: false,
    });

    const updateViewport = React.useCallback(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        const nextViewport = getVisibleViewport(element, scrollContainerRef?.current ?? undefined);

        setViewport((currentViewport) =>
            currentViewport.scrollLeft === nextViewport.scrollLeft &&
            currentViewport.width === nextViewport.width &&
            currentViewport.measured === nextViewport.measured
                ? currentViewport
                : nextViewport,
        );
    }, [ref, scrollContainerRef]);

    React.useLayoutEffect(() => {
        const element = ref.current;
        const scrollContainer = scrollContainerRef?.current;

        if (!element) {
            return undefined;
        }

        updateViewport();
        scrollContainer?.addEventListener('scroll', updateViewport, {passive: true});
        window.addEventListener('resize', updateViewport);

        if (typeof ResizeObserver === 'undefined') {
            return () => {
                scrollContainer?.removeEventListener('scroll', updateViewport);
                window.removeEventListener('resize', updateViewport);
            };
        }

        const resizeObserver = new ResizeObserver(updateViewport);
        resizeObserver.observe(element);
        if (scrollContainer) {
            resizeObserver.observe(scrollContainer);
        }

        return () => {
            scrollContainer?.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
            resizeObserver.disconnect();
        };
    }, [ref, scrollContainerRef, updateViewport]);

    return viewport;
}

export function PDisksCompact({
    pDisks = [],
    vDisks = [],
    viewContext,
    pDiskWidth = PDISK_MIN_WIDTH,
    scrollContainerRef,
    inverted,
}: PDisksCompactProps) {
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const [activeDiskKey, setActiveDiskKey] = React.useState<string | undefined>();
    const isNearViewport = useIsNearViewport(viewportRef, scrollContainerRef);
    const viewport = useVisibleViewport(viewportRef, scrollContainerRef);

    const itemStep = pDiskWidth + PDISK_GAP;
    const totalWidth = pDisks.length * pDiskWidth + Math.max(pDisks.length - 1, 0) * PDISK_GAP;
    const {start, end} = getRange({
        scrollLeft: viewport.scrollLeft,
        viewportWidth: viewport.width,
        measured: viewport.measured,
        itemStep,
        count: pDisks.length,
    });
    const renderedPDisks = React.useMemo(
        () => (isNearViewport ? pDisks.slice(start, end + 1) : []),
        [end, isNearViewport, pDisks, start],
    );
    const vDisksByPDiskId = React.useMemo(() => {
        const result = new Map<PreparedPDisk['PDiskId'], PreparedVDisk[]>();

        if (!renderedPDisks.length) {
            return result;
        }

        const renderedPDiskIds = new Set(renderedPDisks.map((pDisk) => pDisk.PDiskId));

        vDisks.forEach((vDisk) => {
            if (!renderedPDiskIds.has(vDisk.PDiskId)) {
                return;
            }

            const relatedVDisks = result.get(vDisk.PDiskId) ?? [];
            relatedVDisks.push(vDisk);
            result.set(vDisk.PDiskId, relatedVDisks);
        });

        return result;
    }, [renderedPDisks, vDisks]);

    if (!pDisks.length) {
        return null;
    }

    return (
        <div ref={viewportRef} className={b('viewport')}>
            <div className={b('content')} style={{width: totalWidth, height: PDISK_HEIGHT}}>
                {renderedPDisks.map((pDisk, index) => {
                    const originalIndex = start + index;
                    const id =
                        pDisk.StringifiedId ?? `${pDisk.NodeId}-${pDisk.PDiskId}-${originalIndex}`;
                    const relatedVDisks = vDisksByPDiskId.get(pDisk.PDiskId);

                    return (
                        <div
                            className={b('pdisks-item')}
                            key={id}
                            style={{left: originalIndex * itemStep, width: pDiskWidth}}
                        >
                            <PDiskSvg
                                data={pDisk}
                                vDisks={relatedVDisks}
                                viewContext={viewContext}
                                width={pDiskWidth}
                                inactive={!isPdiskActive(pDisk, viewContext)}
                                inverted={inverted}
                                activeDiskKey={activeDiskKey}
                                setActiveDiskKey={setActiveDiskKey}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
