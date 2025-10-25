import React from 'react'
import { DemoDataButton } from './DemoDataButton'
import { ImageWithFallback } from './figma/ImageWithFallback'

const categories = [
  { 
    id: 'flowers', 
    name: 'Flowers', 
    image: 'https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXJzJTIwYm91cXVldHxlbnwxfHx8fDE3NjExNzQxODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-pink-400 to-rose-500' 
  },
  { 
    id: 'food-catering', 
    name: 'Food & Catering', 
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwY2F0ZXJpbmd8ZW58MXx8fHwxNzYxMjQ3NTQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-orange-400 to-red-500' 
  },
  { 
    id: 'handcrafts', 
    name: 'Handcrafts', 
    image: 'https://images.unsplash.com/photo-1640110739689-09b7822d6982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kY3JhZnQlMjBjcmFmdHN8ZW58MXx8fHwxNzYxMjQ3NTQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-purple-400 to-indigo-500' 
  },
  { 
    id: 'jewelry', 
    name: 'Jewelry', 
    image: 'https://images.unsplash.com/photo-1668718003259-650efe62fbca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5JTIwYWNjZXNzb3JpZXN8ZW58MXx8fHwxNzYxMTU4NTUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-yellow-400 to-amber-500' 
  },
  { 
    id: 'beauty', 
    name: 'Beauty & Cosmetics', 
    image: 'https://images.unsplash.com/photo-1602260395251-0fe691861b56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBjb3NtZXRpY3N8ZW58MXx8fHwxNzYxMTg2Mjg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-teal-400 to-cyan-500' 
  },
  { 
    id: 'fashion', 
    name: 'Fashion & Accessories', 
    image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MXx8fHwxNzYxMTYxNTc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-fuchsia-400 to-pink-500' 
  }
]

interface HomepageProps {
  onCategoryClick: (category: string) => void
}

export function Homepage({ onCategoryClick }: HomepageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AdeyLink
          </h1>
          <p className="text-xl text-foreground/80 mb-4">
            Discover amazing products from women entrepreneurs
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
            Browse by category to find local sellers, watch product videos, and support women-owned businesses in your area
          </p>
          <DemoDataButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-64"
            >
              {/* Background Image */}
              <ImageWithFallback
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
                <h2 className="text-3xl text-white drop-shadow-lg">
                  {category.name}
                </h2>
                <p className="text-white/90 text-center mt-2 drop-shadow">
                  Explore unique products
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
