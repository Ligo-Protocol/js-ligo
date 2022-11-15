# js-ligo monorepo

Packages providing the reference TypeScript implementation of Ligo.

## Installation

This monorepo uses [pnpm](https://pnpm.io/), make sure to install it first if you don't already have it.

1. `pnpm install` to install the dependencies
1. `pnpm run build` to build all the packages

### Additional scripts

- `pnpm run lint` to run the linter in all packages
- `pnpm run test` to run tests in all packages
- `pnpm run docs` to generate API documentation

## Packages

| Name                                   | Description                                                                                      | Version |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------- |
| [`@js-ligo/client`](./packages/client) | Main client                                                                                      |         |
| [`@js-ligo/vocab`](./packages/vocab)   | Typescript implementation of the [Ligo Vocabulary](https://github.com/Ligo-Protocol/ligo-vocab). |         |

## License

Licensed under [MIT](LICENSE)
