import {mergeRsbuildConfig} from '@rsbuild/core';

import base from '../../rsbuild.config';

export default mergeRsbuildConfig(base, {
    source: {entry: {index: './tests/querySettings/entry.tsx'}},
    dev: {lazyCompilation: false, hmr: false, liveReload: false},
});
