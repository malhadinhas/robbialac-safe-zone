import React from 'react';
import { Medal } from '@/services/medalService';

interface MedalCardProps {
  medal: Medal;
  isAcquired?: boolean;
}

/**
 * Componente para exibir uma medalha de forma simplificada
 */
export const MedalCard: React.FC<MedalCardProps> = ({ 
  medal,
  isAcquired = false 
}) => {
  return (
    <div className="group relative">
      <div 
        className={`
          bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 p-2
          ${isAcquired 
            ? 'border-2 border-yellow-300 hover:scale-105 hover:shadow-lg' 
            : 'border border-gray-200 hover:shadow-lg hover:border-blue-100'
          }
        `}
      >
        <div className={`${!isAcquired ? 'filter grayscale hover:grayscale-0 transition-all duration-300' : ''}`}>
          <div className="relative w-20 h-20">
            <img 
              src={medal.imageSrc} 
              alt={medal.name} 
              className="w-full h-full object-contain" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = isAcquired
                  ? "https://placeholder.pics/svg/300/FFC107/FFFFFF/medalha"
                  : "https://placeholder.pics/svg/300/CCCCCC/666666/medalha";
              }}
            />
            {isAcquired && (
              <div className="absolute top-0 right-0 -mr-1 -mt-1 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedalCard; 