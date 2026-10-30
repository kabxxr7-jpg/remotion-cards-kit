import React from 'react';
import type {RecapProps} from '../lib/schemas';
import {TextCard} from './TextCard';

export const RecapCard: React.FC<RecapProps> = ({title, lines, safeMargin}) => (
  <TextCard label="Previously" title={title} lines={lines} safeMargin={safeMargin} />
);
