import { render, screen } from '@testing-library/react';
import SectionContainer from '../SectionContainer';

describe('SectionContainer', () => {
  it('renders children', () => {
    render(
      <SectionContainer id="browse" x={5} y={10} w={30} h={20}>
        <div data-testid="child">Content</div>
      </SectionContainer>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('positions absolutely with percentage values', () => {
    const { container } = render(
      <SectionContainer id="tempo" x={60} y={40} w={35} h={50}>
        <div />
      </SectionContainer>
    );
    const section = container.firstChild as HTMLElement;
    expect(section.style.left).toBe('60%');
    expect(section.style.top).toBe('40%');
    expect(section.style.width).toBe('35%');
    expect(section.style.height).toBe('50%');
  });

  it('renders header label when provided', () => {
    render(
      <SectionContainer id="fx" x={0} y={0} w={100} h={100} headerLabel="EFFECTS">
        <div />
      </SectionContainer>
    );
    expect(screen.getByText('EFFECTS')).toBeInTheDocument();
  });

  it('sets data-section-id attribute', () => {
    const { container } = render(
      <SectionContainer id="tempo" x={0} y={0} w={100} h={100}>
        <div />
      </SectionContainer>
    );
    const section = container.firstChild as HTMLElement;
    expect(section.getAttribute('data-section-id')).toBe('tempo');
  });
});
