import type {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import './InfoViewer.scss';

export interface InfoViewerItem {
    label: string;
    value: ReactNode;
}

interface InfoViewerProps {
    title?: string;
    info?: InfoViewerItem[];
    dots?: boolean;
    size?: 's';
    className?: string;
}

const b = cn('info-viewer');

const InfoViewer = ({title, info, dots = true, size, className}: InfoViewerProps) => (
    <div className={b({size}, className)}>
        {title && <div className={b('title')}>{title}</div>}
        {info && info.length > 0 ? (
            <div className={b('items')}>
                {info.map((data, infoIndex) => (
                    <div className={b('row')} key={data.label + infoIndex}>
                        <div className={b('label')}>
                            {data.label}
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

export default InfoViewer;
