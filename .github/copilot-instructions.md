**CRITICAL: Always output the results of any commands you run to temp.log (in the root directory), then read that to get the results of the previous command. This ensures that you can read it - there is a bug at the moment that will prevent you from reading commands directly. Use tee when doing this so I can see the command running without having to open temp.log. You should NOT have to run "echo "Starting header test creation" | tee temp.log" or similar - only do it for test runs and other important commands. Echo should almost never be present.**

STEPS TO FOLLOW:

Try your best to follow the linting rules the first time, that way you will not have to come back to change the code later (see .eslintrc.cjs in the root).

Before starting ANY new features or editing existing features, create tests for the feature, run the tests you created (they should fail) and use test-driven development (red-green testing) to ensure the feature works according to the spec you filled out. Mock and stub anything that needs to be mocked / stubbed, but don't overdo it.

Instead of writing the whole files at once, write the files in incremental steps - writing a function at a time (so you don't corrupt it).

Once each step is completed, run "npm run lint" and fix any issues (warnings OR errors) that pop up. Additionally, run the tests with "npm test -- run" and fix any test failures that remain. You are not allowed to change any linting rules, styling rules or any testing rules.

If a single React component has more than 5 useState / state management calls, convert it to use a React reducer as a part of your task.

TOOLS TO USE:

A pre-install hook will prevent you from ever using npm. Use npm, not pnpm (pnpm has issues with Electron).

Use Vitest and Playwright for tests.

Use eslint for linting. You can use the ESLint MCP server to check the current ESLint status.

You can add packages (especially if they make the job significantly easier). Make sure that if you want to add a package, you tell me the reasoning first.

ALWAYS run tests without watch mode so I don't have to cancel / quit the runs for you.
