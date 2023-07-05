/**
 * Tests the App component
 *
 * @group integration
 */

import React from 'react';
import { App } from './App';
import { render, screen } from '@testing-library/react';
import { AUTO_DETECT_INSTALL_TEXT } from './constants';

describe('App', () => {
  describe('No installation set', () => {
    it(`should show a popup asking if it is okay to auto-detect installations`, () => {
      render(<App />);

      expect(screen.queryByText(AUTO_DETECT_INSTALL_TEXT)).toBeInTheDocument();
    });
  });
});
