<!--
Sync Impact Report:
- Version change: template → 1.0.0
- Added sections: 4 core principles, Development Standards, Quality Gates
- Modified principles: All replaced with new focused principles
- Templates requiring updates: ⚠ pending validation
- Follow-up TODOs: None
-->

# Spec Kit App 章程

## 核心原则

### I. 代码质量标准
所有代码 MUST 遵守一致的格式化、linting 和架构模式。
代码审查是合并前的强制要求。静态分析工具 MUST 无警告通过。
所有公共 API 和复杂业务逻辑都需要文档。
应用整洁代码原则：可读、可维护和自文档化的代码是
不可协商的。

### II. 测试要求
新代码强制要求全面的测试覆盖率，最低为 80%。
单元测试 MUST 在功能实现之前或期间编写。集成
测试是所有 API 端点和关键用户工作流的必需项。所有测试
MUST 在部署前的 CI/CD 管道中通过。对于复杂功能，鼓励
测试驱动开发。

### III. 用户体验一致性
所有用户界面 MUST 遵循既定的设计系统指南和
无障碍标准（最低 WCAG 2.1 AA）。要求所有平台具有一致的交互模式、
视觉层次和响应式设计。用户
反馈和错误信息 MUST 清晰、可操作且用户友好。
跨浏览器兼容性测试是强制性的。

### IV. 性能要求
应用程序 MUST 在标准连接下 3 秒内加载。数据库查询
MUST 通过适当的索引和查询分析进行优化。Bundle 大小 MUST 被
监控并通过代码分割和懒加载保持最小。性能
回归需要立即关注，并且在未解决前不能合并。
生产性能指标需要监控和警报。

## 开发标准

应用程序 MUST 使用 TypeScript 以确保类型安全和可维护性。所有
依赖项 MUST 保持最新，并及时应用安全补丁。
特定于环境的配置 MUST 被外部化，绝不硬编码。
秘密和敏感数据 MUST 被妥善保护，绝不提交到
版本控制中。

## 质量门禁

所有代码更改 MUST 通过自动化测试、linting 和安全扫描。
合并前需要同行代码审查，并至少获得一次批准。
破坏性更改 MUST 被记录并包含迁移指南。重大更改
需要进行性能影响评估。生产部署
需要批准并遵循既定的发布程序。

## 治理

本章程取代所有其他开发实践和指南。
修订需要团队共识和变更理由的文档化。
所有 pull requests MUST 验证是否符合这些原则。违规行为
需要立即修复或提供明确的理由并进行技术债务
跟踪。章程合规性每季度审查一次，并根据需要更新。

**Version**: 1.0.0 | **Ratified**: 2025-09-21 | **Last Amended**: 2025-09-21
