"use client"

import { useState } from 'react'

interface Story {
  id: string
  title: string
  content: string
  image_url?: string
  order_index: number
}

interface StoryViewProps {
  stories: Story[]
  onComplete: () => void
}

export function StoryView({ stories, onComplete }: StoryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentStory = stories[currentIndex]
  const isLastStory = currentIndex === stories.length - 1

  const handleNext = () => {
    if (isLastStory) {
      onComplete()
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (!currentStory) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Scenic Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mountains */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice">
            {/* Back mountains */}
            <polygon points="0,300 200,100 400,250 600,80 800,200 1000,150 1200,300 1200,600 0,600" fill="#1e3a5f" opacity="0.6"/>
            {/* Middle mountains */}
            <polygon points="0,400 150,200 350,320 550,180 750,280 950,220 1200,380 1200,600 0,600" fill="#2c5282" opacity="0.8"/>
            {/* Front mountains */}
            <polygon points="0,450 100,280 300,380 500,260 700,350 900,300 1100,400 1200,450 1200,600 0,600" fill="#2d3748"/>
          </svg>
        </div>

        {/* Clouds */}
        <div className="absolute top-20 left-10 w-32 h-16 bg-purple-300 rounded-full opacity-30 animate-float"></div>
        <div className="absolute top-32 right-20 w-40 h-20 bg-purple-400 rounded-full opacity-25 animate-float-delayed"></div>
        <div className="absolute top-40 left-1/3 w-36 h-18 bg-indigo-300 rounded-full opacity-20 animate-float-slow"></div>

        {/* Tower silhouettes (if applicable) */}
        <div className="absolute bottom-20 left-1/4 w-16 h-32 bg-gray-800 opacity-40 rounded-t-lg"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-40 bg-gray-800 opacity-40 rounded-t-lg"></div>
      </div>

      {/* Main Content - Fixed Height Container */}
      <div className="relative z-10 w-full max-w-3xl px-4 flex flex-col items-center h-full py-4 sm:py-8">
        {/* Character/Owl Icon */}
        <div className="flex justify-center mb-4 sm:mb-6 flex-shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-bounce-gentle overflow-hidden">
            <img 
              src="/hismarty.png" 
              alt="Marty the Owl" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Story Card - Flexible Height */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] flex flex-col w-full max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)]">
          {/* Title Badge */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-2 sm:py-3 text-center flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {currentStory.title}
            </h2>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto story-content p-6 sm:p-8 md:p-12">
            <p className="text-gray-800 text-base sm:text-lg md:text-xl leading-relaxed text-center">
              {currentStory.content}
            </p>
          </div>

          {/* Navigation Buttons - Fixed at Bottom */}
          <div className="flex-shrink-0 p-6 sm:p-8 pt-4 sm:pt-6 border-t border-gray-100">
            <div className="flex gap-3 sm:gap-4 justify-center items-center mb-4 sm:mb-6">
              {currentIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                {isLastStory ? 'Start Quest' : 'Proceed'}
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 sm:w-10 bg-blue-600'
                      : index < currentIndex
                      ? 'w-2 sm:w-2.5 bg-blue-400'
                      : 'w-2 sm:w-2.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Story Counter */}
        <div className="text-center mt-4 sm:mt-6 flex-shrink-0">
          <p className="text-white/80 text-xs sm:text-sm font-medium">
            Story {currentIndex + 1} of {stories.length}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }

        /* Custom scrollbar for content area - always visible */
        .story-content::-webkit-scrollbar {
          width: 10px;
        }
        .story-content::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
          margin: 4px 0;
        }
        .story-content::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
        }
        .story-content::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        /* For Firefox */
        .story-content {
          scrollbar-width: auto;
          scrollbar-color: #94a3b8 #e2e8f0;
        }
      `}</style>
    </div>
  )
}