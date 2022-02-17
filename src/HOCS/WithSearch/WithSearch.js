import React from 'react';

export const withSearch = (Component) => {
    class HOC extends React.Component {
        state = {
            searchQuery: '',
        };

        handleSearchQuery = (searchQuery) => {
            this.setState({searchQuery});
        };

        render() {
            const {searchQuery} = this.state;
            return (
                <Component
                    {...this.props}
                    searchQuery={searchQuery}
                    handleSearchQuery={this.handleSearchQuery}
                />
            );
        }
    }

    return HOC;
};
