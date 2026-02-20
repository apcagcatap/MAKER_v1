"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StoryView } from '@/components/participant/story-view'
import { ResourceCard } from '@/components/participant/resource-card'
import { ParticipantVerification } from '@/components/participant/participant-verification'
import { startQuest, completeStory, finishQuest } from '@/lib/actions/quests'
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
  const [verifiedLevels, setVerifiedLevels] = useState<Set<number>>(new Set())
  const [levelStartTime, setLevelStartTime] = useState<Date | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showNoSurveyToast, setShowNoSurveyToast] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Download helper function for cross-origin images
  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, filename: string) => {
    e.preventDefault() // Stop normal link navigation
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed, opening in new tab instead', error)
      window.open(url, '_blank') // Fallback if blocked by CORS
    }
  }

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
    if (!userProgress) return
    if (userProgress.status === 'completed' && currentStep === 'story') {
      setCurrentStep('completed')
      return
    }
    if (quest.stories?.length > 0 && !userProgress.story_completed && currentStep === 'story') {
      setCurrentStep('story')
      return
    }
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

  useEffect(() => {
    if (currentStep === 'level') {
      setLevelStartTime(new Date())
    }
    if (currentStep === 'completed') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, currentLevelIndex])

  useEffect(() => {
    if (showNoSurveyToast) {
      const timer = setTimeout(() => setShowNoSurveyToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showNoSurveyToast])

  const handleSurveyClick = () => {
    if (quest.survey_link?.trim()) {
      window.open(quest.survey_link.trim(), '_blank', 'noopener,noreferrer')
    } else {
      setShowNoSurveyToast(true)
    }
  }

  const handleStartQuest = async () => {
    try {
      setIsStarting(true)
      await startQuest(quest.id)
      if (!quest.stories || quest.stories.length === 0) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('user_quests').update({ story_completed: true }).eq('quest_id', quest.id).eq('user_id', user.id)
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
        await supabase.from('user_quests').update({ instructions_viewed: true }).eq('quest_id', quest.id).eq('user_id', user.id)
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
        await supabase.from('user_quests').update({ materials_viewed: true }).eq('quest_id', quest.id).eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error marking materials as viewed:', error)
    }
    setCurrentStep('level')
    setCurrentLevelIndex(0)
  }

  const handleLevelComplete = async () => {
    if (isCompletingLevel) return
    setIsCompletingLevel(true)
    const nextLevelIndex = currentLevelIndex + 1
    const completionTime = new Date()
    const levelDuration = levelStartTime
      ? Math.max(0, Math.round((completionTime.getTime() - levelStartTime.getTime()) / 1000))
      : 0

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userQuestData } = await supabase
          .from('user_quests').select('id').eq('quest_id', quest.id).eq('user_id', user.id).single()

        if (userQuestData?.id) {
          const { data: existingCompletion } = await supabase
            .from('level_completions').select('id').eq('user_quest_id', userQuestData.id).eq('level', currentLevelIndex + 1).single()

          if (!existingCompletion) {
            await supabase.from('level_completions').insert({
              user_quest_id: userQuestData.id,
              level: currentLevelIndex + 1,
              completed_at: completionTime.toISOString(),
              duration_seconds: levelDuration
            })
            setLevelCompletions([...levelCompletions, {
              level: currentLevelIndex + 1,
              completedAt: completionTime,
              durationSeconds: levelDuration
            }])
          }
        }

        if (nextLevelIndex < quest.levels.length) {
          await supabase.from('user_quests').update({ current_level: nextLevelIndex }).eq('quest_id', quest.id).eq('user_id', user.id)
          setCurrentLevelIndex(nextLevelIndex)
          setCurrentStep('level')
        } else if (userQuestData?.id) {
          const { data: allLevelCompletions } = await supabase
            .from('level_completions').select('completed_at, duration_seconds').eq('user_quest_id', userQuestData.id).order('level', { ascending: true })

          if (allLevelCompletions && allLevelCompletions.length > 0) {
            const firstLevelTime = new Date(allLevelCompletions[0].completed_at).getTime() - (allLevelCompletions[0].duration_seconds * 1000)
            const lastLevelTime = completionTime.getTime()
            const totalSeconds = Math.max(0, Math.round((lastLevelTime - firstLevelTime) / 1000))
            const totalMinutes = Math.round(totalSeconds / 60)

            console.log('🏆 Quest Complete! Total time:', {
              first_level_started: new Date(firstLevelTime).toISOString(),
              last_level_completed: completionTime.toISOString(),
              total_seconds: totalSeconds,
              total_minutes: totalMinutes
            })

            // 1. First, save the completion times (Let the frontend handle the stopwatch)
            await supabase
              .from('user_quests')
              .update({
                current_level: quest.levels.length,
                completion_time: totalMinutes,
                completion_time_seconds: totalSeconds
              })
              .eq('quest_id', quest.id)
              .eq('user_id', user.id)

            // 2. NOW, call our secure server action to officially complete the quest and grant the XP!
            console.log("Calling secure backend to calculate XP...")
            await finishQuest(quest.id)

            setCurrentStep('completed')
            router.refresh()
          }
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setTimeout(() => setIsCompletingLevel(false), 1000)
    }
  }

  const handleBack = () => {
    if (currentStep === 'instructions') {
      if (quest.stories?.length > 0) setCurrentStep('story')
    } else if (currentStep === 'materials') {
      setCurrentStep('instructions')
    } else if (currentStep === 'level' && currentLevelIndex > 0) {
      setCurrentLevelIndex(currentLevelIndex - 1)
    }
  }

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 0) return "0s"
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (seconds < 3600) return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Confetti pieces
  const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.5 + Math.random() * 2}s`,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 6)],
    size: `${6 + Math.random() * 8}px`,
  }))

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
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm sm:text-base">{quest.skill.name}</span>
            )}
            {quest.xp_reward > 0 && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium text-sm sm:text-base">{quest.xp_reward} XP</span>
            )}
          </div>
          <button onClick={handleStartQuest} disabled={isStarting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base">
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
            {quest.stories?.length > 0 && (
              <button onClick={handleBack} className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Story
              </button>
            )}
            <button onClick={handleInstructionsComplete} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2">
              Continue to Materials <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <button onClick={handleBack} className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
            </button>
            <button onClick={handleMaterialsComplete} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2">
              Start Level 1 <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
    const needsVerification = true
    const isVerified = verifiedLevels.has(currentLevelIndex)
    const canComplete = !needsVerification || isVerified

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
            <span className="font-medium text-gray-600">Level {levelNumber} of {quest.levels.length}</span>
            <span className="font-medium text-gray-600">{progressPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6">
            <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-lg font-medium mb-3 sm:mb-4 text-sm sm:text-base">Level {levelNumber}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{currentLevel.title}</h1>
          </div>
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8">
            <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed">{currentLevel.description}</p>
          </div>

          <div className="mb-6 sm:mb-8 space-y-3">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setShowInstructions(!showInstructions)} className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">General Instructions</span>
                </div>
                {showInstructions ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />}
              </button>
              {showInstructions && (
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{quest.general_instructions || 'No instructions provided.'}</p>
                </div>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setShowMaterials(!showMaterials)} className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Materials Needed</span>
                </div>
                {showMaterials ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />}
              </button>
              {showMaterials && (
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{quest.materials_needed || 'No materials specified.'}</p>
                </div>
              )}
            </div>
          </div>

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

          {needsVerification && !isVerified && (
            <div className="mb-4 sm:mb-6">
              <ParticipantVerification
                participantId={userProgress?.user_id ?? ''}
                questId={quest.id}
                levelIndex={currentLevelIndex}
                onVerified={() => setVerifiedLevels((prev) => new Set(prev).add(currentLevelIndex))}
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
            {currentLevelIndex > 0 && (
              <button onClick={handleBack} className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sm:inline">Back to Level {currentLevelIndex}</span>
              </button>
            )}
            <button
              onClick={handleLevelComplete}
              disabled={isCompletingLevel || !canComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompletingLevel ? <>Processing...</> : currentLevelIndex < quest.levels.length - 1 ? (
                <>Complete Level {levelNumber}<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /></>
              ) : (
                <>Complete Quest<Trophy className="w-4 h-4 sm:w-5 sm:h-5" /></>
              )}
            </button>
          </div>
          {needsVerification && !isVerified && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Get your code verified by a facilitator to continue.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (currentStep === 'completed') {
    const formatElapsedTimeComplete = (seconds: number) => {
      if (!seconds || seconds <= 0) return "0s"
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
      }
      const hours = Math.floor(seconds / 3600)
      const remainingSeconds = seconds % 3600
      const minutes = Math.floor(remainingSeconds / 60)
      const secs = remainingSeconds % 60
      if (secs > 0) return `${hours}h ${minutes}m ${secs}s`
      if (minutes > 0) return `${hours}h ${minutes}m`
      return `${hours}h`
    }

    const actualTotalSeconds = userProgress?.completion_time_seconds || 0
    const hasSurvey = !!quest.survey_link?.trim()

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0 relative">

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <style>{`
              @keyframes confettiFall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              .confetti-piece {
                position: absolute;
                top: -10px;
                animation: confettiFall linear forwards;
                border-radius: 2px;
              }
            `}</style>
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: piece.left,
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                }}
              />
            ))}
          </div>
        )}

        {/* No Survey Toast */}
        {showNoSurveyToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <ClipboardList className="w-4 h-4 flex-shrink-0" />
            There is no survey for this quest.
          </div>
        )}

        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 text-white" onClick={() => setSelectedImage(null)}><X className="w-8 h-8" /></button>
            <img src={selectedImage} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Main Completion Card — white */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 text-center mb-6 sm:mb-8 border border-gray-100">

          {/* Animated Trophy */}
          <div className="mb-6">
            <style>{`
              @keyframes trophyPop {
                0% { transform: scale(0) rotate(-15deg); opacity: 0; }
                60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                80% { transform: scale(0.95) rotate(-2deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
              }
              @keyframes trophyGlow {
                0%, 100% { box-shadow: 0 0 20px 4px rgba(251, 191, 36, 0.4); }
                50% { box-shadow: 0 0 40px 12px rgba(251, 191, 36, 0.7); }
              }
              .trophy-container {
                animation: trophyPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
              .trophy-glow {
                animation: trophyGlow 2s ease-in-out infinite;
              }
            `}</style>
            <div className="trophy-container inline-block">
              <div className="trophy-glow w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Congratulations!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 mb-8 sm:mb-10">
            You&apos;ve completed the quest!
          </p>

          {/* Quest Summary */}
          <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-left border border-blue-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">Quest Summary</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quest:</span>
                <span className="font-bold text-gray-900">{quest.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Levels Completed:</span>
                <span className="font-bold text-gray-900">{quest.levels?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">XP Earned:</span>
                <span className="font-bold text-yellow-600">{quest.xp_reward} XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Completion Time:</span>
                <span className="font-bold font-mono text-blue-600">{formatElapsedTimeComplete(actualTotalSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Level-by-Level Completion Times */}
          {completionsLoaded && levelCompletions.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-left border border-green-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">Your Completion Times</h2>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm md:text-base">
                {levelCompletions.map((completion) => (
                  <div key={completion.level} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      Level {completion.level}
                    </span>
                    <span className="font-mono font-semibold text-green-700">{formatElapsedTime(completion.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => router.push('/participant/quests')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-colors text-sm sm:text-base shadow-md"
            >
              Back to Quests
            </button>
            <button
              onClick={() => setCurrentStep('instructions')}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-colors text-sm sm:text-base"
            >
              Review Quest Content
            </button>
            <button
              onClick={handleSurveyClick}
              className={`flex items-center justify-center gap-2 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-colors text-sm sm:text-base shadow-md ${
                hasSurvey
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
              Take Survey
            </button>
          </div>
        </div>

        {/* Rewards Section */}
        {(quest.badge_image_url || quest.certificate_image_url) && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Your Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {quest.badge_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 sm:p-6 mb-4">
                    <img src={quest.badge_image_url} alt="Badge" onClick={() => setSelectedImage(quest.badge_image_url)} className="w-32 h-32 sm:w-48 sm:h-48 mx-auto object-contain cursor-zoom-in hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Achievement Badge</h3>
                  <a href={quest.badge_image_url} onClick={(e) => handleDownload(e, quest.badge_image_url, `${quest.title}-badge.png`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"><Download className="w-4 h-4" /> <span>Download Badge</span></a>
                </div>
              )}
              {quest.certificate_image_url && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 mb-4">
                    <img src={quest.certificate_image_url} alt="Cert" onClick={() => setSelectedImage(quest.certificate_image_url)} className="w-full h-32 sm:h-48 mx-auto object-contain cursor-zoom-in hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                  <a href={quest.certificate_image_url} onClick={(e) => handleDownload(e, quest.certificate_image_url, `${quest.title}-cert.png`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"><Download className="w-4 h-4" /> <span>Download Certificate</span></a>
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