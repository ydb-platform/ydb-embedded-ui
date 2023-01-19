import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import {InfoViewer} from '../../../../../components/InfoViewer';

import {useTypedSelector} from '../../../../../utils/hooks';

import {getEntityName} from '../../../utils';

import {prepareTopicSchemaInfo} from '../utils';

import {TopicStats} from '../TopicStats';

interface TopicInfoProps {
    data?: TEvDescribeSchemeResult;
}

/** Displays overview for PersQueueGroup EPathType */
export const TopicInfo = ({data}: TopicInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const {error: schemaError} = useTypedSelector((state) => state.schema);

    if (schemaError) {
        return <div className="error">{schemaError.statusText}</div>;
    }

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    return (
        <div>
            <InfoViewer title={entityName} info={prepareTopicSchemaInfo(data)} />
            <TopicStats />
        </div>
    );
};
