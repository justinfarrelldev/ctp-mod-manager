import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appReducer, initialState } from '../app-reducer';

describe('error handling logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle SET_ERROR action to set error message', () => {
        expect.hasAssertions();
        const state = { ...initialState };
        const errorMessage = 'Failed to apply mods: Permission denied';
        const action = { payload: errorMessage, type: 'SET_ERROR' as const };

        appReducer(state, action);

        expect(state.error).toBe(errorMessage);
    });

    it('should handle SET_ERROR action to clear error message', () => {
        expect.hasAssertions();
        const state = { ...initialState, error: 'Some error' };
        const action = {
            payload: undefined as string | undefined,
            type: 'SET_ERROR' as const,
        };

        appReducer(state, action);

        expect(state.error).toBeUndefined();
    });

    it('should handle SET_APPLYING_MODS action', () => {
        expect.hasAssertions();
        const state = { ...initialState };
        const action = { payload: true, type: 'SET_APPLYING_MODS' as const };

        appReducer(state, action);

        expect(state.applyingMods).toBeTruthy();
    });

    it('should handle error state transitions during mod application', () => {
        expect.hasAssertions();
        const state = { ...initialState };

        // Start applying mods
        appReducer(state, { payload: true, type: 'SET_APPLYING_MODS' });
        expect(state.applyingMods).toBeTruthy();

        // Set an error
        const errorMessage = 'Failed to apply mod: Invalid directory';
        appReducer(state, { payload: errorMessage, type: 'SET_ERROR' });
        expect(state.error).toBe(errorMessage);

        // Stop applying mods
        appReducer(state, { payload: false, type: 'SET_APPLYING_MODS' });
        expect(state.applyingMods).toBeFalsy();
        expect(state.error).toBe(errorMessage); // Error should persist
    });
});
