import {Flex} from '@gravity-ui/uikit';

import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {PreparedPDisk} from '../../utils/disks/types';
import {formatMetricPercent} from '../../utils/storageMetrics';
import {CopyableValue} from '../CopyableValue/CopyableValue';
import {getPDiskCapacityItems} from '../DiskCapacityInfo/DiskCapacityInfo';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {getPDiskLogItems, getPDiskRuntimeItems} from './getPDiskDetails';
import {pDiskInfoKeyset} from './i18n';

import './PDiskInfo.scss';

const b = cn('ydb-pdisk-info');

interface PDiskInfoProps {
    pDisk?: PreparedPDisk;
    className?: string;
}

function getPageCapacityItems(data: PreparedPDisk, capacityMetricsEnabled: boolean) {
    const items = getPDiskCapacityItems(data, {useWhiteboardSize: capacityMetricsEnabled}).filter(
        ({id}) => capacityMetricsEnabled || id === 'space' || id === 'slots',
    );
    if (!capacityMetricsEnabled) {
        items.splice(1, 0, {
            id: 'usage',
            name: pDiskInfoKeyset('usage'),
            content: formatMetricPercent(data.AllocatedPercent, 2),
        });
    }
    return [...items, ...getPDiskLogItems(data)];
}

export function PDiskInfo({pDisk = {}, className}: PDiskInfoProps) {
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const identityItems = [
        {name: pDiskInfoKeyset('guid'), value: pDisk.Guid},
        {name: pDiskInfoKeyset('serial-number'), value: pDisk.SerialNumber},
    ].map(({name, value}) => ({
        name,
        content: (
            <CopyableValue copyText={value || undefined} fieldName={name}>
                <span className={b('identity-value')}>{value || EMPTY_DATA_PLACEHOLDER}</span>
            </CopyableValue>
        ),
    }));
    const runtimeItems: YDBDefinitionListItem[] = [
        ...getPDiskRuntimeItems(pDisk),
        ...identityItems,
    ];

    return (
        <Flex className={b(null, className)} gap={6} gapRow={3} wrap="wrap" qa="pdisk-page-info">
            <YDBDefinitionList
                items={runtimeItems}
                nameMaxWidth={200}
                wrapperClassName={b('column')}
            />
            <YDBDefinitionList
                items={getPageCapacityItems(pDisk, capacityMetricsEnabled)}
                nameMaxWidth={200}
                wrapperClassName={b('column')}
            />
        </Flex>
    );
}
