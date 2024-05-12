module.exports = {
    sourceType: "unambiguous",
    presets: [["@babel/preset-env", { targets: { chrome: 100 } }], "@babel/preset-react"],
    plugins: ["macros", ["styled-components", { ssr: true }]],
};
