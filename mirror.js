var fetch = require('node-fetch')
var semver = require('semver')
var fs = require('fs')
require('colors')
var pretty = require('prettysize')
var filter = require('lodash/filter')

const VERSION_LIST_PATH = 'http://nodejs.org/dist/index.json'
const EARLIEST_VERSION_TO_FETCH = '5.7.1'
// const FILES_TO_DOWNLOAD_FROM_VERSIONS = [
//   'osx-x64-pkg',
//   'osx-x64-tar'
// ]
const FILES_NAME_TO_LOCATION_MAP = {
  'headers': 'node-{{VERSION}}-headers.tar.xz',
  'linux-x64': 'node-{{VERSION}}-linux-x64.tar.xz',
  'linux-x86': 'node-{{VERSION}}-linux-x86.tar.xz',
  'osx-x64-pkg': 'node-{{VERSION}}.pkg',
  'osx-x64-tar': 'node-{{VERSION}}-darwin-x64.tar.xz',
  'src': 'node-{{VERSION}}.tar.xz',
  'win-x64-msi': 'node-{{VERSION}}-x64.msi'
  // 'win-x86-msi': 'node-{{VERSION}}-x86.msi'
}
const DOWNLOADS_FOLDER = './downloads/dist'

const json = (res) => {
  return res.json()
}

const printProgress = (filename, percentage, bytesPerSecond) => {
  var percentageText = null
  percentage = Math.floor(percentage)
  if (percentage <= 20) {
    percentageText = (percentage.toString() + '%').red
  }
  if (percentage > 20 && percentage <= 50) {
    percentageText = (percentage.toString() + '%').yellow
  }
  if (percentage > 50 && percentage <= 75) {
    percentageText = (percentage.toString() + '%').blue
  }
  if (percentage > 75 && percentage <= 99) {
    percentageText = (percentage.toString() + '%').green
  }
  if (percentage === 100) {
    percentageText = (percentage.toString() + '%').rainbow
  }
  console.log(percentageText + ' --- ' + pretty(bytesPerSecond) + '/s --- ' + filename)
}

var ProgressStream = require('progress-stream')
const saveFile = (remove_filepath, folder) => {
  if (!fs.existsSync(DOWNLOADS_FOLDER)) {
    fs.mkdirSync(DOWNLOADS_FOLDER)
  }
  const filename = remove_filepath.split('/')[remove_filepath.split('/').length - 1]
  return new Promise((resolve) => {
    const local_file_path = DOWNLOADS_FOLDER + '/' + folder + '/' + filename
    if (fs.existsSync(local_file_path)) {
      console.log(filename + ' was already downloaded before!')
      resolve()
      return
    }
    console.log('Starting download of file ' + filename)
    fetch(remove_filepath).then((res) => {
      if (res.status === 404 && filename.includes('SHASUMS')) {
        console.log('Didnt find ' + filename + ', skipping')
        resolve()
        return
      }
      var writeStream = fs.createWriteStream(local_file_path, {flags: 'w'})
      var progressMeter = ProgressStream({
        length: res.headers.get('content-length'),
        time: 500
      })
      progressMeter.on('progress', (progress) => {
        printProgress(filename, progress.percentage, progress.speed)
      })
      res.body.pipe(progressMeter).pipe(writeStream)
      writeStream.on('close', resolve)
    }).catch((err) => console.log(err))
  })
}

const grabVersionsLaterThan = (version_to_test_against, versions) => {
  var versions_to_return = []
  versions.forEach((version) => {
    if (semver.gt(version.version, version_to_test_against)) {
      versions_to_return.push(version)
    }
  })
  return versions_to_return
}

const parsePaths = (versions) => {
  versions.forEach((version) => {
    var paths = []
    version.files.forEach((file) => {
      const path = FILES_NAME_TO_LOCATION_MAP[file]
      if (path) {
        paths.push('https://nodejs.org/dist/' + version.version + '/' + FILES_NAME_TO_LOCATION_MAP[file].replace(/{{VERSION}}/, version.version))
      }
    })
    paths.push('https://nodejs.org/dist/' + version.version + '/SHASUMS256.txt')
    paths.push('https://nodejs.org/dist/' + version.version + '/SHASUMS.txt')
    version.paths = paths
  })
  return versions
}

var mkdirp = require('mkdirp')
const createFoldersForVersions = (versions) => {
  versions.forEach((version) => {
    mkdirp.sync(DOWNLOADS_FOLDER + '/' + version.version)
  })
}

const WrappedSaveFile = (path, version) => {
  return () => {
    return saveFile(path, version)
  }
}

const downloadVersions = (versions) => {
  return new Promise((resolve) => {
    var promises = []
    versions.forEach((version) => {
      // console.log('VERISON')
      // console.log(version)
      version.paths.forEach((path) => {
        console.log('Queueing version ' + version.version + ' from ' + path + ' for downloading')
        promises.push(WrappedSaveFile(path, version.version))
      })
    })
    promises.reduce((cur, next) => {
      return cur.then(next).catch(() => console.log('err'))
    }, Promise.resolve()).then(() => {
      resolve()
    })
    // Promise.all(promises).then(resolve)
  })
}

// module.exports = {
//   grabVersionsLaterThan,
//   saveFile,
//   parsePaths
// }

const downloadIndexFile = () => {
  return new Promise((resolve) => {
    var writeStream = fs.createWriteStream(DOWNLOADS_FOLDER + '/index.tab', {flags: 'w'})
    fetch('http://nodejs.org/dist/index.tab').then((res) => {
      res.body.pipe(writeStream)
      writeStream.on('close', () => {
        var versions = fs.readFileSync('./downloads/dist/index.tab').toString().split('\n').map((version) => {
          const semverVersion = version.split('\t')[0]
          var toReturn = null
          if (semverVersion === 'version' || semverVersion === '') {
            toReturn = version
          } else {
            if (semver.gt(semverVersion, EARLIEST_VERSION_TO_FETCH)) {
              toReturn = version
            }
          }
          return toReturn
        })
        // Remove null values
        versions = filter(versions)
        fs.writeFileSync('./downloads/dist/index.tab', versions.join('\n'))
        resolve()
      })
    })
  })
}

module.exports = () => {
  fetch(VERSION_LIST_PATH).then(json).then((response) => {
    const versions_to_fetch = grabVersionsLaterThan(EARLIEST_VERSION_TO_FETCH, response)
    const paths = parsePaths(versions_to_fetch)
    createFoldersForVersions(paths)
    console.log('Starting download of index.tab')
    downloadIndexFile().then(() => {
      console.log('Finished downloading of index.tab')
      downloadVersions(paths).then(() => {
        console.log('All done!')
      })
    })
  })
}
