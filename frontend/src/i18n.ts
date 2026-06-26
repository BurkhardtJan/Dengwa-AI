import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enNavigate from './locales/en/navigate.json'
import deCommon from './locales/de/common.json';
import deDashboard from './locales/de/dashboard.json';
import deNavigate from './locales/de/navigate.json'


i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: enCommon,
                dashboard: enDashboard,
                navigate: enNavigate,
            },
            de: {
                common: deCommon,
                dashboard: deDashboard,
                navigate: deNavigate,
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