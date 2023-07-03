import React from 'react';
import { locationService } from '@grafana/runtime';
import { act, render, screen } from '@testing-library/react';
import { TestIds } from '../../constants';
import { VariablePanel } from './VariablePanel';

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  locationService: {
    partial: jest.fn(),
    getSearch: jest.fn(() => new URLSearchParams()),
    getSearchObject: jest.fn(() => ({})),
  },
  getTemplateSrv: jest.fn(() => ({
    getVariables: jest.fn(() => []),
  })),
}));

/**
 * Panel
 */
describe('Panel', () => {
  beforeEach(() => {
    jest.mocked(locationService).partial.mockClear();
  });

  const eventBus = {
    getStream: jest.fn(() => ({
      subscribe: jest.fn(() => ({
        unsubscribe: jest.fn(),
      })),
    })),
  };

  /**
   * Get Tested Component
   */
  const getComponent = ({ options = { name: 'data' }, ...restProps }: any) => {
    return <VariablePanel width={100} height={100} eventBus={eventBus} {...restProps} options={options} />;
  };

  /**
   * Render without errors
   * @param component
   */
  const renderWithoutErrors = async <T,>(component: React.ReactElement): Promise<void> => {
    await render(component);

    await new Promise((resolve) => setTimeout(resolve));
  };

  it('Should find component', async () => {
    await act(() => renderWithoutErrors(getComponent({})));
    expect(screen.getByTestId(TestIds.panel.root)).toBeInTheDocument();
  });

  it('Should show info message if no variables', async () => {
    await act(() => renderWithoutErrors(getComponent({})));
    expect(screen.getByTestId(TestIds.panel.infoMessage)).toBeInTheDocument();
  });
});
