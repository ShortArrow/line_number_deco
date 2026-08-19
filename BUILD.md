# How to build the project

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

## Build ./src/generater

Generate `src/generated` directory.

```bash
mkdir -p src/generated
pnpm dlx ts-node src/generater/fromPackageJson.ts
```

or this command.

```bash
pnpm generate
```

Compile the TypeScript code.

```bash
pnpm compile
```

## Deploy

```bash
pnpm package
```
