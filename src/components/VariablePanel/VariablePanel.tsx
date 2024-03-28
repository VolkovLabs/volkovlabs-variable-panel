import { EventBusSrv, PanelProps } from '@grafana/data';
import React, { useRef } from 'react';

import { useDashboardRedirect, usePersistentValues, useResetVariable } from '../../hooks';
import { DisplayMode, PanelOptions } from '../../types';
import { ButtonView } from '../ButtonView';
import { MinimizeView } from '../MinimizeView';
import { TableView } from '../TableView';

/**
 * Properties
 */
interface Props extends PanelProps<PanelOptions> {}

/**
 * Panel
 */
export const VariablePanel: React.FC<Props> = ({ options, eventBus, ...restProps }) => {
  /**
   * Panel scoped event bus
   */
  const panelEventBus = useRef(new EventBusSrv());

  /**
   * Dashboard Redirect
   */
  useDashboardRedirect({ eventBus, variableName: options.dashboardVariable });

  /**
   * Persistent Values
   */
  usePersistentValues({
    eventBus,
    variableName: options.variable,
    enabled: options.persistent,
    panelEventBus: panelEventBus.current,
  });

  /**
   * Reset variable
   */
  useResetVariable({ eventBus, panelEventBus: panelEventBus.current, variableName: options.resetVariable });

  /**
   * Minimize View
   */
  if (options.displayMode === DisplayMode.MINIMIZE) {
    return <MinimizeView options={options} eventBus={eventBus} panelEventBus={panelEventBus.current} {...restProps} />;
  }

  /**
   * Button View
   */
  if (options.displayMode === DisplayMode.BUTTON) {
    return <ButtonView options={options} eventBus={eventBus} panelEventBus={panelEventBus.current} {...restProps} />;
  }

  /**
   * Table View
   */
  return <TableView options={options} eventBus={eventBus} panelEventBus={panelEventBus.current} {...restProps} />;
};
