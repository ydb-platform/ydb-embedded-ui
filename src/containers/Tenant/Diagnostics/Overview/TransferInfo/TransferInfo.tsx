import type {DefinitionListItem} from '@gravity-ui/components';
import {Flex, Text} from '@gravity-ui/uikit';

import {AsyncReplicationState} from '../../../../../components/AsyncReplicationState';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {getEntityName} from '../../../utils';

import {Credentials} from './Credentials';
import i18n from './i18n';

interface TransferProps {
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for Transfer EPathType */
export function TransferInfo({data}: TransferProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return (
            <div className="error">
                {i18n('noData')} {entityName}
            </div>
        );
    }

    const transferItems = prepareTransferItems(data);

    return (
        <Flex direction="column" gap="4">
            <YDBDefinitionList title={entityName} items={transferItems} />
        </Flex>
    );
}

function prepareTransferItems(data: TEvDescribeSchemeResult) {
    const transferDescription = data.PathDescription?.ReplicationDescription || {};
    const state = transferDescription.State;
    const srcConnectionParams = transferDescription.Config?.SrcConnectionParams || {};
    const {Endpoint, Database} = srcConnectionParams;
    const target = transferDescription.Config?.TransferSpecific?.Targets[0];
    const srcPath = target?.SrcPath;
    const dstPath = target?.DstPath;
    const transformLambda = target?.TransformLambda;

    const info: DefinitionListItem[] = [];

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

    // TODO use true pre
    info.push({
        name: i18n('transformLambda.label'),
        copyText: transformLambda,
        content: (
            <Text variant="code-2" whiteSpace="nowrap">
                <pre>{transformLambda}</pre>
            </Text>
        ),
    });

    return info;
}
