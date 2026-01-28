import 'expect';

declare module 'expect' {
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeWithinRange(min: number, max: number): R;
    toMeetSuccessMetric(target: number): R;
  }
}

declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      toBeWithinRange(min: number, max: number): R;
      toMeetSuccessMetric(target: number): R;
    }
  }
}
