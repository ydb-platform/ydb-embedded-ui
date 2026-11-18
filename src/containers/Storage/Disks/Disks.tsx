import React from 'react';

import {Flex, useLayoutContext} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {
    PDiskDisplayStateGetter,
    VDiskDisplayStateGetter,
} from '../../../utils/disks/displayState';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {useStoragePDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';
import {useStorageVDiskDisplayStateGetter} from '../useStorageVDiskDisplayStateGetter';
import {isPdiskActive, isVdiskActive, useVDisksWithDCMargins} from '../utils';
import {useVirtualizedDiskList} from '../utils/useVirtualizedDiskList';

import {calculateCompactVDiskWidths} from './calculateCompactVDiskWidths';
import {
    ALL_VDISK_WIDTH,
    EXPERT_MODE_PDISK_WIDTH,
    VDISKS_CONTAINER_WIDTH,
    getAllVDisksContainerWidth,
} from './constants';

import './Disks.scss';

const b = cn('ydb-storage-disks');

interface DiskPopupState {
    id: string;
    vdisk: boolean;
    pdisk: boolean;
}

type DiskPopupChangeHandler = (
    id: string | undefined,
    source: 'vdisk' | 'pdisk',
    open: boolean,
    closePair?: boolean,
) => void;

interface DisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    withIcon?: boolean;
    isAllVDisksLayout?: boolean;
}

interface DisksItemProps {
    vDisk: PreparedVDisk;
    viewContext?: StorageViewContext;
    inactive?: boolean;
    highlighted: boolean;
    onPopupChange: DiskPopupChangeHandler;
    compactVDiskWidth?: number;
    withDCMargin?: boolean;
    withIcon?: boolean;
    getDisplayState?: VDiskDisplayStateGetter;
    isAllVDisksLayout?: boolean;
    renderContent: boolean;
    placeholderProps?: React.HTMLAttributes<HTMLDivElement>;
}

const VDiskItem = React.memo(function VDiskItem({
    vDisk,
    highlighted,
    inactive,
    onPopupChange,
    compactVDiskWidth,
    withIcon,
    getDisplayState,
    isAllVDisksLayout,
    renderContent,
    placeholderProps,
}: DisksItemProps) {
    const vDiskId = vDisk.StringifiedId;
    const setHighlightedVDisk = React.useCallback(
        (id?: string) => onPopupChange(vDiskId, 'vdisk', Boolean(id)),
        [onPopupChange, vDiskId],
    );
    const onClosePopup = React.useCallback(
        () => onPopupChange(vDiskId, 'vdisk', false, true),
        [onPopupChange, vDiskId],
    );
    const style: React.CSSProperties = isAllVDisksLayout
        ? {width: ALL_VDISK_WIDTH, flexBasis: ALL_VDISK_WIDTH}
        : {width: compactVDiskWidth, flexBasis: compactVDiskWidth};

    return (
        <div
            style={style}
            className={b('vdisk-item', {all: isAllVDisksLayout})}
            data-disk-id={vDisk.StringifiedId}
        >
            {isAllVDisksLayout ? (
                <div
                    aria-hidden
                    className={b('vdisk-size-indicator')}
                    style={{
                        width: compactVDiskWidth,
                        visibility: renderContent ? undefined : 'hidden',
                    }}
                />
            ) : null}
            <VDiskWithDonorsStack
                renderContent={renderContent}
                placeholderProps={placeholderProps}
                data={vDisk}
                hideMainPDiskInPopup
                compact={!isAllVDisksLayout}
                withIcon={withIcon}
                inactive={inactive}
                delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                highlightedVDisk={highlighted ? vDisk.StringifiedId : undefined}
                setHighlightedVDisk={setHighlightedVDisk}
                onClosePopup={onClosePopup}
                progressBarClassName={b('vdisk-progress-bar')}
                getDisplayState={getDisplayState}
            />
        </div>
    );
});

const PDiskItem = React.memo(function PDiskItem({
    vDisk,
    viewContext,
    highlighted,
    onPopupChange,
    withDCMargin,
    withIcon,
    getDisplayState,
    renderContent,
    placeholderProps,
}: Omit<DisksItemProps, 'getDisplayState'> & {getDisplayState?: PDiskDisplayStateGetter}) {
    const vDiskId = vDisk.StringifiedId;

    const onShowPopup = React.useCallback(
        () => onPopupChange(vDiskId, 'pdisk', true),
        [onPopupChange, vDiskId],
    );
    const onHidePopup = React.useCallback(
        () => onPopupChange(vDiskId, 'pdisk', false),
        [onPopupChange, vDiskId],
    );
    const onClosePopup = React.useCallback(
        () => onPopupChange(vDiskId, 'pdisk', false, true),
        [onPopupChange, vDiskId],
    );

    if (!vDisk.PDisk) {
        // Preserve disk indices for focus tracking while virtualization is disabled.
        return <div data-disk-id={vDiskId} hidden />;
    }

    return (
        <div
            className={b('pdisk-item', {['with-dc-margin']: withDCMargin})}
            data-disk-id={vDiskId}
            style={{width: getDisplayState?.(vDisk.PDisk).width ?? EXPERT_MODE_PDISK_WIDTH}}
            tabIndex={-1}
            {...(renderContent || highlighted ? undefined : placeholderProps)}
        >
            {(renderContent || highlighted) && (
                <PDisk
                    progressBarClassName={b('pdisk-progress-bar')}
                    data={vDisk.PDisk}
                    inactive={!isPdiskActive(vDisk.PDisk, viewContext)}
                    showPopup={highlighted}
                    delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    onShowPopup={onShowPopup}
                    onHidePopup={onHidePopup}
                    onClosePopup={onClosePopup}
                    withIcon={withIcon}
                    highlighted={highlighted}
                    getDisplayState={getDisplayState}
                />
            )}
        </div>
    );
});

export const Disks = React.memo(function Disks({
    vDisks = [],
    viewContext,
    erasure,
    withIcon,
    isAllVDisksLayout,
}: DisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);
    const getVDiskDisplayState = useStorageVDiskDisplayStateGetter();
    const getPDiskDisplayState = useStoragePDiskDisplayStateGetter();

    const [popupState, setPopupState] = React.useState<DiskPopupState>();
    const highlightedVDisk = popupState?.id;
    const onPopupChange = React.useCallback<DiskPopupChangeHandler>(
        (id, source, open, closePair) => {
            if (!id) {
                return;
            }
            setPopupState((current) => {
                // A delayed close from another pair must not clear the current pair.
                if (!open && current?.id !== id) {
                    return current;
                }
                if (closePair) {
                    return undefined;
                }
                const next = {
                    id,
                    vdisk: false,
                    pdisk: false,
                    ...(current?.id === id ? current : {}),
                    [source]: open,
                };
                return next.vdisk || next.pdisk ? next : undefined;
            });
        },
        [],
    );
    const vDiskList = useVirtualizedDiskList(
        vDisks,
        vDisks.every((disk) => Boolean(disk.StringifiedId)),
    );
    // Missing disk identities produce non-focusable placeholders; keep all links reachable.
    const pDiskList = useVirtualizedDiskList(
        vDisks,
        vDisks.every(({PDisk: pDisk}) => !isNil(pDisk?.NodeId) && !isNil(pDisk?.PDiskId)),
    );

    React.useEffect(() => {
        setPopupState((current) =>
            vDisks.some((disk) => disk.StringifiedId === current?.id) ? current : undefined,
        );
    }, [vDisks]);

    const {
        theme: {spaceBaseSize},
    } = useLayoutContext();
    const compactVDiskWidths = React.useMemo(
        () => calculateCompactVDiskWidths(vDisks, spaceBaseSize),
        [spaceBaseSize, vDisks],
    );

    if (!vDisks.length) {
        return null;
    }

    const vDisksContainerWidth = isAllVDisksLayout
        ? getAllVDisksContainerWidth()
        : VDISKS_CONTAINER_WIDTH;

    return (
        <div className={b(null)}>
            <Flex
                direction="row"
                gap={1}
                grow
                style={{width: vDisksContainerWidth}}
                ref={vDiskList.containerRef}
            >
                {vDisks.map((vDisk, index) => (
                    <VDiskItem
                        key={vDisk.StringifiedId || index}
                        vDisk={vDisk}
                        inactive={!isVdiskActive(vDisk, viewContext)}
                        highlighted={highlightedVDisk === vDisk.StringifiedId}
                        onPopupChange={onPopupChange}
                        compactVDiskWidth={compactVDiskWidths[index]}
                        withIcon={withIcon}
                        getDisplayState={getVDiskDisplayState}
                        isAllVDisksLayout={isAllVDisksLayout}
                        renderContent={vDiskList.shouldRenderDisk(index)}
                        placeholderProps={vDiskList.getPlaceholderProps(index)}
                    />
                ))}
            </Flex>

            <div className={b('pdisks-wrapper')} ref={pDiskList.containerRef}>
                {vDisks.map((vDisk, index) => (
                    <PDiskItem
                        key={vDisk.StringifiedId || index}
                        vDisk={vDisk}
                        viewContext={viewContext}
                        highlighted={highlightedVDisk === vDisk.StringifiedId}
                        onPopupChange={onPopupChange}
                        withDCMargin={vDisksWithDCMargins.includes(index)}
                        withIcon={withIcon}
                        getDisplayState={getPDiskDisplayState}
                        renderContent={pDiskList.shouldRenderDisk(index)}
                        placeholderProps={pDiskList.getPlaceholderProps(index)}
                    />
                ))}
            </div>
        </div>
    );
});
