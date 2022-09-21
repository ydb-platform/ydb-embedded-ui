import {useState, useEffect} from 'react';
import cn from 'bem-cn-lite';

import {Button, Icon, Popup} from '@gravity-ui/uikit';
import closeIcon from '../../../assets/icons/close.svg';

import {DATA_QA_TUNE_COLUMNS_POPUP} from '../../../utils/constants';

import './TipPopup.scss';

const b = cn('km-tip-popup');

const DATA = {
    [DATA_QA_TUNE_COLUMNS_POPUP]: {
        id: 1,
        title: 'New feature: column selector',
        description: 'Now you can easily tune columns visibility! 🚀',
    },
};

function TipPopup({dbChangePopupVisibility, dataAttribute, initialIsPopupVisible}) {
    const [isPopupVisible, setIsPopupVisible] = useState(initialIsPopupVisible ?? true);
    const [anchor, setAnchor] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const anchor = document.querySelector(`[data-qa='${dataAttribute}']`);
            if (anchor) {
                setAnchor(anchor);
                clearInterval(interval);
            }
        }, 200);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const onClosePopupClick = () => {
        dbChangePopupVisibility(false);
        setIsPopupVisible(false);
    };

    const tipData = DATA[dataAttribute];

    return tipData && anchor ? (
        <Popup
            className={b('wrapper')}
            anchorRef={{current: anchor}}
            open={isPopupVisible}
            placement={['bottom-end']}
            hasArrow
        >
            <div className={b()}>
                <div className={b('title')}>{tipData.title}</div>
                <div className={b('content')}>{tipData.description}</div>
                <div className={b('cross-icon-wrapper')}>
                    <Button view="flat-secondary" onClick={onClosePopupClick}>
                        <Icon data={closeIcon} size={10} className={b('cross-icon')} />
                    </Button>
                </div>
            </div>
        </Popup>
    ) : null;
}

export default TipPopup;
