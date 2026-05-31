import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DashboardPage from './DashboardPage.jsx';

vi.mock('../services/api.js', () => ({
  dashboardApi: {
    summary: () =>
      Promise.resolve({
        data: {
          total_products: 2,
          total_customers: 1,
          total_orders: 3,
          low_stock_products: [],
        },
      }),
  },
  productsApi: {
    list: () => Promise.resolve({ data: [] }),
  },
}));

describe('DashboardPage', () => {
  it('renders summary metrics', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Total products')).toBeInTheDocument());

    expect(within(screen.getByText('Total products').parentElement).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByText('Total customers').parentElement).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByText('Total orders').parentElement).getByText('3')).toBeInTheDocument();
  });
});
