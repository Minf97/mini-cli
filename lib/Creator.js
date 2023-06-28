
const inquirer = require('inquirer')
const { defaults } = require('./util/preset')

class Creator {
    constructor(name, context) {
        // 项目名称
        this.name = name;
        // 项目路径，含名称
        this.context = process.env.VUE_CLI_CONTEXT = context;
        // package.json 数据
        this.pkg = {};
        // 包管理工具
        this.pm = null;

        // 预设提示选项
        this.presetPrompt = this.resolvePresetPrompts()

        // 测试
        inquirer.prompt(this.resolveFinalPrompts()).then(res => {
            console.log('选择的选项：');
            console.log(res);
        })
    }

    // 获得预设的选项
    resolvePresetPrompts() {
        const presetChoices = Object.entries(defaults.presets).map(([name, preset]) => {
            return {
                name: `${name}(${Object.keys(preset.plugins).join(',')})`, // 将预设的插件放到提示
                value: name
            }
        })

        return {
            name: 'preset',   // preset 记录用户选择的选项值
            type: 'list',   // list 表单选
            message: `Please pick a preset`,
            choices: [
                ...presetChoices,   // vue2 默认配置，vue3 默认配置
                {
                    name: 'Manually select features',   // 手动选择配置，自定义特性配置
                    value: '__manual__'
                }
            ]
        }
    }

    resolveFinalPrompts() {
        const prompts = [
            this.presetPrompt
        ]
        return prompts
    }

    async create() { }
}

module.exports = Creator