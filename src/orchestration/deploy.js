const aschJS = require('asch-js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const ncp = require('ncp').ncp
const Promise = require('bluebird')
const utils = require('../utils')
const logger = require('../logger')

// constructor
let deploy = function (config) {
  this.config = config

  this.peerTransactionUrl = `${config.node.host}:${config.node.port}/peer/transactions`
  this.header = {
    magic: this.config.node.magic,
    version: ''
  }

  this.registerDapp = function () {
    let secret = this.config.dapp.masterAccountPassword
    let secondSecret = this.config.dapp.masterAccountPassword2nd

    let srcDir = utils.getParentDirectory(__dirname)
    let mainDir = utils.getParentDirectory(srcDir)
    logger.silly(`maindir: ${mainDir}`)
    let dappJsFile = path.join(mainDir, 'dapp.json')
    // todo check if file exists
    var dapp = JSON.parse(fs.readFileSync(dappJsFile, 'utf8'))
    dapp.name = `${dapp.name}-${utils.generateRandomString(15)}`
    dapp.link = `${dapp.link.replace('.zip', '')}-${utils.generateRandomString(15)}.zip`
    let trs = aschJS.dapp.createDApp(dapp, secret, secondSecret)

    return axios({
      method: 'POST',
      url: this.peerTransactionUrl,
      headers: this.header,
      data: {
        transaction: trs
      }
    })
  } // deploy end

  this.copyFiles = function (dappId) {
    let self = this
    return new Promise(function (resolve, reject) {
      let dappParentDir = path.join(self.config.node.directory, 'dapps')

      let existsDappDir = fs.existsSync(dappParentDir)

      if (existsDappDir === false) {
        fs.mkdirSync(dappParentDir)
      }

      let newDappDirectory = path.join(self.config.node.directory, 'dapps', dappId)
      fs.mkdirSync(newDappDirectory)

      let dappConfigPath = path.join(self.config.userDevDir, 'config.json')
      let dappConfig = JSON.parse(fs.readFileSync(dappConfigPath, 'utf8'))

      dappConfig.secrets = []
      dappConfig.secrets.push(...self.config.dapp.delegates)
      fs.writeFileSync(dappConfigPath, JSON.stringify(dappConfig, null, 2), 'utf8')

      ncp(self.config.userDevDir, newDappDirectory, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(null)
        }
      })
    })
  } // end copyFiles

  this.changeAschConfig = function () {
    let self = this
    return new Promise(function (resolve, reject) {
      let aschNodeConfigPath = path.join(self.config.node.directory, 'config.json')
      let aschConfig = JSON.parse(fs.readFileSync(aschNodeConfigPath, 'utf8'))

      let newOption = [self.config.dapp.masterAccountPassword]
      aschConfig.dapp.params[self.dappId] = newOption

      fs.writeFileSync(aschNodeConfigPath, JSON.stringify(aschConfig, null, 2), 'utf8')
      resolve('wrote asch/config.json successfully')
    })
  } // end changeAschConfig
}

module.exports = deploy
