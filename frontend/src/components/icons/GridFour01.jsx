const GridFour01 = ({ color = "white", className }) => (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 20 20" 
      fill="none"
    >
      <rect x="3" y="3" width="5" height="5" stroke={color} strokeWidth="2"/>
      <rect x="12" y="3" width="5" height="5" stroke={color} strokeWidth="2"/>
      <rect x="3" y="12" width="5" height="5" stroke={color} strokeWidth="2"/>
      <rect x="12" y="12" width="5" height="5" stroke={color} strokeWidth="2"/>
    </svg>
  );
  
  export { GridFour01 };