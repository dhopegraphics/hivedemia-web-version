const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// Add this block to blacklist node core modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    stream: require.resolve("./shim/empty.js"),
    ws: require.resolve("./shim/empty.js"),
    crypto: require.resolve("./shim/empty.js"),
    buffer: require.resolve("./shim/empty.js"),
    assert: require.resolve("./shim/empty.js"),
    util: require.resolve("./shim/empty.js"),
    events: require.resolve("./shim/empty.js"),
    http: require.resolve("./shim/empty.js"),
    https: require.resolve("./shim/empty.js"),
    os: require.resolve("./shim/empty.js"),
    net: require.resolve("./shim/empty.js"),
    tls: require.resolve("./shim/empty.js"),
    zlib: require.resolve("./shim/empty.js"),
    url: require.resolve("./shim/empty.js"),
  },
};


module.exports = withNativeWind(config, { input: "./global.css" });

