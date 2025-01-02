# How to build the project

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [Yarn V4](https://yarnpkg.com/cli)

## Build ./src/generater

Generate `src/generated` directory.

```bash
mkdir -p ./src/generated
yarn dlx ts-node generater/fromPackageJson.ts
```

or this command.

```bash
yarn generate
```

Compile the TypeScript code.

```bash
yarn compile
```

## Deploy

```bash
yarn package
```
