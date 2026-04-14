import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'currentColor', className = '' }) => {
    const sizes = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const spinnerSize = sizes[size] || sizes.md;

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <svg
                className={`animate-spin ${spinnerSize}`}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                fill={color}
            >
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="1.0" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.916" transform="rotate(30 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.833" transform="rotate(60 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.75" transform="rotate(90 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.666" transform="rotate(120 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.583" transform="rotate(150 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.5" transform="rotate(180 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.416" transform="rotate(210 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.333" transform="rotate(240 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.25" transform="rotate(270 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.166" transform="rotate(300 50 50)" />
                <rect x="46.5" y="10" width="7" height="20" rx="3.5" ry="3.5" opacity="0.083" transform="rotate(330 50 50)" />
            </svg>
        </div>
    );
};

export default LoadingSpinner;
