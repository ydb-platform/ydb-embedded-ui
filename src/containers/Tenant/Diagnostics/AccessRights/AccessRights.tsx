import React from 'react';

import {PersonPlus} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {useEditAccessAvailable} from '../../../../store/reducers/capabilities/hooks';
import {schemaAclApi} from '../../../../store/reducers/schemaAcl/schemaAcl';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {useCurrentSchema} from '../../TenantContext';
import {useTenantQueryParams} from '../../useTenantQueryParams';

import {Owner} from './components/Owner';
import {RightsTable} from './components/RightsTable/RightsTable';
import i18n from './i18n';
import {block} from './shared';

import './AccessRights.scss';

export function AccessRights() {
    const {path, database} = useCurrentSchema();
    const editable = useEditAccessAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = schemaAclApi.useGetSchemaAclQuery(
        {path, database},
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const {handleShowGrantAccessChange} = useTenantQueryParams();

    const loading = isFetching && !currentData;

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        return (
            <React.Fragment>
                <Flex
                    gap={10}
                    justifyContent="space-between"
                    alignItems="start"
                    className={block('header')}
                >
                    <Owner />
                    {editable && (
                        <Button
                            view="action"
                            onClick={() => {
                                handleShowGrantAccessChange(true);
                            }}
                        >
                            <Icon data={PersonPlus} />
                            {i18n('action_grant-access')}
                        </Button>
                    )}
                </Flex>
                <RightsTable />
            </React.Fragment>
        );
    };

    return <LoaderWrapper loading={loading}>{renderContent()}</LoaderWrapper>;
}
