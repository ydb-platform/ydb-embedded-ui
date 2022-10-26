import EmptyState from '../../EmptyState/EmptyState';
import {Illustration} from '../../Illustration';

import i18n from '../i18n';

interface AccessDeniedProps {
    title?: string;
    description?: string;
}

export const AccessDenied = ({title, description}: AccessDeniedProps) => {
    return (
        <EmptyState
            image={<Illustration name="403" />}
            title={title || i18n('403.title')}
            description={description || i18n('403.description')}
        />
    );
};
