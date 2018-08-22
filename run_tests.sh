#!/usr/bin/env bash
GANACHE=0
./node_modules/.bin/ganache-cli -i 5777 >> /dev/null 2>&1 & > ${GANACHE}
sleep 5

npm build
npm run migrate-test
npm test

kill -9 ${GANACHE}
