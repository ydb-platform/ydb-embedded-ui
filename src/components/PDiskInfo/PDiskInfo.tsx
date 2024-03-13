import type {PreparedPDisk} from '../../utils/disks/types';
import {createPDiskDeveloperUILink} from '../../utils/developerUI/developerUI';
import {cn} from '../../utils/cn';
import {formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {valueIsDefined} from '../../utils';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {getPDiskPagePath} from '../../routes';

import type {InfoViewerItem} from '../InfoViewer';
import {InfoViewer, type InfoViewerProps} from '../InfoViewer/InfoViewer';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {pDiskInfoKeyset} from './i18n';

import './PDiskInfo.scss';

const b = cn('ydb-pdisk-info');

interface PDiskInfoProps<T extends PreparedPDisk> extends Omit<InfoViewerProps, 'info'> {
    pDisk: T;
    nodeId?: number | string | null;
    isPDiskPage?: boolean;
}

export function PDiskInfo<T extends PreparedPDisk>({
    pDisk,
    nodeId,
    isPDiskPage = false,
    ...infoViewerProps
}: PDiskInfoProps<T>) {
    const {
        PDiskId,
        Path,
        Guid,
        Category,
        Type,
        Device,
        Realtime,
        State,
        SerialNumber,
        TotalSize,
        AvailableSize,
    } = pDisk;

    const total = Number(TotalSize);
    const available = Number(AvailableSize);

    const pdiskInfo: InfoViewerItem[] = [];

    if (valueIsDefined(Path)) {
        pdiskInfo.push({label: pDiskInfoKeyset('path'), value: Path});
    }
    if (valueIsDefined(Guid)) {
        pdiskInfo.push({label: pDiskInfoKeyset('guid'), value: Guid});
    }
    if (valueIsDefined(Category)) {
        pdiskInfo.push({label: pDiskInfoKeyset('category'), value: Category});
        pdiskInfo.push({label: pDiskInfoKeyset('type'), value: Type});
    }
    if (total >= 0 && available >= 0) {
        pdiskInfo.push({
            label: pDiskInfoKeyset('size'),
            value: (
                <ProgressViewer
                    value={total - available}
                    capacity={total}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                />
            ),
        });
    }
    if (valueIsDefined(State)) {
        pdiskInfo.push({label: pDiskInfoKeyset('state'), value: State});
    }
    if (valueIsDefined(Device)) {
        pdiskInfo.push({
            label: pDiskInfoKeyset('device'),
            value: <EntityStatus status={Device} />,
        });
    }
    if (valueIsDefined(Realtime)) {
        pdiskInfo.push({
            label: pDiskInfoKeyset('realtime'),
            value: <EntityStatus status={Realtime} />,
        });
    }
    if (valueIsDefined(SerialNumber)) {
        pdiskInfo.push({
            label: pDiskInfoKeyset('serial-number'),
            value: SerialNumber || EMPTY_DATA_PLACEHOLDER,
        });
    }

    if (valueIsDefined(PDiskId) && valueIsDefined(nodeId)) {
        const pDiskPagePath = getPDiskPagePath(PDiskId, nodeId);
        const pDiskInternalViewerPath = createPDiskDeveloperUILink({
            nodeId,
            pDiskId: PDiskId,
        });

        pdiskInfo.push({
            label: pDiskInfoKeyset('links'),
            value: (
                <span className={b('links')}>
                    {!isPDiskPage && (
                        <LinkWithIcon
                            title={pDiskInfoKeyset('pdisk-page')}
                            url={pDiskPagePath}
                            external={false}
                        />
                    )}
                    <LinkWithIcon
                        title={pDiskInfoKeyset('developer-ui')}
                        url={pDiskInternalViewerPath}
                    />
                </span>
            ),
        });
    }

    return <InfoViewer info={pdiskInfo} {...infoViewerProps} />;
}
