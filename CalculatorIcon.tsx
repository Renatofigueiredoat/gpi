import React from 'react';

const CalculatorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm.75-12V.75a.75.75 0 0 0-.75-.75H5.25a.75.75 0 0 0-.75.75v11.25c0 .414.336.75.75.75h9.75a.75.75 0 0 0 .75-.75V7.5h-4.5V3.75Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h9.75a.75.75 0 0 1 .75.75v9.75a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75V14.25a.75.75 0 0 1 .75-.75Z" />
    </svg>
);

export default CalculatorIcon;
