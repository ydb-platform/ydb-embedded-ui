import {Flex, Text} from '@gravity-ui/uikit';

import {AsyncReplicationState} from '../../../../../components/AsyncReplicationState';
import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {replicationApi} from '../../../../../store/reducers/replication';
import type {DescribeReplicationResult} from '../../../../../types/api/replication';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {getEntityName} from '../../../utils';

import {Credentials} from './Credentials';
import i18n from './i18n';

interface TransferProps {
    path: string;
    database: string;
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for Transfer EPathType */
export function TransferInfo({path, database, data}: TransferProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return (
            <div className="error">
                {i18n('noData')} {entityName}
            </div>
        );
    }

    const {data: replicationData} = replicationApi.useGetReplicationQuery({path, database}, {});
    const transferItems = prepareTransferItems(data, replicationData);

    return (
        <Flex direction="column" gap="4">
            <YDBDefinitionList title={entityName} items={transferItems} />
        </Flex>
    );
}

function prepareTransferItems(
    data: TEvDescribeSchemeResult,
    replicationData: DescribeReplicationResult | undefined,
) {
    const transferDescription = data.PathDescription?.ReplicationDescription || {};
    const state = transferDescription.State;
    const srcConnectionParams = transferDescription.Config?.SrcConnectionParams || {};
    const {Endpoint, Database} = srcConnectionParams;
    const target = transferDescription.Config?.TransferSpecific?.Target;
    const srcPath = target?.SrcPath;
    const dstPath = target?.DstPath;
    const transformLambda = target?.TransformLambda;

    const info: YDBDefinitionListItem[] = [];

    if (state) {
        info.push({
            name: i18n('state.label'),
            content: <AsyncReplicationState state={state} />,
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

    info.push({
        name: i18n('transformLambda.label'),
        copyText: transformLambda,
        content: transformLambda ? (
            <YDBSyntaxHighlighter language="yql" text={transformLambda} />
        ) : null,
    });

    return info;
}
