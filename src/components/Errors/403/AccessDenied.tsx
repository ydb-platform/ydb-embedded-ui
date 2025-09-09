import {EMPTY_STATE_SIZES, EmptyState} from '../../EmptyState';
import type {EmptyStateProps} from '../../EmptyState';
import {Illustration} from '../../Illustration';
import i18n from '../i18n';

interface AccessDeniedProps extends Omit<EmptyStateProps, 'title'> {
    title?: React.ReactNode;
}

export const AccessDenied = ({
    title,
    description,
    image,
    size = 'm',
    ...restProps
}: AccessDeniedProps) => {
    return (
        <EmptyState
            image={image || <Illustration name="403" width={EMPTY_STATE_SIZES[size]} />}
            title={title || i18n('403.title')}
            description={description || i18n('403.description')}
            {...restProps}
        />
    );
};
