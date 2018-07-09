#!/usr/bin/env node
'use strict'

var glob = require('glob')
var fs = require('fs')
var chalk = require('chalk')
var args = process.argv.slice(2)
var helpers = require('./helper')

var filesAndOrFolders = args.length
  ? args.length === 1
    ? args + '{/**/*,}'
    : '{' + args.join(',') + '}{/**/*,}'
  : '**/*'

var oldActions = ['message', 'alert']

glob(filesAndOrFolders, {
  nodir: true,
  ignore: [
    '**/.git/**/*',
    '**/node_modules/**/*',
    '**/dist/**/*'
  ]
}, (err, files) => {
  if (err) throw err
  var fileChecks = files.map(file => {
    return new Promise(function (resolve, reject) {
      var content = fs.readFileSync(file, 'utf-8')
      var matchRes = {}
      oldActions.forEach(function (action) {
        var reg = new RegExp('[0-9a-z]*.(' + helpers.types.map(type => action + type).join('|') + ')', 'gi')
        if (reg.test(content)) {
          matchRes[action] = true
        }
      })
      if (/ToastModule/.test(content)) {
        matchRes.toastModule = true
      }

      if (!matchRes.alert && !matchRes.message && !matchRes.toastModule) {
        if (/[\r\n\s(,]ToastService/gi.test(content)) {
          return resolve({
            name: file,
            status: 'error'
          })
        }
        return resolve({
          name: file,
          status: 'none'
        })
      }

      fs.writeFileSync(file,
        helpers.migrateHelper(content)
          .pipe(matchRes.alert && helpers.migrageAlertAction)
          .pipe(matchRes.message && helpers.migrageMessageAction)
          .pipe((matchRes.message || matchRes.alert) && helpers.migrageConstuctorActions(matchRes.message, matchRes.alert))
          .pipe((matchRes.message || matchRes.alert) && helpers.migrateImportActions(matchRes.message, matchRes.alert))
          .pipe(matchRes.toastModule && helpers.migrageToastModule)
          .end())
      resolve({
        name: file,
        status: 'success'
      })
    })
  })
  Promise.all(fileChecks).then((files) => {
    var successCount = 0; var errorCount = 0
    files.forEach(file => {
      switch (file.status) {
        case 'error':
          errorCount++
          console.log()
          console.log(chalk.red('migrate failed :') + file.name)
          break
        case 'success':
          successCount++
          break
      }
    })
    console.log()
    console.log(chalk.green('migrate success : ') + successCount)
    console.log(chalk.red('migrate failed : ') + errorCount)
  }).catch(error => {
    throw error
  })
})
