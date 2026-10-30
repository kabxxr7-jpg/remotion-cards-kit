import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {DisclosureCard} from './components/DisclosureCard';
import {EndCard} from './components/EndCard';
import {LowerThird} from './components/LowerThird';
import {RecapCard} from './components/RecapCard';
import {buildTimeline, type TimelineItem} from './lib/timeline';
import type {EpisodeProps} from './lib/schemas';
import {BG} from './lib/theme';

const renderItem = (item: TimelineItem, sheet: EpisodeProps): React.ReactNode => {
  switch (item.kind) {
    case 'recap':
      return <RecapCard {...sheet.recap} fps={sheet.fps} />;
    case 'endCard':
      return <EndCard {...sheet.endCard} fps={sheet.fps} />;
    case 'disclosure': {
      const c = item.cue;
      if (c?.type !== 'disclosure') throw new Error('disclosure item without a disclosure cue');
      return <DisclosureCard text={c.text} holdSeconds={c.holdSeconds} fps={sheet.fps} safeMargin={c.safeMargin} align={c.align} />;
    }
    case 'lowerThird': {
      const c = item.cue;
      if (c?.type !== 'lowerThird') throw new Error('lowerThird item without a lowerThird cue');
      return <LowerThird source={c.source} date={c.date} holdSeconds={c.holdSeconds} fps={sheet.fps} />;
    }
  }
};

/** The graphics layer for one episode, laid out from the cue sheet. Black where nothing is placed. */
export const EpisodeTimeline: React.FC<EpisodeProps> = (props) => {
  const timeline = useMemo(() => buildTimeline(props), [props]);
  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      {props.guideTrack ? (
        // the guide voice belongs to the programme, so it starts after any inserted recap
        <Sequence from={timeline.programOffset} name="guide-track">
          <Audio src={staticFile(props.guideTrack)} />
        </Sequence>
      ) : null}
      {timeline.items.map((item) => (
        <Sequence key={item.id} from={item.startFrame} durationInFrames={item.durationFrames} name={item.id}>
          {renderItem(item, props)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
