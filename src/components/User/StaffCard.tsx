import React from 'react';

export interface StaffCardProps {
    login: string;
    children: React.ReactNode & {
        ref?: React.Ref<HTMLElement>;
    };
}

export function StaffCard({children}: StaffCardProps) {
    return <React.Fragment>{children}</React.Fragment>;
}
