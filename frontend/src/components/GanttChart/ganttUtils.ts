import * as d3 from 'd3';
import { GanttEvent } from '@cpu-vis/shared';

export const CHART_CONSTANTS = {
  ROW_HEIGHT: 60,
  ROW_GAP: 20,
  MARGIN: { top: 30, right: 30, bottom: 40, left: 60 },
  SWITCH_MARKER_COLOR: '#ef4444',
  SWITCH_BLOCK_COLOR_LIGHT: '#fca5a5',
  SWITCH_BLOCK_COLOR_DARK: '#7f1d1d',
  IDLE_COLOR_LIGHT: '#e5e7eb',
  IDLE_COLOR_DARK: '#374151',
  GRID_COLOR_LIGHT: '#e5e7eb',
  GRID_COLOR_DARK: '#4b5563',
  AXIS_COLOR_LIGHT: '#374151',
  AXIS_COLOR_DARK: '#9ca3af',
};

export const getChartDimensions = (numCores: number, containerWidth: number) => {
  const width = containerWidth - CHART_CONSTANTS.MARGIN.left - CHART_CONSTANTS.MARGIN.right;
  const height =
    numCores * CHART_CONSTANTS.ROW_HEIGHT +
    (numCores - 1) * CHART_CONSTANTS.ROW_GAP +
    CHART_CONSTANTS.MARGIN.top +
    CHART_CONSTANTS.MARGIN.bottom;
  return { width, height };
};

export const getCoreIds = (events: GanttEvent[]) => {
  return Array.from(new Set(events.map((e) => e.coreId ?? 0))).sort((a, b) => a - b);
};

export const getMaxTime = (events: GanttEvent[], domainMax?: number) => {
  const localMax = d3.max(events, (d) => d.end) || 10;
  return domainMax !== undefined ? Math.max(domainMax, localMax) : localMax;
};

export const getColorScale = () => {
  return d3.scaleOrdinal(d3.schemeTableau10);
};
