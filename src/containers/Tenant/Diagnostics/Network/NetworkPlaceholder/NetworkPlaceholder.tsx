import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import networkIcon from '../../../../../assets/icons/network.svg';

const b = cn('network');

export function NetworkPlaceholder() {
    return (
        <div className={b('placeholder')}>
            <div className={b('placeholder-img')}>
                <Icon data={networkIcon} width={221} height={204} />
            </div>
            <div className={b('placeholder-text')}>{i18n('description_placeholder')}</div>
        </div>
    );
}
