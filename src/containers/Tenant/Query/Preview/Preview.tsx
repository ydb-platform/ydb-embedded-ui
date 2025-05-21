import {useTopicDataAvailable} from '../../../../store/reducers/capabilities/hooks';
import {EPathType} from '../../../../types/api/schema';
import {isTableType} from '../../utils/schema';
import i18n from '../i18n';

import {Preview} from './components/PreviewView';
import {TablePreview} from './components/TablePreview';
import {TopicPreview} from './components/TopicPreview';
import {b} from './shared';
import type {PreviewContainerProps} from './types';

import './Preview.scss';

export function PreviewContainer(props: PreviewContainerProps) {
    const {type, subType} = props;
    const isTable = isTableType(type);
    const isTopic = type === EPathType.EPathTypePersQueueGroup;
    const isTopicPreviewAvailable = useTopicDataAvailable();

    if (isTable) {
        return <TablePreview {...props} />;
    }

    // preview is not available for topics inside CDC (has subtype)
    if (isTopic && !subType && isTopicPreviewAvailable) {
        return <TopicPreview {...props} />;
    }

    const renderContent = () => (
        <div className={b('message-container')}>{i18n('preview.not-available')}</div>
    );
    return <Preview {...props} renderResult={renderContent} />;
}
