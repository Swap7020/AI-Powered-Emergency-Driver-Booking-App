import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set(s => ({ dark: !s.dark })),
    }),
    { name: 'driver-app-theme' }
  )
)

export default useThemeStore
