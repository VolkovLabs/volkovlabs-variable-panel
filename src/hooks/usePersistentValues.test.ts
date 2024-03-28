import { locationService } from '@grafana/runtime';
import { act, renderHook } from '@testing-library/react';

import { ALL_VALUE, ALL_VALUE_PARAMETER } from '../constants';
import { VariableType } from '../types';
import { getRuntimeVariable, setVariableValue } from '../utils';
import { usePersistentValues } from './usePersistentValues';
import { useRuntimeVariables } from './useRuntimeVariables';

/**
 * Session storage mock
 */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  locationService: {
    getSearch: jest.fn(),
  },
}));

/**
 * Mock use runtime variables
 */
jest.mock('./useRuntimeVariables', () => ({
  useRuntimeVariables: jest.fn(() => ({
    variable: null,
  })),
}));

/**
 * Mock utils
 */
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  setVariableValue: jest.fn(),
}));

describe('Use Persistent Values', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
    });
    sessionStorageMock.setItem.mockClear();
    jest.mocked(setVariableValue).mockClear();
  });

  it('Should save unavailable values and remove from url', async () => {
    /**
     * Set variable
     */
    const variableName = 'varName';

    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: getRuntimeVariable({
        name: variableName,
        type: VariableType.QUERY,
        multi: true,
        current: {
          value: ['option1'],
        },
        options: [
          {
            value: 'option1',
            selected: true,
          },
        ],
      } as any),
      getVariable: jest.fn(),
    });

    /**
     * Set query variable values
     */
    jest.mocked(locationService.getSearch).mockImplementation(
      () =>
        ({
          getAll: jest.fn(() => ['option2']),
        }) as any
    );

    await act(async () =>
      renderHook(() =>
        usePersistentValues({ eventBus: {} as any, variableName, enabled: true, panelEventBus: {} as any })
      )
    );

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(`var-${variableName}`, JSON.stringify(['option2']));
    expect(setVariableValue).toHaveBeenCalledWith(variableName, ['option1'], expect.anything());
  });

  it('Should restore values and remove them from the session storage', async () => {
    /**
     * Set variable
     */
    const variableName = 'varName';

    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: getRuntimeVariable({
        name: variableName,
        type: VariableType.QUERY,
        multi: true,
        current: {
          value: [ALL_VALUE_PARAMETER],
        },
        options: [
          {
            value: 'option2',
            selected: false,
          },
        ],
      } as any),
      getVariable: jest.fn(),
    });

    /**
     * Set query variable values
     */
    jest.mocked(locationService.getSearch).mockImplementation(
      () =>
        ({
          getAll: jest.fn(() => [ALL_VALUE]),
        }) as any
    );

    /**
     * Set saved values
     */
    sessionStorageMock.getItem.mockReturnValueOnce(JSON.stringify(['option2']));

    await act(async () =>
      renderHook(() =>
        usePersistentValues({ eventBus: {} as any, variableName, enabled: true, panelEventBus: {} as any })
      )
    );

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(`var-${variableName}`, JSON.stringify([]));
    expect(setVariableValue).toHaveBeenCalledWith(variableName, ['option2'], expect.anything());
  });

  it('Should select all value if no available values', async () => {
    /**
     * Set variable
     */
    const variableName = 'varName';

    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: getRuntimeVariable({
        name: variableName,
        type: VariableType.QUERY,
        multi: true,
        current: {
          value: ALL_VALUE_PARAMETER,
        },
        options: [],
      } as any),
      getVariable: jest.fn(),
    });

    /**
     * Set query variable values
     */
    jest.mocked(locationService.getSearch).mockImplementation(
      () =>
        ({
          getAll: jest.fn(() => ['option1']),
        }) as any
    );

    await act(async () =>
      renderHook(() =>
        usePersistentValues({ eventBus: {} as any, variableName, enabled: true, panelEventBus: {} as any })
      )
    );

    expect(setVariableValue).toHaveBeenCalledWith(variableName, [ALL_VALUE], expect.anything());
  });

  it('Should work if no previously saved values', async () => {
    /**
     * Set variable
     */
    const variableName = 'varName';

    jest.mocked(useRuntimeVariables).mockReturnValue({
      variable: getRuntimeVariable({
        name: variableName,
        type: VariableType.QUERY,
        multi: true,
        current: {
          value: [ALL_VALUE_PARAMETER],
        },
        options: [
          {
            value: 'option2',
            selected: false,
          },
        ],
      } as any),
      getVariable: jest.fn(),
    });

    /**
     * Set query variable values
     */
    jest.mocked(locationService.getSearch).mockImplementation(
      () =>
        ({
          getAll: jest.fn(() => [ALL_VALUE]),
        }) as any
    );

    /**
     * Set saved values
     */
    sessionStorageMock.getItem.mockReturnValueOnce(null);

    await act(async () =>
      renderHook(() =>
        usePersistentValues({ eventBus: {} as any, variableName, enabled: true, panelEventBus: {} as any })
      )
    );

    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    expect(setVariableValue).not.toHaveBeenCalled();
  });
});
