import React from 'react';

import {Button, Flex} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {cn} from '../../../utils/cn';
import {DONOR_COLOR} from '../../../utils/disks/constants';
import {getDataSeverityColor} from '../../../utils/disks/helpers';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {useSetting} from '../../../utils/hooks/useSetting';
import {isNumeric} from '../../../utils/utils';
import {PDisk} from '../PDisk';
import type {StorageNodesPaginatedTableData, StorageViewContext} from '../types';
import {isPdiskActive, isVdiskActive} from '../utils';

import {i18n} from './i18n';

import './PDisksPreview.scss';

const b = cn('ydb-storage-pdisks-preview');

const PDISK_MIN_WIDTH = 165;
const VDISK_SIZE = 6;
const VDISK_GAP = 1;
const VDISK_COLUMN_GAP = 1;
const PDISK_WIDTH = VDISK_SIZE;
const PDISK_HEIGHT = VDISK_SIZE * 6 + VDISK_GAP * 5;
const SUMMARY_HEIGHT = PDISK_HEIGHT;
// Match the existing PDisks container: 40px content + 10px cell padding + 1px border.
// The 41px SVG/button intentionally extends into the cell padding without enlarging the row.
const DISKS_CONTAINER_HEIGHT = 40;
const PDISK_X = 0;
const PDISK_Y = SUMMARY_HEIGHT - PDISK_HEIGHT;
const VDISK_X = PDISK_X + PDISK_WIDTH + VDISK_COLUMN_GAP;
const GRID_STEP = VDISK_SIZE + VDISK_GAP;
const VDISKS_WITHOUT_PDISK_COLUMN = Math.floor((SUMMARY_HEIGHT + VDISK_GAP) / GRID_STEP);

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
    highlighted?: boolean;
    inverted?: boolean;
}

interface PDiskPreviewItemProps extends PDiskPreviewSvgProps {
    id: string;
    expandedWidth: number;
    highlightedDisk?: string;
    setHighlightedDisk: React.Dispatch<React.SetStateAction<string | undefined>>;
}

// The preview uses ordinary prepared-data severity, independently of Expert mode display states.
type PreviewTone = ReturnType<typeof getDataSeverityColor> | typeof DONOR_COLOR;

interface VDiskPath {
    key: string;
    path: string;
    tone: PreviewTone;
    inactive: boolean;
}

function getFilledSize(percent: unknown, size: number, inverted = false) {
    const numericPercent = Number(percent);

    if (!isNumeric(percent) || numericPercent < 0) {
        return 0;
    }

    const filledPercent = inverted
        ? Math.max(100 - numericPercent, 0)
        : Math.min(numericPercent, 100);

    return (filledPercent / 100) * size;
}

function getBarClassName(element: string, tone: PreviewTone, highlighted?: boolean) {
    return b('color', {[tone.toLowerCase()]: true, highlighted}, b(element));
}

function getPDiskKey(pDisk: PreparedPDisk, index: number) {
    return pDisk.StringifiedId ?? `${pDisk.NodeId}-${pDisk.PDiskId}-${index}`;
}

function getVDiskPaths(vDisks: PreparedVDisk[], viewContext?: StorageViewContext) {
    const paths = new Map<string, VDiskPath>();

    vDisks.forEach((vDisk, index) => {
        const column = Math.floor(index / VDISKS_WITHOUT_PDISK_COLUMN);
        const row = index % VDISKS_WITHOUT_PDISK_COLUMN;
        const x = VDISK_X + column * (VDISK_SIZE + VDISK_COLUMN_GAP);
        const y = row * (VDISK_SIZE + VDISK_GAP);
        const tone = vDisk.DonorMode ? DONOR_COLOR : getDataSeverityColor(vDisk.Severity);
        const inactive = !isVdiskActive(vDisk, viewContext);
        const key = `${tone}-${inactive}`;
        const rectPath = `M${x} ${y}h${VDISK_SIZE}v${VDISK_SIZE}h-${VDISK_SIZE}z`;
        const existing = paths.get(key);

        if (existing) {
            existing.path += rectPath;
        } else {
            paths.set(key, {key, path: rectPath, tone, inactive});
        }
    });

    return Array.from(paths.values());
}

function getSummaryWidth(vDisksCount: number) {
    const columns = Math.ceil(vDisksCount / VDISKS_WITHOUT_PDISK_COLUMN);

    return PDISK_WIDTH + columns * (VDISK_SIZE + VDISK_COLUMN_GAP);
}

export function getPDisksPreviewColumnWidth({
    PDisks = [],
    VDisks = [],
}: Pick<StorageNodesPaginatedTableData['data'][number], 'PDisks' | 'VDisks'>) {
    if (!PDisks.length) {
        return 0;
    }
    const slotsPerDisk = new Map<PreparedVDisk['PDiskId'], number>();
    for (const disk of VDisks) {
        slotsPerDisk.set(disk.PDiskId, (slotsPerDisk.get(disk.PDiskId) ?? 0) + 1);
    }
    // Each preview contains only its actual slots, not the cluster-wide maximum.
    const disksWidth = PDisks.reduce(
        (width, disk) => width + getSummaryWidth(slotsPerDisk.get(disk.PDiskId) ?? 0),
        0,
    );
    return disksWidth + (PDisks.length - 1) * 2 + 20;
}

function PDiskPreviewSvg({
    pDisk,
    vDisks,
    viewContext,
    width,
    highlighted,
    inverted,
}: PDiskPreviewSvgProps) {
    const pDiskTone = getDataSeverityColor(pDisk.Severity);
    const pDiskFilledHeight = getFilledSize(pDisk.AllocatedPercent, PDISK_HEIGHT, inverted);
    const pDiskFillY = inverted ? PDISK_Y : PDISK_Y + PDISK_HEIGHT - pDiskFilledHeight;
    const vDiskPaths = React.useMemo(
        () => getVDiskPaths(vDisks, viewContext),
        [vDisks, viewContext],
    );

    const pDiskBars = (
        <React.Fragment>
            <rect
                className={getBarClassName('pdisk-background', pDiskTone, highlighted)}
                x={PDISK_X}
                y={PDISK_Y}
                width={PDISK_WIDTH}
                height={PDISK_HEIGHT}
            />
            <rect
                className={getBarClassName('pdisk-fill', pDiskTone, highlighted)}
                x={PDISK_X}
                y={pDiskFillY}
                width={PDISK_WIDTH}
                height={pDiskFilledHeight}
            />
            <rect
                className={getBarClassName('pdisk-border', pDiskTone, highlighted)}
                x={PDISK_X + 0.5}
                y={PDISK_Y + 0.5}
                width={PDISK_WIDTH - 1}
                height={PDISK_HEIGHT - 1}
            />
        </React.Fragment>
    );

    return (
        <svg
            className={b('svg')}
            viewBox={`0 0 ${width} ${SUMMARY_HEIGHT}`}
            width={width}
            height={SUMMARY_HEIGHT}
            aria-hidden
        >
            {isPdiskActive(pDisk, viewContext) ? pDiskBars : <g opacity={0.5}>{pDiskBars}</g>}
            {vDiskPaths.map((vDisk) => {
                // Match the detail control's translucent fill over its background.
                const bars = (
                    <React.Fragment>
                        <path
                            className={getBarClassName('vdisk-background', vDisk.tone, highlighted)}
                            d={vDisk.path}
                        />
                        <path
                            className={getBarClassName('vdisk-fill', vDisk.tone, highlighted)}
                            d={vDisk.path}
                            // Clip the stroke inward to keep the square size and gaps unchanged.
                            style={{clipPath: `path("${vDisk.path}") view-box`}}
                        />
                    </React.Fragment>
                );

                return vDisk.inactive ? (
                    <g key={vDisk.key} opacity={0.5}>
                        {bars}
                    </g>
                ) : (
                    <React.Fragment key={vDisk.key}>{bars}</React.Fragment>
                );
            })}
        </svg>
    );
}

function PDiskPreviewItem({
    id,
    pDisk,
    vDisks,
    viewContext,
    width,
    expandedWidth,
    inverted,
    highlightedDisk,
    setHighlightedDisk,
}: PDiskPreviewItemProps) {
    const [detailsOpened, setDetailsOpened] = React.useState(false);
    const [previewHovered, setPreviewHovered] = React.useState(false);
    const [previewFocused, setPreviewFocused] = React.useState(false);
    const diskLinkRef = React.useRef<HTMLAnchorElement>(null);
    const previewRef = React.useRef<HTMLButtonElement>(null);
    const transferFocusRef = React.useRef(false);

    React.useLayoutEffect(() => {
        if (!transferFocusRef.current) {
            return;
        }
        transferFocusRef.current = false;
        // Transfer keyboard focus after React replaces the activated control.
        const target = detailsOpened ? diskLinkRef.current : previewRef.current;
        target?.focus({preventScroll: true});
    }, [detailsOpened]);

    const clearOwnHighlight = React.useCallback(() => {
        setHighlightedDisk((current) =>
            current === id || vDisks.some((disk) => disk.StringifiedId === current)
                ? undefined
                : current,
        );
    }, [id, vDisks, setHighlightedDisk]);
    const detailsVersionRef = React.useRef(0);
    const detailsVersion = detailsVersionRef.current;
    const setDetailsHighlightedDisk = React.useCallback(
        (diskId?: string) => {
            if (detailsVersionRef.current === detailsVersion) {
                if (diskId === undefined) {
                    clearOwnHighlight();
                } else {
                    setHighlightedDisk(diskId);
                }
            }
        },
        [detailsVersion, setHighlightedDisk, clearOwnHighlight],
    );

    const closeDetails = React.useCallback(() => {
        // Ignore delayed popup callbacks from this expansion, even after reopening it.
        detailsVersionRef.current += 1;
        setPreviewHovered(false);
        setPreviewFocused(false);
        setDetailsOpened(false);
        clearOwnHighlight();
    }, [clearOwnHighlight]);

    const handleOpenedDetailsClick = React.useCallback(
        (event: React.MouseEvent<unknown>) => {
            if (
                event.detail === 0 ||
                !(event.currentTarget instanceof Node) ||
                !event.currentTarget.contains(event.target as Node)
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            transferFocusRef.current = false;
            closeDetails();
        },
        [closeDetails],
    );

    const handleOpenedDetailsKeyDown = (event: React.KeyboardEvent<unknown>) => {
        // Portalled popup controls handle their own Escape without collapsing the disk.
        if (
            event.key !== 'Escape' ||
            !(event.currentTarget instanceof Node) ||
            !event.currentTarget.contains(event.target as Node)
        ) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        transferFocusRef.current = true;
        closeDetails();
    };

    if (!detailsOpened) {
        return (
            <Button
                view="flat"
                className={b('control')}
                ref={previewRef}
                onMouseEnter={() => setPreviewHovered(true)}
                onMouseLeave={() => setPreviewHovered(false)}
                onFocus={() => setPreviewFocused(true)}
                onBlur={() => setPreviewFocused(false)}
                onClick={(event) => {
                    event.stopPropagation();
                    transferFocusRef.current = event.detail === 0;
                    setDetailsOpened(true);
                }}
                aria-label={i18n('action_show-pdisks-details', {id})}
            >
                <PDiskPreviewSvg
                    pDisk={pDisk}
                    vDisks={vDisks}
                    viewContext={viewContext}
                    width={width}
                    highlighted={previewHovered || previewFocused}
                    inverted={inverted}
                />
            </Button>
        );
    }

    return (
        <Flex
            alignItems="center"
            shrink={0}
            height={SUMMARY_HEIGHT}
            spacing={{px: 1}}
            onClickCapture={handleOpenedDetailsClick}
            onKeyDown={handleOpenedDetailsKeyDown}
        >
            <PDisk
                linkRef={diskLinkRef}
                data={pDisk}
                inactive={!isPdiskActive(pDisk, viewContext)}
                vDisks={vDisks}
                viewContext={viewContext}
                width={expandedWidth}
                showPopup={highlightedDisk === id}
                onShowPopup={() => setDetailsHighlightedDisk(id)}
                onHidePopup={() => setDetailsHighlightedDisk(undefined)}
                highlighted={highlightedDisk === id}
                highlightedDisk={highlightedDisk}
                setHighlightedDisk={setDetailsHighlightedDisk}
            />
        </Flex>
    );
}

export function PDisksPreview({
    pDisks = [],
    vDisks = [],
    viewContext,
    pDiskWidth = PDISK_MIN_WIDTH,
}: PDisksPreviewProps) {
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();
    const [inverted] = useSetting<boolean>(SETTING_KEYS.INVERTED_DISKS);

    if (!pDisks.length) {
        return null;
    }

    return (
        <Flex className={b()} alignItems="center" gap={0.5} height={DISKS_CONTAINER_HEIGHT}>
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
                        inverted={inverted}
                        highlightedDisk={highlightedDisk}
                        setHighlightedDisk={setHighlightedDisk}
                    />
                );
            })}
        </Flex>
    );
}
