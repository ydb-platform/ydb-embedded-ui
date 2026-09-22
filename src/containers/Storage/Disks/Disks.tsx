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
    setHighlightedVDisk?: (id?: string) => void;
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
    setHighlightedVDisk,
    compactVDiskWidth,
    withIcon,
    getDisplayState,
    isAllVDisksLayout,
    renderContent,
    placeholderProps,
}: DisksItemProps) {
    // Do not show PDisk popup for VDisk
    const vDiskToShow = React.useMemo(() => ({...vDisk, PDisk: undefined}), [vDisk]);

    const style: React.CSSProperties = isAllVDisksLayout
        ? {width: ALL_VDISK_WIDTH, flexBasis: ALL_VDISK_WIDTH}
        : {width: compactVDiskWidth, flexBasis: compactVDiskWidth};

    return (
        <div style={style} className={b('vdisk-item', {all: isAllVDisksLayout})}>
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
                data={vDiskToShow}
                compact={!isAllVDisksLayout}
                withIcon={withIcon}
                inactive={inactive}
                delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                highlightedVDisk={highlighted ? vDisk.StringifiedId : undefined}
                setHighlightedVDisk={setHighlightedVDisk}
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
    setHighlightedVDisk,
    withDCMargin,
    withIcon,
    getDisplayState,
    renderContent,
    placeholderProps,
}: Omit<DisksItemProps, 'getDisplayState'> & {getDisplayState?: PDiskDisplayStateGetter}) {
    const vDiskId = vDisk.StringifiedId;

    const onShowPopup = React.useCallback(
        () => setHighlightedVDisk?.(vDiskId),
        [setHighlightedVDisk, vDiskId],
    );
    const onHidePopup = React.useCallback(
        () => setHighlightedVDisk?.(undefined),
        [setHighlightedVDisk],
    );

    if (!vDisk.PDisk) {
        return null;
    }

    return (
        <div
            className={b('pdisk-item', {['with-dc-margin']: withDCMargin})}
            style={{width: getDisplayState?.(vDisk.PDisk).width ?? EXPERT_MODE_PDISK_WIDTH}}
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

    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();
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
        setHighlightedVDisk((id) =>
            vDisks.some((disk) => disk.StringifiedId === id) ? id : undefined,
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
                        setHighlightedVDisk={setHighlightedVDisk}
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
                        setHighlightedVDisk={setHighlightedVDisk}
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
