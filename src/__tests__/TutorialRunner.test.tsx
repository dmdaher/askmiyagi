import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialRunner from '@/components/tutorial/TutorialRunner';
import { useTutorialStore } from '@/store/tutorialStore';
import { Tutorial } from '@/types/tutorial';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
  useTutorialStore.getState().reset();
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

const testTutorial: Tutorial = {
  id: 'test-tutorial',
  deviceId: 'fantom-08',
  title: 'Test Tutorial Title',
  description: 'A test',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['test'],
  steps: [
    {
      id: 'step-1',
      title: 'First Step',
      instruction: 'Do the first thing',
      highlightControls: [],
      panelStateChanges: {},
      displayState: { screenType: 'home' },
    },
    {
      id: 'step-2',
      title: 'Second Step',
      instruction: 'Do the second thing',
      highlightControls: [],
      panelStateChanges: {},
      displayState: { screenType: 'home' },
    },
  ],
};

// Simple mock device panel
function MockDevicePanel() {
  return <div data-testid="device-panel">Mock Panel</div>;
}

describe('TutorialRunner', () => {
  it('renders header with tutorial title/category/difficulty', () => {
    render(<TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />);
    expect(screen.getAllByText('Test Tutorial Title').length).toBeGreaterThanOrEqual(1);
    // Category + difficulty in subtitle (also appears in intro modal)
    expect(screen.getAllByText(/basics/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/beginner/).length).toBeGreaterThanOrEqual(1);
  });

  it('device panel rendered', () => {
    render(<TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />);
    expect(screen.getByTestId('device-panel')).toBeInTheDocument();
  });

  it('tutorial overlay rendered with step content', () => {
    render(<TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />);
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByText('Do the first thing')).toBeInTheDocument();
  });

  it('no max-w-5xl constraint on panel container', () => {
    const { container } = render(
      <TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />,
    );
    const maxWConstraint = container.querySelector('.max-w-5xl');
    expect(maxWConstraint).toBeNull();
  });

  it('close button navigates to home with device param', () => {
    render(<TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />);
    fireEvent.click(screen.getByLabelText('Close tutorial'));
    expect(mockPush).toHaveBeenCalledWith('/?device=fantom-08');
  });

  it('step counter shows "N / total"', () => {
    render(<TutorialRunner tutorial={testTutorial} DevicePanel={MockDevicePanel} panelWidth={2700} panelHeight={900} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
