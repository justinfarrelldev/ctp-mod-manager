# Contributing

There are a few different steps to get started with this repo. To get started, you will need:

- `Node` and `npm` installed (nvm is highly recommended - the repo is set up so that you can simply run `nvm use` in the root to install the correct versions automatically)
- Create a `.env.development` file locally

From here, you can start the dev server with:

```
npm run dev
```

Note that this repo is bundled with [Vite](https://vitejs.dev/) for extremely fast iteration.

# Code Guidelines

Code should be formatted with [Prettier](https://prettier.io/). The recommended editor is VS Code, however any editor should suffice (I actually started this project on Neovim).

All code should also have relevant unit or integration tests to be accepted (follow the [80-20 rule](https://www.investopedia.com/terms/1/80-20-rule.asp)).
