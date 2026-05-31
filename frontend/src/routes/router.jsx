import { createBrowserRouter } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout.jsx';
import CustomersPage from '../pages/CustomersPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import ProductsPage from '../pages/ProductsPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'orders', element: <OrdersPage /> },
    ],
  },
]);

