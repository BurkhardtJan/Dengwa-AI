import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMedium } from '@/services/media.service'
import type { components } from '@/types/api'

type Media = components['schemas']['MediaResponse']

interface MediumContextType {
  mediumId: string | null
  setMediumId: (id: string | null) => void
  medium: Media | undefined
  isLoading: boolean
}

const MediumContext = createContext<MediumContextType | undefined>(undefined)

export function MediumProvider({ children }: { children: ReactNode }) {
  const [mediumId, setMediumId] = useState<string | null>(null)

  const { data: medium, isLoading } = useQuery({
    queryKey: ['media', mediumId],
    queryFn: () => fetchMedium(mediumId!),
    enabled: !!mediumId,
  })

  return (
    <MediumContext.Provider value={{ mediumId, setMediumId, medium, isLoading }}>
      {children}
    </MediumContext.Provider>
  )
}

export function useMedium() {
  const context = useContext(MediumContext)
  if (!context) throw new Error('useMedium must be used within a MediumProvider')
  return context
}