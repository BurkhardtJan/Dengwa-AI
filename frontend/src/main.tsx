import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {registerSW} from 'virtual:pwa-register'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import {TargetLanguageProvider} from "./context/TargetLanguageContext.tsx";
import {MediumProvider} from '@/context/MediumContext'
import {SpeechSettingsProvider} from '@/context/SpeechSettingsContext'
import {ChatDefaultsProvider} from '@/context/ChatDefaultsContext'
import './i18n';

registerSW({immediate: true})
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <TargetLanguageProvider>
                <MediumProvider>
                    <SpeechSettingsProvider>
                        <ChatDefaultsProvider>
                            <App/>
                        </ChatDefaultsProvider>
                    </SpeechSettingsProvider>
                </MediumProvider>
            </TargetLanguageProvider>
        </QueryClientProvider>
    </StrictMode>,
)