import block from 'bem-cn-lite';

import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {useTypedSelector} from '../../../../utils/hooks';

import {InfoViewer, InfoViewerItem} from '../../../../components/InfoViewer';
import {formatCommonItem} from '../../../../components/InfoViewer/formatters';
import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {getEntityName} from '../../utils';

import i18n from '../i18n';
import './ExternalDataSource.scss';

const b = block('ydb-external-data-source-info');

const prepareExternalDataSourceSummary = (data: TEvDescribeSchemeResult): InfoViewerItem[] => {
    return [
        {
            label: i18n('external-objects.source-type'),
            value: data.PathDescription?.ExternalDataSourceDescription?.SourceType,
        },
        formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep),
    ];
};

const prepareExternalDataSourceInfo = (data: TEvDescribeSchemeResult): InfoViewerItem[] => {
    const {Location, Auth} = data.PathDescription?.ExternalDataSourceDescription || {};

    return [
        ...prepareExternalDataSourceSummary(data),
        {
            label: i18n('external-objects.location'),
            value: (
                <EntityStatus
                    name={Location}
                    showStatus={false}
                    hasClipboardButton
                    clipboardButtonAlwaysVisible
                    className={b('location')}
                />
            ),
        },
        {
            label: i18n('external-objects.auth-method'),
            value: Auth?.ServiceAccount
                ? i18n('external-objects.auth-method.service-account')
                : i18n('external-objects.auth-method.none'),
        },
    ];
};

interface ExternalDataSourceProps {
    data?: TEvDescribeSchemeResult;
    prepareData: (data: TEvDescribeSchemeResult) => InfoViewerItem[];
}

const ExternalDataSource = ({data, prepareData}: ExternalDataSourceProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const {error: schemaError} = useTypedSelector((state) => state.schema);

    if (schemaError) {
        return <ResponseError error={schemaError} />;
    }

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    return <InfoViewer title={entityName} info={prepareData(data)} />;
};

export const ExternalDataSourceInfo = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalDataSource data={data} prepareData={prepareExternalDataSourceInfo} />;
};

export const ExternalDataSourceSummary = ({data}: {data?: TEvDescribeSchemeResult}) => {
    return <ExternalDataSource data={data} prepareData={prepareExternalDataSourceSummary} />;
};
