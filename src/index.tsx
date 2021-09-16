import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import store from './store';

import './index.css';
import App from './App';
import ColorChangeHandler from './ColorChangeHandler';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <ColorChangeHandler />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

