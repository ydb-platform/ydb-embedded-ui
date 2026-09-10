import React from 'react';

import {cn} from '../../../utils/cn';
import {
    getDefaultDiskDisplayState,
    getDefaultPDiskDisplayState,
} from '../../../utils/disks/displayState';
import {getDiskBarTone} from '../../../utils/disks/getDiskBarTone';
import type {DiskBarTone, PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';
import {PDisk} from '../PDisk';
import type {StorageViewContext} from '../types';
import {isPdiskActive, isVdiskActive} from '../utils';

import {i18n} from './i18n';

import './PDisksPreview.scss';

const b = cn('ydb-storage-pdisks-preview');

const PDISKS_GAP = 2.5;
const ACTIVE_PDISK_INLINE_PADDING = PDISKS_GAP * 2;
const PDISK_MIN_WIDTH = 165;
const VDISK_SIZE = 6;
const VDISK_RADIUS = 0;
const VDISK_GAP = 1;
const VDISK_COLUMN_GAP = 1;
const PDISK_WIDTH = VDISK_SIZE;
const PDISK_HEIGHT = VDISK_SIZE * 6 + VDISK_GAP * 5;
const SUMMARY_HEIGHT = PDISK_HEIGHT;
const PDISK_X = 0;
const PDISK_Y = SUMMARY_HEIGHT - PDISK_HEIGHT;
const VDISK_X = PDISK_X + PDISK_WIDTH + VDISK_COLUMN_GAP;
const GRID_STEP = VDISK_SIZE + VDISK_GAP;
const VDISKS_WITHOUT_PDISK_COLUMN = Math.floor((SUMMARY_HEIGHT + VDISK_GAP) / GRID_STEP);
const MAX_SEGMENTS = 10;

interface PDisksPreviewProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
}

interface PDiskPreviewSvgProps {
    pDisk: PreparedPDisk;
    vDisks: PreparedVDisk[];
    viewContext?: StorageViewContext;
    width: number;
}

interface PDiskPreviewItemProps extends PDiskPreviewSvgProps {
    id: string;
    detailsOpened: boolean;
    expandedWidth: number;
    highlightedDisk?: string;
    onOpenDetails: VoidFunction;
    onCloseDetails: VoidFunction;
    setHighlightedDisk: (id?: string) => void;
}

interface VDiskRect {
    key: string;
    x: number;
    y: number;
    tone: DiskBarTone;
    inactive: boolean;
}

function getFilledSize(percent: unknown, size: number) {
    const numericPercent = Number(percent);

    if (!isNumeric(percent) || numericPercent < 0) {
        return 0;
    }

    return Math.ceil((Math.min(numericPercent, 100) / 100) * MAX_SEGMENTS) * (size / MAX_SEGMENTS);
}

function getToneModifier(tone: DiskBarTone) {
    return tone === 'LightGrey' ? 'light-grey' : tone.toLowerCase();
}

function getBarMods(tone: DiskBarTone, inactive: boolean) {
    return {
        [getToneModifier(tone)]: true,
        inactive,
    };
}

function getPDiskKey(pDisk: PreparedPDisk, index: number) {
    return pDisk.StringifiedId ?? `${pDisk.NodeId}-${pDisk.PDiskId}-${index}`;
}

function getVDiskRects(vDisks: PreparedVDisk[], viewContext?: StorageViewContext) {
    return vDisks.map((vDisk, vDiskIndex): VDiskRect => {
        const column = Math.floor(vDiskIndex / VDISKS_WITHOUT_PDISK_COLUMN);
        const row = vDiskIndex % VDISKS_WITHOUT_PDISK_COLUMN;
        const displayState = getDefaultDiskDisplayState(vDisk, vDisk.DonorMode);
        const tone = getDiskBarTone({
            severity: displayState.severity,
            isDonor: vDisk.DonorMode,
        });
        const vDiskKey =
            vDisk.StringifiedId ??
            `${vDisk.NodeId}-${vDisk.PDiskId}-${vDisk.VDiskSlotId}-${vDiskIndex}`;

        return {
            key: vDiskKey,
            x: VDISK_X + column * (VDISK_SIZE + VDISK_COLUMN_GAP),
            y: row * (VDISK_SIZE + VDISK_GAP),
            tone,
            inactive: !isVdiskActive(vDisk, viewContext),
        };
    });
}

function getColumnsWidth(columnsCount: number) {
    if (columnsCount === 0) {
        return 0;
    }

    return columnsCount * VDISK_SIZE + (columnsCount - 1) * VDISK_COLUMN_GAP;
}

function getSummaryWidth(vDisksCount: number) {
    const vDisksColumnsCount = Math.ceil(vDisksCount / VDISKS_WITHOUT_PDISK_COLUMN);
    const vDisksWidth = getColumnsWidth(vDisksColumnsCount);
    const gapWidth = vDisksWidth > 0 ? VDISK_COLUMN_GAP : 0;

    return PDISK_WIDTH + gapWidth + vDisksWidth;
}

function PDiskPreviewSvg({pDisk, vDisks, viewContext, width}: PDiskPreviewSvgProps) {
    const pDiskDisplayState = getDefaultPDiskDisplayState(pDisk);
    const pDiskTone = getDiskBarTone({severity: pDiskDisplayState.severity});
    const pDiskFilledHeight = getFilledSize(pDiskDisplayState.allocatedPercent, PDISK_HEIGHT);
    const pDiskFillY = PDISK_Y + PDISK_HEIGHT - pDiskFilledHeight;
    const vDiskRects = React.useMemo(
        () => getVDiskRects(vDisks, viewContext),
        [vDisks, viewContext],
    );

    return (
        <svg
            className={b('svg')}
            viewBox={`0 0 ${width} ${SUMMARY_HEIGHT}`}
            width={width}
            height={SUMMARY_HEIGHT}
            aria-hidden
        >
            <rect
                className={b(
                    'pdisk-background',
                    getBarMods(pDiskTone, !isPdiskActive(pDisk, viewContext)),
                )}
                x={PDISK_X}
                y={PDISK_Y}
                width={PDISK_WIDTH}
                height={PDISK_HEIGHT}
            />
            <rect
                className={b(
                    'pdisk-fill',
                    getBarMods(pDiskTone, !isPdiskActive(pDisk, viewContext)),
                )}
                x={PDISK_X}
                y={pDiskFillY}
                width={PDISK_WIDTH}
                height={pDiskFilledHeight}
            />
            {vDiskRects.map((vDisk) => (
                <rect
                    key={vDisk.key}
                    className={b('vdisk-fill', getBarMods(vDisk.tone, vDisk.inactive))}
                    x={vDisk.x}
                    y={vDisk.y}
                    width={VDISK_SIZE}
                    height={VDISK_SIZE}
                    rx={VDISK_RADIUS}
                />
            ))}
        </svg>
    );
}

function PDiskPreviewItem({
    id,
    pDisk,
    vDisks,
    viewContext,
    width,
    detailsOpened,
    expandedWidth,
    highlightedDisk,
    onOpenDetails,
    onCloseDetails,
    setHighlightedDisk,
}: PDiskPreviewItemProps) {
    const openDetails = React.useCallback(() => {
        onOpenDetails();
        setHighlightedDisk(id);
    }, [id, onOpenDetails, setHighlightedDisk]);

    const closeDetails = React.useCallback(() => {
        onCloseDetails();
        setHighlightedDisk(undefined);
    }, [onCloseDetails, setHighlightedDisk]);

    const handleOpenedDetailsClick = React.useCallback(
        (event: React.MouseEvent) => {
            if (!event.currentTarget.contains(event.target as Node)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            closeDetails();
        },
        [closeDetails],
    );

    return (
        <div
            className={b('item', {active: detailsOpened, compact: !detailsOpened})}
            style={{
                width: detailsOpened ? expandedWidth + ACTIVE_PDISK_INLINE_PADDING * 2 : width,
                paddingInline: detailsOpened ? ACTIVE_PDISK_INLINE_PADDING : undefined,
            }}
            onClickCapture={detailsOpened ? handleOpenedDetailsClick : undefined}
        >
            {detailsOpened ? (
                <PDisk
                    data={pDisk}
                    inactive={!isPdiskActive(pDisk, viewContext)}
                    vDisks={vDisks}
                    viewContext={viewContext}
                    width={expandedWidth}
                    showPopup={highlightedDisk === id}
                    onShowPopup={() => setHighlightedDisk(id)}
                    onHidePopup={() => setHighlightedDisk(undefined)}
                    highlighted={highlightedDisk === id}
                    highlightedDisk={highlightedDisk}
                    setHighlightedDisk={setHighlightedDisk}
                />
            ) : (
                <button
                    type="button"
                    className={b('control')}
                    onClick={(event) => {
                        event.stopPropagation();
                        openDetails();
                    }}
                    aria-label={i18n('action_show-pdisks-details')}
                >
                    <PDiskPreviewSvg
                        pDisk={pDisk}
                        vDisks={vDisks}
                        viewContext={viewContext}
                        width={width}
                    />
                </button>
            )}
        </div>
    );
}

export function PDisksPreview({
    pDisks = [],
    vDisks = [],
    viewContext,
    pDiskWidth = PDISK_MIN_WIDTH,
}: PDisksPreviewProps) {
    const [openedDetailsPDisks, setOpenedDetailsPDisks] = React.useState<Set<string>>(
        () => new Set(),
    );
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b()} style={{gap: PDISKS_GAP}}>
            {pDisks.map((pDisk, index) => {
                const id = getPDiskKey(pDisk, index);
                const relatedVDisks = vDisks.filter((vDisk) => vDisk.PDiskId === pDisk.PDiskId);
                const width = getSummaryWidth(relatedVDisks.length);

                return (
                    <PDiskPreviewItem
                        key={id}
                        id={id}
                        pDisk={pDisk}
                        vDisks={relatedVDisks}
                        viewContext={viewContext}
                        width={width}
                        expandedWidth={pDiskWidth}
                        detailsOpened={openedDetailsPDisks.has(id)}
                        highlightedDisk={highlightedDisk}
                        onOpenDetails={() => {
                            setOpenedDetailsPDisks((current) => new Set(current).add(id));
                        }}
                        onCloseDetails={() => {
                            setOpenedDetailsPDisks((current) => {
                                const next = new Set(current);

                                next.delete(id);

                                return next;
                            });
                        }}
                        setHighlightedDisk={setHighlightedDisk}
                    />
                );
            })}
        </div>
    );
}
