import { fireEvent, render, screen } from '@testing-library/react';
import React, { useRef } from 'react';

import { useContentPosition } from './useContentPosition';

/**
 * In Test Ids
 */
const InTestIds = {
  scrollableElement: 'scrollable-element',
  container: 'container',
  content: 'content',
  grafanaVariablesSection: 'grafanaVariablesSection',
};

describe('Use Content Position', () => {
  /**
   * Tested Component
   */
  const Component = (props: { width: number; height: number; sticky: boolean }) => {
    /**
     * Element ref
     */
    const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

    const { containerRef, style } = useContentPosition({ ...props, scrollableContainerRef });
    return (
      <div ref={containerRef} style={{ width: props.width, height: props.height }}>
        <div data-testid={InTestIds.content} ref={scrollableContainerRef} style={style} />
      </div>
    );
  };

  /**
   * Scrollable Container
   */
  const ScrollableContainer = ({ children, style }: { children: React.ReactElement; style: React.CSSProperties }) => (
    <div className="main-view">
      <div className="scrollbar-view" data-testid={InTestIds.scrollableElement} style={style}>
        {children}
      </div>
    </div>
  );

  it('Should apply size on scroll', () => {
    render(
      <ScrollableContainer style={{ height: 1000 }}>
        <Component width={200} height={200} sticky={false} />
      </ScrollableContainer>
    );

    fireEvent.scroll(screen.getByTestId(InTestIds.scrollableElement), { target: { scrollY: 100 } });

    expect(screen.getByTestId(InTestIds.content)).toHaveStyle({ width: '200px', height: '200px' });
  });

  it('Should follow on scroll', () => {
    render(
      <ScrollableContainer style={{ height: 1000 }}>
        <Component width={200} height={200} sticky={true} />
      </ScrollableContainer>
    );

    const scrollableElement = screen.getByTestId(InTestIds.scrollableElement);
    const content = screen.getByTestId(InTestIds.content);

    expect(content).toHaveStyle({ transform: 'translateY(0px)' });

    content.getBoundingClientRect = jest.fn(
      () =>
        ({
          y: -100,
          height: 200,
        }) as any
    );
    scrollableElement.getBoundingClientRect = jest.fn(
      () =>
        ({
          top: 100,
          height: 1000,
        }) as any
    );
    fireEvent.scroll(scrollableElement, { target: { scrollY: 100 } });

    expect(screen.getByTestId(InTestIds.content)).toHaveStyle({ transform: 'translateY(100px)' });
  });

  it('Should add a spacing if grafana variable section with fixed position', () => {
    render(
      <ScrollableContainer style={{ height: 1000 }}>
        <>
          <section
            aria-label="Dashboard submenu"
            data-testid={InTestIds.grafanaVariablesSection}
            style={{ height: 80, position: 'fixed' }}
          ></section>
          <Component width={200} height={200} sticky={true} />
        </>
      </ScrollableContainer>
    );

    const scrollableElement = screen.getByTestId(InTestIds.scrollableElement);
    const content = screen.getByTestId(InTestIds.content);
    const grafanaVariablesSection = screen.getByTestId(InTestIds.grafanaVariablesSection);

    /**
     * Set client height to variables section
     */
    Object.defineProperty(grafanaVariablesSection, 'clientHeight', {
      get() {
        return 80;
      },
    });

    expect(content).toHaveStyle({ transform: 'translateY(0px)' });

    content.getBoundingClientRect = jest.fn(
      () =>
        ({
          y: -100,
          height: 200,
        }) as any
    );
    scrollableElement.getBoundingClientRect = jest.fn(
      () =>
        ({
          top: 100,
          height: 1000,
        }) as any
    );

    fireEvent.scroll(scrollableElement, { target: { scrollY: 100 } });

    expect(screen.getByTestId(InTestIds.content)).toHaveStyle({ transform: 'translateY(180px)' });
  });
});
