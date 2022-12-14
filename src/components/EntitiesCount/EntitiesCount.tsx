import {Label} from '@gravity-ui/uikit';
import i18n from './i18n';

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
        <Label theme="info" size="m" className={className}>
            {content}
        </Label>
    );
};
