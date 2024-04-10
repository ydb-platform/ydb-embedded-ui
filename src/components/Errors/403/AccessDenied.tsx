import {EmptyState} from '../../EmptyState';
import type {EmptyStateProps} from '../../EmptyState';
import {Illustration} from '../../Illustration';
import i18n from '../i18n';

interface AccessDeniedProps extends Omit<EmptyStateProps, 'image' | 'title' | 'description'> {
    title?: string;
    description?: string;
}

export const AccessDenied = ({title, description, ...restProps}: AccessDeniedProps) => {
    return (
        <EmptyState
            image={<Illustration name="403" />}
            title={title || i18n('403.title')}
            description={description || i18n('403.description')}
            {...restProps}
        />
    );
};
