import common from '../locales/en/common.json';
import dashboard from '../locales/en/dashboard.json';
import vocabulary from '../locales/en/vocabulary.json';
import media from '../locales/en/media.json';
import chat from '../locales/en/chat.json';
import auth from '../locales/en/auth.json';
import landing from '../locales/en/landing.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: {
            common: typeof common;
            dashboard: typeof dashboard;
            vocabulary: typeof vocabulary;
            media: typeof media;
            chat: typeof chat;
            auth: typeof auth;
            landing: typeof landing;
        };
    }
}