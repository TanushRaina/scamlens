/**
 * Shared scroll helpers for the highlight cross-scroll.
 *
 * The legend and the highlighted text scroll each other into view. Smooth
 * scrolling is disabled when the user has asked for reduced motion.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Scroll an element into view, honouring the reduced-motion preference. */
export function scrollToElement(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}
