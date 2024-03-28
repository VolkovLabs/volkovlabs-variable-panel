import { TypedVariableModel } from '@grafana/data';
import { locationService } from '@grafana/runtime';

import { ALL_VALUE, ALL_VALUE_PARAMETER, NO_VALUE_PARAMETER } from '../constants';
import {
  CustomVariableModel,
  QueryVariableModel,
  RuntimeVariable,
  RuntimeVariableWithOptions,
  VariableType,
} from '../types';

/**
 * Set Variable Value
 * @param name
 * @param value
 */
export const setVariableValue = (name: string, value: unknown) => {
  locationService.partial({ [`var-${name}`]: value }, true);
};

/**
 * Select Variable Values
 * @param values
 * @param runtimeVariable
 */
export const selectVariableValues = (values: string[], runtimeVariable?: RuntimeVariable, groupSelection?: boolean) => {
  if (!runtimeVariable) {
    return;
  }

  switch (runtimeVariable.type) {
    case VariableType.CUSTOM:
    case VariableType.QUERY: {
      const { name, multi } = runtimeVariable;

      /**
       * Multi update
       */
      if (multi) {
        if (values.some((value) => value === ALL_VALUE_PARAMETER)) {
          setVariableValue(name, ALL_VALUE);
          return;
        }

        if (values.some((value) => value === NO_VALUE_PARAMETER)) {
          setVariableValue(name, '');
          return;
        }

        /**
         * All Selected values for variable
         */
        const selectedValues = locationService
          .getSearch()
          .getAll(`var-${name}`)
          .filter((s) => s.toLowerCase().indexOf('all') !== 0)
          .filter((value) =>
            groupSelection ? runtimeVariable.options.some((option) => option.value === value) : true
          );
        /**
         * Values selected, but not defined in the URL
         */
        if (selectedValues.length === 0 && !locationService.getSearchObject()[`var-${name}`]) {
          const selectedValue = runtimeVariable.current.value;
          const selectedArray = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

          selectedValues.push(...selectedArray.filter((value) => value !== ALL_VALUE_PARAMETER));
        }

        /**
         * Get Already Selected Values
         */
        const alreadySelectedValues = values.filter((value) => selectedValues.includes(value));

        /**
         * Deselect values
         */
        if (alreadySelectedValues.length === values.length) {
          setVariableValue(
            name,
            selectedValues.filter((value) => !alreadySelectedValues.includes(value))
          );
          return;
        }

        const uniqueValues = [...new Set(values.concat(selectedValues)).values()];

        setVariableValue(name, uniqueValues);
        return;
      }

      /**
       * Single Value
       */
      let value = values[0];

      if (value === ALL_VALUE_PARAMETER) {
        value = ALL_VALUE;
      } else if (value === NO_VALUE_PARAMETER) {
        value = '';
      }

      setVariableValue(name, value);
      return;
    }
    case VariableType.TEXTBOX: {
      const value = values[0];
      setVariableValue(runtimeVariable.name, value);
      return;
    }
    default: {
      /**
       * Unsupported variable type
       */
      return;
    }
  }
};

/**
 * Variable with Options
 */
export const isVariableWithOptions = (
  variable?: RuntimeVariable
): variable is CustomVariableModel | QueryVariableModel => {
  if (!variable) {
    return false;
  }

  return variable.type === VariableType.CUSTOM || variable.type === VariableType.QUERY;
};

/**
 * Get Runtime Variable
 * @param variable
 */
export const getRuntimeVariable = (variable: TypedVariableModel): RuntimeVariable | undefined => {
  if (variable.type === VariableType.TEXTBOX) {
    return variable;
  }
  if (variable.type === VariableType.CUSTOM || variable.type === VariableType.QUERY) {
    const runtimeVariable = {
      ...variable,
      type: VariableType.CUSTOM,
      optionIndexByName: variable.options.reduce((acc, option, index) => {
        acc.set(option.value as string, index);
        return acc;
      }, new Map()),
      helpers: {
        getOption: (value: string) => runtimeVariable.options[runtimeVariable.optionIndexByName.get(value) as number],
      },
    } as RuntimeVariableWithOptions;

    return runtimeVariable;
  }
  return;
};

/**
 * Get Variables Map
 */
export const getVariablesMap = (variables: TypedVariableModel[]): Record<string, RuntimeVariable> => {
  return variables.reduce((acc, variable) => {
    const runtimeVariable = getRuntimeVariable(variable);
    if (runtimeVariable) {
      return {
        ...acc,
        [runtimeVariable.name]: runtimeVariable,
      };
    }
    return acc;
  }, {});
};

/**
 * Is Variable All Selected
 */
export const isVariableAllSelected = (runtimeVariable: RuntimeVariable): boolean => {
  if (isVariableWithOptions(runtimeVariable)) {
    if (Array.isArray(runtimeVariable.current.value)) {
      /**
       * Multi value
       */
      if (runtimeVariable.includeAll) {
        /**
         * Options with all option
         */
        if (!!runtimeVariable.helpers.getOption(ALL_VALUE_PARAMETER)?.selected) {
          /**
           * All option selected
           */
          return true;
        }

        /**
         * Comparing value with removed selected all option
         */
        return runtimeVariable.current.value.length === runtimeVariable.options.length - 1;
      }

      /**
       * Multi value without all option
       */
      return runtimeVariable.current.value.length === runtimeVariable.options.length;
    } else {
      /**
       * Single value
       */
      return runtimeVariable.current.value === ALL_VALUE_PARAMETER;
    }
  }

  return false;
};
