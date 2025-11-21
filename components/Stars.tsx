import React, { useEffect, useState } from 'react';

interface StarProps {
  top: string;
  left: string;
  size: string;
  duration: string;
}

const Stars: React.FC = () => {
  const [stars, setStars] = useState<StarProps[]>([]);

  useEffect(() => {
    const newStars: StarProps[] = [];
    for (let i = 0; i < 100; i++) {
      newStars.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        duration: `${Math.random() * 3 + 2}s`,
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Earth Background */}
      <div className="absolute bottom-20 right-[-10%] w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-gradient-to-br from-blue-600 via-blue-900 to-black rounded-full opacity-40 blur-sm shadow-[0_0_50px_rgba(59,130,246,0.5)]"></div>
      
      {stars.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.duration} infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
};

export default Stars;