"use client"

import { Trophy, Award, Medal, Clock } from 'lucide-react';

interface Completion {
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  completed_at: string;
  duration_seconds: number;
}

interface FastestCompletionsProps {
  completions: Completion[];
}

export function FastestCompletions({ completions }: FastestCompletionsProps) {
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
    if (index === 1) return <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
    if (index === 2) return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
    return (
      <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-500">{index + 1}</span>
      </div>
    )
  }

  const formatElapsedTime = (totalSeconds: number) => {
    // Handle edge cases
    if (totalSeconds < 0) return "0s";
    if (totalSeconds === 0) return "0s";
    
    // Less than 60 seconds: show only seconds
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    // Less than 60 minutes: show minutes and seconds
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    
    // 60 minutes or more: show hours, minutes, and optionally seconds
    const hours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    if (seconds > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${hours}h`;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 text-sm sm:text-base">Fastest Completions</h3>
      
      {completions.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-500 font-medium">No completions yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Be the first to complete this quest!
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 hover:scrollbar-thumb-blue-500">
          {completions.map((completion, index) => (
            <div 
              key={`${completion.user.id}-${index}`} 
              className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Medal/Rank Icon */}
                <div className="flex-shrink-0">
                  {getMedalIcon(index)}
                </div>
                
                {/* Avatar */}
                {completion.user.avatar_url ? (
                  <img
                    src={completion.user.avatar_url}
                    alt={completion.user.full_name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {completion.user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Username */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {completion.user.full_name}
                  </p>
                </div>
              </div>
              
              {/* Elapsed Time - Stopwatch Format */}
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-blue-600 font-mono">
                  {formatElapsedTime(completion.duration_seconds)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}