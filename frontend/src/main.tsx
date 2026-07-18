import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import {TargetLanguageProvider} from "./context/TargetLanguageContext.tsx";
import './i18n';

registerSW({ immediate: true })
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <TargetLanguageProvider>
                <App/>
            </TargetLanguageProvider>
        </QueryClientProvider>
    </StrictMode>,
)
