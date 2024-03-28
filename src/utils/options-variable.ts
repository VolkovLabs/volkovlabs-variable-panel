import { EventBus } from '@grafana/data';

import { ALL_VALUE_PARAMETER, NO_VALUE_PARAMETER } from '../constants';
import { RuntimeVariableWithOptions } from '../types';
import { selectVariableValues } from './variable';

/**
 * Update Variable Options
 * Another file for simple checking selectVariableValues calling
 */
export const updateVariableOptions = ({
  previousValues,
  value,
  emptyValueEnabled,
  variable,
  panelEventBus,
}: {
  previousValues: string[];
  value: string | string[];
  emptyValueEnabled: boolean;
  variable: RuntimeVariableWithOptions;
  panelEventBus: EventBus;
}) => {
  const updatedValues = Array.isArray(value) ? value : [value];

  /**
   * Deselect values
   */
  if (previousValues.length > updatedValues.length) {
    /**
     * Clear Value
     */
    if (updatedValues.length === 0 && emptyValueEnabled) {
      selectVariableValues([NO_VALUE_PARAMETER], variable, panelEventBus);
      return;
    }

    /**
     * Select all
     */
    if (updatedValues.length === 0 && variable?.multi && variable.includeAll) {
      selectVariableValues([ALL_VALUE_PARAMETER], variable, panelEventBus);
      return;
    }

    const removedValues = previousValues.filter((value) => !updatedValues.includes(value));
    selectVariableValues(removedValues, variable, panelEventBus);
    return;
  }

  /**
   * Selected value while All is selected
   */
  if (
    updatedValues.length > 1 &&
    previousValues.includes(ALL_VALUE_PARAMETER) &&
    updatedValues.includes(ALL_VALUE_PARAMETER)
  ) {
    selectVariableValues(
      updatedValues.filter((value) => value !== ALL_VALUE_PARAMETER),
      variable,
      panelEventBus
    );
    return;
  }

  /**
   * Select All Value
   */
  if (
    updatedValues.length > 1 &&
    !previousValues.includes(ALL_VALUE_PARAMETER) &&
    updatedValues.includes(ALL_VALUE_PARAMETER)
  ) {
    selectVariableValues([ALL_VALUE_PARAMETER], variable, panelEventBus);
    return;
  }

  /**
   * Select Values
   */
  selectVariableValues(updatedValues, variable, panelEventBus);
};
