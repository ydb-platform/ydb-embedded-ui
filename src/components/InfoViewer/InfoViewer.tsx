import type {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import './InfoViewer.scss';

export interface InfoViewerItem {
    label: ReactNode;
    value: ReactNode;
}

interface InfoViewerProps {
    title?: string;
    info?: InfoViewerItem[];
    dots?: boolean;
    size?: 's';
    className?: string;
    multilineLabels?: boolean;
    renderEmptyState?: (props?: Pick<InfoViewerProps, 'title' | 'size'>) => ReactNode;
}

const b = cn('info-viewer');

const InfoViewer = ({
    title,
    info,
    dots = true,
    size,
    className,
    multilineLabels,
    renderEmptyState,
}: InfoViewerProps) => {
    if ((!info || !info.length) && renderEmptyState) {
        return <>{renderEmptyState({title, size})}</>;
    }

    return (
        <div className={b({size}, className)}>
            {title && <div className={b('title')}>{title}</div>}
            {info && info.length > 0 ? (
                <div className={b('items')}>
                    {info.map((data, infoIndex) => (
                        <div className={b('row')} key={infoIndex}>
                            <div className={b('label')}>
                                <div className={b('label-text', {multiline: multilineLabels})}>
                                    {data.label}
                                </div>
                                {dots && <div className={b('dots')} />}
                            </div>

                            <div className={b('value')}>{data.value}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <>No {title} data</>
            )}
        </div>
    );
};

export default InfoViewer;
