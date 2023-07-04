const { chalk } = require("@vue/cli-shared-utils")

module.exports = pmInstance => {
    pmInstance.injectFeature({
        name: 'Router',
        value: 'router',
        description: '给项目加入router',
        link: 'https://router.vue.js.org/'
    })

    pmInstance.injectPrompt({
        name: 'historyMode',
        when: answers => answers.features && answers.features.includes('router'),
        type: 'confirm',
        message: `为router使用历史配置? ${chalk.yellow(`(需要正确的服务器设置，以便在生产中进行索引回退)`)}`,
        description: `使用 HTML5 的 History API 时, URL 不携带 '#' 字符了.`,
        link: 'https://router.vuejs.org/guide/essentials/history-mode.html'
    })

    pmInstance.onPromptComplete((answers, options) => {
        if(answers.features && answers.features.includes('router')) {
            options.plugins['@vue/cli-plugin-router'] = {
                historyMode: answers.historyMode
            }
        }
    })
}