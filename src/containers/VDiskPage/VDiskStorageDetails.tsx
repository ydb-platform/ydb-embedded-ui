import {Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {InternalLinkButton} from '../../components/InternalLinkButton';
import {VDiskCopyableValue} from '../../components/VDiskInfo/VDiskCopyableValue';
import {getVDiskLocationItems} from '../../components/VDiskInfo/getVDiskDetails';
import {getPDiskPagePath} from '../../routes';
import type {VDiskData} from '../../store/reducers/vdisk/types';
import {cn} from '../../utils/cn';
import type {DiskDetailItem} from '../../utils/disks/diskInfo/getDiskLocationItems';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {vDiskPageKeyset} from './i18n';

import './VDiskStorageDetails.scss';

const b = cn('ydb-vdisk-storage-details');
const LOCATION_IDS = ['datacenter', 'rack', 'fqdn', 'pdisk-path'];

interface VDiskStorageDetailsProps {
    className?: string;
    data?: VDiskData;
}

function DetailItem({item}: {item: DiskDetailItem}) {
    const copyText = item.copyText === undefined ? undefined : String(item.copyText);
    return (
        <div className={b('detail')} data-qa={`vdisk-location-${item.id}`}>
            <Text color="secondary">{item.name}</Text>
            <VDiskCopyableValue copyText={copyText} fieldName={item.name}>
                <CellWithPopover
                    content={copyText}
                    disabled={!copyText}
                    placement={['top', 'bottom']}
                    fullWidth
                    wrapperClassName={b('value-popover')}
                    className={b('value-popover-content', {
                        'with-left-trim': item.id === 'pdisk-path',
                    })}
                >
                    <span tabIndex={copyText ? 0 : undefined}>{item.content}</span>
                </CellWithPopover>
            </VDiskCopyableValue>
        </div>
    );
}

export function VDiskStorageDetails({className, data = {}}: VDiskStorageDetailsProps) {
    const isViewerUser = useIsViewerUser();
    const pDiskPath =
        isViewerUser && !isNil(data.NodeId) && !isNil(data.PDiskId)
            ? getPDiskPagePath(data.PDiskId, data.NodeId)
            : undefined;
    const items = getVDiskLocationItems(data, {
        Host: data.NodeHost,
        Rack: data.NodeRack,
        DC: data.NodeDC,
    });

    return (
        <div className={b(null, className)} data-qa="vdisk-location">
            <div className={b('card')}>
                {LOCATION_IDS.map((id) => {
                    const item = items.find((entry) => entry.id === id);
                    return item ? <DetailItem key={id} item={item} /> : null;
                })}
            </div>
            <div className={b('card', {ids: true})}>
                {items
                    .filter(({id}) => !LOCATION_IDS.includes(id))
                    .map((item) => (
                        <DetailItem key={item.id} item={item} />
                    ))}
                {pDiskPath && (
                    <InternalLinkButton href={pDiskPath} size="s" view="normal">
                        {vDiskPageKeyset('action_go-to-pdisk')}
                    </InternalLinkButton>
                )}
            </div>
        </div>
    );
}
