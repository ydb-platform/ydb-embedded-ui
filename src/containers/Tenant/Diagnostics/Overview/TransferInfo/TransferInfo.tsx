import React from 'react';

import {Label, Text} from '@gravity-ui/uikit';

import {Loader} from '../../../../../components/Loader';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YQLCodePreview} from '../../../../../components/YQLCodePreview/YQLCodePreview';
import {useClusterWithProxy} from '../../../../../store/reducers/cluster/cluster';
import {replicationApi} from '../../../../../store/reducers/replication';
import type {DescribeReplicationResult} from '../../../../../types/api/replication';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';

import {Credentials} from './Credentials';
import i18n from './i18n';

import './TransferInfo.scss';

interface TransferProps {
    path: string;
    database: string;
    databaseFullPath: string;
    data?: TEvDescribeSchemeResult;
}

const b = cn('ydb-transfer-info');

/** Displays overview for Transfer EPathType */
export function TransferInfo({path, database, data, databaseFullPath}: TransferProps) {
    const useMetaProxy = useClusterWithProxy();

    if (!data) {
        return null;
    }

    const {data: replicationData, isFetching} = replicationApi.useGetReplicationQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {},
    );
    const loading = isFetching && replicationData === undefined;

    if (loading) {
        return <Loader size="s" className={b('loader')} />;
    }

    const {items, transformLambda} = prepareTransferItems(data, replicationData);

    return (
        <React.Fragment>
            <YDBDefinitionList items={items} />
            {transformLambda ? (
                <YQLCodePreview title={i18n('transformLambda.label')} text={transformLambda} />
            ) : null}
        </React.Fragment>
    );
}

function transferState(state: DescribeReplicationResult | undefined) {
    if (!state) {
        return null;
    }

    if ('running' in state) {
        return <Label theme="info">Running</Label>;
    }
    if ('paused' in state) {
        return <Label theme="info">Paused</Label>;
    }
    if ('done' in state) {
        return <Label theme="success">Done</Label>;
    }
    if ('error' in state) {
        return <Label theme="danger">Error</Label>;
    }

    return <Label size="s">Unknown</Label>;
}

function prepareTransferItems(
    data: TEvDescribeSchemeResult,
    replicationData: DescribeReplicationResult | undefined,
) {
    const transferDescription = data.PathDescription?.ReplicationDescription || {};
    const srcConnectionParams = transferDescription.Config?.SrcConnectionParams || {};
    const {Endpoint, Database} = srcConnectionParams;
    const target = transferDescription.Config?.TransferSpecific?.Target;
    const srcPath = target?.SrcPath;
    const dstPath = target?.DstPath;
    const transformLambda = target?.TransformLambda;

    const info: YDBDefinitionListItem[] = [];

    if (replicationData) {
        info.push({
            name: i18n('state.label'),
            content: transferState(replicationData),
        });
    }

    if (replicationData?.error?.issues && replicationData.error.issues[0]?.message) {
        info.push({
            name: i18n('state.error'),
            copyText: replicationData.error.issues[0].message,
            content: (
                <Text variant="code-inline-2" color="danger">
                    {replicationData.error.issues[0].message}
                </Text>
            ),
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

    info.push({
        name: i18n('srcPath.label'),
        copyText: srcPath,
        content: <Text variant="code-inline-2">{srcPath}</Text>,
    });

    info.push({
        name: i18n('dstPath.label'),
        copyText: dstPath,
        content: <Text variant="code-inline-2">{dstPath}</Text>,
    });

    return {items: info, transformLambda};
}
