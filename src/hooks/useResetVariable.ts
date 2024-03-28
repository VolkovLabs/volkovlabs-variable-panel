import { EventBus } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useEffect, useRef } from 'react';

import { VariableChangedEvent } from '../types';
import { useRuntimeVariables } from './useRuntimeVariables';

/**
 * Use Reset Variable
 */
export const useResetVariable = ({
  eventBus,
  panelEventBus,
  variableName,
}: {
  eventBus: EventBus;
  panelEventBus: EventBus;
  variableName?: string;
}) => {
  /**
   * Variable to reset
   */
  const { variable: variableToReset } = useRuntimeVariables(eventBus, variableName || '');

  /**
   * Should reset
   */
  const shouldReset = useRef(false);

  /**
   * Subscribe on variable changed event emitted by the panel
   */
  useEffect(() => {
    const subscription = panelEventBus.subscribe(VariableChangedEvent, () => {
      if (variableName) {
        shouldReset.current = true;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [panelEventBus, variableName]);

  /**
   * Reset variable after options loaded
   */
  useEffect(() => {
    if (shouldReset.current) {
      shouldReset.current = false;
      locationService.partial(
        {
          [`var-${variableToReset?.name}`]: variableToReset?.options?.[0]?.value,
        },
        true
      );
    }
  }, [variableToReset]);
};
