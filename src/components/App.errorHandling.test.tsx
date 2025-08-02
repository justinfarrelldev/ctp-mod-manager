import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { App } from '../App';

// Mock the Electron API
const mockApi = {
    addToInstallDirs: vi.fn(),
    applyModsToInstall: vi.fn(),
    copyFileToModDir: vi.fn(),
    deleteBackup: vi.fn(),
    getAppliedMods: vi.fn().mockResolvedValue([]),
    getCtp2ExecutablePath: vi.fn().mockResolvedValue(''),
    getCtp2InstallDir: vi.fn().mockResolvedValue([]),
    getInstallDirs: vi.fn().mockResolvedValue([]),
    getModsDir: vi.fn().mockResolvedValue(''),
    goToRoute: vi.fn(),
    isGameRunning: vi.fn().mockResolvedValue(false),
    isValidInstall: vi.fn().mockResolvedValue(true),
    listBackups: vi.fn().mockResolvedValue([]),
    loadModFileNames: vi.fn().mockResolvedValue(['testMod']),
    makeBackup: vi.fn(),
    openDirectory: vi.fn(),
    openModsDir: vi.fn(),
    removeFromInstallDirs: vi.fn(),
    removeModFromMods: vi.fn(),
    restoreBackup: vi.fn(),
    runGame: vi.fn(),
    selectFolder: vi.fn(),
    stopGame: vi.fn().mockResolvedValue(true),
    viewFileDirsInZip: vi.fn().mockResolvedValue([]),
};

// Mock the window object with Electron API
Object.defineProperty(window, 'api', {
    value: mockApi,
    writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('UI error handling for mod application', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.setItem('alphaWarningAcknowledged', 'true');

        // Set up default mocks
        mockApi.getInstallDirs.mockResolvedValue(['/test/install']);
        mockApi.loadModFileNames.mockResolvedValue(['testMod']);
    });

    it('should display error modal when mod application fails with permission error', async () => {
        expect.assertions(2);

        // Mock a permission error from applyModsToInstall
        mockApi.applyModsToInstall.mockRejectedValue(
            new Error(
                'Permission denied: Cannot write to "C:\\Program Files\\CallToPower2"'
            )
        );

        render(<App />);

        // Wait for the component to load
        await waitFor(() => {
            expect(screen.getByText('testMod')).toBeInTheDocument();
        });

        // Select the mod
        const modCheckbox = screen.getByLabelText('Select testMod');
        fireEvent.click(modCheckbox);

        // Select an installation
        const installCheckbox = screen.getByLabelText(
            'Select installation: /test/install'
        );
        fireEvent.click(installCheckbox);

        // Click apply mods
        const applyButton = screen.getByLabelText('Apply selected mods');
        fireEvent.click(applyButton);

        // Wait for the error modal to appear
        await waitFor(() => {
            expect(
                screen.getByText(/Failed to apply mods.*Permission denied/)
            ).toBeInTheDocument();
        });
    });

    it('should display error modal when mod application fails with validation error', async () => {
        expect.assertions(2);

        // Mock a validation error from applyModsToInstall
        mockApi.applyModsToInstall.mockRejectedValue(
            new Error('Invalid installation directory: /invalid/path')
        );

        render(<App />);

        // Wait for the component to load
        await waitFor(() => {
            expect(screen.getByText('testMod')).toBeInTheDocument();
        });

        // Select the mod
        const modCheckbox = screen.getByLabelText('Select testMod');
        fireEvent.click(modCheckbox);

        // Select an installation
        const installCheckbox = screen.getByLabelText(
            'Select installation: /test/install'
        );
        fireEvent.click(installCheckbox);

        // Click apply mods
        const applyButton = screen.getByLabelText('Apply selected mods');
        fireEvent.click(applyButton);

        // Wait for the error modal to appear
        await waitFor(() => {
            expect(
                screen.getByText(
                    /Failed to apply mods.*Invalid installation directory/
                )
            ).toBeInTheDocument();
        });
    });

    it('should display error modal when mod application fails with multiple errors', async () => {
        expect.assertions(2);

        // Mock multiple errors from applyModsToInstall
        mockApi.applyModsToInstall.mockRejectedValue(
            new Error(
                'Multiple errors occurred during mod application:\nFailed to apply mod "mod1": Error\nFailed to apply mod "mod2": Error'
            )
        );

        render(<App />);

        // Wait for the component to load
        await waitFor(() => {
            expect(screen.getByText('testMod')).toBeInTheDocument();
        });

        // Select the mod
        const modCheckbox = screen.getByLabelText('Select testMod');
        fireEvent.click(modCheckbox);

        // Select an installation
        const installCheckbox = screen.getByLabelText(
            'Select installation: /test/install'
        );
        fireEvent.click(installCheckbox);

        // Click apply mods
        const applyButton = screen.getByLabelText('Apply selected mods');
        fireEvent.click(applyButton);

        // Wait for the error modal to appear
        await waitFor(() => {
            expect(
                screen.getByText(
                    /Failed to apply mods.*Multiple errors occurred/
                )
            ).toBeInTheDocument();
        });
    });
});
