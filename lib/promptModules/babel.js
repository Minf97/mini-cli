

// pmInstance 是 PromptModuleAPI 的实例对象
module.exports = pmInstance => {
    pmInstance.injectFeature({
        name: 'Babel',
        value: 'babel',
        short: 'Babel',
        description: '将现在的版本转换为老版本',
        link: 'https://babeljs.io/',
        checked: true
    })
}