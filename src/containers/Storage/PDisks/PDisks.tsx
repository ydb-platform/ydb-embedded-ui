import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';

import {PDisksPreview} from './PDisksPreview';

interface PDisksProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
}

export function PDisks({pDisks = [], vDisks = [], viewContext, pDiskWidth}: PDisksProps) {
    return (
        <PDisksPreview
            pDisks={pDisks}
            vDisks={vDisks}
            viewContext={viewContext}
            pDiskWidth={pDiskWidth}
        />
    );
}
