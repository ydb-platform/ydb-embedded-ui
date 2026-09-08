import React from 'react';

import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDiskPopup} from '../../../components/VDiskPopup/VDiskPopup';
import {cn} from '../../../utils/cn';
import {
    getDefaultDiskDisplayState,
    getDefaultPDiskDisplayState,
} from '../../../utils/disks/displayState';
import {getDiskBarTone} from '../../../utils/disks/getDiskBarTone';
import type {DiskColor, PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';
import {isPdiskActive, isVdiskActive} from '../utils';

import './PDisksCompact.scss';

const b = cn('ydb-storage-pdisks-compact');

const PDISK_MIN_WIDTH = 165;
const PDISK_GAP = 10;
const PDISK_HEIGHT = 20;
const PDISK_Y = 20;
const VDISK_HEIGHT = 12;
const VDISK_MIN_WIDTH = 8;
const VDISK_GAP = 2;
const SVG_HEIGHT = 40;

type DiskColorModifier = Lowercase<DiskColor>;
type HitArea =
    | {
          type: 'pdisk';
          data: PreparedPDisk;
          x: number;
          y: number;
          width: number;
          height: number;
      }
    | {
          type: 'vdisk';
          data: PreparedVDisk;
          x: number;
          y: number;
          width: number;
          height: number;
      };

interface PDisksCompactProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
}

function appendRect(path: string, x: number, y: number, width: number, height: number) {
    if (width <= 0 || height <= 0) {
        return path;
    }

    return `${path}M${x} ${y}h${width}v${height}h-${width}z`;
}

function getColorModifier(severity?: number): DiskColorModifier {
    return getDiskBarTone({severity}).toLocaleLowerCase() as DiskColorModifier;
}

function addPath(
    paths: Map<string, string>,
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
) {
    paths.set(key, appendRect(paths.get(key) ?? '', x, y, width, height));
}

function getVDiskWidth(vDisk: PreparedVDisk, totalAllocatedSize: number, availableWidth: number) {
    const allocatedSize = Number(vDisk.AllocatedSize) || 0;

    if (!totalAllocatedSize) {
        return VDISK_MIN_WIDTH;
    }

    return Math.max((allocatedSize / totalAllocatedSize) * availableWidth, VDISK_MIN_WIDTH);
}

function buildCompactPaths({
    pDisks,
    vDisks,
    viewContext,
    pDiskWidth,
}: {
    pDisks: PreparedPDisk[];
    vDisks: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth: number;
}) {
    const pDiskBackgroundPaths = new Map<string, string>();
    const pDiskFillPaths = new Map<string, string>();
    const vDiskPaths = new Map<string, string>();
    const hitAreas: HitArea[] = [];
    const vDisksByPDiskId = new Map<PreparedPDisk['PDiskId'], PreparedVDisk[]>();

    vDisks.forEach((vDisk) => {
        const relatedVDisks = vDisksByPDiskId.get(vDisk.PDiskId) ?? [];
        relatedVDisks.push(vDisk);
        vDisksByPDiskId.set(vDisk.PDiskId, relatedVDisks);
    });

    pDisks.forEach((pDisk, index) => {
        const x = index * (pDiskWidth + PDISK_GAP);
        const pDiskDisplayState = getDefaultPDiskDisplayState(pDisk);
        const pDiskInactive = !isPdiskActive(pDisk, viewContext);
        const pDiskColor = getColorModifier(pDiskDisplayState.severity);
        const pDiskKey = pDiskInactive ? `${pDiskColor}-inactive` : pDiskColor;
        const allocatedPercent = Number(pDiskDisplayState.allocatedPercent);
        const fillWidth =
            Number.isFinite(allocatedPercent) && allocatedPercent >= 0
                ? (Math.min(allocatedPercent, 100) / 100) * pDiskWidth
                : 0;

        addPath(pDiskBackgroundPaths, pDiskKey, x, PDISK_Y, pDiskWidth, PDISK_HEIGHT);
        addPath(pDiskFillPaths, pDiskKey, x, PDISK_Y, fillWidth, PDISK_HEIGHT);
        hitAreas.push({
            type: 'pdisk',
            data: pDisk,
            x,
            y: PDISK_Y,
            width: pDiskWidth,
            height: PDISK_HEIGHT,
        });

        const relatedVDisks = vDisksByPDiskId.get(pDisk.PDiskId) ?? [];
        const totalGap = Math.max(relatedVDisks.length - 1, 0) * VDISK_GAP;
        const availableWidth = Math.max(pDiskWidth - totalGap, VDISK_MIN_WIDTH);
        const totalAllocatedSize = relatedVDisks.reduce(
            (sum, vDisk) => sum + (Number(vDisk.AllocatedSize) || 0),
            0,
        );
        let vDiskX = x;

        relatedVDisks.forEach((vDisk) => {
            const vDiskWidth = getVDiskWidth(vDisk, totalAllocatedSize, availableWidth);
            const displayState = getDefaultDiskDisplayState(vDisk, vDisk.DonorMode);
            const color = getColorModifier(displayState.severity);
            const inactive = !isVdiskActive(vDisk, viewContext);
            const key = inactive ? `${color}-inactive` : color;
            const width = Math.min(vDiskWidth, Math.max(x + pDiskWidth - vDiskX, 0));

            addPath(vDiskPaths, key, vDiskX, 0, width, VDISK_HEIGHT);
            hitAreas.push({
                type: 'vdisk',
                data: vDisk,
                x: vDiskX,
                y: 0,
                width,
                height: VDISK_HEIGHT,
            });
            vDiskX += vDiskWidth + VDISK_GAP;
        });
    });

    return {pDiskBackgroundPaths, pDiskFillPaths, vDiskPaths, hitAreas};
}

function getPathMods(key: string) {
    const [color, inactive] = key.split('-');

    return {
        [color]: true,
        inactive: inactive === 'inactive',
    };
}

function findHitArea(hitAreas: HitArea[], x: number, y: number) {
    return hitAreas.find(
        (area) =>
            x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height,
    );
}

export function PDisksCompact({
    pDisks = [],
    vDisks = [],
    viewContext,
    pDiskWidth = PDISK_MIN_WIDTH,
}: PDisksCompactProps) {
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [activeArea, setActiveArea] = React.useState<HitArea | undefined>();

    const {pDiskBackgroundPaths, pDiskFillPaths, vDiskPaths, hitAreas} = React.useMemo(
        () => buildCompactPaths({pDisks, vDisks, viewContext, pDiskWidth}),
        [pDisks, pDiskWidth, vDisks, viewContext],
    );

    if (!pDisks.length) {
        return null;
    }

    const width = pDisks.length * pDiskWidth + Math.max(pDisks.length - 1, 0) * PDISK_GAP;

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * width;
        const y = ((event.clientY - rect.top) / rect.height) * SVG_HEIGHT;
        const nextActiveArea = findHitArea(hitAreas, x, y);

        setActiveArea((currentActiveArea) =>
            currentActiveArea === nextActiveArea ? currentActiveArea : nextActiveArea,
        );
    };

    const renderPopupContent = ({onClose}: {onClose: VoidFunction}) => {
        if (activeArea?.type === 'pdisk') {
            return <PDiskPopup data={activeArea.data} />;
        }

        if (activeArea?.type === 'vdisk') {
            return <VDiskPopup data={activeArea.data} onClose={onClose} />;
        }

        return null;
    };

    return (
        <HoverPopup
            anchorRef={anchorRef}
            renderPopupContent={renderPopupContent}
            delayOpen={0}
            delayClose={100}
        >
            <div ref={anchorRef} className={b('anchor')}>
                <svg
                    className={b()}
                    width={width}
                    height={SVG_HEIGHT}
                    viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
                    role="img"
                    aria-label={`${pDisks.length} PDisks, ${vDisks.length} VDisks`}
                    onMouseMove={handleMouseMove}
                >
                    {[...vDiskPaths].map(([key, path]) => (
                        <path
                            key={`vdisk-${key}`}
                            d={path}
                            className={b('vdisk', getPathMods(key))}
                        />
                    ))}
                    {[...pDiskBackgroundPaths].map(([key, path]) => (
                        <path
                            key={`pdisk-background-${key}`}
                            d={path}
                            className={b('pdisk-background', getPathMods(key))}
                        />
                    ))}
                    {[...pDiskFillPaths].map(([key, path]) => (
                        <path
                            key={`pdisk-fill-${key}`}
                            d={path}
                            className={b('pdisk-fill', getPathMods(key))}
                        />
                    ))}
                </svg>
            </div>
        </HoverPopup>
    );
}
