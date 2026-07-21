import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const readCurrentDate = () => new Date();

export function getMillisecondsUntilNextLocalDay(referenceDate: Date) {
  const nextLocalDay = new Date(referenceDate);
  nextLocalDay.setHours(24, 0, 0, 0);

  return Math.max(nextLocalDay.getTime() - referenceDate.getTime(), 1_000);
}

export function useCurrentDate(now: () => Date = readCurrentDate) {
  const [currentDate, setCurrentDate] = useState(now);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout>;

    const scheduleRefresh = (referenceDate: Date) => {
      refreshTimer = setTimeout(() => {
        const refreshedDate = now();
        setCurrentDate(refreshedDate);
        scheduleRefresh(refreshedDate);
      }, getMillisecondsUntilNextLocalDay(referenceDate));
    };

    scheduleRefresh(now());
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      const refreshedDate = now();
      setCurrentDate(refreshedDate);
      clearTimeout(refreshTimer);
      scheduleRefresh(refreshedDate);
    });

    return () => {
      clearTimeout(refreshTimer);
      subscription.remove();
    };
  }, [now]);

  return currentDate;
}
