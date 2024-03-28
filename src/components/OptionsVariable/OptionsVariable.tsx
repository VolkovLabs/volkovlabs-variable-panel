import { EventBus, SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import React, { useCallback, useMemo } from 'react';

import { TEST_IDS } from '../../constants';
import { usePersistentStorage } from '../../hooks';
import { CustomVariableModel, QueryVariableModel } from '../../types';
import { updateVariableOptions } from '../../utils';

/**
 * Properties
 */
interface Props {
  /**
   * Variable
   *
   * @type {QueryVariableModel | CustomVariableModel}
   */
  variable: QueryVariableModel | CustomVariableModel;

  /**
   * Empty Value
   *
   * @type {boolean}
   */
  emptyValue: boolean;

  /**
   * Persistent
   *
   * @type {boolean}
   */
  persistent: boolean;

  /**
   * Custom Value
   *
   * @type {boolean}
   */
  customValue: boolean;

  /**
   * Panel Event Bus
   *
   * @type {EventBus}
   */
  panelEventBus: EventBus;
}

/**
 * Options Variable
 * @param props
 */
export const OptionsVariable: React.FC<Props> = ({ variable, emptyValue, persistent, customValue, panelEventBus }) => {
  /**
   * Persistent storage
   */
  const persistentStorage = usePersistentStorage(variable.name);

  /**
   * Current values
   */
  const values = useMemo(() => {
    const value = variable.current.value;

    return Array.isArray(value) ? value : [value];
  }, [variable]);

  /**
   * On Change
   */
  const onChange = useCallback(
    (value: Array<SelectableValue<string>> | SelectableValue<string>) => {
      /**
       * Clear saved values on override by user
       */
      if (persistent) {
        persistentStorage.remove();
      }

      updateVariableOptions({
        previousValues: values,
        value: Array.isArray(value) ? value.map((option: SelectableValue) => option.value) : value.value || '',
        variable,
        emptyValueEnabled: emptyValue,
        panelEventBus,
      });
    },
    [emptyValue, panelEventBus, persistent, persistentStorage, values, variable]
  );

  /**
   * Options
   */
  const options = useMemo(() => {
    const options = variable.options.map((option) => {
      return {
        label: option.text,
        value: option.value,
      };
    });

    /**
     * Add options for custom entered values
     */
    values.forEach((value) => {
      /**
       * Skip for already exist option
       */
      if (options.some((option) => option.value === value)) {
        return;
      }

      options.push({
        label: value,
        value,
      });
    });

    return options;
  }, [values, variable.options]);

  return (
    <Select
      aria-label={TEST_IDS.optionsVariable.root}
      onChange={onChange}
      options={options}
      isMulti={variable.multi}
      value={variable.multi ? values : values[0] || null}
      allowCustomValue={customValue}
    />
  );
};
