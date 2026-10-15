import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './login';

test('renders login email input and login form controls', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  const emailInput = screen.getByLabelText(/Email/i);
  expect(emailInput).toBeInTheDocument();
  const submitButton = screen.getByDisplayValue(/Log in/i);
  expect(submitButton).toBeInTheDocument();
});
