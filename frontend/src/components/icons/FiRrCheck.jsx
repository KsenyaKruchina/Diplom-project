const FiRrCheck = ({ color = "white", className }) => (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 20 20" 
      fill="none"
    >
      <path 
        d="M16.6667 5L7.50004 14.1667L3.33337 10" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
  
  export { FiRrCheck };