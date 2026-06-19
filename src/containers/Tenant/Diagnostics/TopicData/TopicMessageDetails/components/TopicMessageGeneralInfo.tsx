import {DefinitionList, Flex} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {TopicMessage} from '../../../../../../types/api/topic';
import type {ValueOf} from '../../../../../../types/common';
import {formatTimestamp} from '../../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';
import {TOPIC_DATA_COLUMNS_IDS} from '../../utils/types';
import {b} from '../shared';

import {fields} from './fields';

type SchemaInfo = {
    ProtoMessageName?: string;
    Protoseq?: string | number;
    SchemaPath?: string;
};

type MessageInfoField = {
    name: ValueOf<typeof TOPIC_DATA_COLUMNS_IDS>;
    copy?: (row: TopicMessage) => string | undefined;
};

const dataGroups: MessageInfoField[][] = [
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
        {name: TOPIC_DATA_COLUMNS_IDS.SEQNO, copy: (row) => row.SeqNo},
        {name: TOPIC_DATA_COLUMNS_IDS.IP, copy: (row) => row.Ip},
    ],
];

const schemaInfoFields: {name: keyof SchemaInfo; header: string}[] = [
    {name: 'ProtoMessageName', header: i18n('label_proto-message-name')},
    {name: 'Protoseq', header: i18n('label_protoseq')},
    {name: 'SchemaPath', header: i18n('label_schema-path')},
];

interface TopicMessageGeneralInfoProps {
    messageData: TopicMessage;
    schemaInfo?: SchemaInfo;
}

function renderField(item: MessageInfoField, messageData: TopicMessage) {
    const field = fields.find((f) => f.name === item.name);
    const copyText = item.copy?.(messageData);

    return (
        <DefinitionList.Item key={item.name} name={field?.header} copyText={copyText}>
            {field?.render({row: messageData})}
        </DefinitionList.Item>
    );
}

function renderDataGroups(messageData: TopicMessage) {
    return dataGroups.map((group, index) => (
        <DefinitionList className={b('list')} nameMaxWidth={200} key={index}>
            {group.map((item) => renderField(item, messageData))}
        </DefinitionList>
    ));
}

function renderSchemaInfo(schemaInfo?: SchemaInfo) {
    if (!schemaInfo) {
        return null;
    }

    const visibleFields = schemaInfoFields.filter(({name}) => {
        const value = schemaInfo[name];
        return !isNil(value) && String(value).trim() !== '';
    });

    if (!visibleFields.length) {
        return null;
    }

    return (
        <DefinitionList className={b('list')} nameMaxWidth={200}>
            {visibleFields.map(({name, header}) => (
                <DefinitionList.Item key={name} name={header} copyText={String(schemaInfo[name])}>
                    {schemaInfo[name]}
                </DefinitionList.Item>
            ))}
        </DefinitionList>
    );
}

export function TopicMessageGeneralInfo({messageData, schemaInfo}: TopicMessageGeneralInfoProps) {
    return (
        <Flex direction="column" gap={3} className={b('details')}>
            {renderDataGroups(messageData)}
            {renderSchemaInfo(schemaInfo)}
        </Flex>
    );
}
