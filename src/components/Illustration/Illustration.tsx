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
    // Using ?react query parameter is required for dynamic imports to ensure SVGR processes
    // SVG files as React components (IconData) instead of treating them as asset URLs.
    // Static imports work without ?react, but dynamic imports need it explicitly.
    light: {
        403: () => import('../../assets/illustrations/light/403.svg?react'),
        thumbsUp: () => import('../../assets/illustrations/light/thumbsUp.svg?react'),
        error: () => import('../../assets/illustrations/light/error.svg?react'),
    },
    dark: {
        403: () => import('../../assets/illustrations/dark/403.svg?react'),
        thumbsUp: () => import('../../assets/illustrations/dark/thumbsUp.svg?react'),
        error: () => import('../../assets/illustrations/dark/error.svg?react'),
    },
};

const b = cn('ydb-illustration');

export const Illustration = ({name, className, width, height}: IllustrationProps) => {
    const theme = useThemeValue();

    // Store icon data in an object wrapper to preserve the correct type.
    // SVGR transforms SVG files into React components (functions), but when stored directly
    // in useState, they can be incorrectly typed as objects, causing the Icon component
    // to render them as sprite elements instead of proper SVG components.
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
