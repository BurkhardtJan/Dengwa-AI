import common from '../locales/en/common.json';
import dashboard from '../locales/en/dashboard.json';
import navigate from '../locales/en/navigation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      dashboard: typeof dashboard;
      navigate: typeof navigate;
    };
  }
}