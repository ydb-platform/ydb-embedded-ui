import {DefinitionList} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {CopyableValue} from '../../components/CopyableValue/CopyableValue';
import {DatacenterLabel} from '../../components/Datacenter/DatacenterLabel';
import type {PDiskData} from '../../store/reducers/pdisk/types';
import {cn} from '../../utils/cn';
import {getDiskLocationItems} from '../../utils/disks/diskInfo/getDiskLocationItems';

import './PDiskStorageDetails.scss';

const b = cn('ydb-pdisk-storage-details');
const LOCATION_IDS = ['datacenter', 'rack', 'fqdn', 'pdisk-path'];
const FIELD_ORDER = [...LOCATION_IDS, 'node-id', 'pdisk-id'];

export function PDiskStorageDetails({
    data = {},
    className,
}: {
    data?: PDiskData;
    className?: string;
}) {
    const items = getDiskLocationItems(data, {
        Host: data.NodeHost,
        Rack: data.NodeRack,
        DC: data.NodeDC,
    });

    return (
        <div className={b(null, className)} data-qa="pdisk-location">
            {FIELD_ORDER.map((id) => {
                const item = items.find((entry) => entry.id === id);
                if (!item) {
                    return null;
                }
                const copyText = item.copyText === undefined ? undefined : String(item.copyText);
                return (
                    <DefinitionList
                        key={id}
                        direction="vertical"
                        className={b('detail', {location: LOCATION_IDS.includes(id)})}
                        qa={`pdisk-location-${id}`}
                    >
                        <DefinitionList.Item name={item.name}>
                            <CopyableValue copyText={copyText} fieldName={item.name}>
                                <CellWithPopover
                                    content={copyText}
                                    disabled={!copyText}
                                    placement={['top', 'bottom']}
                                    fullWidth
                                    wrapperClassName={b('value-popover')}
                                    className={b('value-popover-content', {
                                        'with-left-trim': id === 'pdisk-path',
                                    })}
                                >
                                    <span tabIndex={copyText ? 0 : undefined}>
                                        {id === 'datacenter' && copyText ? (
                                            <DatacenterLabel
                                                name={copyText}
                                                colorKey={data.NodeDCKey}
                                                size="xxs"
                                            />
                                        ) : (
                                            item.content
                                        )}
                                    </span>
                                </CellWithPopover>
                            </CopyableValue>
                        </DefinitionList.Item>
                    </DefinitionList>
                );
            })}
        </div>
    );
}
