import {isNil} from 'lodash';

import type {FetchData} from '../../../../components/PaginatedTable';
import type {TopicDataRequest, TopicMessage} from '../../../../types/api/topic';
import {convertToNumber} from '../../../../utils/utils';

import type {TopicDataFilters} from './utils/types';

const getInitialOffset = ({
    topicDataFilter,
    selectedOffset = 0,
    initialOffset = 0,
    fromOffset,
}: Pick<TopicDataFilters, 'topicDataFilter' | 'selectedOffset'> & {
    initialOffset?: number;
    fromOffset?: number;
}) => {
    if (!isNil(fromOffset)) {
        return fromOffset;
    }
    if (topicDataFilter === 'TIMESTAMP') {
        return undefined;
    }
    return Math.max(selectedOffset, initialOffset);
};

interface GetTopicDataProps {
    setStartOffset: (offset: number) => void;
    setEndOffset: (offset: number) => void;
    initialOffset?: number;
}

const emptyData = {data: [], total: 0, found: 0};

export const generateTopicDataGetter = ({
    initialOffset = 0,
    setStartOffset,
    setEndOffset,
}: GetTopicDataProps) => {
    let lostOffsets = 0;
    let fromOffset: number | undefined;

    const getTopicData: FetchData<TopicMessage, TopicDataFilters> = async ({
        limit,
        offset: tableOffset,
        filters,
    }) => {
        if (!filters) {
            return emptyData;
        }

        const {partition, selectedOffset, startTimestamp, topicDataFilter, ...rest} = filters;

        if (isNil(partition)) {
            return emptyData;
        }

        const queryParams: TopicDataRequest = {...rest, partition, limit};

        fromOffset = getInitialOffset({topicDataFilter, selectedOffset, initialOffset, fromOffset});

        if (topicDataFilter === 'TIMESTAMP' && isNil(fromOffset)) {
            // get data from timestamp only the very first time. Next fetch we will already know offset
            queryParams.read_timestamp = startTimestamp;
        } else {
            const normalizedOffset = (fromOffset ?? 0) + tableOffset + lostOffsets;
            queryParams.offset = normalizedOffset;
        }

        const response = await window.api.viewer.getTopicData(queryParams);

        const {StartOffset, EndOffset, Messages = []} = response;

        const start = convertToNumber(StartOffset);
        const end = convertToNumber(EndOffset);
        //need to update start and end offsets every time data is fetched to show fresh data in parent component
        setStartOffset(start);
        setEndOffset(end);

        if (isNil(fromOffset)) {
            fromOffset = Messages.length ? convertToNumber(Messages[0].Offset) : end;
        }

        const normalizedOffset = fromOffset + tableOffset + lostOffsets;
        const lastMessageOffset = Messages.length
            ? convertToNumber(Messages[Messages.length - 1].Offset)
            : 0;

        const quantity = end - fromOffset - lostOffsets;

        lostOffsets += normalizedOffset + limit - lastMessageOffset - 1;

        return {
            data: Messages,
            total: quantity,
            found: quantity,
        };
    };
    return getTopicData;
};
