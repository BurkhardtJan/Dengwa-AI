import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enVocabulary from './locales/en/vocabulary.json';
import enMedia from './locales/en/media.json';
import enChat from './locales/en/chat.json';
import enAuth from './locales/en/auth.json';
import enLanding from './locales/en/landing.json';

import deCommon from './locales/de/common.json';
import deDashboard from './locales/de/dashboard.json';
import deVocabulary from './locales/de/vocabulary.json';
import deMedia from './locales/de/media.json';
import deChat from './locales/de/chat.json';
import deAuth from './locales/de/auth.json';
import deLanding from './locales/de/landing.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: enCommon,
                dashboard: enDashboard,
                vocabulary: enVocabulary,
                media: enMedia,
                chat: enChat,
                auth: enAuth,
                landing: enLanding,
            },
            de: {
                common: deCommon,
                dashboard: deDashboard,
                vocabulary: deVocabulary,
                media: deMedia,
                chat: deChat,
                auth: deAuth,
                landing: deLanding,
            },
        },
        defaultNS: 'common',
        fallbackLng: 'en',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;