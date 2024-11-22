import {cn} from '../../../../../../utils/cn';

import './Stub.scss';

const b = cn('ydb-query-result-stub-message');

interface StubMessageProps {
    message: string;
}

export function StubMessage({message}: StubMessageProps) {
    return <div className={b(null)}>{message}</div>;
}
