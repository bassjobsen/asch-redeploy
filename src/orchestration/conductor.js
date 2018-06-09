const Promise = require('bluebird')
const workflow = require('./workflow')
const Watcher = require('./watcher')
const logger = require('../logger')

// ctor
let Conductor = function (service, config) {
  this.service = service
  this.config = config

  let watcher = new Watcher(config)
  watcher.watch()

  this.orchestrate = () => {
    return watcher.waitForFileChanges()
      .then(() => {
        logger.info('finished watching files...')
        return workflow(this.service, this.config)
      })
      .then(() => {
        let ms = 3000
        logger.verbose(`sleep for ${ms}ms`)
        return Promise.delay(ms)
      })
      .catch((error) => {
        logger.verbose('throw in conductor.js line 62')
        throw error
      })
      .then(() => {
        logger.info('waiting for file changes...')
        return this.orchestrate()
      })
  }
}

module.exports = Conductor
