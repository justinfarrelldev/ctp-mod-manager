# Contributing

There are a few different steps to get started with this repo. To get started, you will need:

- `Node` and `npm` installed (nvm is highly recommended - the repo is set up so that you can simply run `nvm use` in the root to install the correct versions automatically)

From here, you can start the dev server with:

```
npm run dev
```

Note that this repo is bundled with [Vite](https://vitejs.dev/) for extremely fast iteration.

# Code Guidelines

Code should be formatted with [Prettier](https://prettier.io/). The recommended editor is VS Code, however any editor should suffice (I actually started this project on Neovim).

Relevant unit or integration tests are always appreciated, but not necessarily required (yet). Eventually, the plan is 80% test coverage, but this project has ballooned quite a lot.

Submit all code via a pull-request on GitHub. I understand it may be a bit hypocritical (given I have just pushed to main since the beginning), but I was the sole contributor for the two years before this project was open-sourced, so there was no need to use PRs. That said, I am going to use PRs for all future contributions as that is the expectation going forward.

Before you submit your PR, ensure that there are NO warnings or errors with ESLint by running `npm run lint`. After that, make sure all tests pass with `npm test`. If both of these work, feel free to submit the PR!
