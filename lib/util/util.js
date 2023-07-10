const fs = require('fs-extra')
const path = require('path')

function writeFileTree(dir, files) {
    Object.keys(files).forEach((name) => {
        const filePath = path.join(dir, name)
        fs.ensureDirSync(path.dirname(filePath))
        fs.writeFileSync(filePath, files[name])
    })
}


function stringifyJS(value) {
    const { stringify } = require('javascript-stringify')
    // 2个空格格式化显示
    return stringify(value, null, 2)
}
module.exports = {
    writeFileTree,
    stringifyJS
}