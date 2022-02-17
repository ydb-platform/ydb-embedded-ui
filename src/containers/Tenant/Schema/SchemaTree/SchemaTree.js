import React from 'react';
import ReactDOM from 'react-dom';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import {getSchema} from '../../../../store/reducers/schema';
import './SchemaTree.scss';

import SchemaNode from '../SchemaNode/SchemaNode';

const b = cn('schema');

class SchemaTree extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        loading: PropTypes.bool,
        error: PropTypes.object,
        schema: PropTypes.object,
        wasLoaded: PropTypes.bool,
        getSchema: PropTypes.func,
        path: PropTypes.string.isRequired,
        tenantPath: PropTypes.string,
    };

    componentDidMount() {
        const {path: tenantPath, getSchema} = this.props;

        getSchema({path: tenantPath});
    }

    emptySchema = React.createRef();

    renderLoader() {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    removeArrow = () => {
        // А как еще эту задачу решить, кроме как лезть в DOM?
        const nodeWithArrow =
            // eslint-disable-next-line react/no-find-dom-node
            ReactDOM.findDOMNode(this)?.parentNode?.parentNode?.querySelector('.tree-view_arrow');
        if (nodeWithArrow) {
            nodeWithArrow.setAttribute('style', 'visibility: hidden');
        }

        return '';
    };

    showEmptyNode() {
        const {tenantPath, schema} = this.props;
        if (schema.Path === tenantPath) {
            return 'no data';
        } else {
            return String(this.removeArrow());
        }
    }

    renderContent = () => {
        const {schema, path} = this.props;
        if (schema && schema.Status === 'StatusSuccess') {
            return (
                <div className={b()}>
                    {schema && schema.PathDescription && schema.PathDescription.Children ? (
                        schema.PathDescription.Children.map((it, key) => (
                            <SchemaNode key={key} fullPath={path} data={it} />
                        ))
                    ) : (
                        <div ref={this.emptySchema}>{this.showEmptyNode()}</div>
                    )}
                </div>
            );
        } else {
            return this.renderLoader();
        }
    };

    render() {
        const {loading, wasLoaded, error, currentSchema: schema} = this.props;
        if (loading && !wasLoaded) {
            return this.renderLoader();
        } else if (
            (error && !error.isCancelled) ||
            (schema && schema.Status === 'StatusAccessDenied')
        ) {
            return <div>{error?.statusText || 'Access denied'}</div>;
        } else {
            return this.renderContent();
        }
    }
}

function mapStateToProps(state, ownProps) {
    const {data: schema = {}, loading, wasLoaded, error, currentSchema} = state.schema;
    const tenantPath = state.tenant.tenant.Name;
    const {path} = ownProps;
    return {
        tenantPath,
        schema: schema[`${path}`],
        loading,
        wasLoaded,
        error,
        currentSchema,
    };
}

const mapDispatchToProps = {
    getSchema,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchemaTree);
