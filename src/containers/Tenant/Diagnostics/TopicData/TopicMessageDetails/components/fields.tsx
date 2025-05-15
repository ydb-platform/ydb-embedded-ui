import {isNil} from 'lodash';

import type {TopicMessageEnhanced} from '../../../../../../types/api/topic';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../../utils/constants';
import {
    TopicDataTimestamp,
    codecColumn,
    messageColumn,
    metadataColumn,
    originalSizeColumn,
    sizeColumn,
    tsDiffColumn,
} from '../../columns/columns';
import {useTopicDataQueryParams} from '../../useTopicDataQueryParams';
import {TOPIC_DATA_COLUMNS_TITLES} from '../../utils/constants';
import {TOPIC_DATA_COLUMNS_IDS} from '../../utils/types';

function valueOrPlaceholder(
    value: string | number | undefined,
    placeholder = EMPTY_DATA_PLACEHOLDER,
) {
    return isNil(value) ? placeholder : value;
}

type TopicMessageDetailsField = {
    name: string;
    header?: React.ReactNode;
    render: (props: {row: TopicMessageEnhanced}) => React.ReactNode;
};

const partitionColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.PARTITION,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.PARTITION],
    render: () => {
        return <PartitionId />;
    },
};
const offsetColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.OFFSET,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.OFFSET],
    render: ({row}) => {
        return valueOrPlaceholder(row.Offset);
    },
};

const timestampCreateColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE],
    render: ({row}) => <TopicDataTimestamp timestamp={row.CreateTimestamp} />,
};
const timestampWriteColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE],
    render: ({row}) => <TopicDataTimestamp timestamp={row.WriteTimestamp} />,
};

const producerIdColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.PRODUCERID],
    render: ({row}) => {
        return valueOrPlaceholder(row.ProducerId);
    },
};
const seqNoColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.SEQNO,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.SEQNO],
    render: ({row}) => {
        return valueOrPlaceholder(row.SeqNo);
    },
};

function PartitionId() {
    const {selectedPartition} = useTopicDataQueryParams();
    return selectedPartition;
}

export const fields: TopicMessageDetailsField[] = [
    partitionColumn,
    offsetColumn,
    timestampCreateColumn,
    timestampWriteColumn,
    tsDiffColumn,
    metadataColumn,
    messageColumn,
    sizeColumn,
    originalSizeColumn,
    codecColumn,
    producerIdColumn,
    seqNoColumn,
];
