import {mergeRsbuildConfig} from '@rsbuild/core';

import base from '../../rsbuild.config';

export default mergeRsbuildConfig(base, {
    source: {entry: {index: './tests/controlPlane/entry.tsx'}},
    html: {template: './tests/controlPlane/index.html'},
});
