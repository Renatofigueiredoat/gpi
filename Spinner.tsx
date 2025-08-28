import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string; // e.g., 'border-sky-500'
    containerClassName?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
    size = 'md', 
    color = 'border-sky-500',
    containerClassName = 'p-4'
}) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4',
    };
    
    return (
        <div className={`flex justify-center items-center ${containerClassName}`}>
            <div className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}></div>
        </div>
    );
};

export default Spinner;
