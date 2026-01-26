"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StoryView } from '@/components/participant/story-view'
import { ResourceCard } from '@/components/participant/resource-card'
import { startQuest, completeStory } from '@/lib/actions/quests'
import { CheckCircle2, Book, ListChecks, Trophy, ArrowRight, Clock } from 'lucide-react'

interface QuestContentViewProps {
  quest: any
  userProgress: any
}

type QuestStep = 'story' | 'instructions' | 'materials' | 'level' | 'completed'

export function QuestContentView({ quest, userProgress }: QuestContentViewProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<QuestStep>('story')
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [levelCompletionTimes, setLevelCompletionTimes] = useState<Date[]>([])

  useEffect(() => {
    // Determine which step the user should see
    if (!userProgress) {
      return // Show start button
    }

    if (userProgress.status === 'completed') {
      setCurrentStep('completed')
      return
    }

    // If user has progressed to levels
    if (userProgress.current_level > 0) {
      setCurrentStep('level')
      setCurrentLevelIndex(userProgress.current_level)
      return
    }

    // Story flow: Only show story if it exists AND hasn't been completed
    if (quest.stories?.length > 0 && !userProgress.story_completed) {
      setCurrentStep('story')
      return
    }

    // After story (or if no story), show instructions
    if (!userProgress.instructions_viewed) {
      setCurrentStep('instructions')
      return
    }

    // After instructions, show materials
    if (!userProgress.materials_viewed) {
      setCurrentStep('materials')
      return
    }

    // After materials, show levels
    setCurrentStep('level')
    setCurrentLevelIndex(0)
  }, [userProgress, quest.stories])

  const handleStartQuest = async () => {
    try {
      setIsStarting(true)
      await startQuest(quest.id)
      
      // If no stories, mark story as complete immediately
      if (!quest.stories || quest.stories.length === 0) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await supabase
            .from('user_quests')
            .update({ story_completed: true })
            .eq('quest_id', quest.id)
            .eq('user_id', user.id)
        }
      }
      
      router.refresh()
    } catch (error) {
      console.error('Error starting quest:', error)
      alert('Failed to start quest. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleStoryComplete = async () => {
    try {
      await completeStory(quest.id)
      // Directly set to instructions, don't wait for refresh
      setCurrentStep('instructions')
      // Then refresh in background
      setTimeout(() => router.refresh(), 100)
    } catch (error) {
      console.error('Error completing story:', error)
    }
  }

  const handleInstructionsComplete = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Mark instructions as viewed
        await supabase
          .from('user_quests')
          .update({ instructions_viewed: true })
          .eq('quest_id', quest.id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error marking instructions as viewed:', error)
    }
    
    setCurrentStep('materials')
  }

  const handleMaterialsComplete = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Mark materials as viewed
        await supabase
          .from('user_quests')
          .update({ materials_viewed: true })
          .eq('quest_id', quest.id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error marking materials as viewed:', error)
    }
    
    setCurrentStep('level')
    setCurrentLevelIndex(0)
  }

  const handleLevelComplete = async () => {
    // Record completion time
    const newCompletionTimes = [...levelCompletionTimes, new Date()]
    setLevelCompletionTimes(newCompletionTimes)

    const nextLevelIndex = currentLevelIndex + 1

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if there are more levels
        if (nextLevelIndex < quest.levels.length) {
          // Update current_level to track progress
          const { error } = await supabase
            .from('user_quests')
            .update({
              current_level: nextLevelIndex
            })
            .eq('quest_id', quest.id)
            .eq('user_id', user.id)

          if (error) {
            console.error('Error updating level progress:', error)
          } else {
            console.log(`✅ Progress saved: Level ${nextLevelIndex + 1}`)
            setCurrentLevelIndex(nextLevelIndex)
            router.refresh()
          }
        } else {
          // All levels completed - mark quest as completed
          const { error } = await supabase
            .from('user_quests')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              current_level: quest.levels.length
            })
            .eq('quest_id', quest.id)
            .eq('user_id', user.id)

          if (error) {
            console.error('Error updating quest status:', error)
          } else {
            console.log('✅ Quest marked as completed!')
          }
          
          setCurrentStep('completed')
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  // If user hasn't started the quest yet, show start button
  if (!userProgress) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{quest.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{quest.description}</p>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium">
              {quest.difficulty}
            </span>
            {quest.skill && (
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                {quest.skill.name}
              </span>
            )}
            {quest.xp_reward > 0 && (
              <span className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium">
                {quest.xp_reward} XP
              </span>
            )}
          </div>

          <button
            onClick={handleStartQuest}
            disabled={isStarting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Quest'}
          </button>
        </div>
      </div>
    )
  }

  // Show story view ONLY if stories exist and user hasn't completed them
  if (currentStep === 'story' && quest.stories?.length > 0 && !userProgress?.story_completed) {
    return <StoryView stories={quest.stories} onComplete={handleStoryComplete} />
  }

  // Instructions Step
  if (currentStep === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Instructions</h1>
          </div>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
              {quest.general_instructions || 'No instructions provided.'}
            </p>
          </div>

          {/* Learning Resources */}
          {quest.learning_resources && quest.learning_resources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quest.learning_resources.map((resource: any) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleInstructionsComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue to Materials
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Materials Step
  if (currentStep === 'materials') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <ListChecks className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Materials You Would Need</h1>
          </div>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
              {quest.materials_needed || 'No materials specified.'}
            </p>
          </div>

          <button
            onClick={handleMaterialsComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Start Level 1
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Level Step
  if (currentStep === 'level' && quest.levels && quest.levels[currentLevelIndex]) {
    const currentLevel = quest.levels[currentLevelIndex]
    const levelNumber = currentLevelIndex + 1
    
    // Calculate progress: currentLevelIndex represents completed levels, not the current one
    const completedLevels = currentLevelIndex
    const progressPercentage = Math.round((completedLevels / quest.levels.length) * 100)

    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Level {levelNumber} of {quest.levels.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {progressPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Level Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium mb-4">
              Level {levelNumber}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentLevel.title}</h1>
          </div>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
              {currentLevel.description}
            </p>
          </div>

          {/* Show previous completion times */}
          {levelCompletionTimes.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-900">Your Progress</h3>
              </div>
              <div className="space-y-2">
                {levelCompletionTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Level {index + 1} completed at {time.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleLevelComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {currentLevelIndex < quest.levels.length - 1 ? (
              <>
                Complete Level {levelNumber}
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Complete Quest
                <Trophy className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Completion Step
  if (currentStep === 'completed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg shadow-2xl p-12 text-center text-white mb-8">
          <div className="mb-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Congratulations! 🎉</h1>
            <p className="text-2xl mb-8">You've completed the quest!</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Quest Summary</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span>Quest:</span>
                <span className="font-bold">{quest.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Levels Completed:</span>
                <span className="font-bold">{quest.levels?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>XP Earned:</span>
                <span className="font-bold">{quest.xp_reward} XP</span>
              </div>
            </div>
          </div>

          {levelCompletionTimes.length > 0 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Your Completion Times</h2>
              <div className="space-y-2 text-left">
                {levelCompletionTimes.map((time, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Level {index + 1}
                    </span>
                    <span className="font-mono">{time.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/participant/quests')}
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Quests
            </button>
            
            <button
              onClick={() => setCurrentStep('instructions')}
              className="bg-white/20 backdrop-blur border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white/30 transition-colors"
            >
              Review Quest Content
            </button>
          </div>
        </div>

        {/* Rewards Section */}
        {(quest.badge_image_url || quest.certificate_image_url) && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Badge */}
              {quest.badge_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-6 mb-4">
                    <img
                      src={quest.badge_image_url}
                      alt="Quest Badge"
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Achievement Badge</h3>
                  <a
                    href={quest.badge_image_url}
                    download={`${quest.title}-badge.png`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Badge
                  </a>
                </div>
              )}

              {/* Certificate */}
              {quest.certificate_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-4">
                    <img
                      src={quest.certificate_image_url}
                      alt="Quest Certificate"
                      className="w-full h-48 mx-auto object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                  <a
                    href={quest.certificate_image_url}
                    download={`${quest.title}-certificate.png`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Certificate
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}