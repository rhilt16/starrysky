import { useEffect, useState } from "react";

export function useBodies(incomingBodies) {
  const [bodies, setBodies] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!incomingBodies || incomingBodies.length === 0) return;

    setBodies(prev => {
      // Add only missing bodies
      const newOnes = incomingBodies.filter(
        body => !prev.some(p => p.name === body.name)
      );

      // If nothing new, keep same array
      if (newOnes.length === 0) return prev;

      const updated = [...prev, ...newOnes];
      setCount(updated.length);
      return updated;
    });
  }, [incomingBodies]);

  return { bodies, count, setBodies, setCount };
}
