import React, { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Heart, MessageCircle, Share2, Play, ChevronUp, ChevronDown } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface Video {
  id: string
  sellerId: string
  productId: string
  title: string
  description: string
  videoUrl: string
  category: string
  likes: number
  commentCount: number
  seller?: {
    id: string
    name: string
    avatar: string
  }
}

interface Comment {
  id: string
  userId: string
  text: string
  timestamp: string
  user: {
    id: string
    name: string
    avatar: string
  }
}

interface VideoFeedProps {
  category: string
  onBack: () => void
  onSellerClick: (sellerId: string) => void
}

export function VideoFeed({ category, onBack, onSellerClick }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    fetchVideos()
  }, [category])

  useEffect(() => {
    if (videos.length > 0) {
      checkLikeStatus()
      fetchComments()
    }
  }, [currentIndex, videos])

  const fetchVideos = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/videos/category/${category}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Fetch seller info for each video
        const videosWithSellers = await Promise.all(
          data.map(async (video: Video) => {
            const sellerResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/user/${video.sellerId}`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`
                }
              }
            )
            const seller = sellerResponse.ok ? await sellerResponse.json() : null
            return { ...video, seller }
          })
        )
        
        setVideos(videosWithSellers)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLikeStatus = async () => {
    if (!user || !videos[currentIndex]) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/videos/${videos[currentIndex].id}/like`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked || false)
      }
    } catch (error) {
      console.error('Check like status error:', error)
    }
  }

  const fetchComments = async () => {
    if (!videos[currentIndex]) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/videos/${videos[currentIndex].id}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user || !accessToken) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/videos/${videos[currentIndex].id}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        
        // Update local video likes count
        setVideos(prev => prev.map((v, i) => 
          i === currentIndex 
            ? { ...v, likes: v.likes + (data.liked ? 1 : -1) }
            : v
        ))
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleAddComment = async () => {
    if (!user || !accessToken || !newComment.trim()) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/videos/${videos[currentIndex].id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ text: newComment })
        }
      )

      if (response.ok) {
        setNewComment('')
        await fetchComments()
        
        // Update comment count
        setVideos(prev => prev.map((v, i) => 
          i === currentIndex 
            ? { ...v, commentCount: v.commentCount + 1 }
            : v
        ))
      }
    } catch (error) {
      console.error('Add comment error:', error)
    }
  }

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowComments(false)
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowComments(false)
    }
  }

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowComments(false)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowComments(false)
    }
  }

  // Touch support for mobile
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading videos...</div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <button onClick={onBack} className="absolute top-4 left-4 z-20 p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center justify-center h-screen">
          <p>No videos available in this category yet.</p>
        </div>
      </div>
    )
  }

  const currentVideo = videos[currentIndex]

  return (
    <div 
      ref={containerRef}
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-screen w-screen bg-black overflow-hidden"
    >
      <button onClick={onBack} className="absolute top-4 left-4 z-20 p-2 bg-gray-800/80 rounded-full">
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button 
          onClick={goToPrevious}
          className="absolute top-1/2 left-4 z-20 p-3 bg-gray-800/80 rounded-full transform -translate-y-1/2 hover:bg-gray-700/80 transition-colors"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}
      
      {currentIndex < videos.length - 1 && (
        <button 
          onClick={goToNext}
          className="absolute top-1/2 left-4 z-20 p-3 bg-gray-800/80 rounded-full transform translate-y-12 hover:bg-gray-700/80 transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Video placeholder - in real app would be video element */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
        <div className="text-center">
          <Play className="w-24 h-24 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">Video: {currentVideo.title}</p>
          <p className="text-white/50 text-sm mt-2">Scroll to navigate</p>
        </div>
      </div>

      {/* Video info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white z-10">
        <button
          onClick={() => onSellerClick(currentVideo.sellerId)}
          className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
        >
          {currentVideo.seller?.avatar ? (
            <ImageWithFallback
              src={currentVideo.seller.avatar}
              alt={currentVideo.seller.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-white">
              {currentVideo.seller?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold">{currentVideo.seller?.name || 'Seller'}</p>
            <p className="text-sm text-gray-300">Tap to view profile</p>
          </div>
        </button>
        <h2 className="mb-2">{currentVideo.title}</h2>
        <p className="text-sm text-gray-300 mb-4">{currentVideo.description}</p>
      </div>

      {/* Action buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
            <Heart className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </div>
          <span className="text-white text-sm">{currentVideo.likes}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-sm">{currentVideo.commentCount}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-sm">Share</span>
        </button>
      </div>

      {/* Comments drawer */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-card border-t border-border rounded-t-3xl z-20 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h3 className="text-center">Comments ({comments.length})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {comment.user?.avatar ? (
                  <ImageWithFallback
                    src={comment.user.avatar}
                    alt={comment.user.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0">
                    {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="mr-2">{comment.user?.name || 'User'}</span>
                    <span className="text-gray-600">{comment.text}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div className="p-4 border-t border-border flex gap-2 bg-card">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button onClick={handleAddComment}>Post</Button>
            </div>
          )}
        </div>
      )}

      {/* Progress indicator */}
      <div className="absolute top-4 right-4 z-10 text-white text-sm bg-gray-800/80 px-3 py-1 rounded-full">
        {currentIndex + 1} / {videos.length}
      </div>
    </div>
  )
}
