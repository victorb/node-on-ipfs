## node-ipfs-mirror

NodeJS binaries + npm, hosted over IPFS

A small utility in two parts. One is to clone existing NodeJS binaries and host them over IPFS. The other one is to set your `nvm` or `n` client to download new NodeJS binaries over IPFS

A script that helps you to fetch and mirror NodeJS binaries from nodejs.org/dist with IFPS.

## Why?

When you download a new node version, you want it to be fast right? And there is no faster way
to download something than through local network (if it exists there) and if needed, falls back
to fetching the binary from the closest mirror.

IPFS helps with this. Basically you have two commands, probably only one you really care about (the `install` one)

## Installation

* `npm install -g node-ipfs-mirror`

### Hosting versions

* `node-ipfs-mirror download`

Clone and host binaries that fits with your version requirements (version 0.12 and up by default):

If you run the command before and run it again, it updates the binaries to the latest versions, leaving already downloaded versions

* `node-ipfs-mirror daemon`

Run a built-in IPFS daemon for hosting the binaries.
Adds binaries to IPFS and then starts an IPFS daemon


### Client

* `node-ipfs-mirror env nvm` <- Prints command for setting the environment variable for usage with `nvm`

* `node-ipfs-mirror env n` <- Prints command for setting the environment variable for usage with `n`

For extra style points, run `eval $(node-ipfs-mirror env nvm)` and you'll be up and running in no time! 🍪
