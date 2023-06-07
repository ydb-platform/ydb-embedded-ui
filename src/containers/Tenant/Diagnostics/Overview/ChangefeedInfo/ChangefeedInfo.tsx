import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import {formatObject, InfoViewer, InfoViewerItem} from '../../../../../components/InfoViewer';
import {
    formatCdcStreamItem,
    formatCommonItem,
} from '../../../../../components/InfoViewer/formatters';

import {useTypedSelector} from '../../../../../utils/hooks';
import {selectSchemaData} from '../../../../../store/reducers/schema/schema';

import {getEntityName} from '../../../utils';

import {TopicStats} from '../TopicStats';

import {prepareTopicSchemaInfo} from '../utils';

const prepareChangefeedInfo = (
    changefeedData?: TEvDescribeSchemeResult,
    topicData?: TEvDescribeSchemeResult,
): Array<InfoViewerItem> => {
    if (!changefeedData && !topicData) {
        return [];
    }

    const streamDescription = changefeedData?.PathDescription?.CdcStreamDescription;

    const {Mode, Format} = streamDescription || {};

    const created = formatCommonItem(
        'CreateStep',
        changefeedData?.PathDescription?.Self?.CreateStep,
    );
    const changefeedInfo = formatObject(formatCdcStreamItem, {
        Mode,
        Format,
    });
    const topicInfo = prepareTopicSchemaInfo(topicData);

    return [created, ...changefeedInfo, ...topicInfo];
};

interface ChangefeedProps {
    data?: TEvDescribeSchemeResult;
    childrenPaths?: string[];
}

/** Displays overview for CDCStream EPathType */
export const ChangefeedInfo = ({data, childrenPaths}: ChangefeedProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const {error: schemaError} = useTypedSelector((state) => state.schema);
    const pqGroupData = useTypedSelector((state) => selectSchemaData(state, childrenPaths?.[0]));

    if (schemaError) {
        return <div className="error">{schemaError.statusText}</div>;
    }

    if (!data || !pqGroupData) {
        return <div className="error">No {entityName} data</div>;
    }

    return (
        <div>
            <InfoViewer title={entityName} info={prepareChangefeedInfo(data, pqGroupData)} />
            <TopicStats />
        </div>
    );
};
