/* global describe, it */
var mirror = require('./mirror.js')
var assert = require('assert')
var fs = require('fs')

var versions = [
  {version: 'v5.7.0', files: ['osx-x64-pkg']},
  {version: 'v5.6.0', files: ['osx-x64-pkg']},
  {version: 'v5.5.0', files: ['osx-x64-pkg']},
  {version: 'v5.4.0', files: ['osx-x64-pkg']},
  {version: 'v5.3.0', files: ['osx-x64-pkg']}
]

describe('Mirror command', () => {
  it('should be able to only take versions above provided version', () => {
    assert.strictEqual(
      2,
      mirror.grabVersionsLaterThan('5.5.0', versions).length,
      'didn\'t parse versions correctly'
    )
  })
  it('should be able to only take versions above provided version', () => {
    var versions_with_paths = mirror.parsePaths(versions)

    assert.strictEqual(
      'https://nodejs.org/dist/v5.7.0/node-v5.7.0.pkg',
      versions_with_paths[0].paths['osx-x64-pkg'],
      'Could not get the right full path for osx binary'
    )
    assert.strictEqual(
      undefined,
      versions_with_paths[0].paths['linux-arm64'],
      'Got something else than null for linux-arm64'
    )
  })
  it('should be able to save file to disk', (done) => {
    var file_to_save = 'https://nodejs.org/dist/index.json'

    mirror.saveFile(file_to_save).then(() => {
      var expected_file = fs.readFileSync('./test_index.json').toString()
      var actual_file = fs.readFileSync('./downloads/index.json').toString()

      assert.strictEqual(expected_file, actual_file)
      fs.unlinkSync('./downloads/index.json')
      done()
    })
  })
})
