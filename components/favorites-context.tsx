"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type FavoritesContextType = {
  favorites: string[]
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("favoriteWorkouts")
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites)
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites)
        } else {
          console.error("Invalid favorites format in localStorage, resetting")
          localStorage.setItem("favoriteWorkouts", JSON.stringify([]))
        }
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error)
      localStorage.setItem("favoriteWorkouts", JSON.stringify([]))
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("favoriteWorkouts", JSON.stringify(favorites))
      } catch (error) {
        console.error("Error saving favorites to localStorage:", error)
      }
    }
  }, [favorites, isInitialized])

  const addFavorite = (id: string) => {
    if (!id) {
      console.error("Cannot add empty ID to favorites")
      return
    }

    // Check if already in favorites to avoid duplicates
    if (favorites.includes(id)) {
      console.log(`Workout ${id} is already in favorites`)
      return
    }

    setFavorites((prev) => [...prev, id])
  }

  const removeFavorite = (id: string) => {
    if (!id) {
      console.error("Cannot remove empty ID from favorites")
      return
    }

    setFavorites((prev) => prev.filter((favId) => favId !== id))
  }

  const isFavorite = (id: string) => {
    if (!id) return false
    return favorites.includes(id)
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
