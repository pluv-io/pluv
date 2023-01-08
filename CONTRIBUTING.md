# Contributing

Thanks for contributing! If you have any suggestions on how to improve these contribution guidelines, please let us know in the [issue tracker](https://github.com/pluv-io/pluv/issues).

## How to contribute

### Prerequisite

Before working on any changes, start by [opening an issue](https://github.com/pluv-io/pluv/issues/new/choose) describing the problem or enhancement you'd like to tackle.

### Setup your environment

_Some commands will assume you have the Github CLI installed, if you haven't, consider [installing it](https://github.com/cli/cli#installation), but you can always use the Web UI if you prefer that instead._

In order to contribute to this project, you will need to fork the repository:

```bash
gh repo fork pluv-io/pluv
```

Then, clone it to your local machine:

```bash
gh repo clone <your-github-name>/pluv
```

This project uses [pnpm](https://pnpm.io) as its package manager. Install it if you haven't already:

```bash
npm install -g pnpm
```

Then, run the following commands in the root directory of the project:

```bash
pnpm install
pnpm build
```

### Get it running

```bash
# in project root directory
pnpm dev
```

This will start a watcher in parallel which builds all `packages/*` on any file change, and should  run the app from the e2e tests on port 3100.

### Testing

Install [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) if you haven't already.

```bash
# in project root directory

# spin up services needed for tests
pnpm services:start

# run tests
pnpm test
```

### Linting

```bash
# in project root directory
pnpm lint
```

### Working on your changes

When making commits, make sure to follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines by running [commitizen](https://github.com/commitizen/cz-cli):

```bash
git add <file> && pnpm commit
```

### When you're done

Check that your code follows the project's style guidelines by running:

```bash
# in project root directory
pnpm lint
```

Please also add integration tests of your changes if applicable.

If your change should appear in the changelog, i.e. it changes some behavior of either the CLI or the outputted application, it must be captured by `changeset` which is done by running

```bash
pnpm changeset
```

and filling out the form with the appropriate information. Then, add the generated changeset to git:

```bash
git add .changeset/*.md && git commit -m "chore: add changeset"
```

When all that's done, it's time to file a pull request to upstream:

```bash
gh pr create --web
```

and fill out the title and body appropriately. Again, make sure to follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines for your title.

## Credits

This documented was inspired by the contributing guidelines for [t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app/blob/next/CONTRIBUTING.md).
