import {isNil} from 'lodash';

import type {FetchData} from '../../../../components/PaginatedTable';
import {TOPIC_MESSAGE_SIZE_LIMIT} from '../../../../store/reducers/topic';
import type {
    TopicDataRequest,
    TopicDataResponse,
    TopicMessage,
    TopicMessageEnhanced,
} from '../../../../types/api/topic';
import {safeParseNumber} from '../../../../utils/utils';

import {TOPIC_DATA_FETCH_LIMIT} from './utils/constants';
import type {TopicDataFilters} from './utils/types';

const emptyData = {data: [], total: 0, found: 0};

interface GetTopicDataProps {
    setStartOffset: (offset: number) => void;
    setEndOffset: (offset: number) => void;
    baseOffset?: number;
}

export function prepareResponse(response: TopicDataResponse, offset: number) {
    const {StartOffset, EndOffset, Messages = []} = response;

    const start = safeParseNumber(StartOffset);
    const end = safeParseNumber(EndOffset);

    const normalizedMessages: TopicMessageEnhanced[] = [];

    const limit = Math.min(TOPIC_DATA_FETCH_LIMIT, Math.max(end - offset, 0));
    let i = 0;
    let j = 0;
    while (j < limit) {
        const currentOffset = offset + j;
        const currentMessage = Messages[i];
        if (currentOffset < start) {
            normalizedMessages.push({
                Offset: currentOffset,
                removed: true,
            });
        } else if (
            !isNil(currentMessage?.Offset) &&
            String(currentMessage.Offset) === String(currentOffset)
        ) {
            normalizedMessages.push(currentMessage);
            i++;
        } else {
            normalizedMessages.push({
                Offset: currentOffset,
                removed: true,
            });
        }
        j++;
    }
    return {start, end, messages: normalizedMessages};
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

        const queryParams: TopicDataRequest = {
            ...rest,
            partition,
            limit,
            last_offset: normalizedOffset + limit,
            message_size_limit: TOPIC_MESSAGE_SIZE_LIMIT,
        };
        queryParams.offset = normalizedOffset;

        const response = await window.api.viewer.getTopicData(queryParams);

        const {start, end, messages} = prepareResponse(response, normalizedOffset);

        //need to update start and end offsets every time data is fetched to show fresh data in parent component
        setStartOffset(start);
        setEndOffset(end);

        const quantity = end - baseOffset;

        return {
            data: messages,
            total: quantity,
            found: quantity,
        };
    };

    return getTopicData;
};
