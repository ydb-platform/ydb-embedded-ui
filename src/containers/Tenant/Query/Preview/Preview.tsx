import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {useTopicDataAvailable} from '../../../../store/reducers/capabilities/hooks';
import {EPathSubType, EPathType} from '../../../../types/api/schema';
import {transformPath} from '../../ObjectSummary/transformPath';
import {isTableType} from '../../utils/schema';
import i18n from '../i18n';

import {DocumentPreview} from './components/DocumentPreview';
import {Preview} from './components/PreviewView';
import {TablePreview} from './components/TablePreview';
import {TopicPreview} from './components/TopicPreview';
import {b} from './shared';
import type {PreviewContainerProps} from './types';
import {useDocumentPreview} from './useDocumentPreview';

import './Preview.scss';

export function PreviewContainer(props: PreviewContainerProps) {
    const {type, subType, path, databaseFullPath} = props;
    const {documentPreview, descriptionState} = useDocumentPreview(props);
    const isTable = isTableType(type);
    const isTopic = type === EPathType.EPathTypePersQueueGroup;
    const isCdcTopic = subType === EPathSubType.EPathSubTypeStreamImpl;
    const isTopicPreviewAvailable = useTopicDataAvailable();

    if (documentPreview) {
        return <DocumentPreview {...documentPreview} />;
    }

    if (!descriptionState && isTable) {
        return <TablePreview {...props} />;
    }

    if (!descriptionState && isTopic && !isCdcTopic && isTopicPreviewAvailable) {
        return <TopicPreview {...props} />;
    }

    const renderContent = () => (
        <LoaderWrapper loading={descriptionState?.loading}>
            <div className={b('message-container')}>
                {i18n('context_query-preview-unavailable')}
            </div>
        </LoaderWrapper>
    );
    return (
        <Preview
            path={descriptionState ? transformPath(path, databaseFullPath) : path}
            quantity={descriptionState ? null : undefined}
            error={descriptionState?.error}
            renderResult={renderContent}
        />
    );
}
