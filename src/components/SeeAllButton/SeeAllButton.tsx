import {ArrowRight} from '@gravity-ui/icons';
import {Flex, Icon, Text} from '@gravity-ui/uikit';

import {InternalLink} from '../InternalLink';

import i18n from './i18n';

interface SeeAllButtonProps {
    to: string;
    className?: string;
    onClick?: () => void;
}

export function SeeAllButton({to, className, onClick}: SeeAllButtonProps) {
    return (
        <InternalLink className={className} to={to} onClick={onClick}>
            <Flex alignItems="center" gap={1}>
                <Text>{i18n('action_see-all')}</Text>
                <Icon data={ArrowRight} size={16} />
            </Flex>
        </InternalLink>
    );
}
