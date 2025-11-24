import React, { useState, useEffect, type CSSProperties } from 'react';

const ProgressBar = ({ progress}) => {
  const containerStyles = {
    height: 20,
    width: '100%',
    backgroundColor: '#e0e0de',
    borderRadius: 50,
  };

  const fillerStyles: CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: 'red',
    borderRadius: 'inherit',
    textAlign: 'right',
    transition: 'width 0.5s ease-in-out', // Smooth animation
  };

  const labelStyles: CSSProperties = {
    padding: 5,
    color: 'white',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}>{`${progress}%`}</span>
      </div>
    </div>
  );
};

const LoadingBar = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate a loading process
    const interval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 50); // Update every 500ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div>
      {loadingProgress < 100 && <ProgressBar progress={loadingProgress} />}
      {loadingProgress === 100 && <p>Loading complete!</p>}
    </div>
  );
};

export default LoadingBar;