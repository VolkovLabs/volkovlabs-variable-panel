import { EventBusSrv } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { renderHook } from '@testing-library/react';

import { VariableChangedEvent } from '../types';
import { useResetVariable } from './useResetVariable';
import { useRuntimeVariables } from './useRuntimeVariables';

/**
 * Mock useRuntimeVariables
 */
jest.mock('./useRuntimeVariables', () => ({
  useRuntimeVariables: jest.fn(() => ({
    getVariable: jest.fn(),
  })),
}));

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  locationService: {
    partial: jest.fn(),
  },
}));

/**
 * Use Reset Variable
 */
describe('useResetVariable', () => {
  beforeEach(() => {
    jest.mocked(locationService.partial).mockClear();
  });

  it('Should select first option after variable changed', () => {
    const eventBus = new EventBusSrv();
    const panelEventBus = new EventBusSrv();

    /**
     * Mock runtime variables
     */
    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: {},
    } as any);

    const { rerender } = renderHook(() =>
      useResetVariable({
        variableName: 'toReset',
        eventBus: eventBus,
        panelEventBus: panelEventBus,
      })
    );

    /**
     * Emit event
     */
    panelEventBus.publish(new VariableChangedEvent());

    /**
     * Mock runtime variables
     */
    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: {
        name: 'toReset',
        options: [
          {
            value: '1',
          },
        ],
      },
    } as any);

    /**
     * Rerender
     */
    rerender();

    /**
     * Check if reset called
     */
    expect(locationService.partial).toHaveBeenCalledWith(
      {
        ['var-toReset']: '1',
      },
      true
    );
  });

  it('Should not reset if no variable', () => {
    const eventBus = new EventBusSrv();
    const panelEventBus = new EventBusSrv();

    /**
     * Mock runtime variables
     */
    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: undefined,
    } as any);

    const { rerender } = renderHook(() =>
      useResetVariable({
        variableName: '',
        eventBus: eventBus,
        panelEventBus: panelEventBus,
      })
    );

    /**
     * Emit event
     */
    panelEventBus.publish(new VariableChangedEvent());

    /**
     * Rerender
     */
    rerender();

    /**
     * Check if reset called
     */
    expect(locationService.partial).not.toHaveBeenCalled();
  });
});
