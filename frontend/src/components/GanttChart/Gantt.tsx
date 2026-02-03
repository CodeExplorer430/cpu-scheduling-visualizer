import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttEvent } from '@cpu-vis/shared';
import { useTheme } from '../../context/ThemeContext';
import {
  CHART_CONSTANTS,
  getChartDimensions,
  getCoreIds,
  getMaxTime,
  getColorScale,
} from './ganttUtils';

interface Props {
  events: GanttEvent[];
  currentTime?: number;
  domainMax?: number; // Optional prop to force a specific X-axis range
}

export const Gantt: React.FC<Props> = ({ events, currentTime, domainMax }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Accessibility attributes for the SVG container
    svg.attr('role', 'img').attr('aria-label', 'Gantt chart visualization of CPU scheduling');

    // Check for dark mode via theme context
    const isDarkMode = theme === 'dark';
    const axisColor = isDarkMode
      ? CHART_CONSTANTS.AXIS_COLOR_DARK
      : CHART_CONSTANTS.AXIS_COLOR_LIGHT;
    const gridColor = isDarkMode
      ? CHART_CONSTANTS.GRID_COLOR_DARK
      : CHART_CONSTANTS.GRID_COLOR_LIGHT;
    const idleColor = isDarkMode
      ? CHART_CONSTANTS.IDLE_COLOR_DARK
      : CHART_CONSTANTS.IDLE_COLOR_LIGHT;
    const idleTextColor = axisColor;
    const switchBlockColor = isDarkMode
      ? CHART_CONSTANTS.SWITCH_BLOCK_COLOR_DARK
      : CHART_CONSTANTS.SWITCH_BLOCK_COLOR_LIGHT;

    // Determine Cores
    const coreIds = getCoreIds(events);
    const numCores = coreIds.length;

    // Dimensions
    const containerWidth = svgRef.current.clientWidth;
    const { width, height } = getChartDimensions(numCores, containerWidth);
    const margin = CHART_CONSTANTS.MARGIN;

    // Resize SVG container
    svg.attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const maxTime = getMaxTime(events, domainMax);
    const xScale = d3.scaleLinear().domain([0, maxTime]).range([0, width]);
    const colorScale = getColorScale();

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(maxTime, 20));

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis);

    // Style Axis
    xAxisGroup.selectAll('text').attr('fill', axisColor);
    xAxisGroup.selectAll('line').attr('stroke', axisColor);
    xAxisGroup.selectAll('path').attr('stroke', axisColor);

    // Render Rows for each Core
    coreIds.forEach((coreId, index) => {
      const coreY = index * (CHART_CONSTANTS.ROW_HEIGHT + CHART_CONSTANTS.ROW_GAP);
      const coreEvents = events.filter((e) => (e.coreId ?? 0) === coreId);

      // Core Label
      g.append('text')
        .attr('x', -10)
        .attr('y', coreY + CHART_CONSTANTS.ROW_HEIGHT / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', axisColor)
        .attr('font-weight', 'bold')
        .text(`Core ${coreId + 1}`);

      // Grid lines per row
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(Math.min(maxTime, 20))
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(() => '')
        )
        .attr('opacity', 0.1)
        .selectAll('line')
        .attr('stroke', gridColor);

      // Bars
      const rowG = g.append('g').attr('transform', `translate(0, ${coreY})`);

      const bars = rowG
        .selectAll('.bar')
        .data(coreEvents)
        .enter()
        .append('g') // Group for rect + accessible title
        .attr('role', 'graphics-symbol')
        .attr('tabindex', '0') // Make focusable
        .attr('aria-label', (d) => {
          if (d.pid === 'IDLE') return `Core ${coreId + 1}: Idle from ${d.start} to ${d.end}`;
          if (d.pid === 'CS')
            return `Core ${coreId + 1}: Context Switch from ${d.start} to ${d.end}`;
          return `Core ${coreId + 1}: Process ${d.pid} from time ${d.start} to ${d.end}`;
        });

      bars
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => xScale(d.start))
        .attr('y', 0)
        .attr('width', (d) => Math.max(1, xScale(d.end) - xScale(d.start))) // Ensure min width of 1px for visibility
        .attr('height', CHART_CONSTANTS.ROW_HEIGHT)
        .attr('fill', (d) => {
          if (d.pid === 'IDLE') return idleColor;
          if (d.pid === 'CS') return switchBlockColor;
          return colorScale(d.pid) as string;
        })
        .attr('stroke', isDarkMode ? '#1f2937' : '#fff') // Dark bg or White
        .attr('stroke-width', 1)
        .attr('opacity', (d) => (currentTime !== undefined && d.start >= currentTime ? 0.2 : 1))
        .attr('cursor', 'pointer'); // Indicate interactivity

      // Add keyboard focus styling (D3 doesn't handle pseudo-classes easily, usually CSS is better)
      // We'll rely on global CSS or Tailwind's focus-visible if possible, but D3 needs a class.
      // Let's rely on standard browser outline for now.

      // Add click handler for potential future details view
      bars.on('click', (event, d) => {
        // Dispatch a custom event or log for now. In a real app, this could open a modal.
        console.log('Clicked process:', d);
      });

      // Add title for hover tooltip (native browser behavior)
      bars.append('title').text((d) => `${d.pid} (${d.start} - ${d.end})`);

      // Labels
      rowG
        .selectAll('.label')
        .data(coreEvents)
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
        .attr('y', CHART_CONSTANTS.ROW_HEIGHT / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => (d.pid === 'IDLE' || d.pid === 'CS' ? idleTextColor : '#fff'))
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d) => (d.pid === 'IDLE' || d.pid === 'CS' ? '' : d.pid))
        .attr('opacity', (d) => (currentTime !== undefined && d.start >= currentTime ? 0 : 1));

      // Context Switch Markers (Per Row)
      const switchPoints: number[] = [];
      // Sort events by start time just in case
      coreEvents.sort((a, b) => a.start - b.start);

      for (let i = 0; i < coreEvents.length - 1; i++) {
        const current = coreEvents[i];
        const next = coreEvents[i + 1];
        if (current.pid !== next.pid && current.pid !== 'IDLE' && next.pid !== 'IDLE') {
          switchPoints.push(current.end);
        }
      }

      rowG
        .selectAll('.switch-marker')
        .data(switchPoints)
        .enter()
        .append('line')
        .attr('class', 'switch-marker')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', -5)
        .attr('y2', CHART_CONSTANTS.ROW_HEIGHT + 5)
        .attr('stroke', CHART_CONSTANTS.SWITCH_MARKER_COLOR)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '2,2');
    });

    // Current Time Indicator (Global across all rows)
    if (currentTime !== undefined) {
      g.append('line')
        .attr('x1', xScale(currentTime))
        .attr('x2', xScale(currentTime))
        .attr('y1', 0)
        .attr('y2', height - margin.top - margin.bottom)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4');

      g.append('text')
        .attr('x', xScale(currentTime))
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(`t=${currentTime}`);
    }
  }, [events, currentTime, theme, domainMax]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg p-4 transition-colors duration-200">
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          className="w-full min-w-[600px]"
          height="150" // This will be updated by D3
          style={{ width: '100%' }}
        ></svg>
      </div>
    </div>
  );
};
