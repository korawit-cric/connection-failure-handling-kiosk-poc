import { render, screen } from '@testing-library/react';
import { FeatureBadge } from '../feature-badge';

describe('FeatureBadge', () => {
  it('renders label correctly', () => {
    render(<FeatureBadge label="Test Badge" />);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies highlight styles when highlight prop is true', () => {
    render(<FeatureBadge label="Highlighted" highlight />);
    const badge = screen.getByText('Highlighted');
    expect(badge).toHaveClass('bg-blue-100');
  });

  it('applies default styles when highlight prop is false', () => {
    render(<FeatureBadge label="Default" />);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-100');
  });
});
