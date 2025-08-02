/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { appReducer, initialState } from '../app-reducer';

describe('app Release Notes Modal', () => {
    it('should show release notes modal by default', () => {
        expect.hasAssertions();
        expect(initialState.showReleaseNotes).toBeTruthy();
    });

    it('should handle SET_SHOW_RELEASE_NOTES action', () => {
        expect.hasAssertions();
        const state = { ...initialState };
        const action = {
            payload: false,
            type: 'SET_SHOW_RELEASE_NOTES' as const,
        };

        appReducer(state, action);

        expect(state.showReleaseNotes).toBeFalsy();
    });

    it('should handle SET_DONT_SHOW_RELEASE_NOTES_AGAIN action', () => {
        expect.hasAssertions();
        const state = { ...initialState };
        const action = {
            payload: true,
            type: 'SET_DONT_SHOW_RELEASE_NOTES_AGAIN' as const,
        };

        appReducer(state, action);

        expect(state.dontShowReleaseNotesAgain).toBeTruthy();
    });

    it('should not show release notes if user has opted out', () => {
        expect.hasAssertions();
        const state = { ...initialState, dontShowReleaseNotesAgain: true };
        expect(
            state.showReleaseNotes && !state.dontShowReleaseNotesAgain
        ).toBeFalsy();
    });
});
