{
  "version": 2,
  "builds": [
    {
      "src": "client/index.html",
      "use": "@vercel/static-build"
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/ws",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/index.html"
    }
  ]
}
