module.exports = {
  apps: [
    {
      name: "jelly",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4000",
      cwd: "C:\\Users\\blais\\code\\jelly-v2",
    },
    {
      name: "file-server",
      script: "file-server.js",
      cwd: "C:\\Users\\blais\\code\\jelly-v2",
    },
    {
      name: "socket-server",
      script: "socket-server.js",
      cwd: "C:\\Users\\blais\\code\\jelly-v2",
    },
  ],
};
