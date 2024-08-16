import {Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

const b = cn('ydb-entities-count');

interface EntitiesCountProps {
    current: number | string;
    total?: number | string;
    label?: string;
    loading?: boolean;
    className?: string;
}

export const EntitiesCount = ({total, current, label, loading, className}: EntitiesCountProps) => {
    let content = '';

    if (label) {
        content += `${label}: `;
    }

    if (loading) {
        content += '...';
    } else {
        content += `${current}`;

        if (total && Number(total) !== Number(current)) {
            content += ` ${i18n('of')} ${total}`;
        }
    }

    return (
        <Label theme="info" size="m" className={b(null, className)}>
            {content}
        </Label>
    );
};
