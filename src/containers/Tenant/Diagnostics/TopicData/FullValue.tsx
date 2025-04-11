import {DefinitionList, Dialog} from '@gravity-ui/uikit';

import type {TopicMessageMetadataItem} from '../../../../types/api/topic';

import i18n from './i18n';
import {b} from './utils/constants';

interface FullValueProps {
    onClose: () => void;
    value?: string | TopicMessageMetadataItem[];
}

export function FullValue({onClose, value}: FullValueProps) {
    const renderContent = () => {
        if (typeof value === 'string') {
            return value;
        }
        return (
            <DefinitionList responsive>
                {value?.map((item, index) => (
                    <DefinitionList.Item key={index} name={item.Key}>
                        {item.Value}
                    </DefinitionList.Item>
                ))}
            </DefinitionList>
        );
    };

    return (
        <Dialog open={value !== undefined} onClose={onClose} className={b('full-value')}>
            <Dialog.Header caption={i18n('label_full-value')} />
            <Dialog.Divider />
            <Dialog.Body>{renderContent()}</Dialog.Body>
        </Dialog>
    );
}
