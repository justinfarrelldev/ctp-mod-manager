# Planning

## What is this?

This is a document dedicated to writing down thoughts and considerations. Feel free to ignore it or ponder some of its insight.

# .zip Within Mod Folder

Should the mod folder contain .zip'd mods or should it contain unzipped mods in their respective folders?

Pros of .zip within the mods folder:

- Simpler organization (no nested folders, no logic to check if the ctp2_data directory exists in the folder to find the top level)
- Takes less time to add mods
- Takes less space on disk

Cons of .zip within the mods folder:

- Takes more time to apply mods
- Would require that all users add mods as .zip files (or that we zip it before adding it - adding complexity)
- Need to unzip at some time to view the change comparisons... temp files??

# Mod Tracking

How would we track which mods the user has already installed, if any?

- Would likely need a lockfile of some sort
  - mods.lock?
  - Would this need to be json?
    - If it were, it would be larger on disk but possibly easier to serialize
- Would likely need a diff file for which all replaced files are compared
  - How would we represent this data?
    - JSON?
  - Would need to be "backtrackable" so we can effectively figure out how to remove select mods from groups of mods
    - JSON ordered in the order of addition?
      - Removed lines would need to have their respective lines subtracted and added lines would need to have theirs added with respect to current mod text (if the current mod text is below the text in the file)
      - How would we handle overlaps? If someone asks to remove a mod that was added earlier than a mod that overwrote those same lines, what would we try to do?
        - Would we avoid this at all costs and simply add the changes below the earlier ones? I feel like that is the definition of an incompatible mod...

{
"file": "units.txt",
"changes": [
{
"line": 5,
"content": "int testNum ="
},
{
"line": 6,
"content": "5"
},
{
"line": 7,
"content": "// this is a test"
}
]
}

If we wanted to add another mod that overwrote line 5, we would need to:

- Check all JSON within the file and ensure that the lines we want to overwrite are available
  - If they are not, warn the user that the mods may be incompatible and show the mod diff if they care
  - If they still say they want to apply, then add the lines underneath of the old ones
- I can use TDD to test for this logic and ensure it is correct
