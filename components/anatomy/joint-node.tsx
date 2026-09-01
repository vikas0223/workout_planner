/**
 * Interactive Joint Node Component for SVG Anatomy Map
 * 
 * Renders an accessible articulation point with an enlarged hitbox for touch ergonomics.
 */

'use client';

import React from 'react';
import { AnatomyRegionDefinition } from '@/types/domain';

export interface JointNodeProps {
  joint: AnatomyRegionDefinition;
  cx: number;
  cy: number;
  isSelected: boolean;
  isHovered: boolean;
  isRelated?: boolean;
  onSelect: (joint: AnatomyRegionDefinition) => void;
  onHover: (joint: AnatomyRegionDefinition | null) => void;
}

export function JointNode({
  joint,
  cx,
  cy,
  isSelected,
  isHovered,
  isRelated = false,
  onSelect,
  onHover,
}: JointNodeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(joint);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onSelect(joint);
    }
  };

  let fillColor = '#ffffff';
  let strokeColor = '#6366f1'; // indigo-500
  let ringRadius = 7;
  let pulseClass = '';

  if (isSelected) {
    fillColor = '#4f46e5'; // indigo-600
    strokeColor = '#312e81'; // indigo-900
    ringRadius = 9;
    pulseClass = 'animate-pulse';
  } else if (isHovered) {
    fillColor = '#818cf8'; // indigo-400
    strokeColor = '#4338ca';
    ringRadius = 8;
  } else if (isRelated) {
    fillColor = '#c7d2fe'; // indigo-200
    strokeColor = '#6366f1';
    ringRadius = 7;
  }

  return (
    <g
      role="button"
      tabIndex={0}
      data-region-id={joint.id}
      data-region-type="joint"
      aria-label={`${joint.label} joint`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover(joint)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(joint)}
      onBlur={() => onHover(null)}
      className="cursor-pointer outline-none group focus:ring-2 focus:ring-indigo-500"
    >
      {/* Invisible enlarged hit target for touch (radius 20px) */}
      <circle cx={cx} cy={cy} r={20} fill="transparent" />

      {/* Outer focus / selection glow */}
      {(isSelected || isHovered) && (
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius + 5}
          fill="none"
          stroke="#818cf8"
          strokeWidth={2}
          strokeDasharray={isSelected ? 'none' : '3 3'}
          opacity={0.7}
          className={pulseClass}
        />
      )}

      {/* Outer Ring */}
      <circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2.5}
        className="transition-all duration-200 group-hover:scale-110"
      />

      {/* Center Articulation Dot */}
      <circle
        cx={cx}
        cy={cy}
        r={2.5}
        fill={isSelected ? '#ffffff' : strokeColor}
      />
    </g>
  );
}
