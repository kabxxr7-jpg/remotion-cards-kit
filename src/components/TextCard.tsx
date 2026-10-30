import React, {useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {fitFontSize} from '../lib/fit';
import {BG, FG, FONT_STACK, LINE_HEIGHT, MUTED} from '../lib/theme';

interface Props {
  label: string;
  title: string;
  lines: string[];
  safeMargin: number;
}

/** Shared body of the recap card and the end card. Static, like every card here. */
export const TextCard: React.FC<Props> = ({label, title, lines, safeMargin}) => {
  const {width, height} = useVideoConfig();
  const body = lines.join('\n\n');
  const fit = useMemo(
    () => fitFontSize({text: `${title}\n\n${body}`, width, height, safeMargin}),
    [title, body, width, height, safeMargin],
  );
  return (
    <AbsoluteFill style={{backgroundColor: BG, color: FG, fontFamily: FONT_STACK, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: fit.boxWidth, height: fit.boxHeight, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={{color: MUTED, fontSize: Math.round(fit.fontPx * 0.6), letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: fit.fontPx * 0.5}}>
          {label}
        </div>
        <div data-title="" style={{fontSize: Math.round(fit.fontPx * 1.0), fontWeight: 700, lineHeight: LINE_HEIGHT, marginBottom: fit.fontPx * 0.6}}>
          {title}
        </div>
        {lines.map((line, i) => (
          <p key={i} data-line="" style={{margin: `0 0 ${fit.fontPx * 0.5}px 0`, fontSize: fit.fontPx, lineHeight: LINE_HEIGHT, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', fontVariantLigatures: 'none'}}>
            {line}
          </p>
        ))}
      </div>
    </AbsoluteFill>
  );
};
