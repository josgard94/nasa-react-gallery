import { render, screen } from '@testing-library/react';
import App from './App';

test('renders NASA Gallery header', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /NASA Gallery/i })).toBeInTheDocument();
});
