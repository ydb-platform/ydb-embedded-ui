import React from 'react';

import {Flex, useLayoutContext} from '@gravity-ui/uikit';

import {VDisk} from '../../../components/VDisk/VDisk';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import './Disks.scss';

const b = cn('ydb-storage-disks');

const VDISKS_CONTAINER_WIDTH = 300;

interface DisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
}

export function Disks({vDisks = [], viewContext}: DisksProps) {
    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

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
                {vDisks?.map((vDisk) => (
                    <VDiskItem
                        key={vDisk.StringifiedId}
                        vDisk={vDisk}
                        inactive={!isVdiskActive(vDisk, viewContext)}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                        unavailableVDiskWidth={unavailableVDiskWidth}
                    />
                ))}
            </Flex>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk) => (
                    <PDiskItem
                        key={vDisk?.PDisk?.StringifiedId}
                        vDisk={vDisk}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
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
}

function VDiskItem({
    vDisk,
    highlightedVDisk,
    inactive,
    setHighlightedVDisk,
    unavailableVDiskWidth,
}: DisksItemProps) {
    // Do not show PDisk popup for VDisk
    const vDiskToShow = {...vDisk, PDisk: undefined};

    const vDiskId = vDisk.StringifiedId;

    // show vdisks without AllocatedSize as having average width (#1433)
    const minWidth = valueIsDefined(vDiskToShow.AllocatedSize) ? undefined : unavailableVDiskWidth;
    const flexGrow = Number(vDiskToShow.AllocatedSize) || 1;

    return (
        <div style={{flexGrow, minWidth}} className={b('vdisk-item')}>
            <VDisk
                data={vDiskToShow}
                compact
                inactive={inactive}
                showPopup={highlightedVDisk === vDiskId}
                onShowPopup={() => setHighlightedVDisk(vDiskId)}
                onHidePopup={() => setHighlightedVDisk(undefined)}
                progressBarClassName={b('vdisk-progress-bar')}
            />
        </div>
    );
}

function PDiskItem({vDisk, highlightedVDisk, setHighlightedVDisk}: DisksItemProps) {
    const vDiskId = vDisk.StringifiedId;

    if (!vDisk.PDisk) {
        return null;
    }

    return (
        <PDisk
            className={b('pdisk-item')}
            progressBarClassName={b('pdisk-progress-bar')}
            data={vDisk.PDisk}
            showPopup={highlightedVDisk === vDiskId}
            onShowPopup={() => setHighlightedVDisk(vDiskId)}
            onHidePopup={() => setHighlightedVDisk(undefined)}
        />
    );
}
