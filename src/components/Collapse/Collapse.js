import {useState, useEffect, useRef} from 'react';
import block from 'bem-cn-lite';
import {ArrowToggle, Button} from '@gravity-ui/uikit';

import './Collapse.scss';

const b = block('yc-collapse');

function useEffectSkipFirst(fn, arr) {
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }

        return fn();
    }, arr);
}

export const Collapse = ({
    title,
    children,
    arrowView = 'icon',
    emptyState = 'No data',
    titleSize = 'l',
    contentMarginTop = 12,
    defaultIsExpand,
    onChange,
}) => {
    const [isExpand, setIsExpand] = useState(defaultIsExpand);

    const arrowDirection = isExpand ? 'top' : 'bottom';

    const arrowComponent =
        arrowView === 'button' ? (
            <Button view="flat" className={b('arrow-button')}>
                <ArrowToggle className={b('arrow')} direction={arrowDirection} size={20} />
            </Button>
        ) : (
            <ArrowToggle className={b('arrow')} direction={arrowDirection} size={20} />
        );

    useEffectSkipFirst(onChange, [isExpand]);

    return (
        <div className={b()}>
            <div
                className={b('panel', {
                    'no-data': !children,
                })}
                onClick={() => {
                    setIsExpand(!isExpand);
                }}
            >
                {typeof title === 'string' ? (
                    <h2
                        className={b('title', {
                            size: titleSize,
                        })}
                    >
                        {title}
                    </h2>
                ) : (
                    title
                )}

                {children && <div className={b('arrow-wrapper')}>{arrowComponent}</div>}
            </div>

            {!children && <h4 className={b('empty-state-title')}>{emptyState}</h4>}

            {children && (
                <div
                    className={b('content', {visible: isExpand})}
                    style={{marginTop: contentMarginTop}}
                >
                    {children}
                </div>
            )}
        </div>
    );
};
