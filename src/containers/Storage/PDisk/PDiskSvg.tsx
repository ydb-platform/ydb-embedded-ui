import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import {isNil} from 'lodash';
import debounce from 'lodash/debounce';
import {useHistory} from 'react-router-dom';

import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDiskPopup} from '../../../components/VDiskPopup/VDiskPopup';
import {getPDiskPagePath, useVDiskPagePath} from '../../../routes';
import {cn} from '../../../utils/cn';
import {YDB_POPOVER_CLASS_NAME} from '../../../utils/constants';
import type {PDiskDisplayState} from '../../../utils/disks/displayState';
import {
    getDefaultDiskDisplayState,
    getDefaultPDiskDisplayState,
} from '../../../utils/disks/displayState';
import {getDiskBarTone} from '../../../utils/disks/getDiskBarTone';
import {getPDiskId} from '../../../utils/disks/helpers';
import type {DiskBarTone, PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import {i18n} from './i18n';

import './PDiskSvg.scss';

const b = cn('ydb-pdisk-svg');

const SVG_HEIGHT = 40;
const VDISK_Y = 4;
const VDISK_HEIGHT = 12;
const PDISK_Y = 20;
const PDISK_HEIGHT = 20;
const VDISK_MIN_WIDTH = 8;
const VDISK_GAP = 2;
const STRIPE_WIDTH = 4;
const STRIPE_STEP = 8;
const DISK_RADIUS = 2;
const PDISK_RADIUS = 4;
const SVG_PATTERN_ID_PREFIX = 'pdisk-svg-pattern';
const SVG_CLIP_ID_PREFIX = 'pdisk-svg-clip';
const POPUP_OFFSET: PopupProps['offset'] = {mainAxis: 2, crossAxis: 0};
const POPUP_PLACEMENT: PopupProps['placement'] = ['top', 'bottom', 'left', 'right'];
const openPopupClosers = new Map<string, VoidFunction>();

interface VDiskArea {
    kind: 'vdisk';
    key: string;
    data: PreparedVDisk;
    x: number;
    y: number;
    width: number;
    height: number;
    tone: DiskBarTone;
    striped: boolean;
    inactive: boolean;
}

interface PDiskArea {
    kind: 'pdisk';
    key: string;
    data: PreparedPDisk;
    x: number;
    y: number;
    width: number;
    height: number;
    tone: DiskBarTone;
    inactive: boolean;
    allocatedPercent?: number;
    label?: string;
}

interface VDiskPath {
    key: string;
    path: string;
    tone: DiskBarTone;
    striped: boolean;
    inactive: boolean;
}

type DiskArea = VDiskArea | PDiskArea;

interface PDiskSvgProps {
    data?: PreparedPDisk;
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    width: number;
    inactive?: boolean;
    activeDiskKey?: string;
    setActiveDiskKey: (id?: string) => void;
    inverted?: boolean;
}

function getVDiskKey(vDisk: PreparedVDisk, index: number) {
    return `vdisk:${
        vDisk.StringifiedId ?? `${vDisk.NodeId}-${vDisk.PDiskId}-${vDisk.VDiskSlotId}-${index}`
    }`;
}

function getPDiskKey(pDisk: PreparedPDisk) {
    return `pdisk:${
        pDisk.StringifiedId ??
        getPDiskId({
            nodeId: pDisk.NodeId,
            pDiskId: pDisk.PDiskId,
        }) ??
        'unknown'
    }`;
}

function getVDiskWeight(vDisk: PreparedVDisk) {
    return Number(vDisk.AllocatedSize) || 1;
}

function getToneModifier(tone: DiskBarTone) {
    return tone === 'LightGrey' ? 'light-grey' : tone.toLowerCase();
}

function getPathKey(area: Pick<VDiskArea, 'tone' | 'striped' | 'inactive'>) {
    return `${getToneModifier(area.tone)}-${area.striped ? 'striped' : 'plain'}-${
        area.inactive ? 'inactive' : 'active'
    }`;
}

function appendRectPath(path: string, x: number, y: number, width: number, height: number) {
    if (width <= 0 || height <= 0) {
        return path;
    }

    const radius = Math.min(DISK_RADIUS, width / 2, height / 2);

    return `${path}M${x + radius} ${y}h${width - 2 * radius}a${radius} ${radius} 0 0 1 ${radius} ${radius}v${
        height - 2 * radius
    }a${radius} ${radius} 0 0 1 -${radius} ${radius}h-${width - 2 * radius}a${radius} ${radius} 0 0 1 -${radius} -${radius}v-${
        height - 2 * radius
    }a${radius} ${radius} 0 0 1 ${radius} -${radius}z`;
}

function getVDiskAreas({
    vDisks,
    viewContext,
    width,
}: {
    vDisks: PreparedVDisk[];
    viewContext?: StorageViewContext;
    width: number;
}): VDiskArea[] {
    const gapWidth = Math.max(vDisks.length - 1, 0) * VDISK_GAP;
    const baseWidth = vDisks.length * VDISK_MIN_WIDTH;
    const contentWidth = Math.max(width - gapWidth, baseWidth);
    const growWidth = Math.max(contentWidth - baseWidth, 0);
    const totalWeight = vDisks.reduce((sum, vDisk) => sum + getVDiskWeight(vDisk), 0);
    let usedDiskWidth = 0;

    return vDisks.map((vDisk, index) => {
        const isLast = index === vDisks.length - 1;
        const vDiskWidth = isLast
            ? contentWidth - usedDiskWidth
            : VDISK_MIN_WIDTH + growWidth * (getVDiskWeight(vDisk) / totalWeight);
        const displayState = getDefaultDiskDisplayState(vDisk, vDisk.DonorMode);
        const tone = getDiskBarTone({
            severity: displayState.severity,
            isDonor: vDisk.DonorMode,
        });
        const area: VDiskArea = {
            kind: 'vdisk',
            key: getVDiskKey(vDisk, index),
            data: vDisk,
            x: usedDiskWidth + index * VDISK_GAP,
            y: VDISK_Y,
            width: vDiskWidth,
            height: VDISK_HEIGHT,
            tone,
            striped: displayState.striped,
            inactive: !isVdiskActive(vDisk, viewContext),
        };

        usedDiskWidth += vDiskWidth;

        return area;
    });
}

function getPDiskLabel(displayState: PDiskDisplayState) {
    if (displayState.isLegendInactive) {
        return undefined;
    }

    const allocatedPercent = displayState.allocatedPercent;
    const hasAllocatedPercent = isNumeric(allocatedPercent) && allocatedPercent >= 0;

    if (hasAllocatedPercent && displayState.showAllocatedPercentLabel !== false) {
        return `${Math.floor(allocatedPercent)}%`;
    }

    if (displayState.showNoDataPlaceholder !== false) {
        return i18n('context_no-data');
    }

    return undefined;
}

function getPDiskArea({
    pDisk,
    inactive,
    width,
}: {
    pDisk: PreparedPDisk;
    inactive?: boolean;
    width: number;
}): PDiskArea {
    const displayState = getDefaultPDiskDisplayState(pDisk);

    return {
        kind: 'pdisk',
        key: getPDiskKey(pDisk),
        data: pDisk,
        x: 0,
        y: PDISK_Y,
        width,
        height: PDISK_HEIGHT,
        tone: getDiskBarTone({
            severity: displayState.severity,
        }),
        inactive: Boolean(inactive),
        allocatedPercent: displayState.allocatedPercent,
        label: getPDiskLabel(displayState),
    };
}

function getVDiskPaths(areas: VDiskArea[]) {
    const pathByKey = new Map<string, VDiskPath>();

    areas.forEach((area) => {
        const pathKey = getPathKey(area);
        const current = pathByKey.get(pathKey);
        const nextPath = appendRectPath(
            current?.path ?? '',
            area.x,
            area.y,
            area.width,
            area.height,
        );

        pathByKey.set(pathKey, {
            key: pathKey,
            path: nextPath,
            tone: area.tone,
            striped: area.striped,
            inactive: area.inactive,
        });
    });

    return Array.from(pathByKey.values());
}

function findVDiskArea(areas: VDiskArea[], x: number, y: number) {
    if (y < VDISK_Y || y > VDISK_Y + VDISK_HEIGHT) {
        return undefined;
    }

    let nearestGapArea: VDiskArea | undefined;
    let nearestGapDistance = Number.POSITIVE_INFINITY;

    for (const area of areas) {
        const areaEnd = area.x + area.width;

        if (x >= area.x && x <= areaEnd) {
            return area;
        }

        const distance = x < area.x ? area.x - x : x - areaEnd;
        if (distance < nearestGapDistance) {
            nearestGapArea = area;
            nearestGapDistance = distance;
        }
    }

    return nearestGapDistance <= VDISK_GAP ? nearestGapArea : undefined;
}

function findDiskArea(vDiskAreas: VDiskArea[], pDiskArea: PDiskArea, x: number, y: number) {
    const vDiskArea = findVDiskArea(vDiskAreas, x, y);

    if (vDiskArea) {
        return vDiskArea;
    }

    if (
        x >= pDiskArea.x &&
        x <= pDiskArea.x + pDiskArea.width &&
        y >= pDiskArea.y &&
        y <= pDiskArea.y + pDiskArea.height
    ) {
        return pDiskArea;
    }

    return undefined;
}

function getAreaMods({tone, inactive}: Pick<VDiskArea, 'tone' | 'inactive'>) {
    return {
        [getToneModifier(tone)]: true,
        inactive,
    };
}

function getVDiskMods({tone, striped, inactive}: Pick<VDiskArea, 'tone' | 'striped' | 'inactive'>) {
    return {
        ...getAreaMods({tone, inactive}),
        striped,
    };
}

function getPatternId(prefix: string, key: string) {
    return `${SVG_PATTERN_ID_PREFIX}-${prefix}-${key}`;
}

function getClipId(prefix: string, key: string) {
    return `${SVG_CLIP_ID_PREFIX}-${prefix}-${key}`;
}

function closeOtherPopups(activeInstanceId: string) {
    openPopupClosers.forEach((close, instanceId) => {
        if (instanceId !== activeInstanceId) {
            close();
        }
    });
}

function getAreaFromEvent(
    event: React.MouseEvent<SVGSVGElement>,
    vDiskAreas: VDiskArea[],
    pDiskArea: PDiskArea,
    width: number,
) {
    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) {
        return undefined;
    }

    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * SVG_HEIGHT;

    return findDiskArea(vDiskAreas, pDiskArea, x, y);
}

function containsPoint(
    element: HTMLElement | null,
    point: Pick<MouseEvent | PointerEvent, 'clientX' | 'clientY'>,
) {
    if (!element) {
        return false;
    }

    const rect = element.getBoundingClientRect();

    return (
        point.clientX >= rect.left &&
        point.clientX <= rect.right &&
        point.clientY >= rect.top &&
        point.clientY <= rect.bottom
    );
}

function getPDiskPath(pDisk: PreparedPDisk) {
    const {NodeId, PDiskId} = pDisk;

    return isNil(NodeId) || isNil(PDiskId) ? undefined : getPDiskPagePath(PDiskId, NodeId);
}

function getPDiskFillBounds(area: PDiskArea, inverted?: boolean) {
    const {allocatedPercent} = area;

    if (!isNumeric(allocatedPercent) || allocatedPercent < 0) {
        return undefined;
    }

    const fillWidth = (Math.min(allocatedPercent, 100) / 100) * area.width;

    if (inverted) {
        return {
            x: area.width - fillWidth,
            width: fillWidth,
        };
    }

    return {
        x: area.x,
        width: fillWidth,
    };
}

export function PDiskSvg({
    data = {},
    vDisks = [],
    viewContext,
    width,
    inactive,
    activeDiskKey,
    setActiveDiskKey,
    inverted,
}: PDiskSvgProps) {
    const history = useHistory();
    const getVDiskLink = useVDiskPagePath();
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const popupContentRef = React.useRef<HTMLDivElement>(null);
    const patternIdPrefix = React.useId().replace(/:/g, '');
    const [isPopupPositionReady, setIsPopupPositionReady] = React.useState(false);

    const vDiskAreas = React.useMemo(
        () => getVDiskAreas({vDisks, viewContext, width}),
        [vDisks, viewContext, width],
    );
    const pDiskArea = React.useMemo(
        () => getPDiskArea({pDisk: data, inactive, width}),
        [data, inactive, width],
    );
    const vDiskPaths = React.useMemo(() => getVDiskPaths(vDiskAreas), [vDiskAreas]);
    const activeArea = React.useMemo<DiskArea | undefined>(() => {
        if (!activeDiskKey) {
            return undefined;
        }

        if (pDiskArea.key === activeDiskKey) {
            return pDiskArea;
        }

        return vDiskAreas.find((area) => area.key === activeDiskKey);
    }, [activeDiskKey, pDiskArea, vDiskAreas]);
    const hasActiveArea = Boolean(activeArea);
    const activePath = React.useMemo(() => {
        if (!activeArea) {
            return undefined;
        }

        if (activeArea.kind === 'pdisk') {
            return getPDiskPath(activeArea.data);
        }

        return getVDiskLink({
            nodeId: activeArea.data.NodeId,
            vDiskId: activeArea.data.StringifiedId,
        });
    }, [activeArea, getVDiskLink]);

    const closePopup = React.useCallback(() => {
        setActiveDiskKey(undefined);
    }, [setActiveDiskKey]);

    const debouncedClosePopup = React.useMemo(
        () => debounce(closePopup, DISKS_POPUP_DEBOUNCE_TIMEOUT),
        [closePopup],
    );

    React.useEffect(() => {
        return () => debouncedClosePopup.cancel();
    }, [debouncedClosePopup]);

    React.useEffect(() => {
        if (!hasActiveArea) {
            setIsPopupPositionReady(false);

            return undefined;
        }

        setIsPopupPositionReady(false);

        let firstAnimationFrame = 0;
        let secondAnimationFrame = 0;

        firstAnimationFrame = window.requestAnimationFrame(() => {
            secondAnimationFrame = window.requestAnimationFrame(() => {
                setIsPopupPositionReady(true);
            });
        });

        return () => {
            window.cancelAnimationFrame(firstAnimationFrame);
            window.cancelAnimationFrame(secondAnimationFrame);
        };
    }, [hasActiveArea]);

    React.useEffect(() => {
        if (!activeArea) {
            return undefined;
        }

        openPopupClosers.set(patternIdPrefix, () => {
            debouncedClosePopup.cancel();
            closePopup();
        });

        const handleDocumentPointerMove = (event: PointerEvent) => {
            if (
                containsPoint(anchorRef.current, event) ||
                containsPoint(popupContentRef.current, event)
            ) {
                return;
            }

            debouncedClosePopup();
        };

        document.addEventListener('pointermove', handleDocumentPointerMove);

        return () => {
            openPopupClosers.delete(patternIdPrefix);
            document.removeEventListener('pointermove', handleDocumentPointerMove);
        };
    }, [activeArea, closePopup, debouncedClosePopup, patternIdPrefix]);

    const showAreaPopup = React.useCallback(
        (area?: DiskArea) => {
            if (!area) {
                debouncedClosePopup();

                return;
            }

            debouncedClosePopup.cancel();
            if (area.key === activeDiskKey) {
                return;
            }

            closeOtherPopups(patternIdPrefix);
            setActiveDiskKey(area.key);
        },
        [activeDiskKey, debouncedClosePopup, patternIdPrefix, setActiveDiskKey],
    );

    const handleMouseMove = React.useCallback(
        (event: React.MouseEvent<SVGSVGElement>) => {
            showAreaPopup(getAreaFromEvent(event, vDiskAreas, pDiskArea, width));
        },
        [pDiskArea, showAreaPopup, vDiskAreas, width],
    );

    const handleClick = React.useCallback(
        (event: React.MouseEvent<SVGSVGElement>) => {
            const nextArea = getAreaFromEvent(event, vDiskAreas, pDiskArea, width);

            if (!nextArea) {
                return;
            }

            const nextPath =
                nextArea.kind === 'pdisk'
                    ? getPDiskPath(nextArea.data)
                    : getVDiskLink({
                          nodeId: nextArea.data.NodeId,
                          vDiskId: nextArea.data.StringifiedId,
                      });

            if (nextPath) {
                history.push(nextPath);
            }
        },
        [getVDiskLink, history, pDiskArea, vDiskAreas, width],
    );

    const handleMouseLeave = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (
                containsPoint(anchorRef.current, event.nativeEvent) ||
                containsPoint(popupContentRef.current, event.nativeEvent)
            ) {
                return;
            }

            debouncedClosePopup();
        },
        [debouncedClosePopup],
    );

    const handlePopupMouseEnter = React.useCallback(() => {
        debouncedClosePopup.cancel();
    }, [debouncedClosePopup]);

    const handlePopupMouseLeave = React.useCallback(() => {
        debouncedClosePopup();
    }, [debouncedClosePopup]);

    const handlePopupOpenChange = React.useCallback<NonNullable<PopupProps['onOpenChange']>>(
        (_open, _event, reason) => {
            if (reason === 'escape-key') {
                debouncedClosePopup.cancel();
                closePopup();
            }
        },
        [closePopup, debouncedClosePopup],
    );

    const pDiskMods = {
        ...getAreaMods(pDiskArea),
        highlighted: activeArea?.kind === 'pdisk',
    };
    const popupFloatingStyles = React.useMemo<React.CSSProperties | undefined>(() => {
        return isPopupPositionReady ? undefined : {visibility: 'hidden'};
    }, [isPopupPositionReady]);
    const pDiskFillBounds = getPDiskFillBounds(pDiskArea, inverted);
    const pDiskClipId = getClipId(patternIdPrefix, pDiskArea.key);

    return (
        <div
            className={b({clickable: Boolean(activePath)})}
            style={{width}}
            ref={anchorRef}
            onMouseLeave={handleMouseLeave}
        >
            <svg
                className={b('svg')}
                viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
                width={width}
                height={SVG_HEIGHT}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            >
                <defs>
                    <clipPath id={pDiskClipId}>
                        <rect
                            x={pDiskArea.x}
                            y={pDiskArea.y}
                            width={pDiskArea.width}
                            height={pDiskArea.height}
                            rx={PDISK_RADIUS}
                        />
                    </clipPath>
                    {vDiskPaths
                        .filter((path) => path.striped)
                        .map((path) => {
                            const mods = getVDiskMods(path);
                            const patternId = getPatternId(patternIdPrefix, path.key);

                            return (
                                <pattern
                                    id={patternId}
                                    key={patternId}
                                    patternUnits="userSpaceOnUse"
                                    width={STRIPE_STEP}
                                    height={STRIPE_STEP}
                                    patternTransform="rotate(135)"
                                >
                                    <rect
                                        className={b('pattern-background', mods)}
                                        width={STRIPE_STEP}
                                        height={STRIPE_STEP}
                                    />
                                    <rect
                                        className={b('pattern-stripe', mods)}
                                        width={STRIPE_WIDTH}
                                        height={STRIPE_STEP}
                                    />
                                </pattern>
                            );
                        })}
                </defs>
                {vDiskPaths.map((path) => {
                    const mods = getVDiskMods(path);
                    const fill = path.striped
                        ? `url(#${getPatternId(patternIdPrefix, path.key)})`
                        : undefined;

                    return (
                        <path
                            key={path.key}
                            className={b('vdisk', mods)}
                            d={path.path}
                            fill={fill}
                        />
                    );
                })}
                {activeArea?.kind === 'vdisk' ? (
                    <path
                        className={b('vdisk', {...getVDiskMods(activeArea), highlighted: true})}
                        d={appendRectPath(
                            '',
                            activeArea.x,
                            activeArea.y,
                            activeArea.width,
                            activeArea.height,
                        )}
                    />
                ) : null}
                <g className={b('pdisk', pDiskMods)}>
                    <rect
                        className={b('pdisk-background')}
                        x={pDiskArea.x}
                        y={pDiskArea.y}
                        width={pDiskArea.width}
                        height={pDiskArea.height}
                        rx={PDISK_RADIUS}
                    />
                    {pDiskFillBounds ? (
                        <rect
                            className={b('pdisk-fill')}
                            x={pDiskFillBounds.x}
                            y={pDiskArea.y}
                            width={pDiskFillBounds.width}
                            height={pDiskArea.height}
                            clipPath={`url(#${pDiskClipId})`}
                        />
                    ) : null}
                    <rect
                        className={b('pdisk-border')}
                        x={pDiskArea.x + 0.5}
                        y={pDiskArea.y + 0.5}
                        width={pDiskArea.width - 1}
                        height={pDiskArea.height - 1}
                        rx={PDISK_RADIUS}
                    />
                    {pDiskArea.label ? (
                        <text
                            className={b('pdisk-label')}
                            x={pDiskArea.width - 4}
                            y={pDiskArea.y + pDiskArea.height / 2}
                            dominantBaseline="central"
                            textAnchor="end"
                        >
                            {pDiskArea.label}
                        </text>
                    ) : null}
                </g>
            </svg>
            {activeArea && anchorRef.current ? (
                <Popup
                    anchorElement={anchorRef.current}
                    open
                    hasArrow
                    returnFocus={false}
                    offset={POPUP_OFFSET}
                    placement={POPUP_PLACEMENT}
                    floatingStyles={popupFloatingStyles}
                    onOpenChange={handlePopupOpenChange}
                >
                    <div
                        ref={popupContentRef}
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handlePopupMouseLeave}
                    >
                        <div className={YDB_POPOVER_CLASS_NAME}>
                            {activeArea.kind === 'pdisk' ? (
                                <PDiskPopup data={activeArea.data} />
                            ) : (
                                <VDiskPopup data={activeArea.data} onClose={closePopup} />
                            )}
                        </div>
                    </div>
                </Popup>
            ) : null}
        </div>
    );
}
