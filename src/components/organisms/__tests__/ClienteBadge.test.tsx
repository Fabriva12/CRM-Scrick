import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClienteBadge } from '../../molecules/ClienteBadge';

describe('ClienteBadge', () => {
  it('renders B2B badge with label "Empresa"', () => {
    render(<ClienteBadge tipo="B2B" />);
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('renders B2C badge with label "Persona"', () => {
    render(<ClienteBadge tipo="B2C" />);
    expect(screen.getByText('Persona')).toBeInTheDocument();
  });

  it('renders a span element', () => {
    render(<ClienteBadge tipo="B2B" />);
    const badge = screen.getByText('Empresa');
    expect(badge.tagName).toBe('SPAN');
  });
});
