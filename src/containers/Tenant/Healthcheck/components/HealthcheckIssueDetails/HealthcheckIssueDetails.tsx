import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {isEmpty} from 'lodash';

import {InternalLink} from '../../../../../components/InternalLink';
import {getTabletPagePath} from '../../../../../routes';
import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import type {Location} from '../../../../../types/api/healthcheck';
import {useTenantQueryParams} from '../../../useTenantQueryParams';
import i18n from '../../i18n';

import {ComputeLocation} from './ComputeLocation';
import type {LocationFieldCompute} from './ComputeLocation';
import {NodeInfo} from './NodeInfo';
import type {LocationFieldStorage} from './StorageLocation';
import {StorageLocation} from './StorageLocation';
import {IdList, LocationDetails, SectionWithTitle} from './utils';

interface HealthcheckIssueDetailsProps {
    issue: IssuesTree;
}

export function IssueDetails({issue}: HealthcheckIssueDetailsProps) {
    const {database} = useTenantQueryParams();
    const {location} = issue;

    const {detailsFields, hiddenStorageFields, hiddenComputeFields} = React.useMemo(() => {
        const hiddenStorageFields: LocationFieldStorage[] = [];
        const hiddenComputeFields: LocationFieldCompute[] = [];
        const fields: {value?: React.ReactNode; title: string}[] = [
            {value: issue.message, title: i18n('label_description')},
        ];
        if (issue.type === 'STORAGE_POOL') {
            fields.push({
                value: issue.location?.storage?.pool?.name,
                title: `${i18n('label_pool')} ${i18n('label_pool-name')}`,
            });
            hiddenStorageFields.push('pool');
        }
        if (issue.type === 'TABLET') {
            const tablet = issue.location?.compute?.tablet;
            fields.push(
                {
                    value: tablet?.id?.length ? (
                        <IdList
                            ids={tablet.id}
                            renderItem={(id) => (
                                <InternalLink to={getTabletPagePath(id, {database})}>
                                    {id}
                                </InternalLink>
                            )}
                        />
                    ) : undefined,
                    title: `${i18n('label_tablet')} ${i18n('label_tablet-id')}`,
                },
                {
                    value: tablet?.type,
                    title: `${i18n('label_tablet')} ${i18n('label_tablet-type')}`,
                },
                {
                    value: tablet?.count,
                    title: `${i18n('label_tablet')} ${i18n('label_tablet-count')}`,
                },
            );
            hiddenComputeFields.push('tablet');
        }
        return {detailsFields: fields, hiddenComputeFields, hiddenStorageFields};
    }, [issue, database]);

    return (
        <Flex direction="column" gap={4}>
            <LocationDetails title={i18n('label_details')} fields={detailsFields} />
            <SectionWithTitle titleVariant="subheader-2" title={i18n('label_location')} gap={3}>
                <StorageLocation location={location.storage} hiddenFields={hiddenStorageFields} />
                <ComputeLocation location={location.compute} hiddenFields={hiddenComputeFields} />
                <DatabaseLocation location={location.database} />
                <NodeLocation location={location.node} />
                <PeerLocation location={location.peer} />
            </SectionWithTitle>
        </Flex>
    );
}

interface DatabaseLocationProps {
    location: Location['database'];
}

function DatabaseLocation({location}: DatabaseLocationProps) {
    if (!location || !location.name) {
        return null;
    }

    return (
        <LocationDetails
            title={i18n('label_database_location')}
            fields={[{value: location.name, title: i18n('label_database')}]}
        />
    );
}

interface NodeLocationProps {
    location: Location['node'];
}

function NodeLocation({location}: NodeLocationProps) {
    if (!location || isEmpty(location)) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_node_location')}>
            <NodeInfo node={location} />
        </SectionWithTitle>
    );
}

interface PeerLocationProps {
    location: Location['peer'];
}

function PeerLocation({location}: PeerLocationProps) {
    if (!location || isEmpty(location)) {
        return null;
    }

    return (
        <SectionWithTitle title={i18n('label_peer_location')}>
            <NodeInfo node={location} title={i18n('label_peer')} />
        </SectionWithTitle>
    );
}
