import React from 'react';

interface TileProps {
  value: number;
  isNew?: boolean;
  isMerged?: boolean;
}

const tileColors: Record<number, string> = {
  2: 'bg-[hsl(185,80%,45%)]',
  4: 'bg-[hsl(185,70%,40%)]',
  8: 'bg-[hsl(200,80%,45%)]',
  16: 'bg-[hsl(220,80%,50%)]',
  32: 'bg-[hsl(240,70%,55%)]',
  64: 'bg-[hsl(260,80%,55%)]',
  128: 'bg-[hsl(260,90%,60%)]',
  256: 'bg-[hsl(280,85%,55%)]',
  512: 'bg-[hsl(300,80%,50%)]',
  1024: 'bg-[hsl(320,90%,55%)]',
  2048: 'bg-primary',
};

const glowTiles = [128, 256, 512, 1024, 2048];

const GameTile: React.FC<TileProps> = ({ value, isNew, isMerged }) => {
  const bgColor = tileColors[value] || 'bg-secondary';
  const hasGlow = glowTiles.includes(value);
  const fontSize = value >= 1024 ? 'text-lg' : value >= 128 ? 'text-xl' : 'text-2xl';

  return (
    <div
      className={`
        w-full h-full rounded-lg flex items-center justify-center
        font-display font-extrabold transition-all duration-75
        ${bgColor}
        ${hasGlow ? 'tile-glow' : ''}
        ${isNew ? 'animate-tile-pop' : ''}
        ${isMerged ? 'animate-tile-merge' : ''}
        ${value >= 2048 ? 'primary-glow' : ''}
      `}
      style={value >= 2048 ? {
        boxShadow: '0 0 30px hsl(185 100% 50% / 0.6), inset 0 0 15px hsl(185 100% 50% / 0.2)'
      } : undefined}
    >
      <span className={`${fontSize} text-foreground drop-shadow-md`}>
        {value}
      </span>
    </div>
  );
};

export default GameTile;
