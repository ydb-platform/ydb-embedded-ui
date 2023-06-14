import block from 'bem-cn-lite';
import {useHistory} from 'react-router';

import {Breadcrumbs, BreadcrumbsItem} from '@gravity-ui/uikit';

import {ExternalLinkWithIcon} from '../../components/ExternalLinkWithIcon/ExternalLinkWithIcon';

import {backend, customBackend} from '../../store';
import {HeaderItemType} from '../../store/reducers/header';
import {useTypedSelector} from '../../utils/hooks';

import './Header.scss';

const b = block('header');

const getInternalLink = (singleClusterMode: boolean) => {
    if (singleClusterMode && !customBackend) {
        return `/internal`;
    }

    return backend + '/internal';
};

function Header() {
    const {singleClusterMode, header}: {singleClusterMode: boolean; header: HeaderItemType[]} =
        useTypedSelector((state) => state);

    const history = useHistory();

    const renderHeader = () => {
        const breadcrumbItems = header.reduce((acc, el) => {
            const action = () => {
                if (el.link) {
                    history.push(el.link);
                }
            };
            acc.push({text: el.text, action});
            return acc;
        }, [] as BreadcrumbsItem[]);

        return (
            <header className={b()}>
                <div>
                    <Breadcrumbs
                        items={breadcrumbItems}
                        lastDisplayedItemsCount={1}
                        firstDisplayedItemsCount={1}
                    />
                </div>

                <ExternalLinkWithIcon
                    title={'Developer UI'}
                    url={getInternalLink(singleClusterMode)}
                />
            </header>
        );
    };
    return renderHeader();
}

export default Header;
