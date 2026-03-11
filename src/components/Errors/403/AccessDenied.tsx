import {getIllustration} from '../../../utils/illustrations';
import type {EmptyStateProps} from '../../EmptyState';
import {EMPTY_STATE_SIZES, EmptyState} from '../../EmptyState';
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
    const AccessDeniedImage = getIllustration('AccessDenied');
    const illustrationSize = EMPTY_STATE_SIZES[size];
    return (
        <EmptyState
            image={
                image || <AccessDeniedImage width={illustrationSize} height={illustrationSize} />
            }
            title={title || i18n('403.title')}
            description={description || i18n('403.description')}
            size={size}
            {...restProps}
        />
    );
};
