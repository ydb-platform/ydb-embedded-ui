import {Flex, Progress} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {formatStorageMetricPair} from '../../utils/storageMetrics';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';

import {pDiskInfoKeyset as i18n} from './i18n';

import './PDiskLogSize.scss';

const b = cn('ydb-pdisk-log-size');

export function PDiskLogSize({used, total}: {used?: string; total?: string}) {
    const usedSize = parseOptionalNonNegativeNumber(used);
    const totalSize = parseOptionalNonNegativeNumber(total);
    const percentage =
        usedSize !== undefined && totalSize !== undefined && totalSize > 0
            ? Math.min(100, (usedSize / totalSize) * 100)
            : undefined;

    return (
        <Flex gap={1} alignItems="center" className={b()}>
            {percentage !== undefined && (
                <Progress
                    className={b('progress')}
                    value={percentage}
                    theme="success"
                    size="s"
                    aria-label={i18n('log-size')}
                />
            )}
            <span>{formatStorageMetricPair(usedSize, totalSize, 2)}</span>
        </Flex>
    );
}
