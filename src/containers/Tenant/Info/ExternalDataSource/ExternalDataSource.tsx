import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {formatCommonItem} from '../../../../components/InfoViewer/formatters';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {getEntityName} from '../../utils';
import i18n from '../i18n';

import './ExternalDataSource.scss';

const b = cn('ydb-external-data-source-info');

const prepareExternalDataSourceSummary = (data: TEvDescribeSchemeResult) => {
    const info: InfoViewerItem[] = [
        {
            label: i18n('external-objects.source-type'),
            value: data.PathDescription?.ExternalDataSourceDescription?.SourceType,
        },
    ];

    const createStep = data.PathDescription?.Self?.CreateStep;

    if (Number(createStep)) {
        info.push(formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep));
    }

    return info;
};

function getAuthMethodValue(data: TEvDescribeSchemeResult) {
    const {Auth} = data.PathDescription?.ExternalDataSourceDescription || {};
    if (Auth?.ServiceAccount) {
        return i18n('external-objects.auth-method.service-account');
    }
    if (Auth?.Aws) {
        return i18n('external-objects.auth-method.aws');
    }
    return i18n('external-objects.auth-method.none');
}

const prepareExternalDataSourceInfo = (data: TEvDescribeSchemeResult): InfoViewerItem[] => {
    const {Location} = data.PathDescription?.ExternalDataSourceDescription || {};

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
            value: getAuthMethodValue(data),
        },
    ];
};

interface ExternalDataSourceProps {
    data?: TEvDescribeSchemeResult;
    prepareData: (data: TEvDescribeSchemeResult) => InfoViewerItem[];
}

const ExternalDataSource = ({data, prepareData}: ExternalDataSourceProps) => {
    const entityName = getEntityName(data?.PathDescription);

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
