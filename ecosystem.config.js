module.exports = {
  apps: [
    {
      name: "Jelly",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4000",
      watch: false,
    },
  ],
};
