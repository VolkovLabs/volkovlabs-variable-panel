import { CSSProperties, RefObject, useLayoutEffect, useRef, useState } from 'react';

/**
 * Content Position
 */
export const useContentPosition = ({
  width,
  height,
  sticky,
  scrollableContainerRef,
}: {
  width: number;
  height: number;
  sticky: boolean;
  scrollableContainerRef: RefObject<HTMLDivElement>;
}) => {
  /**
   * Element ref
   */
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Content Element Styles
   */
  const [style, setStyle] = useState<CSSProperties>({
    position: 'absolute',
    overflow: 'auto',
    width,
    height,
  });

  /**
   * Grafana variable section
   */
  const grafanaVariablesSection = () => {
    const grafanaSection = document.querySelector('[aria-label="Dashboard submenu"]');

    let bottomPosition = 0;
    let sectionHeight = 0;

    if (grafanaSection) {
      bottomPosition = grafanaSection.getBoundingClientRect().bottom;
      sectionHeight = grafanaSection.getBoundingClientRect().height;
    }

    return {
      isUseSection:
        !!grafanaSection &&
        getComputedStyle(grafanaSection).position === 'fixed' &&
        getComputedStyle(grafanaSection).visibility !== 'hidden',
      bottomPosition,
      sectionHeight,
    };
  };

  useLayoutEffect(() => {
    /**
     * Several scrollbar view elements exist
     * We have to specify particular element
     */
    const scrollableElement = document.querySelector('.main-view .scrollbar-view');

    /**
     * Calculate Position
     */
    const calcPosition = () => {
      if (containerRef.current && scrollableElement) {
        if (sticky) {
          /**
           * Use Grafana Section with variables
           */
          const { isUseSection, bottomPosition, sectionHeight } = grafanaVariablesSection();

          const { y: startY, height, top } = containerRef.current.getBoundingClientRect();

          const scrollableElementRect = scrollableElement.getBoundingClientRect();
          let transformY = Math.abs(Math.min(startY - scrollableElementRect.top, 0));
          const visibleHeight = scrollableElementRect.height - startY + scrollableElementRect.top;
          let calculateHeight = Math.min(
            Math.max(height - transformY, 0),
            startY < 0 ? scrollableElementRect.height : visibleHeight
          );

          /**
           * Calculate transformY with grafana variables section
           */
          if (isUseSection && top <= bottomPosition) {
            transformY = Math.abs(transformY + sectionHeight);
            calculateHeight = Math.min(Math.abs(calculateHeight - sectionHeight), calculateHeight);
          }

          if (scrollableContainerRef.current) {
            scrollableContainerRef.current.style.transform = `translateY(${transformY}px)`;
            scrollableContainerRef.current.style.height = `${calculateHeight}px`;
          }

          setStyle({
            height: calculateHeight,
            transform: `translateY(${transformY}px)`,
            width,
          });

          return;
        }

        setStyle({
          width,
          height,
        });
      }
    };

    calcPosition();

    /**
     * Listen for Scroll events
     */
    if (scrollableElement && sticky) {
      scrollableElement.addEventListener('scroll', calcPosition);

      return () => {
        scrollableElement.removeEventListener('scroll', calcPosition);
      };
    }

    return () => {};
  }, [containerRef, width, height, sticky, scrollableContainerRef]);

  return {
    containerRef,
    style,
  };
};
