const path = require('path')
const Creator = require('./Creator')

module.exports = async (projectName) => {
  // 命令运行时的目录
  const cwd = process.cwd()
  // 目录拼接项目名
  const targetDir = path.resolve(cwd, projectName || '.')
  console.log(`创建项目的目录路径: ${targetDir}`);

  const creator = new Creator(projectName, targetDir)
  await creator.create()
}