import {renderToStaticMarkup} from 'react-dom/server';

import {authenticationApi} from '../../../store/reducers/authentication/authentication';
import {configureUIFactory, uiFactory} from '../../../uiFactory/uiFactory';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {AppTitleProvider} from '../../App/AppTitleContext';
import {GetUser} from '../GetUserWrapper';

jest.mock('../../../store/reducers/authentication/authentication', () => ({
    authenticationApi: {useWhoamiQuery: jest.fn()},
}));
jest.mock('../../../utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: jest.fn(),
}));
jest.mock('../../../utils/hooks/useTypedSelector', () => ({
    useTypedSelector: jest.fn(),
}));

const originalAccess = uiFactory.access;
const originalErrorProps = uiFactory.clusterOrDatabaseAccessError;
const getErrorProps = jest.fn(() => ({
    title: undefined,
    description: undefined,
    actions: [<button key="request-access">Request access</button>],
}));

beforeEach(() => {
    getErrorProps.mockClear();
    configureUIFactory({
        access: {getErrorProps},
        clusterOrDatabaseAccessError: {
            title: 'Host error title',
            description: 'Host error description',
            actions: [<button key="help">Get help</button>],
        },
    });
});

afterEach(() => {
    configureUIFactory({access: originalAccess, clusterOrDatabaseAccessError: originalErrorProps});
});

function renderWhoamiError(database: string | undefined, status: number) {
    jest.mocked(useDatabaseFromQuery).mockReturnValue(database);
    jest.mocked(authenticationApi.useWhoamiQuery).mockReturnValue({
        error: {status},
        isFetching: false,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isUninitialized: false,
        refetch: jest.fn(),
    });

    return renderToStaticMarkup(
        <AppTitleProvider appTitle="YDB">
            <GetUser>Database content</GetUser>
        </AppTitleProvider>,
    );
}

test('database whoami 403 adds the custom action and keeps the host defaults', () => {
    const markup = renderWhoamiError('/Root/db', 403);

    expect(getErrorProps).toHaveBeenCalledWith({
        source: 'database',
        database: '/Root/db',
        databaseFullPath: '/Root/db',
        path: '/Root/db',
        capabilities: undefined,
    });
    expect(markup).toContain('Host error title');
    expect(markup).toContain('Host error description');
    expect(markup).toContain('<button>Get help</button>');
    expect(markup).toContain('<button>Request access</button>');
});

test.each([
    {name: 'cluster whoami 403', database: undefined, status: 403},
    {name: 'database whoami 401', database: '/Root/db', status: 401},
])('$name keeps the default error screen', ({database, status}) => {
    const markup = renderWhoamiError(database, status);

    expect(getErrorProps).not.toHaveBeenCalled();
    expect(markup).toContain('Host error title');
    expect(markup).toContain('<button>Get help</button>');
});
