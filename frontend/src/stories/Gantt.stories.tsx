import type { Meta, StoryObj } from '@storybook/react';
import { Gantt } from '../components/GanttChart/Gantt';
import { ThemeProvider } from '../context/ThemeContext';

const meta: Meta<typeof Gantt> = {
  title: 'Visualization/GanttChart',
  component: Gantt,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="p-4 w-full h-screen bg-gray-50 dark:bg-gray-900">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    events: [
      { pid: 'P1', start: 0, end: 5, coreId: 0 },
      { pid: 'P2', start: 5, end: 8, coreId: 0 },
      { pid: 'IDLE', start: 8, end: 10, coreId: 0 },
      { pid: 'P1', start: 10, end: 12, coreId: 0 },
    ],
    currentTime: 6,
  },
};

export const MultiCore: Story = {
  args: {
    events: [
      { pid: 'P1', start: 0, end: 5, coreId: 0 },
      { pid: 'P2', start: 0, end: 4, coreId: 1 },
      { pid: 'P3', start: 5, end: 10, coreId: 0 },
      { pid: 'P4', start: 4, end: 8, coreId: 1 },
      { pid: 'CS', start: 8, end: 9, coreId: 1 },
      { pid: 'P2', start: 9, end: 12, coreId: 1 },
    ],
    currentTime: 7,
  },
};

export const ComplexExecution: Story = {
  args: {
    events: [
      { pid: 'P1', start: 0, end: 3, coreId: 0 },
      { pid: 'CS', start: 3, end: 4, coreId: 0 },
      { pid: 'P2', start: 4, end: 8, coreId: 0 },
      { pid: 'CS', start: 8, end: 9, coreId: 0 },
      { pid: 'P3', start: 9, end: 12, coreId: 0 },
      { pid: 'IDLE', start: 12, end: 15, coreId: 0 },
      { pid: 'P1', start: 15, end: 20, coreId: 0 },
    ],
    currentTime: 20,
  },
};
