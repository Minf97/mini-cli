
const ConfigTransform = require('../lib/ConfigTransform.js')

const vueConfig = new ConfigTransform({
    js: ['vue.config.js']
})

console.log(vueConfig.transform({
    text: '这是一个测试'
}));