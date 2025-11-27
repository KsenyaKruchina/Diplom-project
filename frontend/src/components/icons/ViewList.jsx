const ViewList = ({ color = "white", className }) => (
  <svg 
    className={className}
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none"
  >
    {/* Ось X */}
    <line x1="3" y1="16" x2="17" y2="16" stroke={color} strokeWidth="1.5"/>
    {/* Ось Y */}
    <line x1="3" y1="4" x2="3" y2="16" stroke={color} strokeWidth="1.5"/>
    
    {/* Линия графика - восходящий тренд */}
    <path 
      d="M4 12 L6 8 L8 10 L10 6 L12 9 L14 5 L16 7" 
      stroke={color} 
      strokeWidth="1.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Точки на графике */}
    <circle cx="4" cy="12" r="0.8" fill={color}/>
    <circle cx="6" cy="8" r="0.8" fill={color}/>
    <circle cx="8" cy="10" r="0.8" fill={color}/>
    <circle cx="10" cy="6" r="0.8" fill={color}/>
    <circle cx="12" cy="9" r="0.8" fill={color}/>
    <circle cx="14" cy="5" r="0.8" fill={color}/>
    <circle cx="16" cy="7" r="0.8" fill={color}/>
    
    
    
  </svg>
);

export { ViewList };