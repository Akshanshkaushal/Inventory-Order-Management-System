import { render, screen, waitFor } from '@testing-library/react';
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
}));

describe('DashboardPage', () => {
  it('renders summary metrics', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Total products')).toBeInTheDocument());
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total customers')).toBeInTheDocument();
    expect(screen.getByText('Total orders')).toBeInTheDocument();
  });
});

