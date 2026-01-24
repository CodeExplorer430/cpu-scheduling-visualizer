import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttEvent } from '@cpu-vis/shared';
import { useTheme } from '../../context/ThemeContext';

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
    svg
      .attr('role', 'img')
      .attr('aria-label', 'Gantt chart visualization of CPU scheduling');

    // Check for dark mode via theme context
    const isDarkMode = theme === 'dark';
    const axisColor = isDarkMode ? '#9ca3af' : '#374151'; // gray-400 : gray-700
    const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb'; // gray-600 : gray-200
    const idleColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 : gray-200
    const idleTextColor = isDarkMode ? '#9ca3af' : '#374151';
    const switchMarkerColor = '#ef4444'; // Red for context switches

    // Dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    // Use domainMax if provided, otherwise default to this chart's max time
    const localMax = d3.max(events, (d) => d.end) || 10;
    const maxTime = domainMax !== undefined ? Math.max(domainMax, localMax) : localMax;

    const xScale = d3.scaleLinear().domain([0, maxTime]).range([0, width]);

    // Color scale for processes
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(maxTime, 20));

    const xAxisGroup = g.append('g').attr('transform', `translate(0, ${height})`).call(xAxis);

    // Style Axis
    xAxisGroup.selectAll('text').attr('fill', axisColor);
    xAxisGroup.selectAll('line').attr('stroke', axisColor);
    xAxisGroup.selectAll('path').attr('stroke', axisColor);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(maxTime, 20))
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .attr('opacity', 0.1)
      .selectAll('line')
      .attr('stroke', gridColor);

    // Bars
    const bars = g.selectAll('.bar')
      .data(events)
      .enter()
      .append('g') // Group for rect + accessible title
      .attr('role', 'graphics-symbol')
      .attr('aria-label', d => `${d.pid === 'IDLE' ? 'Idle' : 'Process ' + d.pid} from time ${d.start} to ${d.end}`);

    bars.append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.start))
      .attr('y', height / 2 - 20)
      .attr('width', (d) => xScale(d.end) - xScale(d.start))
      .attr('height', 40)
      .attr('fill', (d) => (d.pid === 'IDLE' ? idleColor : (colorScale(d.pid) as string)))
      .attr('stroke', isDarkMode ? '#1f2937' : '#fff') // Dark bg or White
      .attr('stroke-width', 1)
      .attr('opacity', (d) => (currentTime !== undefined && d.start >= currentTime ? 0.2 : 1));
    
    // Add title for hover tooltip (native browser behavior)
    bars.append('title')
      .text(d => `${d.pid} (${d.start} - ${d.end})`);

    // Labels
    g.selectAll('.label')
      .data(events)
      .enter()
      .append('text')
      .attr('x', (d) => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
      .attr('y', height / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.pid === 'IDLE' ? idleTextColor : '#fff'))
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text((d) => (d.pid === 'IDLE' ? '' : d.pid))
      .attr('opacity', (d) => (currentTime !== undefined && d.start >= currentTime ? 0 : 1));

    // Context Switch Markers
    // Identify switches: consecutive events where PID changes and neither is IDLE
    // Or we can mark ANY switch away from a process (excluding to IDLE? No, usually switch overhead is recorded).
    // Spec says: "show markers where context switches occur".
    // Typically, this is between two different processes.
    
    const switchPoints: number[] = [];
    for(let i = 0; i < events.length - 1; i++) {
        const current = events[i];
        const next = events[i+1];
        if (current.pid !== next.pid && current.pid !== 'IDLE' && next.pid !== 'IDLE') {
            switchPoints.push(current.end);
        }
    }

    g.selectAll('.switch-marker')
        .data(switchPoints)
        .enter()
        .append('line')
        .attr('class', 'switch-marker')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', height / 2 - 25) // Slightly taller than bars
        .attr('y2', height / 2 + 25)
        .attr('stroke', switchMarkerColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '2,2');

    // Current Time Indicator
    if (currentTime !== undefined) {
      g.append('line')
        .attr('x1', xScale(currentTime))
        .attr('x2', xScale(currentTime))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4');

      g.append('text')
        .attr('x', xScale(currentTime))
        .attr('y', -5)
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
          height="150"
          style={{ width: '100%' }}
        ></svg>
      </div>
    </div>
  );
};
