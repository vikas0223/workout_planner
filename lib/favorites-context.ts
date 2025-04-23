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

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteWorkouts")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem("favoriteWorkouts", JSON.stringify(favorites))
  }, [favorites])

  const addFavorite = (id: string) => {
    setFavorites((prev) => [...prev, id])
  }

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id))
  }

  const isFavorite = (id: string) => {
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
