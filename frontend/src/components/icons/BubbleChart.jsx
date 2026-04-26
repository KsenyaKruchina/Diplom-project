import React from "react";

export const BubbleChart = ({ className, color = "white" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.2 18.8c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8zm9.6-4c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm-4.8-8c-1.4 0-2.5-1.1-2.5-2.5S10.6 1.8 12 1.8s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" fill={color}/>
  </svg>
);