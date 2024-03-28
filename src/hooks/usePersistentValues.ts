import { EventBus } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useEffect } from 'react';

import { ALL_VALUE, ALL_VALUE_PARAMETER } from '../constants';
import { isVariableWithOptions, setVariableValue } from '../utils';
import { usePersistentStorage } from './usePersistentStorage';
import { useRuntimeVariables } from './useRuntimeVariables';

/**
 * Unique values array
 * @param array
 */
const uniqueValues = <T>(array: T[]): T[] => {
  const set = new Set<T>();

  array.forEach((item) => {
    set.add(item);
  });

  return Array.from(set.values());
};

/**
 * Use Persistent Values
 */
export const usePersistentValues = ({
  eventBus,
  panelEventBus,
  variableName,
  enabled,
}: {
  eventBus: EventBus;
  panelEventBus: EventBus;
  variableName: string;
  enabled: boolean;
}) => {
  /**
   * Variable
   */
  const { variable } = useRuntimeVariables(eventBus, variableName);

  /**
   * Persistent storage
   */
  const persistentStorage = usePersistentStorage(variableName);

  /**
   * Restore selected values before if available
   */
  useEffect(() => {
    if (enabled && variable && isVariableWithOptions(variable) && variable.multi) {
      /**
       * Query values for variable
       */
      const valuesInQuery = locationService
        .getSearch()
        .getAll(`var-${variable.name}`)
        .filter((s) => s.toLowerCase().indexOf('all') !== 0);

      /**
       * Selected variable values
       */
      const valuesInState = (
        Array.isArray(variable.current.value) ? variable.current.value : [variable.current.value]
      ).filter((value) => value !== ALL_VALUE_PARAMETER);

      /**
       * Unavailable Query Values
       */
      const unavailableQueryValues = valuesInQuery.filter(
        (value) => !variable.options.some((option) => option.value === value)
      );

      /**
       * Save unavailable values and remove from url
       */
      if (unavailableQueryValues.length) {
        const savedUnavailableValues = persistentStorage.get();

        /**
         * Save unavailable values
         */
        persistentStorage.save(uniqueValues(savedUnavailableValues.concat(unavailableQueryValues)));

        /**
         * Update variable values to remove unavailable from url
         */
        setVariableValue(variable.name, valuesInState.length ? valuesInState : [ALL_VALUE], panelEventBus);
      }

      const savedValues = persistentStorage.get();

      /**
       * Find values which are available to select
       */
      const valuesNotInState = savedValues.length
        ? savedValues.filter((value) => variable.options.some((option) => option.value === value))
        : [];

      /**
       * Select values which were selected before and made available again
       */
      if (valuesNotInState.length) {
        /**
         * Save unavailable values
         */
        persistentStorage.save(savedValues.filter((value) => !valuesNotInState.includes(value)));

        /**
         * Update variable values with available values which were selected before
         */
        setVariableValue(variable.name, valuesInState.concat(valuesNotInState), panelEventBus);
      }
    }
  }, [enabled, eventBus, panelEventBus, persistentStorage, variable]);
};
