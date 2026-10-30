import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import type {LowerThirdProps} from '../lib/schemas';
import {BG, FG, FONT_STACK, LINE_HEIGHT, MUTED} from '../lib/theme';

/** Source and date lower-third. Static, for the same reason as the disclosure card. */
export const LowerThird: React.FC<LowerThirdProps> = ({source, date}) => {
  const {height} = useVideoConfig();
  const size = Math.round(height * 0.04);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', fontFamily: FONT_STACK}}>
      <div style={{margin: `0 0 ${Math.round(height * 0.08)}px ${Math.round(height * 0.08)}px`, padding: `${size * 0.5}px ${size}px`, backgroundColor: BG, borderLeft: `${Math.round(size * 0.2)}px solid ${FG}`}}>
        <div data-source="" style={{color: FG, fontSize: size, lineHeight: LINE_HEIGHT, fontWeight: 600, whiteSpace: 'pre-wrap'}}>{source}</div>
        <div data-date="" style={{color: MUTED, fontSize: Math.round(size * 0.75), lineHeight: LINE_HEIGHT}}>{date}</div>
      </div>
    </AbsoluteFill>
  );
};
