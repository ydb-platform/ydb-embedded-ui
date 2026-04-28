import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isEmpty} from 'lodash';

import {InternalLink} from '../../../../../components/InternalLink';
import {useTabletPagePath} from '../../../../../routes';
import type {Location} from '../../../../../types/api/healthcheck';
import {useHealthcheckContext} from '../../HealthcheckContext';
import i18n from '../../i18n';

import {NodeInfo} from './NodeInfo';
import {PoolInfo} from './PoolInfo';
import {IdList, LocationDetails, SectionWithTitle} from './utils';

export type LocationFieldCompute = 'tablet' | 'schema' | 'node' | 'pool' | 'state_storage';

type ComputeLocationType = Location['compute'];

const LocationFieldRenderer: Record<
    LocationFieldCompute,
    (location: ComputeLocationType) => React.ReactNode
> = {
    node: (location: ComputeLocationType) => <NodeInfo node={location?.node} key="node" />,
    pool: (location: ComputeLocationType) => <PoolInfo location={location} key="pool" />,
    tablet: (location: ComputeLocationType) => <TabletInfo location={location} key="tablet" />,
    schema: (location: ComputeLocationType) => <SchemaInfo location={location} key="schema" />,
    state_storage: (location: ComputeLocationType) => (
        <StateStorageInfo location={location} key="state_storage" />
    ),
};

interface ComputeLocationProps {
    location: ComputeLocationType;
    hiddenFields?: LocationFieldCompute[];
}

export function ComputeLocation({location, hiddenFields = []}: ComputeLocationProps) {
    const {node, tablet, schema, pool, state_storage: stateStorage} = location ?? {};

    const fields = React.useMemo(() => {
        const fields: LocationFieldCompute[] = [];
        if (node) {
            fields.push('node');
        }
        if (pool) {
            fields.push('pool');
        }
        if (tablet) {
            fields.push('tablet');
        }
        if (schema) {
            fields.push('schema');
        }
        if (stateStorage) {
            fields.push('state_storage');
        }
        return fields.filter((field) => !hiddenFields.includes(field));
    }, [node, pool, tablet, schema, stateStorage, hiddenFields]);

    if (!location || isEmpty(location) || fields.length === 0) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_compute_location')} titleVariant="subheader-2">
            <Flex direction="column" gap={3}>
                {fields.map((field) => LocationFieldRenderer[field](location))}
            </Flex>
        </SectionWithTitle>
    );
}

interface ComputeSectionProps {
    location?: ComputeLocationType;
}

function TabletInfo({location}: ComputeSectionProps) {
    const getTabletPagePath = useTabletPagePath();
    const {clusterName} = useHealthcheckContext();
    const {tablet} = location ?? {};

    if (!tablet) {
        return null;
    }

    return (
        <LocationDetails
            fields={[
                {
                    value: tablet.id?.length ? (
                        <IdList
                            ids={tablet.id}
                            renderItem={(id) => (
                                <InternalLink to={getTabletPagePath(id, {clusterName})}>
                                    {id}
                                </InternalLink>
                            )}
                        />
                    ) : undefined,
                    title: i18n('label_tablet-id'),
                },
                {value: tablet.type, title: i18n('label_tablet-type')},
                {value: tablet.count, title: i18n('label_tablet-count')},
            ]}
        />
    );
}

function SchemaInfo({location}: ComputeSectionProps) {
    const {schema} = location ?? {};

    if (!schema) {
        return null;
    }

    return (
        <LocationDetails
            fields={[
                {value: schema.type, title: i18n('label_schema-type')},
                {value: schema.path, title: i18n('label_schema-path')},
            ]}
        />
    );
}

function StateStorageInfo({location}: ComputeSectionProps) {
    const stateStorage = location?.state_storage;

    if (!stateStorage) {
        return null;
    }

    return (
        <Flex direction="column" gap={3}>
            <LocationDetails
                fields={[{value: stateStorage.ring, title: i18n('label_state-storage-ring')}]}
            />
            <NodeInfo node={stateStorage.node} />
        </Flex>
    );
}
