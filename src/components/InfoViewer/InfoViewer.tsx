import React from 'react';

import {cn} from '../../utils/cn';

import './InfoViewer.scss';

export interface InfoViewerItem {
    label: React.ReactNode;
    value: React.ReactNode;
}

export interface InfoViewerProps {
    title?: string;
    info?: InfoViewerItem[];
    dots?: boolean;
    size?: 's';
    className?: string;
    multilineLabels?: boolean;
    renderEmptyState?: (props?: Pick<InfoViewerProps, 'title' | 'size'>) => React.ReactNode;
}

const b = cn('info-viewer');

export const InfoViewer = ({
    title,
    info,
    dots = true,
    size,
    className,
    multilineLabels,
    renderEmptyState,
}: InfoViewerProps) => {
    if ((!info || !info.length) && renderEmptyState) {
        return <React.Fragment>{renderEmptyState({title, size})}</React.Fragment>;
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
                <React.Fragment>No {title} data</React.Fragment>
            )}
        </div>
    );
};

export default InfoViewer;
