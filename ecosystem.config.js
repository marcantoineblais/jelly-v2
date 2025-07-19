module.exports = {
  apps: [
    {
      name: "Jelly",
      script: "node_modules/next/dist/bin/next",
      args: "PORT=4000 start",
      watch: false,
    },
  ],
};