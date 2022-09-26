import {useEffect, useState} from 'react';
import cn from 'bem-cn-lite';
import {useThemeValue} from '@gravity-ui/uikit';

export interface IllustrationProps {
    name: string;
    className?: string;
}

type IllustrationStore = Record<string, Record<string, () => Promise<{default: any}>>>;

const store: IllustrationStore = {
    light: {
        403: () => import('../../assets/illustrations/light/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/light/thumbsUp.svg'),
    },
    dark: {
        403: () => import('../../assets/illustrations/dark/403.svg'),
        thumbsUp: () => import('../../assets/illustrations/light/thumbsUp.svg'),
    },
};

const b = cn('kv-illustration');

export const Illustration = ({name, className, ...props}: IllustrationProps) => {
    const theme = useThemeValue();
    const [src, setSrc] = useState('');
    const srcGetter = store[theme] && store[theme][name];

    useEffect(() => {
        if (typeof srcGetter === 'function') {
            srcGetter()
                .then((svg) => setSrc(svg.default))
                .catch((e) => {
                    console.error(e);
                    setSrc('');
                });
        }
    }, [srcGetter]);

    return (
        <img
            alt={name}
            src={src}
            className={b(null, className)}
            {...props}
        />
    );
}
