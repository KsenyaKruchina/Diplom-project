const StyleLine = ({ color = "white", className }) => (
  <svg 
    className={className}
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none"
  >
    {/* Большой круг - заполнен на 3/4 */}
    <circle cx="10" cy="10" r="8" stroke="#414141" strokeWidth="1.5" fill="none"/>
    <path 
      d="M10 2 
         A8 8 0 1 1 10 18 
         A8 8 0 1 1 10 2" 
      stroke={color} 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeDasharray="18.85 6.28"
      transform="rotate(-90 10 10)"
    />
    
    {/* Маленький круг - заполнен на 3/4 */}
    <circle cx="10" cy="10" r="4" stroke="#414141" strokeWidth="1.5" fill="none"/>
    <path 
      d="M10 6 
         A4 4 0 1 1 10 14 
         A4 4 0 1 1 10 6" 
      stroke={color} 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeDasharray="9.42 3.14"
      transform="rotate(-90 10 10)"
    />
    
    {/* Центральная точка */}
    <circle cx="10" cy="10" r="0.5" fill={color}/>
  </svg>
);

export { StyleLine };