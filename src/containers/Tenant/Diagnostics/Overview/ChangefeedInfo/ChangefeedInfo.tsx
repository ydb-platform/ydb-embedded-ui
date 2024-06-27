import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {InfoViewer, formatObject} from '../../../../../components/InfoViewer';
import {
    formatCdcStreamItem,
    formatCommonItem,
} from '../../../../../components/InfoViewer/formatters';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
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
    path: string;
    data?: TEvDescribeSchemeResult;
    topic?: TEvDescribeSchemeResult;
}

/** Displays overview for CDCStream EPathType */
export const ChangefeedInfo = ({path, data, topic}: ChangefeedProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data || !topic) {
        return <div className="error">No {entityName} data</div>;
    }

    return (
        <div>
            <InfoViewer title={entityName} info={prepareChangefeedInfo(data, topic)} />
            <TopicStats path={path} />
        </div>
    );
};
