
import { Buffer } from 'buffer';

if (typeof process === 'undefined') {
  window.process = {
    env: {},
    nextTick: (cb: () => void) => {
      setTimeout(cb, 0);
    },
  } as any;
} else if (typeof process.nextTick === 'undefined') {
  process.nextTick = (cb: () => void) => {
    setTimeout(cb, 0);
  };
}

if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

window.global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <App />
);
