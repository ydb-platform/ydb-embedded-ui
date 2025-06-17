import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isEmpty} from 'lodash';

import {InternalLink} from '../../../../../components/InternalLink';
import {getPDiskPagePath, getVDiskPagePath} from '../../../../../routes';
import type {Location} from '../../../../../types/api/healthcheck';
import i18n from '../../i18n';

import {NodeInfo} from './NodeInfo';
import {PoolInfo} from './PoolInfo';
import {IdList, LocationDetails, SectionWithTitle} from './utils';

export type LocationFieldStorage = 'pool' | 'node' | 'pdisk' | 'vdisk' | 'group';

type StorageLocationType = Location['storage'];

const LocationFieldRenderer: Record<
    LocationFieldStorage,
    (location: StorageLocationType) => React.ReactNode
> = {
    node: (location: StorageLocationType) => <NodeInfo node={location?.node} key="node" />,
    pool: (location: StorageLocationType) => <PoolInfo location={location} key="pool" />,
    group: (location: StorageLocationType) => <GroupInfo location={location} key="group" />,
    vdisk: (location: StorageLocationType) => <VDiskInfo location={location} key="vdisk" />,
    pdisk: (location: StorageLocationType) => <PDiskInfo location={location} key="pdisk" />,
};

interface StorageLocationProps {
    location: StorageLocationType;
    hiddenFields?: LocationFieldStorage[];
}

export function StorageLocation({location, hiddenFields = []}: StorageLocationProps) {
    const {node, pool} = location ?? {};
    const {group} = pool ?? {};
    const {vdisk} = group ?? {};
    const {pdisk} = vdisk ?? {};

    const fields = React.useMemo(() => {
        const fields: LocationFieldStorage[] = [];
        if (node) {
            fields.push('node');
        }
        if (pool) {
            fields.push('pool');
        }
        if (group) {
            fields.push('group');
        }
        if (vdisk) {
            fields.push('vdisk');
        }
        if (pdisk) {
            fields.push('pdisk');
        }
        return fields.filter((field) => !hiddenFields.includes(field));
    }, [node, pool, group, vdisk, pdisk, hiddenFields]);

    if (!location || isEmpty(location) || fields.length === 0) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_storage_location')} titleVariant="subheader-2">
            <Flex direction="column" gap={2}>
                {fields.map((field) => LocationFieldRenderer[field](location))}
            </Flex>
        </SectionWithTitle>
    );
}

interface StorageSectionProps {
    location?: Location['storage'];
}

function GroupInfo({location}: StorageSectionProps) {
    const {pool} = location ?? {};
    const {group} = pool ?? {};

    const ids = group?.id;

    if (!ids?.length) {
        return null;
    }

    return (
        <LocationDetails
            fields={[
                {
                    value: ids?.length ? <IdList ids={ids} /> : undefined,
                    title: i18n('label_group-id'),
                },
            ]}
        />
    );
}

function VDiskInfo({location}: StorageSectionProps) {
    const {node, pool} = location ?? {};
    const {group} = pool ?? {};
    const {vdisk} = group ?? {};

    const ids = vdisk?.id;

    if (!ids?.length) {
        return null;
    }

    return (
        <LocationDetails
            fields={[
                {
                    value: ids?.length ? (
                        <IdList
                            ids={ids}
                            renderItem={(id) => (
                                <InternalLink
                                    to={getVDiskPagePath({
                                        vDiskId: id,
                                        nodeId: node?.id,
                                    })}
                                >
                                    {id}
                                </InternalLink>
                            )}
                        />
                    ) : undefined,
                    title: i18n('label_vdisk-id'),
                },
            ]}
        />
    );
}
function PDiskInfo({location}: StorageSectionProps) {
    const {node, pool} = location ?? {};
    const {group} = pool ?? {};
    const {vdisk} = group ?? {};
    const {pdisk} = vdisk ?? {};

    if (!pdisk?.length) {
        return null;
    }

    return pdisk.map((disk) => (
        <LocationDetails
            key={disk.id || disk.path}
            fields={[
                {
                    value:
                        disk.id && node?.id ? (
                            <InternalLink to={getPDiskPagePath(disk.id, node.id)}>
                                {disk.id}
                            </InternalLink>
                        ) : (
                            disk.id
                        ),
                    title: i18n('label_pdisk-id'),
                },
                {value: disk.path, title: i18n('label_pdisk-path')},
            ]}
        />
    ));
}
