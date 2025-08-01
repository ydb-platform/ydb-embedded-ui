import type {ProgressProps} from '@gravity-ui/uikit';
import {Progress} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import type {VersionValue} from '../../../utils/versions/types';

import './VersionsBar.scss';

const b = cn('ydb-cluster-versions-bar');

interface VersionsBarProps {
    versionsValues?: VersionValue[];
    size?: ProgressProps['size'];
    progressClassName?: string;
}

export const VersionsBar = ({
    versionsValues = [],
    size = 's',
    progressClassName: className,
}: VersionsBarProps) => {
    return (
        <div className={b()}>
            <Progress value={100} stack={versionsValues} size={size} className={className} />
            <div className={b('versions')}>
                {versionsValues.map((item, index) => (
                    <div
                        className={b('version-title')}
                        style={{color: item.color}}
                        key={item.version}
                        title={item.version}
                    >
                        {`${item.version}${index === versionsValues.length - 1 ? '' : ','}`}
                    </div>
                ))}
            </div>
        </div>
    );
};
