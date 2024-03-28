import { Field, FieldConfigProperty, FieldType, PanelPlugin } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';

import { GroupsEditor, VariablePanel } from './components';
import {
  ALLOW_CUSTOM_VALUE_OPTIONS,
  ALLOW_EMPTY_VALUE_OPTIONS,
  ALWAYS_VISIBLE_FILTER_OPTIONS,
  AUTO_SCROLL_OPTIONS,
  DISPLAY_MODE_OPTIONS,
  FAVORITES_OPTIONS,
  FILTER_OPTIONS,
  GROUP_SELECTION_OPTIONS,
  HEADER_OPTIONS,
  PERSISTENT_OPTIONS,
  SELECTED_GROUP_OPTIONS,
  SHOW_LABEL_OPTIONS,
  SHOW_NAME_OPTIONS,
  STATUS_SORT_OPTIONS,
  STICKY_OPTIONS,
} from './constants';
import { DisplayMode, PanelOptions } from './types';

/**
 * Panel Plugin
 */
export const plugin = new PanelPlugin<PanelOptions>(VariablePanel)
  .setNoPadding()
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Unit,
      FieldConfigProperty.Color,
      FieldConfigProperty.Min,
      FieldConfigProperty.Max,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Links,
      FieldConfigProperty.Mappings,
      'unitScale' as never,
      'fieldMinMax' as never,
    ],
  })
  .setPanelOptions((builder) => {
    /**
     * Variables
     */
    const variables = getTemplateSrv().getVariables();
    const variableOptions = variables.map((vr) => ({
      label: vr.name,
      value: vr.name,
    }));

    /**
     * Visibility
     */
    const showForMinimizeView = (config: PanelOptions) => config.displayMode === DisplayMode.MINIMIZE;
    const showForButtonView = (config: PanelOptions) => config.displayMode === DisplayMode.BUTTON;
    const showForTableView = (config: PanelOptions) => config.displayMode === DisplayMode.TABLE;
    const isVariableSelected = (config: PanelOptions) => !!config.variable;

    /**
     * Common Options
     */
    builder.addRadio({
      path: 'displayMode',
      name: 'Display mode',
      settings: {
        options: DISPLAY_MODE_OPTIONS,
      },
      defaultValue: DisplayMode.TABLE,
    });

    /**
     * Minimize Mode Options
     */
    builder
      .addSliderInput({
        path: 'padding',
        name: 'Padding',
        defaultValue: 10,
        settings: {
          min: 0,
          max: 20,
        },
        showIf: (config) => showForMinimizeView(config) || showForButtonView(config),
      })
      .addRadio({
        path: 'emptyValue',
        name: 'Allow empty value',
        description: 'Supports empty value for multi-choice variable.',
        defaultValue: false,
        settings: {
          options: ALLOW_EMPTY_VALUE_OPTIONS,
        },
        showIf: (config) => showForMinimizeView(config) || showForButtonView(config),
      })
      .addRadio({
        path: 'persistent',
        name: 'Persistent values',
        description: 'Allow to keep selected values if unavailable.',
        defaultValue: false,
        settings: {
          options: PERSISTENT_OPTIONS,
        },
        showIf: (config) => showForMinimizeView(config) || showForButtonView(config),
      })
      .addRadio({
        path: 'showLabel',
        name: 'Show Label',
        description: 'Display variable name',
        defaultValue: false,
        settings: {
          options: SHOW_LABEL_OPTIONS,
        },
        showIf: (config) => showForButtonView(config),
      })
      .addRadio({
        path: 'customValue',
        name: 'Allow custom values',
        description: 'Supports custom values for the variable.',
        defaultValue: false,
        settings: {
          options: ALLOW_CUSTOM_VALUE_OPTIONS,
        },
        showIf: (config) => showForMinimizeView(config),
      });

    builder
      .addRadio({
        path: 'sticky',
        name: 'Sticky position',
        description: 'Variables will follow when scrolling.',
        settings: {
          options: STICKY_OPTIONS,
        },
        defaultValue: false,
        showIf: showForTableView,
      })
      .addRadio({
        path: 'autoScroll',
        name: 'Auto scroll to the selected value',
        settings: {
          options: AUTO_SCROLL_OPTIONS,
        },
        defaultValue: false,
        showIf: showForTableView,
      });

    /**
     * Header
     */
    builder
      .addRadio({
        path: 'header',
        name: 'Header',
        settings: {
          options: HEADER_OPTIONS,
        },
        category: ['Header'],
        defaultValue: true,
        showIf: showForTableView,
      })
      .addRadio({
        path: 'filter',
        name: 'Allow values filtering',
        settings: {
          options: FILTER_OPTIONS,
        },
        defaultValue: false,
        category: ['Header'],
        showIf: (config) => showForTableView(config) && config.header,
      })
      .addRadio({
        path: 'alwaysVisibleFilter',
        name: 'Always visible filter input',
        settings: {
          options: ALWAYS_VISIBLE_FILTER_OPTIONS,
        },
        defaultValue: false,
        category: ['Header'],
        showIf: (config) => showForTableView(config) && config.header && config.filter,
      })
      .addRadio({
        path: 'favorites',
        name: 'Allow selecting favorites',
        description: 'Saved in the browser storage for each user.',
        settings: {
          options: FAVORITES_OPTIONS,
        },
        defaultValue: false,
        category: ['Header'],
        showIf: (config) => showForTableView(config) && config.header,
      })
      .addRadio({
        path: 'statusSort',
        name: 'Sort by status',
        settings: {
          options: STATUS_SORT_OPTIONS,
        },
        defaultValue: false,
        category: ['Header'],
        showIf: (config) => showForTableView(config) && config.header,
      });

    /**
     * Variables
     */
    builder
      .addSelect({
        path: 'variable',
        name: 'Select variable to display',
        settings: {
          options: variableOptions,
        },
        category: ['Layout'],
        showIf: (config) => showForMinimizeView(config) || !config.groups?.length,
      })
      .addSelect({
        path: 'resetVariable',
        name: 'Select variable to reset',
        settings: {
          options: [],
          getOptions: async (context) => {
            return variableOptions.filter((option) => option.label !== context.options.variable);
          },
          isClearable: true,
        },
        category: ['Layout'],
        showIf: (config) => isVariableSelected(config),
      })
      .addCustomEditor({
        id: 'groups',
        path: 'groups',
        name: 'Tree View based on data source query',
        editor: GroupsEditor,
        category: ['Layout'],
        showIf: showForTableView,
      })
      .addRadio({
        path: 'showName',
        name: 'Display variable names',
        settings: {
          options: SHOW_NAME_OPTIONS,
        },
        defaultValue: false,
        category: ['Layout'],
        showIf: (config) => showForTableView(config) && !!config.groups?.length,
      });

    builder
      .addRadio({
        path: 'groupSelection',
        name: 'Allow group selection',
        settings: {
          options: GROUP_SELECTION_OPTIONS,
        },
        defaultValue: false,
        category: ['Groups'],
        showIf: (config) => showForTableView(config) && !!config.groups?.length,
      })
      .addRadio({
        path: 'saveSelectedGroup',
        name: 'Preserve selected group',
        description: 'Saved in the browser storage for each user.',
        settings: {
          options: SELECTED_GROUP_OPTIONS,
        },
        defaultValue: false,
        category: ['Groups'],
        showIf: (config) => showForTableView(config) && config.groups?.length > 1,
      })
      .addTextInput({
        path: 'saveSelectedGroupKey',
        name: 'Selected group Id',
        description: 'Key to preserve selected group in the browser storage.',
        defaultValue: '',
        settings: {
          placeholder: 'Will be unique per panel if empty',
        },
        showIf: (config) => showForTableView(config) && config.saveSelectedGroup,
        category: ['Groups'],
      });

    builder.addSelect({
      path: 'dashboardVariable',
      name: 'Select variable with dashboard UID',
      description: 'Allows to redirect to different dashboards',
      settings: {
        options: variableOptions,
      },
      category: ['Dashboard'],
    });

    /**
     * Status
     */
    builder
      .addFieldNamePicker({
        path: 'name',
        name: 'Field with variable values. First string field will be used if not specified.',
        settings: {
          filter: (f: Field) => f.type === FieldType.string,
          noFieldsMessage: 'No strings fields found',
        },
        category: ['Status'],
        showIf: (config) => showForTableView(config) || showForButtonView(config),
      })
      .addFieldNamePicker({
        path: 'status',
        name: 'Field with status values. First number field will be used if not specified.',
        settings: {
          filter: (f: Field) => f.type === FieldType.number,
          noFieldsMessage: 'No number fields found',
        },
        category: ['Status'],
        showIf: (config) => showForTableView(config) || showForButtonView(config),
      });

    return builder;
  });
