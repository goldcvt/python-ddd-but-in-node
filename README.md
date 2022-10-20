# NodeDDD

A Node.js/TypeScript clone of python architecture book [repository](https://github.com/cosmicpython/code/)

Used tech/whatever: typescript, mocha, xo, prettier, prisma, chai

## How to run

First things first:
`npm ci`
Secondly use prisma cli to generate SQLite DB:
`npx prisma migrate dev --name init`
That's it! Now you can run tests:
`npm run test`
Or in watch mode:
`npm run test:watch`
