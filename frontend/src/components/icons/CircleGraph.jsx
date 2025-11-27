const CircleGraph = ({ percentage = 75.7, className }) => (
    <div className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Фон круга */}
        <circle 
          cx="60" 
          cy="60" 
          r="54" 
          fill="none" 
          stroke="#414141" 
          strokeWidth="12" 
        />
        {/* Прогресс */}
        <circle 
          cx="60" 
          cy="60" 
          r="54" 
          fill="none" 
          stroke="#8234f7" 
          strokeWidth="12" 
          strokeDasharray={339}
          strokeDashoffset={339 - (percentage * 3.39)}
          transform="rotate(-90 60 60)"
        />
      </svg>
    </div>
  );
  
  export { CircleGraph };