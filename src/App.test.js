import { render, screen } from '@testing-library/react';
import App from './App';

test('renders a brand element', () => {
  render(<App />);

  const linkElement = screen.getByText(/Wiseekr/);

  expect(linkElement).toBeInTheDocument();
  expect(linkElement).toHaveClass('navbar-brand');
});