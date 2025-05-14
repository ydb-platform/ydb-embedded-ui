import {DefinitionList, Flex} from '@gravity-ui/uikit';

import type {TopicMessage} from '../../../../../../types/api/topic';
import type {ValueOf} from '../../../../../../types/common';
import {formatTimestamp} from '../../../../../../utils/dataFormatters/dataFormatters';
import {TOPIC_DATA_COLUMNS_IDS} from '../../utils/types';
import {b} from '../shared';

import {fields} from './fields';

const dataGroups: {
    name: ValueOf<typeof TOPIC_DATA_COLUMNS_IDS>;
    copy?: (row: TopicMessage) => string | undefined;
}[][] = [
    [
        {name: TOPIC_DATA_COLUMNS_IDS.PARTITION},
        {name: TOPIC_DATA_COLUMNS_IDS.OFFSET},
        {name: TOPIC_DATA_COLUMNS_IDS.SIZE},
    ],
    [
        {
            name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE,
            copy: (row) => formatTimestamp(row.CreateTimestamp),
        },
        {
            name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE,
            copy: (row) => formatTimestamp(row.WriteTimestamp),
        },
        {name: TOPIC_DATA_COLUMNS_IDS.TS_DIFF},
    ],
    [
        {name: TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE},
        {name: TOPIC_DATA_COLUMNS_IDS.CODEC},
        {name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID, copy: (row) => row.ProducerId},
        {name: TOPIC_DATA_COLUMNS_IDS.SEQNO},
    ],
];

interface TopicMessageGeneralInfoProps {
    messageData: TopicMessage;
}

export function TopicMessageGeneralInfo({messageData}: TopicMessageGeneralInfoProps) {
    return (
        <Flex direction="column" gap={3} className={b('details')}>
            {dataGroups.map((group, index) => (
                <DefinitionList className={b('list')} nameMaxWidth={200} key={index}>
                    {group.map((item) => {
                        const column = fields.find((f) => f.name === item.name);
                        const copyText = item.copy?.(messageData);
                        return (
                            <DefinitionList.Item
                                key={item.name}
                                name={column?.header}
                                copyText={copyText}
                            >
                                {column?.render?.({row: messageData})}
                            </DefinitionList.Item>
                        );
                    })}
                </DefinitionList>
            ))}
        </Flex>
    );
}
