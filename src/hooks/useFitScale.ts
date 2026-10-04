import { useEffect, useState } from 'react';

/**
 * Returns a scale factor (<= 1) that fits a fixed-size design surface
 * (designWidth x designHeight) inside the current viewport.
 */
export function useFitScale(designWidth: number, designHeight: number): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(1, vw / designWidth, vh / designHeight));
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [designWidth, designHeight]);

  return scale;
}
