import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isEmpty} from 'lodash';

import {InternalLink} from '../../../../../components/InternalLink';
import {getTabletPagePath} from '../../../../../routes';
import type {Location} from '../../../../../types/api/healthcheck';
import {useTenantQueryParams} from '../../../useTenantQueryParams';
import i18n from '../../i18n';

import {NodeInfo} from './NodeInfo';
import {PoolInfo} from './PoolInfo';
import {IdList, LocationDetails, SectionWithTitle} from './utils';

export type LocationFieldCompute = 'tablet' | 'schema' | 'node' | 'pool';

type ComputeLocationType = Location['compute'];

const LocationFieldRenderer: Record<
    LocationFieldCompute,
    (location: ComputeLocationType) => React.ReactNode
> = {
    node: (location: ComputeLocationType) => <NodeInfo node={location?.node} key="node" />,
    pool: (location: ComputeLocationType) => <PoolInfo location={location} key="pool" />,
    tablet: (location: ComputeLocationType) => <TabletInfo location={location} key="tablet" />,
    schema: (location: ComputeLocationType) => <SchemaInfo location={location} key="schema" />,
};

interface ComputeLocationProps {
    location: ComputeLocationType;
    hiddenFields?: LocationFieldCompute[];
}

export function ComputeLocation({location, hiddenFields = []}: ComputeLocationProps) {
    const {node, tablet, schema, pool} = location ?? {};

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
        return fields.filter((field) => !hiddenFields.includes(field));
    }, [node, pool, tablet, schema, hiddenFields]);

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
    const {tablet} = location ?? {};
    const {database} = useTenantQueryParams();

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
                                <InternalLink to={getTabletPagePath(id, {database})}>
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
