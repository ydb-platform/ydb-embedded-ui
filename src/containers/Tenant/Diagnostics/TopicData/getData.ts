import {isNil} from 'lodash';

import type {FetchData} from '../../../../components/PaginatedTable';
import type {TopicDataRequest, TopicMessage} from '../../../../types/api/topic';
import {safeParseNumber} from '../../../../utils/utils';

import type {TopicDataFilters} from './utils/types';

const emptyData = {data: [], total: 0, found: 0};

interface GetTopicDataProps {
    setStartOffset: (offset: number) => void;
    setEndOffset: (offset: number) => void;
}

export const generateTopicDataGetter = ({setStartOffset, setEndOffset}: GetTopicDataProps) => {
    const getTopicData: FetchData<TopicMessage, TopicDataFilters> = async ({
        limit,
        offset: tableOffset,
        filters,
    }) => {
        if (!filters) {
            return emptyData;
        }

        const {partition, isEmpty, ...rest} = filters;

        if (isNil(partition) || isEmpty) {
            return emptyData;
        }

        const queryParams: TopicDataRequest = {...rest, partition, limit};
        queryParams.offset = tableOffset;

        const response = await window.api.viewer.getTopicData(queryParams);

        const {StartOffset, EndOffset, Messages = []} = response;

        const start = safeParseNumber(StartOffset);
        const end = safeParseNumber(EndOffset);

        //need to update start and end offsets every time data is fetched to show fresh data in parent component
        setStartOffset(start);
        setEndOffset(end);

        const quantity = end - start;

        return {
            data: Messages,
            total: quantity,
            found: quantity,
        };
    };

    return getTopicData;
};
