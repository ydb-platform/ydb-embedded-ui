import {DefinitionList, Flex} from '@gravity-ui/uikit';

import type {TopicMessage} from '../../../../../../types/api/topic';
import {TOPIC_DATA_COLUMNS_IDS} from '../../utils/types';
import {b} from '../shared';

import {fields} from './fields';

const dataGroups = [
    [
        {name: TOPIC_DATA_COLUMNS_IDS.PARTITION, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.OFFSET, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.SIZE, copy: false},
    ],
    [
        {name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_CREATE, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.TIMESTAMP_WRITE, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.TS_DIFF, copy: false},
    ],
    [
        {name: TOPIC_DATA_COLUMNS_IDS.ORIGINAL_SIZE, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.CODEC, copy: false},
        {name: TOPIC_DATA_COLUMNS_IDS.PRODUCERID, copy: true},
        {name: TOPIC_DATA_COLUMNS_IDS.SEQNO, copy: false},
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
                        const column = fields.find((c) => c.name === item.name);
                        return (
                            <DefinitionList.Item
                                key={item.name}
                                name={column?.header}
                                copyText={item.copy ? item.name : undefined}
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
