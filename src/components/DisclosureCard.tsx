import React, {useEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, cancelRender, useVideoConfig} from 'remotion';
import {fitFontSize} from '../lib/fit';
import type {DisclosureProps} from '../lib/schemas';
import {BG, FG, FONT_STACK, LINE_HEIGHT} from '../lib/theme';

interface ViewProps {
  text: string;
  width: number;
  height: number;
  safeMargin: number;
  align: 'left' | 'center';
}

/**
 * The card body. Nothing in here depends on the current frame: the same markup is produced on
 * every frame of the hold, so there is no fade, no movement and nothing that can touch the wording.
 * The text goes in as a single React text child and CSS only preserves its spacing (pre-wrap).
 */
export const DisclosureCardView: React.FC<ViewProps> = ({text, width, height, safeMargin, align}) => {
  const fit = useMemo(() => fitFontSize({text, width, height, safeMargin}), [text, width, height, safeMargin]);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Render-time guard: the size is estimated, so check the REAL layout once and refuse to produce a video
  // in which the text spills out of the safe area.
  useEffect(() => {
    const box = boxRef.current;
    const p = textRef.current;
    if (box && p && (p.scrollHeight > box.clientHeight + 1 || p.scrollWidth > box.clientWidth + 1)) {
      cancelRender(new Error(`Disclosure text overflows the safe area at ${fit.fontPx}px. Shorten it or reduce safeMargin.`));
    }
  }, [fit.fontPx]);

  return (
    <AbsoluteFill style={{backgroundColor: BG, color: FG, fontFamily: FONT_STACK, alignItems: 'center', justifyContent: 'center'}}>
      <div
        ref={boxRef}
        data-safe-area=""
        style={{width: fit.boxWidth, height: fit.boxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <p
          ref={textRef}
          data-verbatim=""
          style={{
            margin: 0,
            width: '100%',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            hyphens: 'none',
            textAlign: align,
            fontSize: fit.fontPx,
            lineHeight: LINE_HEIGHT,
            fontVariantLigatures: 'none',
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const DisclosureCard: React.FC<DisclosureProps> = ({text, safeMargin, align}) => {
  const {width, height} = useVideoConfig();
  return <DisclosureCardView text={text} width={width} height={height} safeMargin={safeMargin} align={align} />;
};
