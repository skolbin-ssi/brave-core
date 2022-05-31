import * as React from 'react'
import getPageHandlerInstance from './api/brave_page_handler'

export function useTorObserver () {
  const [hasInit, setHasInit] = React.useState(false)
  const [isConnected, setIsConnected] = React.useState(false)
  const [progress, setProgress] = React.useState<string | undefined>(undefined)

  const isLoading = !hasInit && !isConnected

  React.useEffect(() => {
    getPageHandlerInstance().callbackRouter.onTorCircuitEstablished.addListener(setHasInit)
    getPageHandlerInstance().callbackRouter.onTorInitializing.addListener(setProgress)
  }, [])

  React.useEffect(() => {
    getPageHandlerInstance().pageHandler.getIsTorConnected().then((res: { isConnected: boolean }) => setIsConnected(res.isConnected))
  }, [hasInit])

  return {
    isConnected,
    isLoading,
    progress
  }
}

export function useHasSeenDisclaimer () {
  const [hasSeenDisclaimer, setHasSeenDisclaimer] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    getPageHandlerInstance().pageHandler.getHasUserSeenDisclaimerPref().then((res: { hasSeen: boolean }) => setHasSeenDisclaimer(res.hasSeen))
  }, [])

  return { hasSeenDisclaimer }
}
