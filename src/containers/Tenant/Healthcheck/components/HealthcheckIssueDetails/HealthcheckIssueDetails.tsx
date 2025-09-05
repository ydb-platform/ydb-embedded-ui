import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {InternalLink} from '../../../../../components/InternalLink';
import {getTabletPagePath} from '../../../../../routes';
import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {useTenantQueryParams} from '../../../useTenantQueryParams';
import i18n from '../../i18n';

import type {LocationFieldCompute} from './ComputeLocation';
import {IssueLocation} from './IssueLocation';
import type {LocationFieldStorage} from './StorageLocation';
import {IdList, LocationDetails} from './utils';

interface HealthcheckIssueDetailsProps {
    issue: IssuesTree;
}

export function IssueDetails({issue}: HealthcheckIssueDetailsProps) {
    const {database} = useTenantQueryParams();

    const {detailsFields, hiddenStorageFields, hiddenComputeFields} = React.useMemo(() => {
        const hiddenStorageFields: LocationFieldStorage[] = [];
        const hiddenComputeFields: LocationFieldCompute[] = [];
        const fields: {value?: React.ReactNode; title: string}[] = [
            {value: issue.message, title: i18n('label_description')},
        ];
        if (issue.type === 'STORAGE_POOL') {
            fields.push({
                value: issue.location?.storage?.pool?.name,
                title: i18n('label_pool-name'),
            });
            hiddenStorageFields.push('pool');
        }
        if (issue.type === 'COMPUTE_POOL') {
            fields.push({
                value: issue.location?.compute?.pool?.name,
                title: i18n('label_pool-name'),
            });
            hiddenComputeFields.push('pool');
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
                    title: i18n('label_tablet-id'),
                },
                {
                    value: tablet?.type,
                    title: i18n('label_tablet-type'),
                },
                {
                    value: tablet?.count,
                    title: i18n('label_tablet-count'),
                },
            );
            hiddenComputeFields.push('tablet');
        }
        return {detailsFields: fields, hiddenComputeFields, hiddenStorageFields};
    }, [issue, database]);

    const {location} = issue;

    return (
        <Flex direction="column" gap={4}>
            <LocationDetails
                title={i18n('label_details')}
                fields={detailsFields}
                titleVariant="subheader-2"
            />
            <IssueLocation
                location={location}
                hiddenStorageFields={hiddenStorageFields}
                hiddenComputeFields={hiddenComputeFields}
            />
        </Flex>
    );
}
