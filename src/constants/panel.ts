import { DisplayMode } from '../types';

/**
 * Display Mode Options
 */
export const DisplayModeOptions = [
  { value: DisplayMode.TABLE, label: 'Table', description: 'Full featured table view.' },
  { value: DisplayMode.MINIMIZE, label: 'Minimize', description: 'Minimized select view.' },
  { value: DisplayMode.BUTTON, label: 'Button', description: 'Button select view.' },
];

/**
 * Header Options
 */
export const HeaderOptions = [
  { value: true, label: 'Display', description: 'Display variable Label or Id. Allows to enable filtering.' },
  { value: false, label: 'Hide', description: 'Do not display header.' },
];

/**
 * Sticky Position
 */
export const StickyOptions = [
  { value: true, label: 'Enabled', description: 'Follow when scrolling.' },
  { value: false, label: 'Disabled', description: 'Scroll with dashboard.' },
];

/**
 * Filter Options
 */
export const FilterOptions = [
  { value: true, label: 'Enabled', description: 'Display Table Filter.' },
  { value: false, label: 'Disabled', description: 'Hide Table Filter.' },
];

/**
 * Favorites Options
 */
export const FavoritesOptions = [
  { value: true, label: 'Enabled', description: 'Allows selecting and filtering favorites.' },
  { value: false, label: 'Disabled', description: 'Hide favorites.' },
];

/**
 * Status Sort Options
 */
export const StatusSortOptions = [
  { value: true, label: 'Enabled', description: 'Allows sort by status.' },
  { value: false, label: 'Disabled', description: 'Hide sorting.' },
];

/**
 * Show Name Options
 */
export const ShowNameOptions = [
  { value: true, label: 'Enabled', description: 'Display variable names.' },
  { value: false, label: 'Disabled', description: 'Hide variable names.' },
];

/**
 * Auto Scroll Options
 */
export const AutoScrollOptions = [
  { value: true, label: 'Enabled', description: 'Auto scroll to the first selected value.' },
  { value: false, label: 'Disabled', description: 'Disable auto scroll.' },
];

/**
 * Group Selection Options
 */
export const GroupSelectionOptions = [
  { value: true, label: 'Enabled', description: 'Enable to allow group selection.' },
  { value: false, label: 'Disabled', description: 'Disable group selection.' },
];

/**
 * Allow Empty Value Options
 */
export const AllowEmptyValueOptions = [
  { value: true, label: 'Enabled', description: 'Empty value enabled.' },
  { value: false, label: 'Disabled', description: 'Empty value disabled.' },
];
