import { locationService } from '@grafana/runtime';

import { ALL_VALUE, ALL_VALUE_PARAMETER, NO_VALUE_PARAMETER } from '../constants';
import { VariableChangedEvent, VariableType } from '../types';
import { selectVariableValues } from './variable';

/**
 * Mock @grafana/runtime
 */
jest.mock('@grafana/runtime', () => ({
  locationService: {
    getSearch: jest.fn(),
    getSearchObject: jest.fn(() => ({})),
    partial: jest.fn(),
  },
}));

describe('Variable Utils', () => {
  /**
   * Event Bus
   */
  const eventBus: any = {
    publish: jest.fn(),
  };

  beforeEach(() => {
    eventBus.publish.mockClear();
  });

  it('Should emit variable changed event', () => {
    const variable = { name: 'variable', type: VariableType.CUSTOM, options: [] };
    selectVariableValues(['value1', 'value2'], variable as any, eventBus);

    expect(eventBus.publish).toHaveBeenCalledWith({
      type: VariableChangedEvent.type,
    });
  });

  describe('selectVariableValues', () => {
    beforeEach(() => {
      jest.mocked(locationService.partial).mockClear();
    });

    describe('Custom Single', () => {
      jest.mocked(locationService.getSearch).mockImplementation(
        () =>
          ({
            getAll: jest.fn(() => []),
          }) as any
      );

      it('Should apply only first value', () => {
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [] };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: 'value1',
          },
          true
        );
      });

      it('Should apply all value', () => {
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [] };
        selectVariableValues([ALL_VALUE_PARAMETER], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ALL_VALUE,
          },
          true
        );
      });

      it('Should apply no value', () => {
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [] };
        selectVariableValues([NO_VALUE_PARAMETER], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: '',
          },
          true
        );
      });
    });

    describe('Custom Multi', () => {
      jest.mocked(locationService.getSearch).mockImplementation(
        () =>
          ({
            getAll: jest.fn(() => []),
          }) as any
      );

      it('Should apply all values', () => {
        const variable = { name: 'variable', type: VariableType.CUSTOM, current: { value: [] }, multi: true };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2'],
          },
          true
        );
      });

      it('Should apply no value', () => {
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [], multi: true };
        selectVariableValues([NO_VALUE_PARAMETER], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: '',
          },
          true
        );
      });

      it('Should add all values to already selected values', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => ['selected1', 'selected2']),
            }) as any
        );
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [], multi: true };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2', 'selected1', 'selected2'],
          },
          true
        );
      });

      it('Should add all unique values to already selected values', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => ['value2', 'selected1', 'selected2']),
            }) as any
        );
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [], multi: true };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2', 'selected1', 'selected2'],
          },
          true
        );
      });

      it('Should set only all value if all was passed', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => ['value2', 'selected1', 'selected2']),
            }) as any
        );
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [], multi: true };
        selectVariableValues(['value1', ALL_VALUE_PARAMETER], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ALL_VALUE,
          },
          true
        );

        /**
         * Check case-insensitive of all value
         */
        jest.mocked(locationService.partial).mockClear();
        selectVariableValues(['value1', ALL_VALUE_PARAMETER], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ALL_VALUE,
          },
          true
        );
      });

      it('Should deselect values if all already selected', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => ['value1', 'value2', 'selected1', 'selected2']),
            }) as any
        );
        const variable = { name: 'variable', type: VariableType.CUSTOM, options: [], multi: true };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['selected1', 'selected2'],
          },
          true
        );
      });

      it('Should select values if some already selected', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => ['value1', 'selected1', 'selected2']),
            }) as any
        );
        const variable = { name: 'variable', type: VariableType.CUSTOM, current: { value: [] }, multi: true };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2', 'selected1', 'selected2'],
          },
          true
        );
      });

      it('Should adjust values if they not defined in url ', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => []),
            }) as any
        );
        jest.mocked(locationService.getSearchObject).mockImplementation(() => ({}));
        const variable = {
          name: 'variable',
          type: VariableType.CUSTOM,
          current: {
            value: ['selected1'],
          },
          multi: true,
        };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2', 'selected1'],
          },
          true
        );
      });

      it('Should adjust values if they not defined in url for non array', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => []),
            }) as any
        );
        jest.mocked(locationService.getSearchObject).mockImplementation(() => ({}));
        const variable = {
          name: 'variable',
          type: VariableType.CUSTOM,
          current: {
            value: 'selected1',
          },
          multi: true,
        };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2', 'selected1'],
          },
          true
        );
      });

      it('Should deselect all value if it not defined in url ', () => {
        jest.mocked(locationService.getSearch).mockImplementation(
          () =>
            ({
              getAll: jest.fn(() => []),
            }) as any
        );
        jest.mocked(locationService.getSearchObject).mockImplementation(() => ({}));
        const variable = {
          name: 'variable',
          type: VariableType.CUSTOM,
          current: {
            value: [ALL_VALUE_PARAMETER],
          },
          multi: true,
        };
        selectVariableValues(['value1', 'value2'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: ['value1', 'value2'],
          },
          true
        );
      });
    });

    describe('Text Box', () => {
      it('Should apply only first value', () => {
        const variable = { name: 'variable', type: VariableType.TEXTBOX };
        selectVariableValues(['value1'], variable as any, eventBus);

        expect(locationService.partial).toHaveBeenCalledWith(
          {
            [`var-${variable.name}`]: 'value1',
          },
          true
        );
      });
    });

    it('Should not apply value if no variable passed', () => {
      selectVariableValues(['value1'], undefined, eventBus);

      expect(locationService.partial).not.toHaveBeenCalled();
    });

    it('Should not apply value for unsupported variable type', () => {
      const variable = { name: 'variable', type: VariableType.ADHOC };
      selectVariableValues(['value1'], variable as any, eventBus);

      expect(locationService.partial).not.toHaveBeenCalled();
    });
  });
});
