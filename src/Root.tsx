import React from 'react';
import {Composition} from 'remotion';
import {DisclosureCard} from './components/DisclosureCard';
import {EndCard} from './components/EndCard';
import {LowerThird} from './components/LowerThird';
import {RecapCard} from './components/RecapCard';
import {EpisodeTimeline} from './EpisodeTimeline';
import {holdFrames} from './lib/duration';
import {
  DisclosureSchema,
  EndCardSchema,
  EpisodeSchema,
  LowerThirdSchema,
  RecapSchema,
  type DisclosureProps,
  type EndCardProps,
  type EpisodeProps,
  type LowerThirdProps,
  type RecapProps,
} from './lib/schemas';
import {buildTimeline} from './lib/timeline';

const W = 1920;
const H = 1080;

const disclosureDefaults: DisclosureProps = {
  text: 'Sample disclosure text. Replace it from a JSON file with --props.',
  holdSeconds: 8,
  fps: 24,
  safeMargin: 0.1,
  align: 'center',
};
const recapDefaults: RecapProps = {
  enabled: true,
  title: 'Sample recap',
  lines: ['Replace these lines from a JSON file with --props.'],
  seconds: 20,
  fps: 24,
  safeMargin: 0.1,
};
const endDefaults: EndCardProps = {enabled: true, title: 'Sample end card', lines: [], seconds: 6, fps: 24, safeMargin: 0.1};
const lowerThirdDefaults: LowerThirdProps = {source: 'Source: sample', date: '1 January 2000', holdSeconds: 5, fps: 24};
const episodeDefaults: EpisodeProps = {
  fps: 24,
  featureCut: false,
  programDuration: '00:01:00:00',
  recap: {enabled: true, title: 'Sample recap', lines: ['A line.'], seconds: 20, safeMargin: 0.1},
  endCard: {enabled: true, title: 'Sample end card', lines: [], seconds: 6, safeMargin: 0.1},
  cues: [{id: 'disclosure', type: 'disclosure', at: '00:00:09:00', text: 'Sample.', holdSeconds: 8, safeMargin: 0.1, align: 'center'}],
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="DisclosureCard"
      component={DisclosureCard}
      width={W}
      height={H}
      fps={24}
      durationInFrames={holdFrames(8, 24)}
      schema={DisclosureSchema}
      defaultProps={disclosureDefaults}
      calculateMetadata={({props}) => {
        const p = DisclosureSchema.parse(props);
        return {durationInFrames: holdFrames(p.holdSeconds, p.fps), fps: p.fps, props: p};
      }}
    />
    <Composition
      id="RecapCard"
      component={RecapCard}
      width={W}
      height={H}
      fps={24}
      durationInFrames={holdFrames(20, 24)}
      schema={RecapSchema}
      defaultProps={recapDefaults}
      calculateMetadata={({props}) => {
        const p = RecapSchema.parse(props);
        if (!p.enabled) {
          // Remotion cannot make a zero-frame video. In an episode a disabled recap adds zero frames
          // (see EpisodeTimeline); rendered on its own it is an error, not a surprise one-frame file.
          throw new Error('The recap is switched off (enabled: false): nothing to render. Use EpisodeTimeline for the feature cut.');
        }
        return {durationInFrames: holdFrames(p.seconds, p.fps), fps: p.fps, props: p};
      }}
    />
    <Composition
      id="EndCard"
      component={EndCard}
      width={W}
      height={H}
      fps={24}
      durationInFrames={holdFrames(6, 24)}
      schema={EndCardSchema}
      defaultProps={endDefaults}
      calculateMetadata={({props}) => {
        const p = EndCardSchema.parse(props);
        if (!p.enabled) throw new Error('The end card is switched off (enabled: false): nothing to render.');
        return {durationInFrames: holdFrames(p.seconds, p.fps), fps: p.fps, props: p};
      }}
    />
    <Composition
      id="LowerThird"
      component={LowerThird}
      width={W}
      height={H}
      fps={24}
      durationInFrames={holdFrames(5, 24)}
      schema={LowerThirdSchema}
      defaultProps={lowerThirdDefaults}
      calculateMetadata={({props}) => {
        const p = LowerThirdSchema.parse(props);
        return {durationInFrames: holdFrames(p.holdSeconds, p.fps), fps: p.fps, props: p};
      }}
    />
    <Composition
      id="EpisodeTimeline"
      component={EpisodeTimeline}
      width={W}
      height={H}
      fps={24}
      durationInFrames={buildTimeline(episodeDefaults).totalFrames}
      schema={EpisodeSchema}
      defaultProps={episodeDefaults}
      calculateMetadata={({props}) => {
        const p = EpisodeSchema.parse(props);
        return {durationInFrames: buildTimeline(p).totalFrames, fps: p.fps, props: p};
      }}
    />
  </>
);
