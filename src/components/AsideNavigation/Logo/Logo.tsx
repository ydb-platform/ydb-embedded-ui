import React from 'react';
import block from 'bem-cn-lite';
import {Button, Icon} from '@gravity-ui/uikit';

import './Logo.scss';

const b = block('nv-aside-header-logo');

export interface LogoProps {
    onLogoIconClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    logoText: (() => React.ReactNode) | string;
    logoIcon: SVGIconData;
    logoIconClassName?: string;
    logoIconSize?: string | number;
    logoTextSize?: string | number;
    logoHref?: string;
    isCompact: boolean;
    logoWrapper?: (node: React.ReactNode, isCompact: boolean) => React.ReactNode;
}

export const Logo: React.FC<LogoProps> = ({
    onLogoIconClick,
    logoText,
    logoIcon,
    logoIconSize = 24,
    logoTextSize = 16,
    logoHref = '/',
    logoIconClassName,
    isCompact,
    logoWrapper,
}) => {
    const hasClickHandler = typeof onLogoIconClick === 'function';
    const hasLogoWrapper = typeof logoWrapper === 'function';

    const linkProps = hasClickHandler
        ? {}
        : {
              target: '_self',
              href: logoHref,
          };

    const button = (
        <Button
            view="flat"
            size="l"
            className={b('btn-logo')}
            component={hasLogoWrapper ? 'span' : undefined}
            onClick={onLogoIconClick}
            {...linkProps}
        >
            <Icon data={logoIcon} size={logoIconSize} className={logoIconClassName} />
        </Button>
    );

    let logo: React.ReactNode;

    if (typeof logoText === 'function') {
        logo = logoText();
    } else {
        logo = (
            <div className={b('logo')} style={{fontSize: logoTextSize}}>
                {logoText}
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('logo-btn-place')}>
                {typeof logoWrapper === 'function' ? logoWrapper(button, isCompact) : button}
            </div>
            {!isCompact &&
                (typeof logoWrapper === 'function' ? (
                    logoWrapper(logo, isCompact)
                ) : (
                    <a {...linkProps} className={b('logo-link')} onClick={onLogoIconClick}>
                        {logo}
                    </a>
                ))}
        </div>
    );
};
