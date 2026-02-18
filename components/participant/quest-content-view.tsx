"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StoryView } from '@/components/participant/story-view'
import { ResourceCard } from '@/components/participant/resource-card'
import { ParticipantVerification } from '@/components/participant/participant-verification'
import { startQuest, completeStory } from '@/lib/actions/quests'
import { CheckCircle2, Book, ListChecks, Trophy, ArrowRight, ArrowLeft, Clock, Download, X, ChevronDown, ChevronUp, FileText, Package } from 'lucide-react'

interface QuestContentViewProps {
  quest: any
  userProgress: any
}

type QuestStep = 'story' | 'instructions' | 'materials' | 'level' | 'completed'

interface LevelCompletion {
  level: number
  completedAt: Date
  durationSeconds: number
}

export function QuestContentView({ quest, userProgress }: QuestContentViewProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<QuestStep>('story')
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompletingLevel, setIsCompletingLevel] = useState(false)
  const [levelCompletions, setLevelCompletions] = useState<LevelCompletion[]>([])
  const [completionsLoaded, setCompletionsLoaded] = useState(false)
  // Track which level indexes have been facilitator-verified this session
  const [verifiedLevels, setVerifiedLevels] = useState<Set<number>>(new Set())
  
  // Track when current level started (resets for each level)
  const [levelStartTime, setLevelStartTime] = useState<Date | null>(null)
  
  // Dropdown states for level page
  const [showInstructions, setShowInstructions] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  
  // State for the image pop-up (enlarged view)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Load existing level completions from database
  useEffect(() => {
    const loadLevelCompletions = async () => {
      if (!userProgress) {
        setCompletionsLoaded(true)
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data: completions } = await supabase
          .from('level_completions')
          .select('*')
          .eq('user_quest_id', userProgress.id)
          .order('level', { ascending: true })

        if (completions) {
          setLevelCompletions(completions.map((c: any) => ({
            level: c.level,
            completedAt: new Date(c.completed_at),
            durationSeconds: c.duration_seconds || 0
          })))
        }
        setCompletionsLoaded(true)
      } catch (error) {
        console.error('Error loading level completions:', error)
        setCompletionsLoaded(true)
      }
    }

    loadLevelCompletions()
  }, [userProgress])

  useEffect(() => {
    // Determine which step the user should see
    if (!userProgress) {
      return // Show start button
    }

    if (userProgress.status === 'completed' && currentStep === 'story') {
      setCurrentStep('completed')
      return
    }

    // Story flow: Only show story if it exists AND hasn't been completed
    if (quest.stories?.length > 0 && !userProgress.story_completed && currentStep === 'story') {
      setCurrentStep('story')
      return
    }

    // We only want to auto-sync the step if we are initializing or if the status just changed to completed
    if (currentStep === 'story') {
        if (!userProgress.instructions_viewed) {
          setCurrentStep('instructions')
        } else if (!userProgress.materials_viewed) {
          setCurrentStep('materials')
        } else {
          setCurrentStep('level')
          setCurrentLevelIndex(userProgress.current_level || 0)
        }
    }
  }, [userProgress, quest.stories])

  // Start level timer when level loads
  useEffect(() => {
    if (currentStep === 'level') {
      const startTime = new Date()
      setLevelStartTime(startTime)
      console.log(`⏱️ Level ${currentLevelIndex + 1} timer started at:`, startTime.toISOString())
    }
  }, [currentStep, currentLevelIndex])

  const handleStartQuest = async () => {
    try {
      setIsStarting(true)
      await startQuest(quest.id)
      
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
      setCurrentStep('instructions')
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
        await supabase
          .from('user_quests')
          .update({ materials_viewed: true })
          .eq('quest_id', quest.id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error marking materials as viewed:', error)
    }
    
    // Navigate to level 1 (timer will start automatically via useEffect)
    setCurrentStep('level')
    setCurrentLevelIndex(0)
  }

  const handleLevelComplete = async () => {
    if (isCompletingLevel) return

    setIsCompletingLevel(true)

    const nextLevelIndex = currentLevelIndex + 1
    const completionTime = new Date()
    
    // Calculate THIS level's duration from when the level started
    const levelDuration = levelStartTime 
      ? Math.max(0, Math.round((completionTime.getTime() - levelStartTime.getTime()) / 1000))
      : 0

    console.log(`✅ Level ${currentLevelIndex + 1} completed in ${levelDuration}s`)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user quest data
        const { data: userQuestData } = await supabase
          .from('user_quests')
          .select('id')
          .eq('quest_id', quest.id)
          .eq('user_id', user.id)
          .single()

        if (userQuestData?.id) {
          // Check if this level completion already exists
          const { data: existingCompletion } = await supabase
            .from('level_completions')
            .select('id')
            .eq('user_quest_id', userQuestData.id)
            .eq('level', currentLevelIndex + 1)
            .single()

          if (!existingCompletion) {
            // Insert new level completion with duration
            await supabase
              .from('level_completions')
              .insert({
                user_quest_id: userQuestData.id,
                level: currentLevelIndex + 1,
                completed_at: completionTime.toISOString(),
                duration_seconds: levelDuration
              })

            // Update local state
            setLevelCompletions([...levelCompletions, {
              level: currentLevelIndex + 1,
              completedAt: completionTime,
              durationSeconds: levelDuration
            }])
          }
        }

        if (nextLevelIndex < quest.levels.length) {
          // Progressing to next level
          await supabase
            .from('user_quests')
            .update({
              current_level: nextLevelIndex
            })
            .eq('quest_id', quest.id)
            .eq('user_id', user.id)

          // Move to next level (timer will restart via useEffect)
          setCurrentLevelIndex(nextLevelIndex)
          setCurrentStep('level')
        } else if (userQuestData?.id) {
          // Final level - Calculate TOTAL time from ALL level completions
          const { data: allLevelCompletions } = await supabase
            .from('level_completions')
            .select('completed_at, duration_seconds')
            .eq('user_quest_id', userQuestData.id)
            .order('level', { ascending: true })

          if (allLevelCompletions && allLevelCompletions.length > 0) {
            // Get the FIRST level's start time and LAST level's completion time
            const firstLevelTime = new Date(allLevelCompletions[0].completed_at).getTime() - (allLevelCompletions[0].duration_seconds * 1000)
            const lastLevelTime = completionTime.getTime()
            
            // Calculate ACTUAL elapsed time from start to finish
            const totalSeconds = Math.max(0, Math.round((lastLevelTime - firstLevelTime) / 1000))
            const totalMinutes = Math.round(totalSeconds / 60)

            console.log('🏆 Quest Complete! Total time:', {
              first_level_started: new Date(firstLevelTime).toISOString(),
              last_level_completed: completionTime.toISOString(),
              total_seconds: totalSeconds,
              total_minutes: totalMinutes
            })

            await supabase
              .from('user_quests')
              .update({
                status: 'completed',
                completed_at: completionTime.toISOString(),
                current_level: quest.levels.length,
                completion_time: totalMinutes,
                completion_time_seconds: totalSeconds
              })
              .eq('quest_id', quest.id)
              .eq('user_id', user.id)

            setCurrentStep('completed')
            router.refresh()
          }
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setTimeout(() => {
        setIsCompletingLevel(false)
      }, 1000)
    }
  }

  const handleBack = () => {
    if (currentStep === 'instructions') {
      // Go back to story (only if story exists)
      if (quest.stories?.length > 0) {
        setCurrentStep('story')
      }
    } else if (currentStep === 'materials') {
      setCurrentStep('instructions')
    } else if (currentStep === 'level' && currentLevelIndex > 0) {
      // Only allow going back if NOT on Level 1
      setCurrentLevelIndex(currentLevelIndex - 1)
    }
  }

  // Helper function to format elapsed time
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 0) return "0s"
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (seconds < 3600) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins > 0) {
      return `${hours}h ${mins}m`
    }
    return `${hours}h`
  }

  if (!userProgress) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex-1">{quest.title}</h1>
            <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm sm:text-base w-fit sm:flex-shrink-0">
              {quest.difficulty}
            </span>
          </div>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6">{quest.description}</p>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {quest.skill && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm sm:text-base">
                {quest.skill.name}
              </span>
            )}
            {quest.xp_reward > 0 && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium text-sm sm:text-base">
                {quest.xp_reward} XP
              </span>
            )}
          </div>

          <button
            onClick={handleStartQuest}
            disabled={isStarting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {isStarting ? 'Starting...' : 'Start Quest'}
          </button>
        </div>
      </div>
    )
  }

  if (currentStep === 'story' && quest.stories?.length > 0 && !userProgress?.story_completed) {
    return <StoryView stories={quest.stories} onComplete={handleStoryComplete} />
  }

  if (currentStep === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Book className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Instructions</h1>
          </div>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed">
              {quest.general_instructions || 'No instructions provided.'}
            </p>
          </div>

          {quest.learning_resources && quest.learning_resources.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Learning Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {quest.learning_resources.map((resource: any) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Back button - only show if story exists */}
            {quest.stories?.length > 0 && (
              <button
                onClick={handleBack}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Story
              </button>
            )}

            <button
              onClick={handleInstructionsComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              Continue to Materials
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'materials') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <ListChecks className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Materials You Would Need</h1>
          </div>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed">
              {quest.materials_needed || 'No materials specified.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back
            </button>

            <button
              onClick={handleMaterialsComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              Start Level 1
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'level' && quest.levels && quest.levels[currentLevelIndex]) {
    const currentLevel = quest.levels[currentLevelIndex]
    const levelNumber = currentLevelIndex + 1
    const progressPercentage = Math.round((currentLevelIndex / quest.levels.length) * 100)
    // Show verification on every level — facilitator must verify each one
    const needsVerification = true
    const isVerified = verifiedLevels.has(currentLevelIndex)
    const canComplete = !needsVerification || isVerified

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
            <span className="font-medium text-gray-600">
              Level {levelNumber} of {quest.levels.length}
            </span>
            <span className="font-medium text-gray-600">
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

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6">
            <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-lg font-medium mb-3 sm:mb-4 text-sm sm:text-base">
              Level {levelNumber}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{currentLevel.title}</h1>
          </div>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed">
              {currentLevel.description}
            </p>
          </div>

          {/* Quick Reference Dropdowns */}
          <div className="mb-6 sm:mb-8 space-y-3">
            {/* Instructions Dropdown */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">General Instructions</span>
                </div>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
              {showInstructions && (
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {quest.general_instructions || 'No instructions provided.'}
                  </p>
                </div>
              )}
            </div>

            {/* Materials Dropdown */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowMaterials(!showMaterials)}
                className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Materials Needed</span>
                </div>
                {showMaterials ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
              {showMaterials && (
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {quest.materials_needed || 'No materials specified.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Your Progress Section - Shows individual level times */}
          {completionsLoaded && levelCompletions.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h3 className="font-bold text-green-900 text-sm sm:text-base">Your Progress</h3>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {levelCompletions.map((completion) => (
                  <div key={completion.level} className="flex items-center gap-2 text-xs sm:text-sm text-green-700">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Level {completion.level} completed in {formatElapsedTime(completion.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Manual Verification Widget ── */}
          {needsVerification && !isVerified && (
            <div className="mb-4 sm:mb-6">
              <ParticipantVerification
                participantId={userProgress?.user_id ?? ''}
                questId={quest.id}
                levelIndex={currentLevelIndex}
                onVerified={() =>
                  setVerifiedLevels((prev) => new Set(prev).add(currentLevelIndex))
                }
              />
            </div>
          )}

          {needsVerification && isVerified && (
            <div className="mb-4 sm:mb-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Facilitator verified — you&apos;re good to go!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Back button - ONLY show if NOT on Level 1 (to protect timer) */}
            {currentLevelIndex > 0 && (
              <button
                onClick={handleBack}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sm:inline">Back to Level {currentLevelIndex}</span>
              </button>
            )}

            <button
              onClick={handleLevelComplete}
              disabled={isCompletingLevel || !canComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompletingLevel ? (
                <>Processing...</>
              ) : currentLevelIndex < quest.levels.length - 1 ? (
                <>
                  Complete Level {levelNumber}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              ) : (
                <>
                  Complete Quest
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </div>

          {/* Helper text when blocked by verification */}
          {needsVerification && !isVerified && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Get your code verified by a facilitator to continue. You can tap
              the button above to request a code or ask them to generate one from
              your profile.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (currentStep === 'completed') {
    const formatElapsedTimeComplete = (seconds: number) => {
      if (!seconds || seconds <= 0) return "0s"
      
      if (seconds < 60) {
        return `${seconds}s`
      }
      
      if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
      }
      
      const hours = Math.floor(seconds / 3600)
      const remainingSeconds = seconds % 3600
      const minutes = Math.floor(remainingSeconds / 60)
      const secs = remainingSeconds % 60
      
      if (secs > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${hours}h ${minutes}m`
      } else {
        return `${hours}h`
      }
    }

    // Use the ACTUAL total time from the database (userProgress.completion_time_seconds)
    // This matches what's shown in the leaderboard
    const actualTotalSeconds = userProgress?.completion_time_seconds || 0

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0 relative">
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 text-white" onClick={() => setSelectedImage(null)}><X className="w-8 h-8" /></button>
            <img src={selectedImage} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg shadow-2xl p-6 sm:p-8 md:p-12 text-center text-white mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Congratulations! 🎉</h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8">You&apos;ve completed the quest!</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Quest Summary</h2>
            <div className="space-y-2 sm:space-y-3 text-left text-sm sm:text-base">
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
              <div className="flex items-center justify-between">
                <span>Total Completion Time:</span>
                <span className="font-bold font-mono">
                  {formatElapsedTimeComplete(actualTotalSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Level-by-Level Completion Times */}
          {completionsLoaded && levelCompletions.length > 0 && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Your Completion Times</h2>
              <div className="space-y-1 sm:space-y-2 text-left text-xs sm:text-sm md:text-base">
                {levelCompletions.map((completion) => (
                  <div key={completion.level} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Level {completion.level}
                    </span>
                    <span className="font-mono">{formatElapsedTime(completion.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button onClick={() => router.push('/participant/quests')} className="bg-white text-blue-600 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base">Back to Quests</button>
            <button onClick={() => setCurrentStep('instructions')} className="bg-white/20 backdrop-blur border-2 border-white text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-white/30 transition-colors text-sm sm:text-base">Review Quest Content</button>
          </div>
        </div>

        {(quest.badge_image_url || quest.certificate_image_url) && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Your Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {quest.badge_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 sm:p-6 mb-4">
                    <img src={quest.badge_image_url} alt="Badge" onClick={() => setSelectedImage(quest.badge_image_url)} className="w-32 h-32 sm:w-48 sm:h-48 mx-auto object-contain cursor-zoom-in hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Achievement Badge</h3>
                  <a href={quest.badge_image_url} download={`${quest.title}-badge.png`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"><Download className="w-4 h-4" /> <span>Download Badge</span></a>
                </div>
              )}
              {quest.certificate_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 mb-4">
                    <img src={quest.certificate_image_url} alt="Cert" onClick={() => setSelectedImage(quest.certificate_image_url)} className="w-full h-32 sm:h-48 mx-auto object-contain cursor-zoom-in hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                  <a href={quest.certificate_image_url} download={`${quest.title}-cert.png`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"><Download className="w-4 h-4" /> <span>Download Certificate</span></a>
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