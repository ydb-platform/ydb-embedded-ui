import React from 'react';

import {Flex, useLayoutContext} from '@gravity-ui/uikit';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {
    DiskDisplayStateGetter,
    PDiskDisplayStateGetter,
} from '../../../utils/disks/displayState';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {useStoragePDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';
import {useStorageVDiskDisplayStateGetter} from '../useStorageVDiskDisplayStateGetter';
import {isPdiskActive, isVdiskActive, useVDisksWithDCMargins} from '../utils';

import {calculateCompactVDiskWidths} from './calculateCompactVDiskWidths';
import {ALL_VDISK_WIDTH, VDISKS_CONTAINER_WIDTH, getAllVDisksContainerWidth} from './constants';

import './Disks.scss';

const b = cn('ydb-storage-disks');

interface DisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    withIcon?: boolean;
    isAllVDisksLayout?: boolean;
}

export function Disks({
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
            <Flex direction="row" gap={1} grow style={{width: vDisksContainerWidth}}>
                {vDisks?.map((vDisk, index) => (
                    <VDiskItem
                        key={vDisk.StringifiedId || index}
                        vDisk={vDisk}
                        inactive={!isVdiskActive(vDisk, viewContext)}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                        compactVDiskWidth={compactVDiskWidths[index]}
                        withIcon={withIcon}
                        getDisplayState={getVDiskDisplayState}
                        isAllVDisksLayout={isAllVDisksLayout}
                    />
                ))}
            </Flex>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk, index) => (
                    <PDiskItem
                        key={vDisk?.PDisk?.StringifiedId || index}
                        vDisk={vDisk}
                        viewContext={viewContext}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                        withDCMargin={vDisksWithDCMargins.includes(index)}
                        withIcon={withIcon}
                        getDisplayState={getPDiskDisplayState}
                    />
                ))}
            </div>
        </div>
    );
}

interface DisksItemProps {
    vDisk: PreparedVDisk;
    viewContext?: StorageViewContext;
    inactive?: boolean;
    highlightedVDisk?: string;
    setHighlightedVDisk?: (id?: string) => void;
    compactVDiskWidth?: number;
    withDCMargin?: boolean;
    withIcon?: boolean;
    getDisplayState?: DiskDisplayStateGetter;
    isAllVDisksLayout?: boolean;
}

function VDiskItem({
    vDisk,
    highlightedVDisk,
    inactive,
    setHighlightedVDisk,
    compactVDiskWidth,
    withIcon,
    getDisplayState,
    isAllVDisksLayout,
}: DisksItemProps) {
    // Do not show PDisk popup for VDisk
    const vDiskToShow = {...vDisk, PDisk: undefined};

    const style: React.CSSProperties = isAllVDisksLayout
        ? {width: ALL_VDISK_WIDTH, flexBasis: ALL_VDISK_WIDTH}
        : {width: compactVDiskWidth, flexBasis: compactVDiskWidth};

    return (
        <div style={style} className={b('vdisk-item', {all: isAllVDisksLayout})}>
            {isAllVDisksLayout ? (
                <div
                    aria-hidden
                    className={b('vdisk-size-indicator')}
                    style={{width: compactVDiskWidth}}
                />
            ) : null}
            <VDiskWithDonorsStack
                data={vDiskToShow}
                compact={!isAllVDisksLayout}
                withIcon={withIcon}
                inactive={inactive}
                delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                highlightedVDisk={highlightedVDisk}
                setHighlightedVDisk={setHighlightedVDisk}
                progressBarClassName={b('vdisk-progress-bar')}
                getDisplayState={getDisplayState}
            />
        </div>
    );
}

function PDiskItem({
    vDisk,
    viewContext,
    highlightedVDisk,
    setHighlightedVDisk,
    withDCMargin,
    withIcon,
    getDisplayState,
}: DisksItemProps & {getDisplayState?: PDiskDisplayStateGetter}) {
    const vDiskId = vDisk.StringifiedId;

    const isHighlighted = highlightedVDisk === vDiskId;

    if (!vDisk.PDisk) {
        return null;
    }

    return (
        <PDisk
            className={b('pdisk-item', {['with-dc-margin']: withDCMargin})}
            progressBarClassName={b('pdisk-progress-bar')}
            data={vDisk.PDisk}
            inactive={!isPdiskActive(vDisk.PDisk, viewContext)}
            showPopup={isHighlighted}
            delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
            delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
            onShowPopup={() => setHighlightedVDisk?.(vDiskId)}
            onHidePopup={() => setHighlightedVDisk?.(undefined)}
            withIcon={withIcon}
            highlighted={isHighlighted}
            getDisplayState={getDisplayState}
        />
    );
}
