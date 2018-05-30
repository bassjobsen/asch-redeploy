
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, label } = format
require('winston-daily-rotate-file')
const moment = require('moment')
const chalk = require('chalk')

let logger = createLogger()

let styleText = function (text, meta) {
  if (meta) {
    let styles = meta.split('.')
    for (let i = 0; i < styles.length; ++i) {
      if (styles[i] in chalk) {
        text = chalk[styles[i]](text)
      }
    }
  }
  return text
}

const customFormat = printf(info => {
  let formattedDate = moment(info.timestamp).format('YYYY-MM-DD HH:mm:SSS')
  let level = info.level.toUpperCase()
  let message = styleText(info.message, info.meta)
  switch (level) {
    case 'SILLY':
      level = chalk.cyanBright(level)
      message = chalk.cyanBright(message)
      break
    case 'DEBUG':
      level = chalk.blueBright(level)
      message = chalk.blueBright(message)
      break
    case 'VERBOSE':
      level = chalk.magenta(level)
      message = chalk.magenta(message)
      break
    case 'INFO':
      level = chalk.cyan(level)
      message = chalk.cyan(message)
      break
    case 'WARN':
      level = chalk.yellow(level)
      message = chalk.yellow(message)
      break
    case 'ERROR':
      level = chalk.red(level)
      message = chalk.red(message)
      break
    default:
      break
  }
  // pass metadata to logger -> logger.info('test', { meta: 'meta' })
  let output = `[${chalk.blue(formattedDate)}][${level}] ${message}`
  return output
})

let consoleLogLevel = 'info'
if (process.env['NODE_ENV'] === 'development') {
  consoleLogLevel = 'verbose'
}

let con = new transports.Console({
  level: consoleLogLevel,
  format: combine(
    label(),
    timestamp(),
    customFormat
  ),
  colorize: process.stdout.isTTY
})
logger.add(con)

var dailyRotatefile = new (transports.DailyRotateFile)({
  filename: 'asch-redeploy-%DATE%.log',
  dirname: 'logs',
  datePattern: 'YYYY-MM-DD',
  level: 'silly'
})
logger.add(dailyRotatefile)

module.exports = logger