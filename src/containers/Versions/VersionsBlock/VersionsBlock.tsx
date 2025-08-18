import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';

import './VersionsBlock.scss';

const b = cn('ydb-versions-block');

interface VersionsBlockProps {
    expanded: boolean;
    renderHeader: () => React.ReactNode;
    renderContent: () => React.ReactNode;
}

export const VersionsBlock = ({expanded, renderHeader, renderContent}: VersionsBlockProps) => {
    return (
        <div className={b(null)}>
            {renderHeader()}
            {expanded ? (
                <Flex direction={'column'} className={b('content')}>
                    {renderContent()}
                </Flex>
            ) : null}
        </div>
    );
};
