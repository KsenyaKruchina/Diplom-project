const User = ({ color = "white", className }) => (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 20 20" 
      fill="none"
    >
      <circle cx="10" cy="6" r="4" stroke={color} strokeWidth="2"/>
      <path d="M16 18C16 14.6863 13.3137 12 10 12C6.68629 12 4 14.6863 4 18" stroke={color} strokeWidth="2"/>
    </svg>
  );
  
  export { User };