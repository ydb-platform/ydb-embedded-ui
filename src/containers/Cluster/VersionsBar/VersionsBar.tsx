import block from 'bem-cn-lite';

import {Progress} from '@gravity-ui/uikit';

import type {VersionValue} from '../../../types/versions';

import './VersionsBar.scss';

const b = block('ydb-cluster-versions-bar');

interface VersionsBarProps {
    versionsValues?: VersionValue[];
}

export const VersionsBar = ({versionsValues = []}: VersionsBarProps) => {
    return (
        <div className={b()}>
            <Progress value={100} stack={versionsValues} view="thin" />
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
