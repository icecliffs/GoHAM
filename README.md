![GoHAM](https://socialify.git.ci/icecliffs/GoHAM/image?language=1&name=1&owner=1&pattern=Floating%20Cogs&theme=Light)


# GoHAM

> 一款适用于无线电爱好者们的无线电日志通联纪录系统

中文 | [English](./README-en.md) | [日本語](./README-jp.md)

![version](https://img.shields.io/github/v/release/IceCliffs/GoHAM?include_prereleases&label=version)

> [!IMPORTANT]
> 该项目还在开发中，如遇到BUG或急需一些功能性的建议可以提个 [ISSUE](https://github.com/icecliffs/GoHAM/issues) 或发送电子邮件

体验地址：[https://goham-1Ba34Da3c8-vmlinux.iloli.moe](https://goham-1Ba34Da3c8-vmlinux.iloli.moe)

## 🔧功能

- 最基本的电台日志记录
  - 频率管理、通联日志管理、日志导出等等
- 通联大屏，方便可靠直观发现通联数据
- 支持 ADIF 日志导入及导出，方便快速对接系统
- 支持多平台部署，**后续可能会考虑采用SaaS多用户模式，敬请期待**
- ~~支持客户端/服务端日志通联，用户可自行下载客户端添加日志至服务端~~
  - 地址：https://github.com/icecliffs/WSocketReflectorGoHAM

## 🔨部署

#### Docker部署（推荐）

```
docker run icecliffs/goham:latest -p 11451:11451
```

手动编译：仓库内有 `docker-compose.yaml` 可以根据需求自定义

#### Windows部署

在发行界面（Release）找到需要下载的版本即可，由于数据库使用的是MySQL所以需要手动导入SQL文件（`goham.sql`）

在 `config.yaml` 配置好对应的账号密码端口号后直接运行

```
goham.exe
```

即可

#### Linux部署

在发行界面（Release）找到需要下载的版本即可，由于数据库使用的是MySQL所以需要手动导入SQL文件（`goham.sql`）

在 `config.yaml` 配置好对应的账号密码端口号后直接运行

```
./goham
```

即可

## 🐴Demo

![](./assets/2.jpg)

![](./assets/3.jpg)

![](./assets/4.jpg)

![](./assets/5.jpg)

![](./assets/6.jpg)

![](./assets/7.jpg)

## 🌏关于i18n

目前适配了简体中文、繁体中文、日语（机翻）、英语（机翻），如遇到翻译错误可提 [ISSUE](https://github.com/icecliffs/GoHAM/issues) 或电子邮件，急需翻译大佬，如果有要的可以联系我