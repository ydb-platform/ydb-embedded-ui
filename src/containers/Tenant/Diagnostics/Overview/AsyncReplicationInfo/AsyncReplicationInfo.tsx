import {Flex, Text} from '@gravity-ui/uikit';

import {AsyncReplicationState} from '../../../../../components/AsyncReplicationState';
import {InfoViewer} from '../../../../../components/InfoViewer';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {useTypedSelector} from '../../../../../utils/hooks';
import {getEntityName} from '../../../utils';
import {AsyncReplicationPaths} from '../AsyncReplicationPaths';

import {Credentials} from './Credentials';
import i18n from './i18n';

interface AsyncReplicationProps {
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for Replication EPathType */
export function AsyncReplicationInfo({data}: AsyncReplicationProps) {
    const entityName = getEntityName(data?.PathDescription);

    const {error: schemaError} = useTypedSelector((state) => state.schema);

    if (schemaError) {
        return <div className="error">{schemaError.statusText}</div>;
    }

    if (!data) {
        return (
            <div className="error">
                {i18n('noData')} {entityName}
            </div>
        );
    }

    return (
        <Flex direction="column" gap="4">
            <InfoViewer
                title={entityName}
                info={[
                    {
                        label: i18n('state.label'),
                        value: (
                            <AsyncReplicationState
                                state={data.PathDescription?.ReplicationDescription?.State}
                            />
                        ),
                    },
                    {
                        label: i18n('srcConnection.endpoint.label'),
                        value: (
                            <Text variant="code-inline-2">
                                {
                                    data.PathDescription?.ReplicationDescription?.Config
                                        ?.SrcConnectionParams?.Endpoint
                                }
                            </Text>
                        ),
                    },
                    {
                        label: i18n('srcConnection.database.label'),
                        value: (
                            <Text variant="code-inline-2">
                                {
                                    data.PathDescription?.ReplicationDescription?.Config
                                        ?.SrcConnectionParams?.Database
                                }
                            </Text>
                        ),
                    },
                    {
                        label: i18n('credentials.label'),
                        value: (
                            <Credentials
                                connection={
                                    data.PathDescription?.ReplicationDescription?.Config
                                        ?.SrcConnectionParams
                                }
                            />
                        ),
                    },
                ]}
            />
            <AsyncReplicationPaths config={data.PathDescription?.ReplicationDescription?.Config} />
        </Flex>
    );
}
