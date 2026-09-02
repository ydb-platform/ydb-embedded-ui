import {VDisk} from '../../../components/VDisk/VDisk';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import type {PDiskProps} from './PDisk';
import {PDisk} from './PDisk';

const b = cn('pdisk-storage');

interface PDiskWithVDisksProps extends Omit<PDiskProps, 'topContent'> {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    withVDiskIcons?: boolean;
    highlightedDisk?: string;
    setHighlightedDisk?: (id?: string) => void;
}

export function PDiskWithVDisks({
    vDisks,
    viewContext,
    withIcon,
    withVDiskIcons,
    delayOpen = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    delayClose = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    highlightedDisk,
    setHighlightedDisk,
    ...pDiskProps
}: PDiskWithVDisksProps) {
    const vDisksContent = vDisks?.length ? (
        <div className={b('vdisks')}>
            {vDisks.map((vDisk) => {
                const vDiskId = vDisk.StringifiedId;
                const highlighted = highlightedDisk === vDiskId;

                return (
                    <div
                        key={vDiskId}
                        className={b('vdisks-item')}
                        style={{
                            // 1 is small enough for empty disks to be of the minimum width
                            // but if all of them are empty, `flex-grow: 1` would size them evenly
                            flexGrow: Number(vDisk.AllocatedSize) || 1,
                        }}
                    >
                        <VDisk
                            withIcon={withVDiskIcons ?? withIcon}
                            data={vDisk}
                            inactive={!isVdiskActive(vDisk, viewContext)}
                            compact
                            delayOpen={delayOpen}
                            delayClose={delayClose}
                            showPopup={highlighted}
                            onShowPopup={() => setHighlightedDisk?.(vDiskId)}
                            onHidePopup={() => setHighlightedDisk?.(undefined)}
                            highlighted={highlighted}
                        />
                    </div>
                );
            })}
        </div>
    ) : null;

    return (
        <PDisk
            {...pDiskProps}
            withIcon={withIcon}
            delayOpen={delayOpen}
            delayClose={delayClose}
            topContent={vDisksContent}
        />
    );
}
