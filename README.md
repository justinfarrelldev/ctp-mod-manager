# Call to Power Mod Manager

**VERY IMPORTANT NOTE**
This is ALPHA software, and it _will_ have bugs! Back up any installations before using this mod manager on them.

This is a mod manager intended for use with the Call to Power series of games (however, it can be used for other games as well if desired).

**Back up all installations that you care about before applying mods over them - applying mods to games that have already been saved will often cause the save to be corrupted!**

# Installing CTP Mod Manager

To get CTP Mod Manager, you can find the latest release on the [releases](https://github.com/justinfarrelldev/ctp-mod-manager/releases) page. Download the right file for your system and run it.

# Features

## Finds Your Game Install

It will automatically find your installed Call to Power game (so you can add mods to it if you wish) as long as it is in a standard directory. If your install is not found automatically, you can add it with an easy-to-use folder picker (just make sure you're in a folder next to ctp2_data and ctp2_program before clicking "Select Folder").

## Enables Easy Backups

There are options to create, restore and delete backups that you name yourself. The backups also include your save files!

![image](https://github.com/user-attachments/assets/d6e6d470-242a-4714-9534-89aed4fb841e)

![image](https://github.com/user-attachments/assets/c9010f88-c977-41c7-a92e-8f78d2c24bef)

## Applies Mods in One Click

Most mods can just be applied in a single click, including scenario mods. Incompatible mods can be found in the "Incompatible Mods" section of the latest release.

![image](https://github.com/user-attachments/assets/dfe0ecf7-fd5d-48a5-aa7a-739cfc19fc50)


## Change Your Theme

You can change your themes with a click of a button to any of DaisyUI's wonderful themes. These include light modes, dark modes and most modes in-between!

### Light:
![image](https://github.com/user-attachments/assets/438322aa-7ed9-4efd-bd12-6aaf365d9ebb)

### Dark:
![image](https://github.com/user-attachments/assets/64e5ad90-541a-46ef-beae-2830bd1a568d)

### Halloween: 
![image](https://github.com/user-attachments/assets/8befd4a6-c3ad-44a3-a752-4afcb2717006)

... and many more!

## Apply Multiple Mods At Once

You can apply multiple mods together at once. The order you select the mods is the order they will be applied in.

![image](https://github.com/user-attachments/assets/5b5b680d-8efd-4aea-8c66-2e4cd254dbb9)


# Contributing

Please see CONTRIBUTING.md.

# Debugging

If you encounter this error while building the mod manager from scratch:

An unhandled rejection has occurred inside Forge:
Error: EPERM: operation not permitted, rmdir 'C:\Users\YOUR~1.NAME\AppData\Local\Temp\electron-packager\win32-x64\ctp-mod-manager-win32-x64-FBAsa7\resources\app\.github\workflows'

...then you should try going to `C:\Users\YOUR~1.NAME\AppData\Local\Temp` and `rm -rf` the `electron-packager` folder.

# F.A.Q.

_Why Electron?_

I am much more familiar with TypeScript, React and (now) Electron than I am with Rust, C++ or C. I definitely _can_ code in C++ competently, but I am not nearly as confident and I have been trying to get this out as soon as I can.

That said, I do regret choosing Electron for this project - Electron is quite difficult to work with due to the inter-process communications paradigm. For this reason, if I were to start over tomorrow, I would definitely just choose native Rust.

_Why Call to Power?_

I am a huge fan of Call to Power II and I love the community. I run the Discord for the games and I believe that the community needs more tools to make modding not only easier but more accessible as well.
