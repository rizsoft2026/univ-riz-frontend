import { lazy } from 'react';

// SDU ERP
const SDUERP = lazy(() => import('@/pages/SDUERP'));

// Other
const Error404 = lazy(() => import('@/pages/NotFound404'));
const Login = lazy(() => import('@/pages/Login'));

export const layoutsRoutes = [
  {
    path: '/',
    name: 'SDUERP',
    element: <SDUERP />
  },
  {
    path: '/sdu-erp',
    name: 'SDUERP',
    element: <SDUERP />
  }
];

export const singlePageRoutes = [
  {
    path: '/404',
    name: '404',
    element: <Error404 />
  },
  {
    path: '/login',
    name: 'Login',
    element: <Login />
  }
];