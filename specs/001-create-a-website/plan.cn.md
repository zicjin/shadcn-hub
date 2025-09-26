# 实现计划：ShadCN 组件聚合器

**分支**: `001-create-a-website` | **日期**: 2025-09-21 | **规范**: `/specs/001-create-a-website/spec.md`
**输入**: 来自 `/specs/001-create-a-website/spec.md` 的功能规范

## 执行流程 (/plan 命令范围)
```
1. 从输入路径加载功能规范
   → 如果未找到：错误 "在 {path} 处没有功能规范"
2. 填充技术背景（扫描 NEEDS CLARIFICATION）
   → 从上下文中检测项目类型 (web=frontend+backend, mobile=app+api)
   → 根据项目类型设置结构决策
3. 根据章程文档的内容填写章程检查部分。
4. 评估下方的章程检查部分
   → 如果存在违规：在复杂性跟踪中记录
   → 如果无法提供理由：错误 "请先简化方法"
   → 更新进度跟踪：初始章程检查
5. 执行阶段 0 → research.md
   → 如果仍有 NEEDS CLARIFICATION：错误 "请解决未知问题"
6. 执行阶段 1 → contracts, data-model.md, quickstart.md, 特定于代理的模板文件 (例如, Claude Code 使用 `CLAUDE.md`, GitHub Copilot 使用 `.github/copilot-instructions.md`, Gemini CLI 使用 `GEMINI.md`, Qwen Code 使用 `QWEN.md` 或 opencode 使用 `AGENTS.md`)。
7. 重新评估章程检查部分
   → 如果出现新的违规：重构设计，返回阶段 1
   → 更新进度跟踪：设计后章程检查
8. 规划阶段 2 → 描述任务生成方法（不要创建 tasks.md）
9. 停止 - 准备好执行 /tasks 命令
```

**重要提示**: /plan 命令在第 7 步停止。阶段 2-4 由其他命令执行：
- 阶段 2: /tasks 命令创建 tasks.md
- 阶段 3-4: 实现执行（手动或通过工具）

## 摘要
一个聚合和展示来自 7 个基于 shadcn 的组件库的 UI 组件示例的网站。用户可以通过双轴导航（按源网站或组件类型）浏览组件，查看真实的可交互组件渲染，并访问源代码。使用 TypeScript、TanStack、Tailwind CSS 构建，并使用 Crawlee 进行网络爬取，使用 PostgreSQL/Drizzle 进行数据存储。

## 技术背景
**语言/版本**: TypeScript 5.x (最新稳定版)
**主要依赖**: TanStack (Query, Router, Table), Tailwind CSS, shadcn/ui, Zustand, Zod, Fuse.js, Crawlee, Drizzle ORM
**存储**: PostgreSQL (原生, 用户名: postgres, 无密码)
**测试**: Vitest 用于单元测试, Playwright 用于 E2E 测试
**目标平台**: Web 浏览器 (Chrome, Firefox, Safari, Edge)
**项目类型**: web (前端+后端架构)
**性能目标**: <3s 初始加载, <500ms 搜索响应, 支持 1000 并发用户
**约束条件**: <200ms 组件渲染时间, 移动/平板/桌面响应式设计
**规模/范围**: 7 个源网站, 总计约 500 个组件, 1 万日活跃用户

## 章程检查
*关卡：必须在阶段 0 研究之前通过。在阶段 1 设计之后重新检查。*

**代码质量标准**: ✅ TypeScript 强制执行类型安全。使用 ESLint + Prettier 进行代码检查/格式化。模块化架构，关注点分离清晰。

**测试要求**: ✅ 使用 Vitest 进行单元测试（目标覆盖率 80%），使用 Playwright 进行 E2E 测试，对关键路径采用 TDD 方法。

**用户体验一致性**: ✅ shadcn/ui 设计系统，使用 Tailwind 保证样式一致，符合 WCAG 2.1 AA 标准，包含响应式设计。

**性能要求**: ✅ <3s 加载时间目标，计划进行 PostgreSQL 索引，使用 Vite 进行代码分割，包含性能监控。

## 项目结构

### 文档 (此功能)
```
specs/[###-feature]/
├── plan.md              # 此文件 (/plan 命令输出)
├── research.md          # 阶段 0 输出 (/plan 命令)
├── data-model.md        # 阶段 1 输出 (/plan 命令)
├── quickstart.md        # 阶段 1 输出 (/plan 命令)
├── contracts/           # 阶段 1 输出 (/plan 命令)
└── tasks.md             # 阶段 2 输出 (/tasks 命令 - 不由 /plan 创建)
```

### 源代码 (仓库根目录)
```
# 选项 1: 单一项目 (默认)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# 选项 2: Web 应用 (当检测到 "frontend" + "backend" 时)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# 选项 3: 移动 + API (当检测到 "iOS/Android" 时)
api/
└── [同上 backend]

ios/ or android/
└── [平台特定结构]
```

**结构决策**: 选项 2 (Web 应用) - 前端 React 应用与后端 API 服务

## 阶段 0: 大纲与研究
1. 从上文的 **技术背景** 中提取未知项：
   - 每个 NEEDS CLARIFICATION → 研究任务
   - 每个依赖项 → 最佳实践任务
   - 每个集成点 → 模式任务

2. **生成并派遣研究代理**：
   ```
   对于技术背景中的每个未知项:
     任务: "为 {feature context} 研究 {unknown}"
   对于每个技术选择:
     任务: "在 {domain} 中寻找 {tech} 的最佳实践"
   ```

3. 在 `research.md` 中 **整合研究发现**，使用以下格式：
   - 决策: [选择了什么]
   - 理由: [为什么选择]
   - 考虑过的替代方案: [还评估了什么]

**输出**: research.md，其中所有 NEEDS CLARIFICATION 都已解决

## 阶段 1: 设计与合约
*先决条件: research.md 已完成*

1. 从功能规范中 **提取实体** → `data-model.md`：
   - 实体名称、字段、关系
   - 来自需求中的验证规则
   - 状态转换（如果适用）

2. 从功能需求中 **生成 API 合约**：
   - 每个用户操作 → 一个端点
   - 使用标准的 REST/GraphQL 模式
   - 将 OpenAPI/GraphQL 模式输出到 `/contracts/`

3. 从合约中 **生成合约测试**：
   - 每个端点一个测试文件
   - 断言请求/响应模式
   - 测试必须失败（尚未实现）

4. 从用户故事中 **提取测试场景**：
   - 每个故事 → 一个集成测试场景
   - 快速入门测试 = 故事验证步骤

5. **增量更新代理文件** (O(1) 操作)：
   - 为你的 AI 助手运行 `.specify/scripts/bash/update-agent-context.sh claude`
   - 如果存在：仅从当前计划中添加新技术
   - 保留标记之间的手动添加内容
   - 更新最近的更改（保留最近 3 条）
   - 为提高 token 效率，保持在 150 行以下
   - 输出到仓库根目录

**输出**: data-model.md, /contracts/*, 失败的测试, quickstart.md, 特定于代理的文件

## 阶段 2: 任务规划方法
*本节描述 /tasks 命令将执行的操作 - 不要在 /plan 期间执行*

**任务生成策略**：
- 加载 `.specify/templates/tasks-template.md` 作为基础
- 从阶段 1 的设计文档（合约、数据模型、快速入门）生成任务
- 每个 API 端点（11 个端点）→ 合约测试任务 [P]
- 每个实体（8 个实体）→ Drizzle 模型创建任务 [P]
- 每个用户故事（5 个场景）→ 集成测试任务
- 使测试通过的实现任务

**排序策略**：
- TDD 顺序：测试先于实现
- 依赖顺序：数据库 → 模型 → 服务 → API → 前端
- 标记 [P] 表示可并行执行（独立文件）

**任务类别**：
1. **设置任务** (3-4 个任务)
   - 初始化 monorepo 结构
   - 设置 PostgreSQL 和 Drizzle
   - 配置 TypeScript、ESLint、Prettier

2. **数据库任务** (8-10 个任务)
   - 为每个实体创建 Drizzle 模式
   - 设置迁移
   - 创建索引和约束

3. **API 合约测试** (11 个任务, 全部 [P])
   - 每个端点一个测试文件
   - 测试请求/响应模式

4. **后端实现** (15-20 个任务)
   - Express 服务器设置
   - API 路由实现
   - 用于业务逻辑的服务层
   - 使用 Crawlee 实现爬虫

5. **前端任务** (10-15 个任务)
   - 使用 Vite 设置 React 应用
   - 组件层次结构
   - TanStack Router 页面
   - Zustand 存储
   - 使用 shadcn 的 UI 组件

6. **集成测试** (5 个任务)
   - 针对每个用户场景的 E2E 测试
   - 性能验证测试

**预计输出**: 在 tasks.md 中包含 50-60 个编号且有序的任务

**重要提示**: 此阶段由 /tasks 命令执行，而不是由 /plan 执行

## 阶段 3+: 未来实现
*这些阶段超出了 /plan 命令的范围*

**阶段 3**: 任务执行 (/tasks 命令创建 tasks.md)  
**阶段 4**: 实现 (遵循章程原则执行 tasks.md)  
**阶段 5**: 验证 (运行测试, 执行 quickstart.md, 性能验证)

## 复杂性跟踪
*仅当章程检查存在必须说明理由的违规时填写*

| 违规 | 为何需要 | 更简单的替代方案被拒绝的原因 |
|-----------|------------|-------------------------------------|
| [例如, 第 4 个项目] | [当前需求] | [为什么 3 个项目不足够] |
| [例如, 仓库模式] | [具体问题] | [为什么直接访问数据库不足够] |


## 进度跟踪
*此清单在执行流程中更新*

**阶段状态**：
- [x] 阶段 0: 研究完成 (/plan 命令)
- [x] 阶段 1: 设计完成 (/plan 命令)
- [x] 阶段 2: 任务规划完成 (/plan 命令 - 仅描述方法)
- [ ] 阶段 3: 任务已生成 (/tasks 命令)
- [ ] 阶段 4: 实现完成
- [ ] 阶段 5: 验证通过

**关卡状态**：
- [x] 初始章程检查: 通过
- [x] 设计后章程检查: 通过
- [x] 所有 NEEDS CLARIFICATION 已解决
- [x] 复杂性偏差已记录 (无要求)

---
*基于章程 v1.0.0 - 参见 `/memory/constitution.md`*
