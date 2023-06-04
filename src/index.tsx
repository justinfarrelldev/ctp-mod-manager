import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { ModificationScreen } from './ModificationScreen';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/modify/:location',
    element: <ModificationScreen />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
