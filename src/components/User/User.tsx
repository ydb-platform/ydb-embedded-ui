import {cn} from '../../utils/cn';
import {useComponent} from '../ComponentProvider/ComponentsProvider';

import './User.scss';

const b = cn('kv-user');

interface UserProps {
    className?: string;
    login: string;
}
export function UserCard({login, className}: UserProps) {
    const StaffCard = useComponent('StaffCard');

    return (
        <div className={b(null, className)}>
            <StaffCard login={login}>
                <div className={b('name')}>{login}</div>
            </StaffCard>
        </div>
    );
}
