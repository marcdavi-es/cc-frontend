import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { Auth0Provider } from "@auth0/auth0-react";
import 'antd/dist/antd.css';

ReactDOM.render(
  <Auth0Provider
    audience="https://5qfry2gbjh.execute-api.eu-west-1.amazonaws.com/"
    domain="dev-2g9z9q0r.eu.auth0.com"
    clientId="lhY52r9n6PzCzCzNHynJhHHpQZKuxoUB"
    redirectUri={window.location.origin}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Auth0Provider>,
  document.getElementById('root')
);
