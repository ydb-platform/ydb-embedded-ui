import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {getIllustration} from '../../utils/illustrations';
import {EmptyState} from '../EmptyState';

import i18n from './i18n';

interface EmptyFilterProps {
    title: string;
    message?: string;
    showAll?: string;
    onShowAll?: VoidFunction;
    image?: React.ReactNode;
}

export const EmptyFilter = ({
    title,
    message = i18n('default_message'),
    showAll = i18n('default_button_label'),
    onShowAll,
    image,
}: EmptyFilterProps) => {
    const SuccessImage = getIllustration('SuccessOperation');

    const resolvedImage = React.useMemo(() => {
        if (image !== undefined) {
            return image;
        }
        return <SuccessImage width={200} height={200} />;
    }, [image, SuccessImage]);

    return (
        <EmptyState
            image={resolvedImage}
            position="left"
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
};
