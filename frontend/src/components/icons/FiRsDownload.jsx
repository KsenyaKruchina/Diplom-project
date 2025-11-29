import React from "react";

export const FiRsDownload = ({ color = "currentColor", className = "", ...props }) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M7.5 10.5L7.5 1.5M7.5 10.5L4.5 7.5M7.5 10.5L10.5 7.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 9.5V11.5C1.5 12.0523 1.94772 12.5 2.5 12.5H12.5C13.0523 12.5 13.5 12.0523 13.5 11.5V9.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};