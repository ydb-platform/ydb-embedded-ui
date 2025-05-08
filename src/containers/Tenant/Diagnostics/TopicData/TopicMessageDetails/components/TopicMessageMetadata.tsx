import {DefinitionList} from '@gravity-ui/uikit';

import type {TopicMessageMetadataItem} from '../../../../../../types/api/topic';
import i18n from '../../i18n';
import {b} from '../shared';

import {TopicDataSection} from './TopicDataSection';

interface TopicMessageMetadataProps {
    data: TopicMessageMetadataItem[];
}

export function TopicMessageMetadata({data}: TopicMessageMetadataProps) {
    return (
        <TopicDataSection title={i18n('label_metadata')}>
            <DefinitionList nameMaxWidth={200} className={b('message-meta')}>
                {data.map((item) => (
                    <DefinitionList.Item key={item.Key} name={item.Key} copyText={item.Value}>
                        {item.Value}
                    </DefinitionList.Item>
                ))}
            </DefinitionList>
        </TopicDataSection>
    );
}
