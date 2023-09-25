import cn from 'bem-cn-lite';

import InfoViewer, {InfoViewerItem} from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';
import {TopTables} from './TopTables/TopTables';
import {TopGroups} from './TopGroups';
import './Storage.scss';

const b = cn('tenant-overview-storage');

export interface StorageMetrics {
    blobStorageUsed?: number;
    blobStorageLimit?: number;
    tableStorageUsed?: number;
    tableStorageLimit?: number;
}

interface StorageProps {
    tenantName: string;
    info?: InfoViewerItem[];
    metrics: StorageMetrics;
}

export function Storage({tenantName, metrics}: StorageProps) {
    const {blobStorageUsed, tableStorageUsed, blobStorageLimit, tableStorageLimit} = metrics;
    const formatValues = (value?: number, total?: number) => {
        const size = getSizeWithSignificantDigits(Number(blobStorageLimit || blobStorageUsed), 0);

        return formatStorageValues(value, total, size);
    };

    const info = [
        {
            label: 'Database storage',
            value: (
                <ProgressViewer
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatValues}
                    colorizeProgress={true}
                    warningThreshold={75}
                    dangerThreshold={85}
                />
            ),
        },
        {
            label: 'Table storage',
            value: (
                <ProgressViewer
                    value={tableStorageUsed}
                    capacity={tableStorageLimit}
                    formatValues={formatValues}
                    colorizeProgress={true}
                    warningThreshold={75}
                    dangerThreshold={85}
                />
            ),
        },
    ];
    return (
        <>
            <InfoViewer className={b('info')} title="Storage details" info={info} />
            <TopTables path={tenantName} />
            <TopGroups tenant={tenantName} />
        </>
    );
}
