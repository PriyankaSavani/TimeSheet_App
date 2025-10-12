import React from 'react'
import Routes from './routes/Routes';
import { configureFakeBackend } from './helpers';

// theme
import './assets/scss/Default.scss';

// configure fake backend
configureFakeBackend();

const App = () => {
       return (
              <Routes />
       )
}

export default App;