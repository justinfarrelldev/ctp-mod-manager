# Call to Power Mod Manager

**VERY IMPORTANT NOTE**
This is ALPHA software, and it _will_ have bugs! Back up any installations before using this mod manager on them.

This is a mod manager intended for use with the Call to Power series of games (however, it can be used for other games as well if desired).

# Plans for the Future

- [] Fill out more tests to cover common cases
- [] Make long-running calls to the backend asynchronous
- [] Make scenario mods apply successfully
- [] Add fallbacks for common mods (such as Spyroviper's mod) which have different folder structures

# Features

## Finds Your Game Install

It will automatically find your installed Call to Power game and add it as a profile (so you can add mods to it if you wish).

## Non-Destructive

All of the changes it makes aim to be non-destructive and entirely reversible.

## Mod Diff View

The mod manager provides a diff view so you can see which files and lines each mod affects. This should allow you to safely add multiple mods together with confidence!

# Debugging

If you encounter this error:

An unhandled rejection has occurred inside Forge:
Error: EPERM: operation not permitted, rmdir 'C:\Users\YOUR~1.NAME\AppData\Local\Temp\electron-packager\win32-x64\ctp-mod-manager-win32-x64-FBAsa7\resources\app\.github\workflows'

...then you should try going to `C:\Users\YOUR~1.NAME\AppData\Local\Temp` and `rm -rf` the `electron-packager` folder.

# F.A.Q.

_Why Electron?_

I am much more familiar with TypeScript, React and (now) Electron than I am with Rust, C++ or C. I definitely _can_ code in C++ competently, but I am not nearly as confident and I have been trying to get this out as soon as I can.

_Why Call to Power?_

I am a huge fan of Call to Power II and I love the community. I run the Discord for the games and I can see that the community needs more tools to make modding not only easier but more accessible as well.
