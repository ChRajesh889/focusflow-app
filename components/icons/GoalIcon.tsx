
import React from 'react';

const GoalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a12.02 12.02 0 0 0-5.84-2.56V21m0-18v4.82a6 6 0 0 1 5.84 7.38m-5.84-2.56a12.02 12.02 0 0 1-5.84-2.56V3m0 18v-4.82a6 6 0 0 1-5.84-7.38m5.84 2.56a12.02 12.02 0 0 0 5.84 2.56" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
);

export default GoalIcon;