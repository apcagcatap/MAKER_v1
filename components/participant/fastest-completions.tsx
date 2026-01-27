"use client"

import { Trophy, Award, Medal, Clock } from 'lucide-react';

interface Completion {
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  completed_at: string;
  duration_minutes?: number;
}

interface FastestCompletionsProps {
  completions: Completion[];
}

export function FastestCompletions({ completions }: FastestCompletionsProps) {
  const medalIcons = [
    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" key="gold" />,
    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" key="silver" />,
    <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" key="bronze" />
  ];

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
        <div className="space-y-3 sm:space-y-4">
          {completions.map((completion, index) => (
            <div key={completion.user.id} className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                {medalIcons[index]}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
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
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {completion.user.full_name}
                  </p>
                  {completion.duration_minutes && (
                    <p className="text-xs text-gray-500">
                      {completion.duration_minutes < 60 
                        ? `${completion.duration_minutes}m`
                        : `${Math.floor(completion.duration_minutes / 60)}h ${completion.duration_minutes % 60}m`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}