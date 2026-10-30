import React from 'react';
import type {EndCardProps} from '../lib/schemas';
import {TextCard} from './TextCard';

export const EndCard: React.FC<EndCardProps> = ({title, lines, safeMargin}) => (
  <TextCard label="End" title={title} lines={lines} safeMargin={safeMargin} />
);
