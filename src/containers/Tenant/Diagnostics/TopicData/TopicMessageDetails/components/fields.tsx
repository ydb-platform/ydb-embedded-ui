import type {TopicMessageEnhanced} from '../../../../../../types/api/topic';
import {
    codecColumn,
    messageColumn,
    metadataColumn,
    originalSizeColumn,
    seqNoColumn,
    sizeColumn,
    timestampCreateColumn,
    timestampWriteColumn,
    tsDiffColumn,
    valueOrPlaceholder,
} from '../../columns/columns';
import {useTopicDataQueryParams} from '../../useTopicDataQueryParams';
import {TOPIC_DATA_COLUMNS_TITLES} from '../../utils/constants';
import {TOPIC_DATA_COLUMNS_IDS} from '../../utils/types';

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

const producerIdColumn: TopicMessageDetailsField = {
    name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID,
    header: TOPIC_DATA_COLUMNS_TITLES[TOPIC_DATA_COLUMNS_IDS.PRODUCERID],
    render: ({row}) => {
        return valueOrPlaceholder(row.ProducerId);
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
