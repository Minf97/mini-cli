
module.exports = class PromptModuleAPI {
    // 入参 creator 为 Creator 实例对象
    constructor(creator) {
        this.creator = creator
    }

    /**
     * 给 featurePrompt.choices 注入值
     * @param {*} feature 特征
     */
    injectFeature(feature) {
        this.creator.featurePrompt.choices.push(feature)
    }

    /**
     * 给 injectedPrompts 注入选项
     * @param {*} prompt 选项
     */
    injectPrompt(prompt) {
        this.creator.injectedPrompts.push(prompt)
    }

    /**
     * 给 promptCompleteCbs 变量填充数据
     * @param {*} name 
     * @param {*} option 
     */
    injectOptionForPrompt(name, option) {
        this.creator.injectedPrompts.find(f => {
            return f.name === name
        }).choices.push(option)
    }

    /**
     * 注入回调
     * @param {*} cb 
     */
    onPromptComplete(cb) {
        this.creator.promptCompleteCbs.push(cb)
    }


}
