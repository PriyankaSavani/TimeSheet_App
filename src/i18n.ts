import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip: move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
     en: {
          translation: {
               'Please enter a valid email': 'Please enter a valid email',
               'Please enter Email': 'Please enter Email',
               'Please enter Password': 'Please enter Password',
               'Forgot your password?': 'Forgot your password?',
               "Don't have an account?": "Don't have an account?",
               'Sign Up': 'Sign Up',
               'Sign In': 'Sign In',
               'Sign in with': 'Sign in with',
               'Enter your email address and password to access Timesheet.': 'Enter your email address and password to access Timesheet.',
               'Email': 'Email',
               'Password': 'Password',
          }
     }
};

i18n
     // pass the i18n instance to react-i18next.
     .use( initReactI18next )
     // init i18next
     // for all options read: https://www.i18next.com/overview/configuration-options
     .init( {
          resources,
          lng: 'en', // language to use, more info here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
          // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
          // if you're using a language detector, do not define the lng option

          interpolation: {
               escapeValue: false // react already does escaping
          }
     } );

export default i18n;
