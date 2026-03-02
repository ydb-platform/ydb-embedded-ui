import {getIllustration} from '../../../utils/illustrations';
import type {EmptyStateProps} from '../../EmptyState';
import {EMPTY_STATE_SIZES, EmptyState} from '../../EmptyState';
import i18n from '../i18n';

interface UnauthenticatedProps extends Omit<EmptyStateProps, 'title'> {
    title?: React.ReactNode;
}

export const Unauthenticated = ({
    title,
    description,
    image,
    size = 'm',
    ...restProps
}: UnauthenticatedProps) => {
    const UnauthenticatedImage = getIllustration('Unauthenticated');
    const illustrationSize = EMPTY_STATE_SIZES[size];
    return (
        <EmptyState
            image={
                image || <UnauthenticatedImage width={illustrationSize} height={illustrationSize} />
            }
            title={title || i18n('401.title')}
            description={description || i18n('401.description')}
            size={size}
            {...restProps}
        />
    );
};
