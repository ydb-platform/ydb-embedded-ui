import React from 'react';

import {Flex, useLayoutContext} from '@gravity-ui/uikit';

import {VDisk} from '../../../components/VDisk/VDisk';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';
import {PDisk} from '../PDisk';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive, useVDisksWithDCMargins} from '../utils';

import './Disks.scss';

const b = cn('ydb-storage-disks');

const VDISKS_CONTAINER_WIDTH = 300;

interface DisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    withIcon?: boolean;
}

export function Disks({vDisks = [], viewContext, erasure, withIcon = false}: DisksProps) {
    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);

    const {
        theme: {spaceBaseSize},
    } = useLayoutContext();

    if (!vDisks.length) {
        return null;
    }

    const unavailableVDiskWidth =
        (VDISKS_CONTAINER_WIDTH - spaceBaseSize * (vDisks.length - 1)) / vDisks.length;

    return (
        <div className={b(null)}>
            <Flex direction={'row'} gap={1} grow style={{width: VDISKS_CONTAINER_WIDTH}}>
                {vDisks?.map((vDisk, index) => (
                    <VDiskItem
                        key={vDisk.StringifiedId || index}
                        vDisk={vDisk}
                        inactive={!isVdiskActive(vDisk, viewContext)}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                        unavailableVDiskWidth={unavailableVDiskWidth}
                        withIcon={withIcon}
                    />
                ))}
            </Flex>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk, index) => (
                    <PDiskItem
                        key={vDisk?.PDisk?.StringifiedId || index}
                        vDisk={vDisk}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                        withDCMargin={vDisksWithDCMargins.includes(index)}
                        withIcon={withIcon}
                    />
                ))}
            </div>
        </div>
    );
}

interface DisksItemProps {
    vDisk: PreparedVDisk;
    inactive?: boolean;
    highlightedVDisk: string | undefined;
    setHighlightedVDisk: (id: string | undefined) => void;
    unavailableVDiskWidth?: number;
    withDCMargin?: boolean;
    withIcon?: boolean;
}

function VDiskItem({
    vDisk,
    highlightedVDisk,
    inactive,
    setHighlightedVDisk,
    unavailableVDiskWidth,
    withIcon = false,
}: DisksItemProps) {
    // Do not show PDisk popup for VDisk
    const vDiskToShow = {...vDisk, PDisk: undefined};

    const vDiskId = vDisk.StringifiedId;

    // show vdisks without AllocatedSize as having average width (#1433)
    const minWidth = isNumeric(vDiskToShow.AllocatedSize) ? undefined : unavailableVDiskWidth;
    const flexGrow = Number(vDiskToShow.AllocatedSize) || 1;

    return (
        <div style={{flexGrow, minWidth}} className={b('vdisk-item')}>
            <VDisk
                data={vDiskToShow}
                compact
                withIcon={withIcon}
                inactive={inactive}
                showPopup={highlightedVDisk === vDiskId}
                delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                onShowPopup={() => setHighlightedVDisk(vDiskId)}
                onHidePopup={() => setHighlightedVDisk(undefined)}
                progressBarClassName={b('vdisk-progress-bar')}
            />
        </div>
    );
}

function PDiskItem({
    vDisk,
    highlightedVDisk,
    setHighlightedVDisk,
    withDCMargin,
    withIcon = false,
}: DisksItemProps) {
    const vDiskId = vDisk.StringifiedId;

    if (!vDisk.PDisk) {
        return null;
    }

    return (
        <PDisk
            className={b('pdisk-item', {['with-dc-margin']: withDCMargin})}
            progressBarClassName={b('pdisk-progress-bar')}
            data={vDisk.PDisk}
            showPopup={highlightedVDisk === vDiskId}
            delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
            delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
            onShowPopup={() => setHighlightedVDisk(vDiskId)}
            onHidePopup={() => setHighlightedVDisk(undefined)}
            withIcon={withIcon}
        />
    );
}
