import { render, screen } from '@testing-library/react';

// Simple component for testing
const SimpleComponent = ({ title, content }) => (
  <div data-testid="simple-component">
    <h1>{title}</h1>
    <p>{content}</p>
  </div>
);

test('renders simple component with props', () => {
  render(<SimpleComponent title="Test Title" content="Test Content" />);
  
  const titleElement = screen.getByText('Test Title');
  const contentElement = screen.getByText('Test Content');
  const componentElement = screen.getByTestId('simple-component');
  
  expect(titleElement).toBeInTheDocument();
  expect(contentElement).toBeInTheDocument();
  expect(componentElement).toBeInTheDocument();
});

test('renders with different props', () => {
  render(<SimpleComponent title="Another Title" content="Different Content" />);
  
  const titleElement = screen.getByText('Another Title');
  const contentElement = screen.getByText('Different Content');
  
  expect(titleElement).toBeInTheDocument();
  expect(contentElement).toBeInTheDocument();
});