module.exports = {
  apps: [{
    name: "knightsrook-songwriters-toolkit",
    script: "/opt/knightsrook-songwriters-toolkit/server/dist/index.js",
    cwd: "/opt/knightsrook-songwriters-toolkit/server",
    env: {
      NODE_ENV: "production",
      PORT: 5010
    }
  }]
};
