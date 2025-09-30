import React from 'react';

import type {IconData} from '@gravity-ui/uikit';
import {Flex, Icon, useThemeValue} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {cn} from '../../utils/cn';

import './Illustration.scss';

export interface IllustrationProps {
    name: string;
    width?: number;
    height?: number;
    className?: string;
}

type IllustrationStore = Record<string, Record<string, () => Promise<{default: IconData}>>>;

const store: IllustrationStore = {
    light: {
        403: () => import('../../assets/illustrations/light/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/light/thumbsUp.svg'),
        error: () => import('../../assets/illustrations/light/error.svg'),
    },
    dark: {
        403: () => import('../../assets/illustrations/dark/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/dark/thumbsUp.svg'),
        error: () => import('../../assets/illustrations/dark/error.svg'),
    },
};

const b = cn('ydb-illustration');

export const Illustration = ({name, className, width, height}: IllustrationProps) => {
    const theme = useThemeValue();

    // When a function is stored in useState, typeof returns 'object'
    // SVGR loads SVG files as React components (functions)
    // However, in the Icon component, these are treated as objects and incorrectly rendered as sprite elements (bug)
    // To fix this, we need to wrap the icon data in an additional object, so its initial type is preserved
    const [{iconData}, setIconData] = React.useState<{iconData?: IconData}>({});

    React.useEffect(() => {
        const loadIcon = async () => {
            try {
                const iconLoader = store[theme]?.[name];

                if (iconLoader && typeof iconLoader === 'function') {
                    const module = await iconLoader();
                    setIconData({iconData: module.default});
                }
            } catch (err) {
                console.error('Failed to load illustration:', name, err);
                setIconData({});
            }
        };

        loadIcon();
    }, [name, theme]);

    if (isNil(iconData)) {
        return null;
    }

    return (
        <Flex style={{width, height}} className={b(null, className)}>
            <Icon data={iconData} className={b('icon')} />
        </Flex>
    );
};
