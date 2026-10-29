const TOUR_EVENT = 'crimevista:start-tour';

export function startTour(): void {
  window.dispatchEvent(new Event(TOUR_EVENT));
}

export function onTourRequest(handler: () => void): () => void {
  window.addEventListener(TOUR_EVENT, handler);
  return () => window.removeEventListener(TOUR_EVENT, handler);
}