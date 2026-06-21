# Contributing

感谢你帮助改进 Agent Sandbox Cookbook。

本项目重视可运行例子、经过验证的文档和清晰对比。如果贡献内容依赖某个 vendor SDK 或 runtime feature，请包含 source links，以及你检查的 version 或 date。

## Good Contributions

- 可运行的 agent tool example。
- Vendor SDK compatibility note。
- Sandbox failure-mode demo。
- 关于 runtime 近期变化的 field note。
- 对过时 API example 的修正。
- 跨 provider 的 side-by-side comparison。

## Content Standards

- 优先写 minimal runnable examples，不要一开始写大 demo。
- Vendor-specific claims 必须有来源。
- Speculative 或 unverified behavior 必须明确标注。
- 尽量包含 exact commands。
- 包含 safe failure examples，不要只写 happy path。
- 不要泄露真实 API keys、account IDs 或 private endpoints。

## Recipe Structure

每个 recipe 应包含：

- Purpose
- Prerequisites
- How to run
- Tool schema
- Sandbox contract mapping
- Expected output
- Failure cases
- Notes and limitations

## Field Note Structure

每篇 field note 应包含：

- Date
- Vendor/runtime
- What changed
- Why it matters
- Sandbox impact
- Links
- Follow-up checklist
