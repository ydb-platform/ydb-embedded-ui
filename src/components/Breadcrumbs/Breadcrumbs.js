import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {Breadcrumbs as BreadcrumbsUiKit} from '@yandex-cloud/uikit';

import './Breadcrumbs.scss';

const b = cn('kv-breadcrumbs');

class Breadcrumbs extends React.Component {
    static propTypes = {
        items: PropTypes.array,
    };

    static defaultProps = {
        items: [],
    };

    render() {
        const {items} = this.props;
        return <BreadcrumbsUiKit items={items} firstDisplayedItemsCount={1} className={b()} />;
    }
}

export default Breadcrumbs;
