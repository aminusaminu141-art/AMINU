import { render, screen } from '@testing-library/react';
import App from '../client/scripts/main'; // Adjust the import based on your actual main script
import '@testing-library/jest-dom/extend-expect';

describe('Client Application', () => {
  test('renders principal dashboard', () => {
    render(<App />);
    const linkElement = screen.getByText(/Principal Dashboard/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('renders student dashboard', () => {
    render(<App />);
    const linkElement = screen.getByText(/Student Dashboard/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('renders class master dashboard', () => {
    render(<App />);
    const linkElement = screen.getByText(/Class Master Dashboard/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('renders exam officer dashboard', () => {
    render(<App />);
    const linkElement = screen.getByText(/Exam Officer Dashboard/i);
    expect(linkElement).toBeInTheDocument();
  });
});