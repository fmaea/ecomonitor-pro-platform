# 产品评估指标框架 (Metrics Framework) - 智慧环监在线学习平台

## 1. 指标框架概述

本框架旨在建立一套科学、系统、可执行的指标体系，用于衡量“智慧环监在线学习平台”的成功度、监控产品健康状况，并为产品迭代和运营决策提供数据支持。我们将采用业界成熟的 **HEART** 模型作为核心框架，因为它能全面地评估用户体验。

## 2. 北极星指标 (North Star Metric)

* **指标名称:** **学生周有效学习行为数 (Weekly Engaged Learning Actions - WELA)**
* **定义:** 一名学生在一周内，完成**至少3次**“有效学习行为”的总次数。
    * **有效学习行为** 定义为：
        1.  完成一次随堂测验或单元测试。
        2.  提交一次作业或项目。
        3.  与一个交互式内容（如3D模型、交互图表）的互动时长超过1分钟。
        4.  (v3.0) 在讨论区发起一个提问或贡献一个有价值的回答。
* **为何选择它:** WELA 指标超越了简单的“活跃度”，它直接关联到产品的核心价值——**促进学生主动且有深度的学习**。一个高的WELA值意味着学生不仅仅是登录了平台，更是在平台内进行了能带来知识增量的、有价值的互动。它是**用户留存**和**教学效果**的最佳先导指标。

## 3. HEART 指标体系详述

| 维度 | 目标 (Goal) | 信号 (Signal) | 指标 (Metrics) |
| :--- | :--- | :--- | :--- |
| **H**appiness (愉悦度) | 用户对产品感到满意，体验良好。 | 用户主动表达正面情绪；愿意推荐产品。 | - **用户满意度评分 (CSAT):** 在完成一个章节或项目后，弹出“本次学习体验您满意吗？”（1-5分）。<br>- **净推荐值 (NPS):** 定期向师生推送“您有多大意愿将平台推荐给同事/同学？”（0-10分）。 |
| **E**ngagement (参与度) | 用户在平台上有深度、高频的互动。 | 用户不仅仅是浏览，而是主动使用各项功能。 | - **北极星指标 (WELA)**<br>- **人均学习时长 (分钟/日)**<br>- **交互功能使用率:** 各类交互元素（3D、热区图）的点击率。<br>- **作业提交率 (%)** |
| **A**doption (接受度) | 新用户开始使用产品，老用户开始使用新功能。| 新用户注册并完成引导；用户使用新上线的特性。| - **新用户注册数 (师/生)**<br>- **新用户激活率 (%):** 注册后7天内完成首次课程学习的学生比例。<br>- **新功能采纳率 (%):** v2.0上线后，使用“活页式编辑器”的教师比例。 |
| **R**etention (留存率) | 用户持续反复地使用产品。 | 用户在一段时间后仍然会回到平台。 | - **次周/次月留存率 (%):** 新用户在注册后第2周/第2月仍然活跃的比例。<br>- **WAU/MAU 比率:** 衡量用户粘性。<br>- **教师内容贡献留存:** 首次创建内容的教师，在下个月是否仍有创建行为。 |
| **T**ask Success (任务成功率) | 用户能够高效、顺利地完成关键任务。 | 用户在核心流程中没有遇到障碍。 | - **核心任务完成率 (%):** 例如，学生成功提交作业的比例。<br>- **任务耗时:** 例如，教师从登录到成功发布一个作业的平均时长。<br>- **错误率:** 例如，在上传资源时失败的次数比例。|

## 4. 功能级评估指标

* **交互式学习单元:**
    * **指标:** 平均互动时长、完成率、退出率。
    * **目的:** 评估某个交互设计（如一个3D模型）是否足够吸引人、是否存在体验障碍。
* **活页式编辑器 (教师端):**
    * **指标:** 编辑器使用频率、平均单次使用时长、活页创建数量。
    * **目的:** 评估教师端核心工具的易用性和受欢迎程度。

## 5. 指标监测计划

* **数据采集:**
    * **前端埋点:** 使用如 Google Analytics, Mixpanel 或自研埋点系统，采集用户在Web端的详细行为。
    * **后端日志:** 记录服务器端的关键业务事件。
    * **数据库:** 直接从业务数据库中提取核心数据（如用户数、课程数）。
* **数据报告:**
    * **实时看板 (Dashboard):** 搭建一个内部数据看板（如使用 Metabase, Superset），供产品和运营团队实时监控核心指标（DAU, WAU, WELA等）。
    * **周报/月报:** 定期生成深入的数据分析报告，分析用户行为趋势、评估版本迭代效果，并提出可行的产品优化建议。
* **A/B 测试:** 对于重要的功能改动或UI优化，采用A/B测试方法，用数据驱动决策，确保每次改动都带来正面效果。