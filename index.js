var glob = require('glob')
var fs = require('fs')
var chalk = require('chalk')
var args = process.argv.slice(2)

var filesAndOrFolders = args.length
    ? args.length === 1
        ? args + '{/**/*,}'
        : '{' + args.join(',') + '}{/**/*,}'
    : '**/*'

var oldActions = ['message', 'alert']
var newActions = ['message', 'notification']
var types = ['success', 'error', 'info', 'warning']

glob(filesAndOrFolders, {
    nodir: true,
    ignore: [
        '**/.git/**/*',
        '**/node_modules/**/*',
        '**/dist/**/*',
    ]
}, (err, files) => {
    if (err) throw err
    var fileChecks = files.map(file => {
        return new Promise(function (resolve, reject) {
            var content = fs.readFileSync(file, 'utf-8')
            var matchRes = {}, compileResult = false
            oldActions.forEach(function (action) {
                var reg = new RegExp('[0-9a-z]*\.(' + types.map(type => action + type).join('|') + ')', 'gi')
                if (reg.test(content)) {
                    matchRes[action] = true
                }
            })

            if (!matchRes.alert && !matchRes.message) {
                if (/[\r\n\s\(\,]ToastService/gi.test(content)) {
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
                migrateHelper(content)
                    .pipe(matchRes.alert && rule1)
                    .pipe(matchRes.message && rule2)
                    .pipe((matchRes.message || matchRes.alert) && rule3(matchRes.message, matchRes.alert))
                    .pipe((matchRes.message || matchRes.alert) && rule4(matchRes.message, matchRes.alert))
                    .end())
            resolve({
                name: file,
                status: 'success'
            })
        })
    })
    Promise.all(fileChecks).then((files) => {
        var successCount = 0, errorCount = 0
        files.forEach(file => {
            switch (file.status) {
                case 'error':
                    errorCount++
                    console.log();
                    console.log(chalk.red('migrate failed :') + file.name);
                    break;
                case 'success':
                    successCount++
                    // console.log();
                    // console.log(chalk.green('migrate success ') + file);
                    break;
            }
        })
        console.log()
        console.log(chalk.green('migrate success : ') + successCount)
        console.log(chalk.red('migrate failed : ') + errorCount)
    }).catch(error => {
        throw error
    })
})

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
var rule1 = function (content) {
    let transfer = content
    types.forEach(function (type) {
        var reg = new RegExp('([0-9a-z]*\.alert)' + type, 'gi')
        transfer = transfer.replace(reg, 'auiNotificationService.' + type)
    })
    return transfer
}

// migrate message action
var rule2 = function (content) {
    let transfer = content
    types.forEach(function (type) {
        var reg = new RegExp('([0-9a-z]*\.)message' + type, 'gi')
        transfer = transfer.replace(reg, 'auiMessageService.' + type)
    })
    return transfer
}

// migrate ToastService in constructor
var rule3 = function (importMessage, importNotification) {
    return function (content) {
        return content.replace(/(private|protected|public)[\r\n\s]*[0-9a-zA-Z]*[\r\n\s]*\:[\r\n\s]*ToastService/g,
            (importMessage ? '$1 auiMessageService: MessageService' : '') +
            (importMessage && importNotification ? ' ,' : '') +
            (importNotification ? '$1 auiNotificationService: NotificationService' : ''))
    }
}

// migrate import ToastService
var rule4 = function (importMessage, importNotification) {
    return function (content) {
        return content.replace(/(import[\r\n\s]*{[\r\n\s\w]*)ToastService([\r\n\s\w]*}[\r\n\s\w]*\'alauda\-ui\')/g,
            '$1' +
            (importMessage ? 'MessageService' : '') +
            (importMessage && importNotification ? ', ' : '') +
            (importNotification ? 'NotificationService' : '') + '$2'
        )
    }
}
