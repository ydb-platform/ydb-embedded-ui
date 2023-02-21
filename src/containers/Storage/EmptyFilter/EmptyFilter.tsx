import {Button} from '@gravity-ui/uikit';

import {EmptyState} from '../../../components/EmptyState';
import {Illustration} from '../../../components/Illustration';

import i18n from './i18n';

interface EmptyFilterProps {
    title: string;
    message?: string;
    showAll?: string;
    onShowAll?: VoidFunction;
}

export const EmptyFilter = ({
    title,
    message = i18n('default_message'),
    showAll = i18n('default_button_label'),
    onShowAll,
}: EmptyFilterProps) => (
    <EmptyState
        image={<Illustration name="thumbsUp" />}
        title={title}
        description={message}
        actions={
            onShowAll && [
                <Button key="show-all" onClick={onShowAll}>
                    {showAll}
                </Button>,
            ]
        }
    />
);
