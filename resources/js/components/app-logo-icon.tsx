import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/icon.png"
            alt="Sakada logo"
            className={className}
            {...props}
        />
    );
}
