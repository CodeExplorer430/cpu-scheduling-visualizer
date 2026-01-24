import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttEvent } from '@cpu-vis/shared';

interface Props {
  events: GanttEvent[];
}

export const Gantt: React.FC<Props> = ({ events }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const maxTime = d3.max(events, d => d.end) || 10;
    const xScale = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, width]);

    // Color scale for processes
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    // Bars
    g.selectAll('.bar')
      .data(events)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.start))
      .attr('y', height / 2 - 20)
      .attr('width', d => xScale(d.end) - xScale(d.start))
      .attr('height', 40)
      .attr('fill', d => d.pid === 'IDLE' ? '#e5e7eb' : colorScale(d.pid) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Labels
    g.selectAll('.label')
      .data(events)
      .enter()
      .append('text')
      .attr('x', d => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
      .attr('y', height / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.pid === 'IDLE' ? '#374151' : '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.pid === 'IDLE' ? 'IDLE' : d.pid);

    // Grid lines (optional)
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .attr('opacity', 0.1);

  }, [events]);

  return (
    <div className="w-full bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Gantt Chart</h3>
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full min-w-[600px]" height="150" style={{ width: '100%' }}></svg>
      </div>
    </div>
  );
};
