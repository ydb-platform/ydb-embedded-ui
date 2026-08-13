import {VDisk} from '../../../components/VDisk/VDisk';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

const b = cn('pdisk-storage');

interface PDiskVDisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    withIcon?: boolean;
    delayOpen: number;
    delayClose: number;
    highlightedDisk?: string;
    setHighlightedDisk?: (id?: string) => void;
}

export function PDiskVDisks({
    vDisks,
    viewContext,
    withIcon,
    delayOpen,
    delayClose,
    highlightedDisk,
    setHighlightedDisk,
}: PDiskVDisksProps) {
    if (!vDisks?.length) {
        return null;
    }

    return (
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
                            withIcon={withIcon}
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
    );
}
