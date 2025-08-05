import React from 'react';
import { act } from 'react-dom/test-utils';
import { formatMessage, shallow, mockUseKeyedState } from '@edx/react-unit-test-utils';
import { Button, Modal } from '@openedx/paragon';
import { Pause, PlayArrow } from '@openedx/paragon/icons';

import UnitTimer from './UnitTimer';

jest.mock('@edx/frontend-platform/i18n', () => ({
  defineMessages: m => m,
  useIntl: () => ({ formatMessage: jest.requireActual('@edx/react-unit-test-utils').formatMessage }),
}));

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  const mockUseState = jest.fn();
  const mockUseEffect = jest.fn();

  return {
    ...originalReact,
    useState: mockUseState,
    useEffect: mockUseEffect,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const props = {
  unitId: 'test-unit-id',
};

describe('UnitTimer component', () => {
  let el;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.clear();

    // Mock useState
    React.useState.mockImplementation((initialValue) => [initialValue, jest.fn()]);

    // Mock useEffect to execute the callback immediately
    React.useEffect.mockImplementation((callback, deps) => callback());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with initial state', () => {
    // Set up useState to return expected values
    React.useState
      .mockImplementationOnce(() => [0, jest.fn()]) // seconds
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...props} />);

    expect(el.type).toEqual(React.Fragment);
    expect(el.findByTestId('unit-timer-display').text()).toEqual('00:00:00');

    // Verify timer controls are rendered
    const buttons = el.findByType(Button);
    expect(buttons.length).toEqual(4);

    // First button should be Pause since timer starts running
    expect(buttons[0].props.iconBefore).toEqual(Pause);
    expect(buttons[0].props.children).toEqual('Pause');
  });

  it('loads saved time from localStorage', () => {
    // Mock localStorage to return saved time
    localStorageMock.getItem.mockImplementationOnce(() => '120'); // 2 minutes

    // Set up useState to return expected values
    React.useState
      .mockImplementationOnce((initialVal) => [initialVal, jest.fn()]) // seconds initially 0
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    // Create a setter for seconds that will be captured by useEffect
    const setSeconds = jest.fn();
    React.useState.mockImplementationOnce(() => [0, setSeconds]);

    el = shallow(<UnitTimer {...props} />);

    // Verify localStorage was checked
    expect(localStorageMock.getItem).toHaveBeenCalledWith(`unit_timer_${props.unitId}`);

    // Verify the seconds were updated
    expect(setSeconds).toHaveBeenCalledWith(120);
  });

  it('sets initial time based on problem type if no saved time exists', () => {
    // Mock localStorage to return null (no saved time)
    localStorageMock.getItem.mockImplementation((key) => null);

    // Create props with initialTimeByProblemType
    const propsWithInitialTime = {
      ...props,
      initialTimeByProblemType: 300, // 5 minutes
    };

    // Set up useState to return expected values
    const setSeconds = jest.fn();
    React.useState
      .mockImplementationOnce(() => [0, setSeconds]) // seconds
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...propsWithInitialTime} />);

    // Verify setSeconds was called with initialTimeByProblemType
    expect(setSeconds).toHaveBeenCalledWith(300);
  });

  it('does not override existing saved time with problem type initial time', () => {
    // Mock localStorage to return saved time
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === `unit_timer_${props.unitId}`) {
        return '120'; // 2 minutes saved time
      }
      return null;
    });

    // Create props with initialTimeByProblemType
    const propsWithInitialTime = {
      ...props,
      initialTimeByProblemType: 300, // 5 minutes
    };

    // Set up useState to return expected values
    const setSeconds = jest.fn();
    React.useState
      .mockImplementationOnce(() => [0, setSeconds]) // seconds
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...propsWithInitialTime} />);

    // Verify setSeconds was called with the saved time (120), not initialTimeByProblemType
    expect(setSeconds).toHaveBeenCalledWith(120);
    expect(setSeconds).not.toHaveBeenCalledWith(300);
  });

  it('toggles the timer when pause/resume button is clicked', () => {
    // Set up useState with mock setters that we can track
    const setIsRunning = jest.fn();
    React.useState
      .mockImplementationOnce(() => [0, jest.fn()]) // seconds
      .mockImplementationOnce(() => [true, setIsRunning]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...props} />);

    // Find and click the pause button
    const pauseButton = el.findByType(Button)[0];
    pauseButton.props.onClick();

    // Verify setIsRunning was called with the opposite value
    expect(setIsRunning).toHaveBeenCalledWith(false);
  });

  it('resets the timer when reset button is clicked', () => {
    // Set up useState with mock setters that we can track
    const setSeconds = jest.fn();
    const setIsRunning = jest.fn();
    React.useState
      .mockImplementationOnce(() => [120, setSeconds]) // seconds
      .mockImplementationOnce(() => [false, setIsRunning]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...props} />);

    // Find and click the reset button
    const resetButton = el.findByType(Button)[1];
    resetButton.props.onClick();

    // Verify setSeconds and setIsRunning were called with the expected values
    expect(setSeconds).toHaveBeenCalledWith(0);
    expect(setIsRunning).toHaveBeenCalledWith(true);
  });

  it('logs completion when complete button is clicked', () => {
    // Set up useState with mock setters that we can track
    const setCompletionLogs = jest.fn();
    const setSeconds = jest.fn();
    const setIsRunning = jest.fn();
    const initialLogs = [];

    React.useState
      .mockImplementationOnce(() => [120, setSeconds]) // seconds
      .mockImplementationOnce(() => [true, setIsRunning]) // isRunning
      .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
      .mockImplementationOnce(() => [initialLogs, setCompletionLogs]); // completionLogs

    // Mock Date for consistent testing
    const mockDate = new Date('2023-01-01T12:00:00Z');
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
    global.Date.toISOString = jest.fn(() => mockDate.toISOString());

    el = shallow(<UnitTimer {...props} />);

    // Find and click the complete button
    const completeButton = el.findByType(Button)[2];
    completeButton.props.onClick();

    // Verify setCompletionLogs was called with the expected log
    expect(setCompletionLogs).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        unitId: props.unitId,
        timeSpent: 120,
        dateCompleted: mockDate.toISOString(),
      }),
    ]));

    // Verify timer was reset
    expect(setSeconds).toHaveBeenCalledWith(0);
    expect(setIsRunning).toHaveBeenCalledWith(true);
  });

  it('opens the history modal when history button is clicked', () => {
    // Set up useState with mock setters that we can track
    const setIsModalOpen = jest.fn();
    React.useState
      .mockImplementationOnce(() => [0, jest.fn()]) // seconds
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [false, setIsModalOpen]) // isModalOpen
      .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

    el = shallow(<UnitTimer {...props} />);

    // Find and click the history button
    const historyButton = el.findByType(Button)[3];
    historyButton.props.onClick();

    // Verify setIsModalOpen was called with true
    expect(setIsModalOpen).toHaveBeenCalledWith(true);
  });

  it('clears logs when clear button is clicked in modal', () => {
    // Set up useState with mock setters that we can track
    const setCompletionLogs = jest.fn();
    const setIsModalOpen = jest.fn();
    const initialLogs = [{
      id: 1, unitId: props.unitId, timeSpent: 120, dateCompleted: '2023-01-01T12:00:00Z',
    }];

    React.useState
      .mockImplementationOnce(() => [0, jest.fn()]) // seconds
      .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
      .mockImplementationOnce(() => [true, setIsModalOpen]) // isModalOpen
      .mockImplementationOnce(() => [initialLogs, setCompletionLogs]); // completionLogs

    el = shallow(<UnitTimer {...props} />);

    // Find and click the clear logs button in the modal
    const modal = el.findByType(Modal);
    const clearButton = modal.findByText('Clear History');
    clearButton.props.onClick();

    // Verify setCompletionLogs was called with empty array
    expect(setCompletionLogs).toHaveBeenCalledWith([]);
    // Verify modal was closed
    expect(setIsModalOpen).toHaveBeenCalledWith(false);
  });

  it('formats time correctly', () => {
    // Different seconds values to test formatting
    const testCases = [
      { seconds: 0, expected: '00:00:00' },
      { seconds: 59, expected: '00:00:59' },
      { seconds: 60, expected: '00:01:00' },
      { seconds: 3599, expected: '00:59:59' },
      { seconds: 3600, expected: '01:00:00' },
      { seconds: 7325, expected: '02:02:05' },
    ];

    testCases.forEach(({ seconds, expected }) => {
      React.useState
        .mockImplementationOnce(() => [seconds, jest.fn()]) // seconds
        .mockImplementationOnce(() => [true, jest.fn()]) // isRunning
        .mockImplementationOnce(() => [false, jest.fn()]) // isModalOpen
        .mockImplementationOnce(() => [[], jest.fn()]); // completionLogs

      const el = shallow(<UnitTimer {...props} />);
      expect(el.findByTestId('unit-timer-display').text()).toEqual(expected);
    });
  });
});
