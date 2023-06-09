import React from 'react';
import { toDataFrame } from '@grafana/data';
import { fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { TestIds } from '../constants';
import { TableItem } from '../types';
import { getItemWithStatus, selectVariableValues } from '../utils';
import { useFavorites } from './useFavorites';
import { useRuntimeVariables } from './useRuntimeVariables';
import { useTable } from './useTable';

/**
 * Mock useRuntimeVariables
 */
jest.mock('./useRuntimeVariables', () => ({
  useRuntimeVariables: jest.fn(() => ({
    variable: null,
    getVariable: jest.fn(),
  })),
}));

/**
 * Mock useFavorites
 */
jest.mock('./useFavorites', () => ({
  useFavorites: jest.fn(() => ({
    remove: jest.fn(),
    add: jest.fn(),
    isAdded: jest.fn(),
  })),
}));

/**
 * Mock utils
 */
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  selectVariableValues: jest.fn(),
  getItemWithStatus: jest.fn((...args: [any, any]) => jest.requireActual('../utils').getItemWithStatus(...args)),
}));

/**
 * In Test Ids
 */
const InTestIds = {
  headerRow: (id: string) => `data-testid table header-row-${id}`,
  row: (value: string, depth: number) => `data-testid table row-${depth}-${value}`,
};

describe('Use Table Hook', () => {
  beforeEach(() => {
    jest.mocked(selectVariableValues).mockClear();
  });

  it('Should return variable options if no levels', () => {
    jest.mocked(useRuntimeVariables).mockImplementation(
      () =>
        ({
          variable: {
            options: [
              {
                text: 'option1',
                value: 'option1',
                selected: true,
              },
              {
                text: 'option2',
                value: 'option2',
                selected: false,
              },
            ],
          },
        } as any)
    );

    /**
     * Use Table
     */
    const { result } = renderHook(() =>
      useTable({ data: { series: [] } as any, options: {} as any, eventBus: null as any })
    );

    expect(result.current.tableData).toEqual([
      expect.objectContaining({
        value: 'option1',
        selected: true,
        selectable: true,
      }),
      expect.objectContaining({
        value: 'option2',
        selected: false,
        selectable: true,
      }),
    ]);
  });

  it('Should add All option for single level', () => {
    const variable = {
      multi: true,
      includeAll: true,
      options: [
        {
          text: 'All',
          value: '__all',
          selected: false,
        },
        {
          text: 'device1',
          value: 'device1',
          selected: true,
        },
        {
          text: 'device2',
          value: 'device2',
          selected: false,
        },
      ],
    };
    jest.mocked(useRuntimeVariables).mockImplementation(
      () =>
        ({
          variable,
          getVariable: jest.fn(() => variable),
        } as any)
    );
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'device',
          values: ['device1', 'device2'],
        },
      ],
      refId: 'A',
    });

    /**
     * Use Table
     */
    const { result } = renderHook(() =>
      useTable({
        data: { series: [dataFrame] } as any,
        options: {} as any,
        eventBus: null as any,
        levels: [{ name: 'device', source: 'A' }],
      })
    );

    expect(result.current.tableData).toEqual([
      expect.objectContaining({
        value: 'All',
        selected: false,
        selectable: true,
      }),
      expect.objectContaining({
        value: 'device1',
        selected: true,
        selectable: true,
      }),
      expect.objectContaining({
        value: 'device2',
        selected: false,
        selectable: true,
      }),
    ]);
  });

  it('Should return rows with subRows if nested levels', () => {
    const variable = {
      multi: true,
      includeAll: true,
      options: [
        {
          text: 'All',
          value: '__all',
          selected: false,
        },
        {
          text: 'device1',
          value: 'device1',
          selected: true,
        },
        {
          text: 'device2',
          value: 'device2',
          selected: false,
        },
      ],
    };
    jest.mocked(useRuntimeVariables).mockImplementation(
      () =>
        ({
          variable,
          getVariable: jest.fn(() => variable),
        } as any)
    );
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'country',
          values: ['USA', 'Japan'],
        },
        {
          name: 'device',
          values: ['device1', 'device2'],
        },
      ],
      refId: 'A',
    });

    /**
     * Use Table
     */
    const { result } = renderHook(() =>
      useTable({
        data: { series: [dataFrame] } as any,
        eventBus: null as any,
        options: {} as any,
        levels: [
          { name: 'country', source: 'A' },
          { name: 'device', source: 'A' },
        ],
      })
    );

    expect(result.current.tableData).toEqual([
      expect.objectContaining({
        value: 'USA',
        selected: false,
        selectable: false,
        childValues: ['device1'],
        children: [
          expect.objectContaining({
            value: 'device1',
            selected: true,
          }),
        ],
      }),
      expect.objectContaining({
        value: 'Japan',
        selected: false,
        selectable: false,
        childValues: ['device2'],
        children: [
          expect.objectContaining({
            value: 'device2',
            selected: false,
          }),
        ],
      }),
    ]);
  });

  it('Should apply status', () => {
    const variable = {
      multi: true,
      includeAll: false,
      options: [
        {
          text: 'All',
          value: '__all',
          selected: false,
        },
        {
          text: 'device1',
          value: 'device1',
          selected: true,
        },
        {
          text: 'device2',
          value: 'device2',
          selected: false,
        },
      ],
    };
    jest.mocked(useRuntimeVariables).mockImplementation(
      () =>
        ({
          variable,
          getVariable: jest.fn(() => variable),
        } as any)
    );
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'country',
          values: ['USA', 'Japan'],
        },
        {
          name: 'device',
          values: ['device1', 'device2'],
        },
      ],
      refId: 'A',
    });

    const statusDataFrame = toDataFrame({
      fields: [
        {
          name: 'name',
          values: ['device1', 'device2'],
        },
        {
          name: 'last',
          values: [70, 81],
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
        },
      ],
    });

    /**
     * Use Table
     */
    const { result } = renderHook(() =>
      useTable({
        data: { series: [dataFrame, statusDataFrame] } as any,
        options: {
          name: 'name',
          status: 'last',
        } as any,
        eventBus: null as any,
        levels: [{ name: 'device', source: 'A' }],
      })
    );

    expect(result.current.tableData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'device1',
          showStatus: true,
          statusColor: 'green',
        }),
        expect.objectContaining({
          value: 'device2',
          showStatus: true,
          statusColor: 'red',
        }),
      ])
    );
  });

  it('Should work if no variable', () => {
    jest.mocked(useRuntimeVariables).mockImplementation(
      () =>
        ({
          variable: null,
          getVariable: jest.fn(),
        } as any)
    );

    /**
     * Use Table
     */
    const { result } = renderHook(() =>
      useTable({ data: { series: [] } as any, options: {} as any, eventBus: null as any })
    );

    expect(result.current.tableData).toEqual([]);
  });

  describe('Check Render Logic', () => {
    /**
     * Table Header
     * @param columns
     * @param table
     * @constructor
     */
    const TableHeader = ({ columns, table }: { columns: any[]; table: any }) => (
      <>
        {columns.map((column) => (
          <div key={column.id} data-testid={InTestIds.headerRow(column.id)}>
            {typeof column.header === 'function' ? column.header({ table }) : column.header}
          </div>
        ))}
      </>
    );

    /**
     * Rows Component
     * @param data
     * @param columns
     * @param depth
     * @param getSubRows
     * @constructor
     */
    const Rows: React.FC<{
      data: TableItem[];
      columns: any[];
      depth?: number;
      getSubRows: (row: TableItem) => TableItem[] | undefined;
    }> = ({ data, columns, depth = 0, getSubRows }) => (
      <>
        {data.map((row, index) => {
          const subRows = getSubRows(row);
          return (
            <div key={`${depth}-${row.value}`} data-testid={InTestIds.row(row.value, depth)}>
              <div>
                {columns[0].cell({
                  row: {
                    original: row,
                    depth,
                    getCanExpand: () => !!row.children,
                    getToggleExpandedHandler: () => {},
                    getIsExpanded: () => index % 2 === 0,
                  },
                  getValue: () => row.value,
                })}
                {columns[1].cell({
                  row: {
                    original: row,
                    depth,
                  },
                  getValue: () => row.isFavorite,
                })}
              </div>
              {subRows && <Rows data={subRows} columns={columns} depth={depth + 1} getSubRows={getSubRows} />}
            </div>
          );
        })}
      </>
    );

    it('Should select unselected values', () => {
      const deviceVariable = {
        multi: true,
        includeAll: true,
        options: [
          {
            text: 'All',
            value: '__all',
            selected: false,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: false,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: true,
          },
        ],
      };
      const countryVariable = {
        multi: true,
        options: [
          {
            text: 'USA',
            value: 'USA',
            selected: false,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable: deviceVariable,
            getVariable: jest.fn((name: string) => (name === 'country' ? countryVariable : deviceVariable)),
          } as any)
      );
      const dataFrame = toDataFrame({
        fields: [
          {
            name: 'country',
            values: ['USA', 'Japan'],
          },
          {
            name: 'device',
            values: ['device1', 'device2'],
          },
        ],
        refId: 'A',
      });

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [dataFrame] } as any,
          options: {
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [
            { name: 'country', source: 'A' },
            { name: 'device', source: 'A' },
          ],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      const device1 = screen.getByTestId(TestIds.table.cell('device1', 1));

      /**
       * Check row presence
       */
      expect(device1).toBeInTheDocument();

      /**
       * Check if device1 is not selected
       */
      const device1Control = within(device1).getByTestId(TestIds.table.control);
      expect(device1Control).not.toBeChecked();

      /**
       * Check if device2 is selected
       */
      const device2Control = within(screen.getByTestId(TestIds.table.cell('device2', 1))).getByTestId(
        TestIds.table.control
      );
      expect(device2Control).toBeChecked();

      /**
       * Select device1
       */
      fireEvent.click(device1Control);

      expect(selectVariableValues).toHaveBeenCalledWith(['device1'], deviceVariable);

      jest.mocked(selectVariableValues).mockClear();

      /**
       * Should select values by clicking on label
       */
      fireEvent.click(within(device1).getByTestId(TestIds.table.label));

      expect(selectVariableValues).toHaveBeenCalledWith(['device1'], deviceVariable);
    });

    it('Should select unselected parent values', () => {
      const deviceVariable = {
        multi: true,
        includeAll: true,
        options: [
          {
            text: 'All',
            value: '__all',
            selected: false,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: false,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: false,
          },
        ],
      };
      const countryVariable = {
        multi: true,
        name: 'country',
        options: [
          {
            text: 'USA',
            value: 'USA',
            selected: false,
          },
          {
            text: 'Japan',
            value: 'Japan',
            selected: false,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable: deviceVariable,
            getVariable: jest.fn((name: string) => (name === 'country' ? countryVariable : deviceVariable)),
          } as any)
      );
      const dataFrame = toDataFrame({
        fields: [
          {
            name: 'country',
            values: ['USA', 'Japan'],
          },
          {
            name: 'device',
            values: ['device1', 'device2'],
          },
        ],
        refId: 'A',
      });

      jest.mocked(getItemWithStatus).mockImplementation((item, options) =>
        item.variable?.name === 'country'
          ? {
              ...item,
              showStatus: false,
              selectable: true,
            }
          : jest.requireActual('../utils').getItemWithStatus(item, options)
      );

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [dataFrame] } as any,
          options: {
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [
            { name: 'country', source: 'A' },
            { name: 'device', source: 'A' },
          ],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      const country = screen.getByTestId(TestIds.table.cell('Japan', 0));

      /**
       * Check row presence
       */
      expect(country).toBeInTheDocument();

      /**
       * Check if Japan is not selected
       */
      const countryControl = within(country).getByTestId(TestIds.table.control);
      expect(countryControl).not.toBeChecked();

      /**
       * Select country
       */
      fireEvent.click(countryControl);

      expect(selectVariableValues).toHaveBeenCalledWith(['Japan'], countryVariable);
      expect(selectVariableValues).toHaveBeenCalledWith(['device2'], deviceVariable);
    });

    it('Should use radio for single value', () => {
      const variable = {
        multi: false,
        includeAll: false,
        options: [
          {
            text: 'device1',
            value: 'device1',
            selected: false,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: true,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable,
            getVariable: jest.fn(() => variable),
          } as any)
      );

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [] } as any,
          options: {
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      const device1 = screen.getByTestId(TestIds.table.cell('device1', 0));

      /**
       * Check row presence
       */
      expect(device1).toBeInTheDocument();

      /**
       * Check if control is radio
       */
      const device1Control = within(device1).getByTestId(TestIds.table.control);
      expect(device1Control).toHaveAttribute('type', 'radio');
    });

    it('Should select value if single all value is selected', () => {
      const variable = {
        multi: false,
        includeAll: true,
        options: [
          {
            text: 'All',
            value: '__all',
            selected: true,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: true,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: true,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable,
            getVariable: jest.fn(() => variable),
          } as any)
      );

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [] } as any,
          options: {
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      const device1 = screen.getByTestId(TestIds.table.cell('device1', 0));

      /**
       * Check row presence
       */
      expect(device1).toBeInTheDocument();

      /**
       * Select device 1
       */
      const device1Control = within(device1).getByTestId(TestIds.table.control);

      fireEvent.click(device1Control);

      expect(selectVariableValues).toHaveBeenCalledWith(['device1'], variable);
    });

    it('Row with subRows should not be selectable and expandable', () => {
      const variable = {
        multi: true,
        includeAll: true,
        options: [
          {
            text: 'All',
            value: '__all',
            selected: false,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: true,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable,
            getVariable: jest.fn(() => variable),
          } as any)
      );
      const dataFrame = toDataFrame({
        fields: [
          {
            name: 'country',
            values: ['USA', 'Japan'],
          },
          {
            name: 'device',
            values: ['device1', 'device2'],
          },
        ],
        refId: 'A',
      });

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [dataFrame] } as any,
          options: {
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [
            { name: 'country', source: 'A' },
            { name: 'device', source: 'A' },
          ],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      /**
       * Check if country row is not selectable
       */
      const usaRow = screen.getByTestId(TestIds.table.cell('USA', 0));
      expect(usaRow).toBeInTheDocument();
      expect(within(usaRow).queryByTestId(TestIds.table.control)).not.toBeInTheDocument();

      /**
       * Check if label clicking doesn't update values
       */
      fireEvent.click(within(usaRow).getByTestId(TestIds.table.label));

      expect(selectVariableValues).not.toHaveBeenCalled();

      /**
       * Check if country row is expandable
       */
      expect(within(usaRow).getByTestId(TestIds.table.buttonExpand)).toBeInTheDocument();

      /**
       * Check if device row is selectable and not expandable if value exists in variable options
       */
      const device1Row = screen.getByTestId(TestIds.table.cell('device1', 1));
      expect(device1Row).toBeInTheDocument();
      expect(within(device1Row).getByTestId(TestIds.table.control)).toBeInTheDocument();
      expect(within(device1Row).queryByTestId(TestIds.table.buttonExpand)).not.toBeInTheDocument();

      /**
       * Check if unselectable device2 row doesn't exist
       */
      expect(screen.queryByTestId(TestIds.table.cell('device2', 1))).not.toBeInTheDocument();
    });

    it('Should show variable names', () => {
      const deviceVariable = {
        multi: true,
        includeAll: true,
        options: [
          {
            text: 'All',
            value: '__all',
            selected: false,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: false,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: true,
          },
        ],
      };
      const countryVariable = {
        multi: true,
        options: [
          {
            text: 'USA',
            value: 'USA',
            selected: false,
          },
        ],
      };
      jest.mocked(useRuntimeVariables).mockImplementation(
        () =>
          ({
            variable: deviceVariable,
            getVariable: jest.fn((name: string) => (name === 'country' ? countryVariable : deviceVariable)),
          } as any)
      );
      const dataFrame = toDataFrame({
        fields: [
          {
            name: 'country',
            values: ['USA', 'Japan'],
          },
          {
            name: 'device',
            values: ['device1', 'device2'],
          },
        ],
        refId: 'A',
      });

      /**
       * Use Table
       */
      const { result } = renderHook(() =>
        useTable({
          data: { series: [dataFrame] } as any,
          options: {
            showName: true,
            favorites: true,
          } as any,
          eventBus: null as any,
          levels: [
            { name: 'country', source: 'A' },
            { name: 'device', source: 'A' },
          ],
        })
      );

      /**
       * Render rows
       */
      render(
        <Rows data={result.current.tableData} columns={result.current.columns} getSubRows={result.current.getSubRows} />
      );

      const device1 = screen.getByTestId(TestIds.table.cell('device1', 1));

      /**
       * Check row presence
       */
      expect(device1).toBeInTheDocument();

      /**
       * Check if name is shown
       */
      expect(within(device1).getByText('device: device1')).toBeInTheDocument();
    });

    describe('Favorites', () => {
      const deviceVariable = {
        multi: true,
        includeAll: true,
        name: 'device',
        options: [
          {
            text: 'All',
            value: '__all',
            selected: false,
          },
          {
            text: 'device1',
            value: 'device1',
            selected: false,
          },
          {
            text: 'device2',
            value: 'device2',
            selected: true,
          },
        ],
      };

      const favoritesMock = {
        add: jest.fn(),
        remove: jest.fn(),
        isAdded: jest.fn((name, value) => value === 'device1'),
      };
      jest.mocked(useFavorites).mockImplementation(() => favoritesMock);

      const dataFrame = toDataFrame({
        fields: [
          {
            name: 'device',
            values: ['device1', 'device2'],
          },
        ],
        refId: 'A',
      });

      beforeEach(() => {
        favoritesMock.add.mockClear();
        favoritesMock.remove.mockClear();
      });

      it('Show not show favorites control for All option', () => {
        jest.mocked(useRuntimeVariables).mockImplementation(
          () =>
            ({
              variable: deviceVariable,
              getVariable: jest.fn(() => deviceVariable),
            } as any)
        );
        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [dataFrame] } as any,
            options: {
              favorites: true,
            } as any,
            eventBus: null as any,
            levels: [{ name: 'device', source: 'A' }],
          })
        );

        /**
         * Render rows
         */
        render(
          <Rows
            data={result.current.tableData}
            columns={result.current.columns}
            getSubRows={result.current.getSubRows}
          />
        );

        const rowAll = screen.getByTestId(InTestIds.row('All', 0));

        expect(rowAll).toBeInTheDocument();

        /**
         * All value can't be added to favorites
         */
        expect(within(rowAll).queryByTestId(TestIds.table.favoritesControl)).not.toBeInTheDocument();
      });

      it('Show added to favorites control for device1', () => {
        jest.mocked(useRuntimeVariables).mockImplementation(
          () =>
            ({
              variable: deviceVariable,
              getVariable: jest.fn(() => deviceVariable),
            } as any)
        );
        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [dataFrame] } as any,
            options: {
              favorites: true,
            } as any,
            eventBus: null as any,
            levels: [{ name: 'device', source: 'A' }],
          })
        );

        /**
         * Render rows
         */
        render(
          <Rows
            data={result.current.tableData}
            columns={result.current.columns}
            getSubRows={result.current.getSubRows}
          />
        );

        const rowDevice1 = screen.getByTestId(InTestIds.row('device1', 0));

        expect(rowDevice1).toBeInTheDocument();

        /**
         * Device can be removed to favorites
         */
        const favoritesControl = within(rowDevice1).getByTestId(TestIds.table.favoritesControl);
        expect(favoritesControl).toBeInTheDocument();

        /**
         * Remove device from favorites
         */
        fireEvent.click(favoritesControl);

        expect(favoritesMock.remove).toHaveBeenCalledWith('device', 'device1');
      });

      it('Show not added to favorites control for device1', () => {
        jest.mocked(useRuntimeVariables).mockImplementation(
          () =>
            ({
              variable: deviceVariable,
              getVariable: jest.fn(() => deviceVariable),
            } as any)
        );

        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [dataFrame] } as any,
            options: {
              favorites: true,
            } as any,
            eventBus: null as any,
            levels: [{ name: 'device', source: 'A' }],
          })
        );

        /**
         * Render rows
         */
        render(
          <Rows
            data={result.current.tableData}
            columns={result.current.columns}
            getSubRows={result.current.getSubRows}
          />
        );

        const rowDevice2 = screen.getByTestId(InTestIds.row('device2', 0));

        expect(rowDevice2).toBeInTheDocument();

        /**
         * Device can be added to favorites
         */
        const favoritesControl = within(rowDevice2).getByTestId(TestIds.table.favoritesControl);
        expect(favoritesControl).toBeInTheDocument();

        /**
         * Add to Favorites
         */
        fireEvent.click(favoritesControl);

        expect(favoritesMock.add).toHaveBeenCalledWith('device', 'device2');
      });
    });

    describe('Header', () => {
      it('Should render expand all button', () => {
        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [] } as any,
            options: {
              header: true,
            } as any,
            eventBus: null as any,
            levels: [
              { name: 'country', source: 'A' },
              { name: 'device', source: 'A' },
            ],
          })
        );

        const toggleAllRows = jest.fn();

        /**
         * Render header
         */
        render(
          <TableHeader
            columns={result.current.columns}
            table={{
              getCanSomeRowsExpand: () => true,
              getToggleAllRowsExpandedHandler: () => toggleAllRows,
              getIsAllRowsExpanded: () => true,
            }}
          />
        );

        const valueHeader = screen.getByTestId(InTestIds.headerRow('value'));
        expect(valueHeader).toBeInTheDocument();

        const buttonExpandAll = within(valueHeader).getByTestId(TestIds.table.buttonExpandAll);
        expect(buttonExpandAll).toBeInTheDocument();
        expect(within(buttonExpandAll).getByTestId('angle-double-down')).toBeInTheDocument();

        fireEvent.click(buttonExpandAll);

        expect(toggleAllRows).toHaveBeenCalled();
      });

      it('Should show current expand state', () => {
        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [] } as any,
            options: {
              header: true,
            } as any,
            eventBus: null as any,
            levels: [
              { name: 'country', source: 'A' },
              { name: 'device', source: 'A' },
            ],
          })
        );

        const toggleAllRows = jest.fn();

        /**
         * Render header
         */
        render(
          <TableHeader
            columns={result.current.columns}
            table={{
              getCanSomeRowsExpand: () => true,
              getToggleAllRowsExpandedHandler: () => toggleAllRows,
              getIsAllRowsExpanded: () => false,
            }}
          />
        );

        const valueHeader = screen.getByTestId(InTestIds.headerRow('value'));
        expect(valueHeader).toBeInTheDocument();

        const buttonExpandAll = within(valueHeader).getByTestId(TestIds.table.buttonExpandAll);
        expect(buttonExpandAll).toBeInTheDocument();
        expect(within(buttonExpandAll).getByTestId('angle-double-right')).toBeInTheDocument();
      });

      it('Should not render expand all button', () => {
        /**
         * Use Table
         */
        const { result } = renderHook(() =>
          useTable({
            data: { series: [] } as any,
            options: {
              header: true,
            } as any,
            eventBus: null as any,
            levels: [
              { name: 'country', source: 'A' },
              { name: 'device', source: 'A' },
            ],
          })
        );

        /**
         * Render header
         */
        render(
          <TableHeader
            columns={result.current.columns}
            table={{
              getCanSomeRowsExpand: () => false,
              getToggleAllRowsExpandedHandler: () => undefined,
              getIsAllRowsExpanded: () => true,
            }}
          />
        );

        const valueHeader = screen.getByTestId(InTestIds.headerRow('value'));
        expect(valueHeader).toBeInTheDocument();

        expect(within(valueHeader).queryByTestId(TestIds.table.buttonExpandAll)).not.toBeInTheDocument();
      });
    });
  });
});
