import {isNil} from 'lodash';

import type {FetchData} from '../../../../components/PaginatedTable';
import type {TopicDataRequest, TopicMessage} from '../../../../types/api/topic';
import {safeParseNumber} from '../../../../utils/utils';

import {TOPIC_DATA_FETCH_LIMIT} from './utils/constants';
import type {TopicDataFilters} from './utils/types';

const emptyData = {data: [], total: 0, found: 0};

interface GetTopicDataProps {
    setStartOffset: (offset: number) => void;
    setEndOffset: (offset: number) => void;
    baseOffset?: number;
}

export const generateTopicDataGetter = ({
    setStartOffset,
    setEndOffset,
    baseOffset = 0,
}: GetTopicDataProps) => {
    const getTopicData: FetchData<TopicMessage, TopicDataFilters> = async ({
        limit,
        offset: tableOffset,
        filters,
    }) => {
        if (!filters) {
            return emptyData;
        }

        const {partition, isEmpty, ...rest} = filters;

        if (isNil(partition) || partition === '' || isEmpty) {
            return emptyData;
        }

        const normalizedOffset = baseOffset + tableOffset;

        const queryParams: TopicDataRequest = {...rest, partition, limit};
        queryParams.offset = normalizedOffset;

        const response = await window.api.viewer.getTopicData(queryParams);

        const {StartOffset, EndOffset, Messages = []} = response;

        const start = safeParseNumber(StartOffset);
        const end = safeParseNumber(EndOffset);

        const removedMessagesCount = start - normalizedOffset;

        const result = [];
        for (let i = 0; i < Math.min(TOPIC_DATA_FETCH_LIMIT, removedMessagesCount); i++) {
            result.push({
                Offset: `Offset ${normalizedOffset + i} removed`,
            });
        }
        for (
            let i = 0;
            i <
            Math.min(
                TOPIC_DATA_FETCH_LIMIT,
                TOPIC_DATA_FETCH_LIMIT - removedMessagesCount,
                Messages.length,
            );
            i++
        ) {
            result.push(Messages[i]);
        }

        //need to update start and end offsets every time data is fetched to show fresh data in parent component
        setStartOffset(start);
        setEndOffset(end);

        const quantity = end - baseOffset;

        return {
            data: result,
            total: quantity,
            found: quantity,
        };
    };

    return getTopicData;
};
