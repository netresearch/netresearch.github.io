# Deployment

## Build Environment

You need to have a Node.js environment with gulp and yarn.

You can use the offical Node.js Docker container image:

```bash
docker run -ti --rm -v `pwd`:/work node bash
npm install --global gulp-cli
cd /work
```

## Build

```bash
yarn
yarn install
gulp
```


## Deploy

Deployment is done by pushing the updated index.html to github.com:netresearch/netresearch.github.io.git
