import React from 'react';

import {Flex, Link} from '@gravity-ui/uikit';

import {InternalLink} from '../../components/InternalLink';

interface BreadcrumbLinkProps {
    icon?: React.ReactNode;
    text?: string;
    link?: string;
}

function checkIsExternalLink(link?: string): link is string {
    return Boolean(link?.startsWith('http'));
}

export function BreadcrumbLink({icon, text, link}: BreadcrumbLinkProps) {
    if (checkIsExternalLink(link)) {
        return (
            <Link href={link} view="secondary">
                <BreadcrumbLinkContent icon={icon} text={text} />
            </Link>
        );
    }
    return (
        <InternalLink to={link} as="tab">
            <BreadcrumbLinkContent icon={icon} text={text} />
        </InternalLink>
    );
}

function BreadcrumbLinkContent({icon, text}: Omit<BreadcrumbLinkProps, 'link'>) {
    return (
        <Flex alignItems="center" gap={1}>
            {icon}
            {text}
        </Flex>
    );
}
