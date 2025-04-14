import React from 'react';
import { Medal } from '@/services/medalService';

interface MedalCardProps {
  medal: Medal;
  userPoints?: number;
  isAcquired?: boolean;
}

/**
 * Componente para exibir uma medalha
 */
export const MedalCard: React.FC<MedalCardProps> = ({ 
  medal, 
  userPoints = 0,
  isAcquired = false 
}) => {
  const progress = medal.requiredPoints 
    ? Math.min(Math.round((userPoints / medal.requiredPoints) * 100), 100) 
    : 0;

  return (
    <div className="group relative">
      <div 
        className={`
          bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
          ${isAcquired 
            ? 'border-2 border-yellow-300 hover:scale-105 hover:shadow-lg' 
            : 'border border-gray-200 hover:shadow-lg hover:border-blue-100'
          }
        `}
      >
        <div className={`p-4 ${!isAcquired ? 'filter grayscale hover:grayscale-0 transition-all duration-300' : ''}`}>
          <div className="flex justify-center mb-3">
            <div className={`
              relative w-32 h-32 
              ${!isAcquired ? 'opacity-70 group-hover:opacity-90 transition-opacity duration-300' : ''}
            `}>
              <img 
                src={medal.imageSrc} 
                alt={medal.name} 
                className="w-full h-full object-contain" 
                onError={(e) => {
                  // Fallback em caso de erro
                  (e.target as HTMLImageElement).src = isAcquired
                    ? "https://placeholder.pics/svg/300/FFC107/FFFFFF/medalha"
                    : "https://placeholder.pics/svg/300/CCCCCC/666666/medalha";
                }}
              />
              {isAcquired && (
                <div className="absolute top-0 right-0 -mr-2 -mt-2 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <h3 className={`text-lg font-bold text-center ${isAcquired ? 'text-gray-900' : 'text-gray-700'}`}>
            {medal.name}
          </h3>
          <p className={`text-sm text-center ${isAcquired ? 'text-gray-600' : 'text-gray-500'} mb-2`}>
            {medal.description}
          </p>
          
          {isAcquired && medal.acquiredDate && (
            <div className="mt-2 text-xs text-center text-gray-500">
              Conquistada em: {new Date(medal.acquiredDate).toLocaleDateString('pt-BR')}
            </div>
          )}
          
          {!isAcquired && medal.requiredPoints && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{userPoints} / {medal.requiredPoints} pontos</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedalCard; 