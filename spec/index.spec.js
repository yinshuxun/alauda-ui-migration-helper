'use strict'

var helper = require('../helper')

describe('migtate alauda-ui', () => {
  it('migrateImportActions', () => {
    expect(helper.migrateHelper('import  { xx,ToastService ,xx ,xx} from alauda-ui ').pipe(helper.migrateImportActions(true, true)).end())
      .toBe('import  { xx,MessageService, NotificationService ,xx ,xx} from alauda-ui ')
  })

  it('migrateImportActions', () => {
    expect(helper.migrateHelper(' , private toast:ToastService  ').pipe(helper.migrageConstuctorActions(true, true)).end()).toBe(
      ' , private auiMessageService: MessageService ,private auiNotificationService: NotificationService  ')
  })

  it('migrageAlertAction', () => {
    expect(helper.migrateHelper('this.tt.alertSuccess(123)').pipe(helper.migrageAlertAction).end()).toBe(
      'this.auiNotificationService.success(123)')
  })

  it('migrageAlertAction', () => {
    expect(helper.migrateHelper('this.tt.messageSuccess(123)').pipe(helper.migrageMessageAction).end()).toBe(
      'this.auiMessageService.success(123)')
  })

  it('migrageToastModule', () => {
    expect(helper.migrateHelper('import {xx,ToastModule,x} from alauda-ui , var exprotModule = [,ToastModule ,]').pipe(helper.migrageToastModule).end()).toBe(
      'import {xx,NotificationModule, MessageModule,x} from alauda-ui , var exprotModule = [,NotificationModule, MessageModule ,]')
  })
})
