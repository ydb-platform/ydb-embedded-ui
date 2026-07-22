import {Text} from '@gravity-ui/uikit';

import {AsyncReplicationState} from '../../../../../components/AsyncReplicationState';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {AsyncReplicationPaths} from '../AsyncReplicationPaths';

import {Credentials} from './Credentials';
import i18n from './i18n';

interface AsyncReplicationProps {
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for Replication EPathType */
export function AsyncReplicationInfo({data}: AsyncReplicationProps) {
    if (!data) {
        return null;
    }

    return <AsyncReplicationPaths config={data.PathDescription?.ReplicationDescription?.Config} />;
}

export function prepareReplicationItems(data: TEvDescribeSchemeResult): YDBDefinitionListItem[] {
    const replicationDescription = data.PathDescription?.ReplicationDescription || {};
    const state = replicationDescription.State;
    const srcConnectionParams = replicationDescription.Config?.SrcConnectionParams || {};
    const {Endpoint, Database} = srcConnectionParams;

    const info: YDBDefinitionListItem[] = [];

    if (state) {
        info.push({
            name: i18n('state.label'),
            content: <AsyncReplicationState state={state} />,
        });
    }

    if (Endpoint) {
        info.push({
            name: i18n('srcConnection.endpoint.label'),
            copyText: Endpoint,
            content: <Text variant="code-inline-2">{Endpoint}</Text>,
        });
    }

    if (Database) {
        info.push({
            name: i18n('srcConnection.database.label'),
            copyText: Database,
            content: <Text variant="code-inline-2">{Database}</Text>,
        });
    }

    if (srcConnectionParams) {
        info.push({
            name: i18n('credentials.label'),
            content: <Credentials connection={srcConnectionParams} />,
        });
    }

    return info;
}
