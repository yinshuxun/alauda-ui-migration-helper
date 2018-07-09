'use strict'
var types = ['success', 'error', 'info', 'warning']

var migrateHelper = function (content) {
  this.content = content
  this.pipe = function (excutor) {
    if (typeof excutor === 'function') {
      this.content = excutor(this.content)
    }
    return this
  }
  this.end = function () {
    return this.content
  }
  return this
}

// migrate alert action
var migrageAlertAction = function (content) {
  let transfer = content
  types.forEach(function (type) {
    var reg = new RegExp('([0-9a-z]*.alert)' + type, 'gi')
    transfer = transfer.replace(reg, 'auiNotificationService.' + type)
  })
  return transfer
}

// migrate message action
var migrageMessageAction = function (content) {
  let transfer = content
  types.forEach(function (type) {
    var reg = new RegExp('([0-9a-z]*.)message' + type, 'gi')
    transfer = transfer.replace(reg, 'auiMessageService.' + type)
  })
  return transfer
}

// migrate ToastService in constructor
var migrageConstuctorActions = function (importMessage, importNotification) {
  return function (content) {
    return content.replace(/(private|protected|public)[\r\n\s]*[0-9a-zA-Z]*[\r\n\s]*:[\r\n\s]*ToastService/g,
      (importMessage ? '$1 auiMessageService: MessageService' : '') +
      (importMessage && importNotification ? ' ,' : '') +
      (importNotification ? '$1 auiNotificationService: NotificationService' : ''))
  }
}

// migrate import ToastService
var migrateImportActions = function (importMessage, importNotification) {
  return function (content) {
    return content.replace(/(import[\r\n\s]*{[\r\n\s\w,]*)ToastService([\r\n\s\w,]*}[\r\n\s\w'"]*alauda-ui)/g,
      '$1' +
      (importMessage ? 'MessageService' : '') +
      (importMessage && importNotification ? ', ' : '') +
      (importNotification ? 'NotificationService' : '') + '$2'
    )
  }
}

var migrageToastModule = function (content) {
  return content.replace(/ToastModule/g, 'NotificationModule, MessageModule')
}

module.exports = {
  migrateImportActions,
  migrageConstuctorActions,
  migrageMessageAction,
  migrageAlertAction,
  migrageToastModule,
  migrateHelper,
  types
}
