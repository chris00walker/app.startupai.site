'use client';

import { ClickToComponent as CTC } from 'click-to-react-component';

export function ClickToComponent() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return <CTC />;
}
