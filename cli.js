#!/usr/bin/env node

var program = require('commander')
var fs = require('fs')

program
  .command('download')
  .action(() => {
    var mirror = require('./mirror.js')
    mirror()
  })
program
  .command('daemon')
  .action(() => {
    var downloadsExists = fs.existsSync('./downloads')
    if (!downloadsExists) {
      console.log('No downloads folder found! Run `node-ipfs-mirror download` first!')
      process.exit(1)
    }
    console.log('Starting daemon...')
    var ipfsd = require('ipfsd-ctl')
    ipfsd.local('./.ipfs', (err, node) => {
      if (err) {
        throw new Error(err)
      }
      node.init((err) => {
        if (err) {
          console.log('Already initialized... Continuing...')
        }
        node.startDaemon((err, ipfs) => {
          if (err) {
            throw new Error(err)
          }
          ipfs.id((err, id) => {
            if (err) {
              throw new Error(err)
            }
            console.log('Started! Your ID is: ' + id.ID)
            console.log('Adding all files to IPFS now, this might take a while...')
            ipfs.add('downloads', {recursive: true}, (err, hashes) => {
              if (err) {
                throw new Error(err)
              }
              hashes.forEach((hash) => {
                if (hash.Name === 'dist') {
                  console.log('Added `./downloads` to IPFS, hash of dist/ folder is: ' + hash.Hash)
                  console.log('Publishing with IPNS, this might also take a while...')
                  ipfs.name.publish(hash.Hash, (err, address) => {
                    if (err) {
                      throw new Error(err)
                    }
                    const fullAddress = 'http://localhost:8080/ipns/' + address.Name
                    console.log('Published! Your address for dist/ folder is:')
                    console.log(fullAddress)
                    fs.writeFileSync('./.ipns_address', fullAddress)
                  })
                }
              })
            })
          })
        })
      })
    })
  })
program
  .command('env [tool]')
  .action((tool) => {
    if (tool === undefined || tool !== 'n' && tool !== 'nvm') {
      console.log('Usage: `node-ipfs-mirror env [tool]`\n[tool] must be either `n` or `nvm`')
      process.exit(1)
    }
    if (!fs.existsSync('./.ipns_address')) {
      console.log('Couldnt find .ipns_address, make sure you run `node-ipfs-mirror daemon` in the background before!')
      process.exit(1)
    }
    const address = fs.readFileSync('./.ipns_address').toString()
    if (tool === 'n') {
      console.log('export NODE_MIRROR=' + address)
    }
    if (tool === 'nvm') {
      console.log('export NVM_NODEJS_ORG_MIRROR=' + address)
    }
  })
program
  .command('reset')
  .action(() => {
    var rimraf = require('rimraf')
    rimraf.sync('./.ipfs')
    rimraf.sync('./downloads')
    console.log('Removed `./.ipfs` and `./downloads`')
  })
program.parse(process.argv)
