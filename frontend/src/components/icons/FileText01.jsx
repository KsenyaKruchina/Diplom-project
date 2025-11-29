import React from "react";

export const FileText01 = ({ color = "currentColor", className = "", ...props }) => {
  return (
    <svg
      width="37"
      height="37"
      viewBox="0 0 37 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M21.5 3.5H11.5C10.3954 3.5 9.5 4.39543 9.5 5.5V31.5C9.5 32.6046 10.3954 33.5 11.5 33.5H25.5C26.6046 33.5 27.5 32.6046 27.5 31.5V11.5L21.5 3.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 3.5V11.5H27.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 18.5H13.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 23.5H13.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 28.5H13.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};