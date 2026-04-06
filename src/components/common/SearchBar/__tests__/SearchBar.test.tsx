import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SearchBar } from '../index';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onSearch: jest.fn(),
    placeholder: 'Search photos...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search photos...')).toBeTruthy();
  });

  it('should display the value', () => {
    render(<SearchBar {...defaultProps} value="test query" />);
    const input = screen.getByDisplayValue('test query');
    expect(input).toBeTruthy();
  });

  it('should update query when text changes', () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search photos...');

    fireEvent.changeText(input, 'new text');
    expect(screen.getByDisplayValue('new text')).toBeTruthy();
  });

  it('should call onSearch when submitted', () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search photos...');

    fireEvent.changeText(input, 'search query');
    fireEvent(input, 'submitEditing');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('search query');
  });

  it('should call onSearch when search button pressed', () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search photos...');

    fireEvent.changeText(input, 'search query');
    const button = screen.getByTestId('search-button');
    fireEvent.press(button);
    expect(defaultProps.onSearch).toHaveBeenCalledWith('search query');
  });

  it('should not search when query is empty', () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search photos...');

    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');
    expect(defaultProps.onSearch).not.toHaveBeenCalled();
  });

  it('should apply custom placeholder', () => {
    render(<SearchBar {...defaultProps} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });
});
