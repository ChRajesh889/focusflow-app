import React from 'react';

const ThumbsDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5 3 6.75v-5.25h2.904l1.14 5.25M6.633 10.5c.806 0 1.533.446 2.031 1.08a9.041 9.041 0 012.861 2.4c.723.384 1.35.956 1.653 1.715a4.498 4.498 0 00.322 1.672v.653a.75.75 0 01-.75.75A2.25 2.25 0 0116.5 18c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H9.312c-1.026 0-1.945-.694-2.054-1.715a1.123 1.123 0 01.068-1.285c.343-.95 1.24-1.638 2.274-1.782a11.95 11.95 0 011.605-.213" />
  </svg>
);

export default ThumbsDownIcon;
