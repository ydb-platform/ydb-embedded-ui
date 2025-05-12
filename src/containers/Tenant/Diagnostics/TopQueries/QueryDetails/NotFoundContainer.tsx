import {Button, Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import CryCatIcon from '../../../../../assets/icons/cry-cat.svg';

const b = cn('kv-top-queries');

interface NotFoundContainerProps {
    onClose: () => void;
}

export const NotFoundContainer = ({onClose}: NotFoundContainerProps) => {
    return (
        <div className={b('not-found-container')}>
            <Icon data={CryCatIcon} size={100} />
            <Text variant="subheader-2" className={b('not-found-title')}>
                {i18n('query-details.not-found.title')}
            </Text>
            <Text variant="body-1" color="complementary" className={b('not-found-description')}>
                {i18n('query-details.not-found.description')}
            </Text>
            <Button size="m" view="normal" className={b('not-found-close')} onClick={onClose}>
                {i18n('query-details.close')}
            </Button>
        </div>
    );
};
