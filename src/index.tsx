import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux';
import { configureStore } from './redux/store';

import './i18n';

const root = createRoot(
     document.getElementById( 'root' ) as HTMLElement
);

root.render(
     <BrowserRouter>
          <Provider store={ configureStore( {} ) }>
               <App />
          </Provider>
     </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
