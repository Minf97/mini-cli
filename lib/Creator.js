const { chalk, log, hasGit, hasProjectGit, execa } = require('@vue/cli-shared-utils')
const inquirer = require('inquirer')
const { defaults, vuePresets } = require('./util/preset')
const PromptModuleAPI = require('./PromptModuleAPI.js')
const { getPromptModules } = require('./util/prompt')
const PackageManager = require('./PackageManager')
const { writeFileTree } = require('./util/util.js')
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

        // 预设提示选项（单选框）
        this.presetPrompt = this.resolvePresetPrompts()
        // 自定义特性的提示选项（复选框）
        this.featurePrompt = this.resolveFeaturePrompts()
        // 保存相关提示选项
        this.outroPrompts = this.resolveOutroPrompts()
        // 其他提示选项
        this.injectedPrompts = []
        // 回调
        this.promptCompleteCbs = []


        const promptAPI = new PromptModuleAPI(this)
        const promptModules = getPromptModules()
        promptModules.forEach(m => m(promptAPI))

        // 测试
        // inquirer.prompt(this.resolveFinalPrompts()).then(res => {
        //     console.log('选择的选项：');
        //     console.log(res);
        // })
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

    // 获得自定义复选框
    resolveFeaturePrompts() {
        return {
            name: 'features',  // features 记录用户选择的选项值
            when: answers => answers.preset === '__manual__',
            type: 'checkbox',
            message: '选择你需要的特性加入到你的项目中：',
            choices: [],
            pageSize: 10
        }
    }

    // 保存相关提示选项
    resolveOutroPrompts() {
        const outroPrompts = [
            // useConfigFiles是单选框提示选项
            {
                name: 'useConfigFiles',
                when: answers => answers.preset === '__manual__',
                type: 'list',
                message: '你打算将 Babel，ESLint 这些配置项保存在哪里？',
                choices: [
                    {
                        name: '在专用的config文件',
                        value: 'files'
                    },
                    {
                        name: '在 package.json 里',
                        value: 'pkg'
                    }
                ]
            },
            // 确认提示选项
            {
                name: 'save',
                when: answers => answers.preset === '__manual__',
                type: 'confirm',
                message: '是否保存本次配置作为预设?',
                default: false
            },
            // 输入提示选项
            {
                name: 'saveName',
                when: asnwers => asnwers.save,
                type: 'input',
                message: '预设名称为：'
            }
        ]

        return outroPrompts
    }

    resolveFinalPrompts() {
        const prompts = [
            this.presetPrompt,
            this.featurePrompt,
            ...this.outroPrompts,
            ...this.injectedPrompts
        ]
        return prompts
    }

    async promptAndResolvePreset() {
        try {
            let preset;
            const { name } = this
            const answers = await inquirer.prompt(this.resolveFinalPrompts());

            // answers 得到的值为 { preset: 'Default (Vue 2)' }

            if (answers.preset && answers.preset === 'Default（Vue2）') {
                if (answers.preset in vuePresets) {
                    preset = vuePresets[answers.preset]
                }
            } else {
                // 暂不支持 Vue3、自定义特性配置情况
                throw new Error('哎呀，出错了，暂不支持 Vue3、自定义特性配置情况')
            }
            preset.plugins['@vue/cli-service'] = Object.assign({
                projectName: name
            }, preset)

            return preset
        } catch (err) {
            console.log(chalk.red(err));
            process.exit(1);
        }
    }

    async create(cliOptions = {}) {
        const preset = await this.promptAndResolvePreset();
        await this.initPackageManagerEnv(preset)
        // 测试
        console.log('preset 值：');
        console.log(preset);
    }

    //  字段/功能释义：
    // ● preset: 项目设置信息
    // ● pm: 实例化 PackageManager，用它来安装依赖。
    // ● pkg: 用于生成 package.json 文件的对象，将 preset 的插件及其版本号放到 pkg.devDependencies
    // ● writeFileTree 将 pkg 写入到项目目录下 package.json 文件。
    // ● 初始化 Git
    // ● pm.install 安装项目需要的依赖。该方法会调用子进程安装依赖，执行的命令为：npm install --loglevel error --legacy-peer-deps。（npm 版本小于7执行 npm install --loglevel error）。
    async initPackageManagerEnv(preset) {
        const { name, context } = this;
        this.pm = new PackageManager({ context })

        // 打印提示
        log(`✨ 创建项目：${chalk.yellow(context)}`)

        // 用于生成 package.json 文件
        const pkg = {
            name,
            version: '0.1.0',
            private: true,
            devDependencies: {}
        }

        // 给 npm 包指定版本，简单做，使用最新的版本
        const deps = Object.keys(preset.plugins);
        deps.forEach(dep => {
            let { version } = preset.plugins[dep]
            if (!version) {
                version = 'latest'
            }
            pkg.devDependencies[dep] = version
        })
        this.pkg = pkg;

        // 写 package.json 文件
        await writeFileTree(context, {
            'package.json': JSON.stringify(pkg, null, 2)
        })

        // 初始化 git 仓库，以至于 vue-cli-service 可以设置 git hooks
        const shouldInitGit = this.shouldInitGit()
        if (shouldInitGit) {
            log(`🗃 初始化 Git 仓库...`)
            await this.run('git init')
        }

        // 安装插件 plugins
        log(`⚙ 正在安装 CLI plugins， 请稍候...`)

        await this.pm.install()
    }

    run(command, args) {
        if (!args) { [command, ...args] = command.split(/\s+/) }
        return execa(command, args, { cwd: this.context })
    }

    // 判断是否可以初始化 git 仓库：系统安装了 git 且目录下未初始化过
    shouldInitGit() {
        if (!hasGit()) {
            // 系统未安装git
            return false
        }
        // 项目未初始化 Git
        return !hasProjectGit(this.context)
    }
}

module.exports = Creator


