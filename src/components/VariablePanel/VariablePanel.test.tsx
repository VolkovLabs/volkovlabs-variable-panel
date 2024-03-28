import { locationService } from '@grafana/runtime';
import { render, screen } from '@testing-library/react';
import { getJestSelectors } from '@volkovlabs/jest-selectors';
import React from 'react';

import { useRuntimeVariables } from '../../hooks';
import { DisplayMode } from '../../types';
import { VariablePanel } from './VariablePanel';

/**
 * Properties
 */
type Props = React.ComponentProps<typeof VariablePanel>;

/**
 * In Test Ids
 */
const InTestIds = {
  tableView: 'data-testid table-view',
  minimizeView: 'data-testid minimize-view',
  buttonView: 'data-testid button-view',
};

/**
 * Mock useRuntimeVariables hook
 */
jest.mock('../../hooks/useRuntimeVariables', () => ({
  useRuntimeVariables: jest.fn(() => ({
    variable: null,
    getVariable: jest.fn(),
  })),
}));

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  locationService: {
    getLocation: jest.fn(() => ({
      search: '',
    })),
    replace: jest.fn(),
  },
}));

/**
 * Mock TableView
 */
jest.mock('../TableView', () => ({
  TableView: jest.fn(() => <div data-testid={InTestIds.tableView} />),
}));

/**
 * Mock MinimizeView
 */
jest.mock('../MinimizeView', () => ({
  MinimizeView: jest.fn(() => <div data-testid={InTestIds.minimizeView} />),
}));

/**
 * Mock ButtonView
 */
jest.mock('../ButtonView', () => ({
  ButtonView: jest.fn(() => <div data-testid={InTestIds.buttonView} />),
}));

/**
 * Panel
 */
describe('Panel', () => {
  /**
   * Get Tested Component
   */
  const getComponent = ({ options = {} as any, ...restProps }: Partial<Props>) => {
    return <VariablePanel options={options} {...(restProps as any)} />;
  };

  /**
   * Selectors
   */
  const getSelectors = getJestSelectors(InTestIds);
  const selectors = getSelectors(screen);

  it('Should render table view', async () => {
    render(getComponent({ options: { displayMode: DisplayMode.TABLE } as any }));
    expect(selectors.tableView()).toBeInTheDocument();
  });

  it('Should render minimize view', async () => {
    render(getComponent({ options: { displayMode: DisplayMode.MINIMIZE } as any }));
    expect(selectors.minimizeView()).toBeInTheDocument();
  });

  it('Should render button view', async () => {
    render(getComponent({ options: { displayMode: DisplayMode.BUTTON } as any }));
    expect(selectors.buttonView()).toBeInTheDocument();
  });

  it('Should render table view by default', async () => {
    render(getComponent({ options: { displayMode: undefined } as any }));
    expect(selectors.tableView()).toBeInTheDocument();
  });

  describe('Dashboard Redirect', () => {
    beforeEach(() => {
      jest.mocked(locationService.replace).mockClear();
    });

    it('Should redirect if variable value changed', () => {
      jest.mocked(useRuntimeVariables).mockImplementationOnce(
        () =>
          ({
            variable: {
              name: 'dashboardId',
              current: {
                value: '123',
              },
            },
          }) as any
      );

      const search = '?var-device=1';
      jest.mocked(locationService.getLocation).mockReturnValueOnce({
        search,
      });

      render(getComponent({ options: {} as any }));

      expect(locationService.replace).toHaveBeenCalledWith(`/d/123${search}`);
    });

    it('Should not redirect if variable not defined', () => {
      jest.mocked(useRuntimeVariables).mockImplementationOnce(
        () =>
          ({
            variable: undefined,
          }) as any
      );

      render(getComponent({ options: {} as any }));

      expect(locationService.replace).not.toHaveBeenCalled();
    });
  });
});
