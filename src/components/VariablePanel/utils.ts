import { FilterFn } from '@tanstack/react-table';
import { PanelData, DataFrame, Field } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { TableItem, GroupLevel, RuntimeVariable } from '../../types';

/**
 * Convert Data Frame to objects array
 * @param dataFrame
 */
const convertToObjects = (dataFrame: DataFrame) => {
  const result = [];

  for (let index = 0; index < dataFrame.length; index += 1) {
    const object = dataFrame.fields.reduce((acc, field) => {
      return {
        ...acc,
        [field.name]: field.values.get(index),
      };
    }, {});
    result.push(object);
  }

  return result;
};

/**
 * Group Items by Field
 * @param items
 * @param fieldKey
 */
const groupBy = (items: object[] | undefined, fieldKey: string): Map<string, object[]> => {
  return (
    items?.reduce((acc: Map<string, object[]>, item) => {
      const key = item[fieldKey as keyof typeof item];
      const existItems = acc.get(key);
      acc.set(key, existItems ? existItems.concat(item) : [item]);
      return acc;
    }, new Map()) || new Map()
  );
};

/**
 * Recursively Group items
 * @param items
 * @param fieldKeys
 * @param getItem
 */
const getGroupArray = (
  items: object[],
  fieldKeys: string[],
  getItem: (item: object, key: string, children?: TableItem[]) => TableItem
): TableItem[] => {
  const currentKey = fieldKeys[0];

  if (fieldKeys.length === 1) {
    return items
      .map((item) => {
        return getItem(item, currentKey);
      })
      .filter((item) => item.selectable);
  }

  return Array.from(groupBy(items, currentKey), ([key, groupItems]): TableItem => {
    const children = getGroupArray(groupItems, fieldKeys.slice(1), getItem);
    const item = getItem({ [currentKey]: key }, currentKey, children);
    return {
      ...item,
      childValues: children.reduce(
        (acc, child) => acc.concat(child.childValues ? child.childValues : [child.value]),
        item.childValues || []
      ),
      children,
    };
  }).filter((item) => item.childValues?.length || item.selectable);
};

/**
 * Get Table Rows
 * @param data
 * @param groupLevels
 * @param getItem
 */
export const getRows = (
  data: PanelData,
  groupLevels: GroupLevel[],
  getItem?: (item: object, key: string, children?: TableItem[]) => TableItem
): TableItem[] | null => {
  const lastGroupLevel = groupLevels[groupLevels.length - 1];
  const dataFrame = data.series.find((dataFrame) => dataFrame.refId === lastGroupLevel.source);

  if (!dataFrame) {
    return null;
  }

  /**
   * Data frame as array of objects
   */
  const objects = convertToObjects(dataFrame);

  /**
   * Default Get Item
   * @param item
   * @param key
   */
  const defaultGetItem = (item: object, key: string): TableItem => ({
    value: item[key as keyof typeof item],
    selected: false,
    showStatus: false,
  });

  return getGroupArray(
    objects,
    groupLevels.map(({ name }) => name),
    getItem || defaultGetItem
  );
};

/**
 * Get Item With Status
 * @param item
 * @param namesArray
 * @param statusField
 * @param children
 * @param isSelectedAll
 */
export const getItemWithStatus = (
  item: { value: string; selected: boolean; variable?: RuntimeVariable },
  {
    namesArray,
    statusField,
    children,
    isSelectedAll,
  }: { namesArray?: unknown[]; statusField?: Field; children?: TableItem[]; isSelectedAll: boolean }
): TableItem => {
  let statusColor;
  let showStatus = false;

  /**
   * Status
   */
  const index = namesArray?.findIndex((name) => name === item.value);
  if (index !== undefined && index >= 0) {
    showStatus = true;
    const lastValue = statusField?.values.get(index);
    const displayValue = statusField?.display?.(lastValue);
    statusColor = displayValue?.color;
  }

  const isAllChildrenSelected = children ? children.every((child) => child.selected) : false;
  const selectable = item.variable?.options?.some((option) => option.text === item.value) && !children;

  return {
    value: item.value,
    selected: selectable ? isSelectedAll || item.selected || isAllChildrenSelected : false,
    showStatus,
    statusColor,
    variable: item.variable,
    selectable,
    canBeFavorite: selectable && item.value !== 'All',
  };
};

/**
 * Select Variable Values
 * @param values
 * @param runtimeVariable
 */
export const selectVariableValues = (values: string[], runtimeVariable?: RuntimeVariable) => {
  if (!runtimeVariable) {
    return;
  }

  const { name, multi } = runtimeVariable;

  /**
   * Multi update
   */
  if (multi) {
    if (values.some((value) => value.toLowerCase() === 'all')) {
      locationService.partial({ [`var-${name}`]: 'All' }, true);
      return;
    }

    /**
     * All Selected values for variable
     */
    const searchParams = locationService
      .getSearch()
      .getAll(`var-${name}`)
      .filter((s) => s.toLowerCase().indexOf('all') !== 0);

    /**
     * Values selected, but not defined in the URL
     */
    if (searchParams.length === 0 && !locationService.getSearchObject()[`var-${name}`]) {
      searchParams.push(...runtimeVariable.options.filter((option) => option.selected).map((option) => option.text));
    }

    /**
     * Get Already Selected Values
     */
    const alreadySelectedValues = values.filter((value) => searchParams.includes(value));

    /**
     * Deselect values
     */
    if (alreadySelectedValues.length === values.length) {
      locationService.partial(
        { [`var-${name}`]: searchParams.filter((value) => !alreadySelectedValues.includes(value)) },
        true
      );
      return;
    }

    const uniqueValues = [...new Set(values.concat(searchParams)).values()];

    locationService.partial({ [`var-${name}`]: uniqueValues }, true);
    return;
  }

  /**
   * Single Value
   */
  const value = values[0];
  locationService.partial({ [`var-${name}`]: value }, true);
};

/**
 * Get FilteredTree
 * @param rows
 * @param values
 */
export const getFilteredTree = (rows: TableItem[], values: string[]): TableItem[] => {
  const filteredRows = rows.filter((row) => row.childValues?.some((childValue) => values.includes(childValue)));
  return filteredRows.filter((row) => (row.children ? getFilteredTree(row.children, values) : false));
};

/**
 * Items to Update
 */
type TreePlain = {
  variable?: RuntimeVariable;
  values: string[];
  selectable?: boolean;
};

/**
 * Convert Tree To Plain
 * @param rows
 * @param result
 * @param depth
 */
export const convertTreeToPlain = (rows: TableItem[], result: TreePlain[] = [], depth = 0): TreePlain[] => {
  return rows.reduce((acc, row) => {
    const levelItem = acc[depth] || {
      variable: undefined,
      values: [],
      selectable: false,
    };

    levelItem.variable = row.variable;
    levelItem.values.push(row.value);
    levelItem.selectable = row.selectable;

    const newResult = acc[depth] ? acc : acc.concat(levelItem);
    if (row.children) {
      return convertTreeToPlain(row.children, newResult, depth + 1);
    }

    return newResult;
  }, result);
};

/**
 * Value Filter
 * @param row
 * @param columnId
 * @param value
 */
export const valueFilter: FilterFn<TableItem> = (row, columnId, value) => {
  /**
   * Filter parent rows
   */
  if (row.original.childValues) {
    return row.original.childValues.some((childValue) => childValue.toLowerCase().includes(value.toLowerCase()));
  }

  /**
   * Filter last level row
   */
  return row.original.value.toLowerCase().includes(value.toLowerCase());
};
