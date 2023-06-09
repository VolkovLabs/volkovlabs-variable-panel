import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { toDataFrame } from '@grafana/data';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { TestIds } from '../../constants';
import { LevelsEditor } from '../LevelsEditor';
import { GroupsEditor } from './GroupsEditor';

/**
 * Props
 */
type Props = React.ComponentProps<typeof GroupsEditor>;

/**
 * Mock @grafana/ui
 */
jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  Collapse: jest.fn(({ children, isOpen, label, onToggle }) => {
    return (
      <>
        <div onClick={onToggle}>{label}</div>
        {isOpen ? children : null}
      </>
    );
  }),
}));

/**
 * Mock LevelsEditor
 */
jest.mock('../LevelsEditor', () => ({
  LevelsEditor: jest.fn(() => <div data-testid={TestIds.levelsEditor.root} />),
}));

/**
 * Mock react-beautiful-dnd
 */
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'),
  DragDropContext: jest.fn(({ children }) => children),
  Droppable: jest.fn(({ children }) => children({})),
  Draggable: jest.fn(({ children }) =>
    children(
      {
        draggableProps: {},
      },
      {}
    )
  ),
}));

/**
 * In Test Ids
 */
const InTestIds = {
  buttonLevelsUpdate: 'button-levels-update',
};

describe('GroupsEditor', () => {
  /**
   * Get Tested Component
   * @param props
   */
  const getComponent = (props: Partial<Props>) => <GroupsEditor {...(props as any)} />;

  const dataFrameA = toDataFrame({
    fields: [
      {
        name: 'field1',
      },
      {
        name: 'field2',
      },
    ],
    refId: 'A',
  });

  const dataFrameB = toDataFrame({
    fields: [
      {
        name: 'fieldB1',
      },
      {
        name: 'fieldB2',
      },
    ],
    refId: 'B',
  });

  it('Should render groups', () => {
    render(
      getComponent({
        context: {
          data: [dataFrameA],
          options: {
            groups: [
              {
                name: 'group1',
                items: [],
              },
              {
                name: 'group2',
                items: [],
              },
            ],
          } as any,
        } as any,
      })
    );

    expect(screen.getByTestId(TestIds.groupsEditor.item('group1'))).toBeInTheDocument();
    expect(screen.getByTestId(TestIds.groupsEditor.item('group2'))).toBeInTheDocument();
  });

  it('Should render if groups unspecified', () => {
    render(
      getComponent({
        context: {
          data: [dataFrameA],
          options: {} as any,
        } as any,
      })
    );

    expect(screen.getByTestId(TestIds.groupsEditor.newItem)).toBeInTheDocument();
  });

  it('Should add new group', async () => {
    const onChange = jest.fn();

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    await act(() =>
      fireEvent.change(screen.getByTestId(TestIds.groupsEditor.newItemName), { target: { value: 'group2' } })
    );

    expect(screen.getByTestId(TestIds.groupsEditor.buttonAddNew)).toBeInTheDocument();
    expect(screen.getByTestId(TestIds.groupsEditor.buttonAddNew)).not.toBeDisabled();

    await act(() => fireEvent.click(screen.getByTestId(TestIds.groupsEditor.buttonAddNew)));

    expect(onChange).toHaveBeenCalledWith([
      { name: 'group1', items: [] },
      { name: 'group2', items: [] },
    ]);
  });

  it('Should remove group', async () => {
    const onChange = jest.fn();

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [],
              },
              {
                name: 'group2',
                items: [],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    const item2 = screen.getByTestId(TestIds.groupsEditor.item('group2'));

    /**
     * Check field presence
     */
    expect(item2).toBeInTheDocument();

    /**
     * Remove
     */
    await act(() => fireEvent.click(within(item2).getByTestId(TestIds.groupsEditor.buttonRemove)));

    expect(onChange).toHaveBeenCalledWith([{ name: 'group1', items: [] }]);
  });

  it('Should show group content', async () => {
    const onChange = jest.fn();

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [],
              },
              {
                name: 'group2',
                items: [],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    const item1 = screen.getByTestId(TestIds.groupsEditor.item('group1'));

    /**
     * Check field presence
     */
    expect(item1).toBeInTheDocument();

    /**
     * Open
     */
    await act(() => fireEvent.click(item1));

    expect(screen.getByTestId(TestIds.levelsEditor.root)).toBeInTheDocument();
  });

  it('Should update item', () => {
    const onChange = jest.fn();

    jest.mocked(LevelsEditor).mockImplementation(({ name, onChange }) => (
      <div data-testid={TestIds.levelsEditor.root}>
        <button
          data-testid={InTestIds.buttonLevelsUpdate}
          onClick={() =>
            onChange({
              name,
              items: [],
            })
          }
        />
      </div>
    ));

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [
                  {
                    name: 'field 2',
                  },
                  {
                    name: 'field1',
                  },
                ],
              },
              {
                name: 'group2',
                items: [
                  {
                    name: 'field1',
                  },
                ],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    /**
     * Open group1
     */
    fireEvent.click(screen.getByTestId(TestIds.groupsEditor.item('group1')));

    /**
     * Simulate group change
     */
    fireEvent.click(screen.getByTestId(InTestIds.buttonLevelsUpdate));

    expect(onChange).toHaveBeenCalledWith([
      {
        name: 'group1',
        items: [],
      },
      {
        name: 'group2',
        items: [
          {
            name: 'field1',
          },
        ],
      },
    ]);
  });

  it('Should reorder items', async () => {
    let onDragEndHandler: (result: DropResult) => void = () => {};
    jest.mocked(DragDropContext).mockImplementation(({ children, onDragEnd }: any) => {
      onDragEndHandler = onDragEnd;
      return children;
    });
    const onChange = jest.fn();

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [
                  {
                    name: 'field 2',
                  },
                  {
                    name: 'field1',
                  },
                ],
              },
              {
                name: 'group2',
                items: [
                  {
                    name: 'field1',
                  },
                ],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    /**
     * Simulate drop field 1 to index 0
     */
    await act(() =>
      onDragEndHandler({
        destination: {
          index: 0,
        },
        source: {
          index: 1,
        },
      } as any)
    );

    expect(onChange).toHaveBeenCalledWith([
      {
        name: 'group2',
        items: expect.any(Array),
      },
      {
        name: 'group1',
        items: expect.any(Array),
      },
    ]);
  });

  it('Should not reorder items if drop outside the list', async () => {
    let onDragEndHandler: (result: DropResult) => void = () => {};
    jest.mocked(DragDropContext).mockImplementation(({ children, onDragEnd }: any) => {
      onDragEndHandler = onDragEnd;
      return children;
    });
    const onChange = jest.fn();

    render(
      getComponent({
        context: {
          data: [dataFrameA, dataFrameB],
          options: {
            groups: [
              {
                name: 'group1',
                items: [
                  {
                    name: 'field 2',
                  },
                  {
                    name: 'field1',
                  },
                ],
              },
              {
                name: 'group2',
                items: [
                  {
                    name: 'field1',
                  },
                ],
              },
            ],
          } as any,
        } as any,
        onChange,
      })
    );

    /**
     * Simulate drop field 1 to outside the list
     */
    await act(() =>
      onDragEndHandler({
        destination: null,
        source: {
          index: 1,
        },
      } as any)
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
