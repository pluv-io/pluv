module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-pluv`
  extends: ["pluv"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};
