 # Ansible 部署设计（蓝绿 / 逐台滚动）

本文档说明使用 Ansible 替换现有 SSH 部署的设计方案，包含蓝绿与逐台滚动两种策略、playbook 结构、nginx 流量切换方法、回滚流程与在 GitHub Actions 中集成的手动批准（Environment）方案。

## 目标
- 将 CI 中的 SSH 部署替换为 Ansible Playbook，提升可观测性、并发控制与回滚能力。
- 支持两种部署策略：蓝绿（快速切换、易回滚）与逐台滚动（最小中断，多主机场景）。
- 在生产部署前增加人工批准步骤（使用 GitHub Environments）。

## 假设与前提
- 目标环境为 Docker 主机（单机或多主机），使用 `docker-compose.prod.yml` 启动服务。若为 Kubernetes，建议使用 k8s 原生机制（此设计另行扩展）。
- 目标主机可通过 Ansible SSH key 登录，CI 将通过 secret 注入私钥并运行 `ansible-playbook`。
- Nginx 作为统一反向代理，支持通过修改配置或切换 upstream 来指向 blue/green 后端。

## 总体方案概览
- 将 `deploy/ansible/` 放入仓库，内容如下：
  - `inventory.yml`（或 `inventory/hosts`）
  - `playbooks/bluegreen-deploy.yml`（蓝绿部署）
  - `playbooks/rolling-deploy.yml`（逐台滚动）
  - `roles/compose-deploy/tasks/*`（通用 docker-compose 部署 tasks）
  - `roles/nginx-switch/tasks/*`（切换 upstream / reload）
  - `scripts/check_health.sh`（远程健康检查脚本）
  - `vars/production.yml`（主机分组与参数）

## Inventory 示例
```yaml
[web]
prod-1 ansible_host=1.2.3.4
prod-2 ansible_host=1.2.3.5

[web:vars]
ansible_user=deployer
ansible_ssh_private_key_file=/tmp/deploy_key
deploy_path=/srv/soletrade
compose_file=docker-compose.prod.yml
registry: ghcr.io/myorg
image_namespace: myorg
```

CI 将不会在仓库中提交私钥或把私钥写入文件，工作流会在 runner 上将 Secret 写为临时文件并传入 `ansible-playbook -i inventory.yml`。

## 蓝绿部署流程（playbook 关键步骤）
1. CI 构建并推送镜像（已在 workflow 中实现）。
2. 选择空闲环境（color = blue 或 green），playbook 将目标主机按 color 分配目录或使用不同 compose 文件名：`docker-compose.blue.yml` / `docker-compose.green.yml`，并在 `deploy_path/<color>` 拉取或生成对应 compose（或通过 `docker-compose -f <file> pull` 用 tag 启动）。
3. 在空闲环境启动新版本：
   - 在每台目标主机上：`docker-compose -f <file> pull && docker-compose -f <file> up -d`。
   - 运行 smoke tests/healthchecks（`check_health.sh`，例如访问 `/health`、数据库连接、重要 API 调用）。
4. 若健康检查通过，切换流量：
   - 方法 A（推荐）：修改反向代理 nginx upstream（替换 upstream 指向 blue/green 后端 IP:port），并 `nginx -s reload`。切换操作由 Ansible 的 `roles/nginx-switch` 执行（该 role 可 SSH 到 nginx 主机或在同一主机执行）。
   - 方法 B（替代）：在同一主机上通过 `docker-compose` 替换容器名和端口，或使用 `nginx` 的 `proxy_pass` 指向不同容器名称（需在 docker 网络中解析）。
5. 切换后继续观察若干分钟，若出现问题可快速回滚到先前 color（重新切换 nginx upstream）。

## 逐台滚动部署流程（playbook 关键步骤）
1. 将主机分成多个批次（Ansible `serial: 1/2/25%` 等）。
2. 对当前批次每台主机执行：
   - 拉取镜像、停止相关容器、启动新容器（或 `docker-compose pull && docker-compose up -d`）。
   - 执行健康检查；若失败则停止并回滚（或标记失败并报警）。
3. 等待全部批次完成并验证全量健康后结束部署。

## Healthcheck 设计
- `check_health.sh`（放在 `deploy/ansible/files/`）示例行为：
  - 访问 `http://localhost:3001/health` 或 `http://127.0.0.1:3001/actuator/health` 等
  - 调用数据库简单查询（通过 `psql` 或在容器内使用 `npx prisma` 简单查询）
  - 对关键端点做 smoke requests：登录、查询一个商品、创建短期测试询价（非持久）
  - 返回非 0 则视为失败

Ansible 在每个步骤后会以重试策略运行 healthcheck（例如 3 次，间隔 10s），若持续失败则执行回滚动作。

## 回滚策略
- 蓝绿：切换 nginx upstream 回到旧 color 即可完成回滚（非常快速），并保留故障环境供调试。  
- 滚动：对已经更新的主机执行回滚 playbook（拉取旧镜像 tag 并重启），或使用 DB 备份恢复复杂 schema 问题。
- 强制回滚流程应在 `roles/rollback` 中定义，包含：
  - 恢复上次可用镜像 tag（workflow 在推送镜像时保存 `${{ github.sha }}` 标签和 `latest` 的映射）
  - 重启服务并执行健康检查

## Ansible Playbook 结构（示例）
```
deploy/ansible/
├─ inventory.yml
├─ playbooks/
│  ├─ bluegreen-deploy.yml
│  ├─ rolling-deploy.yml
│  └─ rollback.yml
├─ roles/
│  ├─ compose-deploy/
│  │  └─ tasks/main.yml
│  ├─ nginx-switch/
│  │  └─ tasks/main.yml
│  └─ healthcheck/
│     └─ tasks/main.yml
└─ files/
   └─ check_health.sh
```

示例 `bluegreen-deploy.yml` 简要：
```yaml
- name: BlueGreen deploy
  hosts: web
  serial: 100%   # 全部同时部署到指定 color 的主机
  vars_files:
    - ../vars/production.yml
  tasks:
    - name: Ensure deploy path exists
      file: path={{ deploy_path }}/{{ deploy_color }} state=directory owner={{ ansible_user }}

    - name: Pull and start compose for color
      include_role:
        name: compose-deploy
      vars:
        compose_file: "{{ compose_file }}.{{ deploy_color }}"

    - name: Run health checks
      include_role:
        name: healthcheck

    - name: Switch nginx to new color (only when all ok)
      include_role:
        name: nginx-switch
      when: healthcheck_result is defined and healthcheck_result == 'ok'
```

## GitHub Actions 集成与人工批准
- 使用 GitHub Environments 实现人工批准：在工作流中将部署 job 指向一个 `environment: production`，并在该 Environment 的设置中配置 Required reviewers。示例：
```yaml
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: ...
      - name: ansible deploy
        run: ansible-playbook -i deploy/ansible/inventory.yml deploy/ansible/playbooks/bluegreen-deploy.yml
```
- 当 workflow 运行到 `deploy` job 时会暂停，等待 Environment 的审批者手动批准。

CI Secrets 要求（新增/已有）
- `DEPLOY_SSH_KEY`（私钥，用于 Ansible SSH）
- `DEPLOY_USER`（可选）
- `DEPLOY_HOSTS` 或在 repo 中维护 `inventory`（敏感 host 可通过 secrets 传入）
- `REGISTRY` / `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` / `IMAGE_NAMESPACE`（已存在）

## 测试与演练
1. 在 staging 环境使用相同 playbook（不同 inventory/staging vars）反复演练蓝绿切换与回滚。  
2. 编写 smoke tests（自动化脚本）并集成到 playbook healthcheck 中。  
3. 执行“灾难恢复演练”：从备份恢复 DB 并回滚一次失败的部署。

## 下一步实施计划（建议）
1. 创建 `deploy/ansible` 目录并添加 `inventory.yml` 与 `playbooks`（我可以为你生成初始实现）。
2. 在 GitHub 上创建 Environment `production` 并配置审批者（Required reviewers）。
3. 在仓库 Secrets 中添加 `DEPLOY_SSH_KEY` 和 `DEPLOY_PATH` 等。  
4. 在 CI workflow 中替换 SSH action 为 Ansible 调用，并确保 runner 安装 Ansible（例如 `pip install ansible`）。

如果你确认，我现在可以：
- A) 生成 `deploy/ansible` 的初始 playbook 与 role 模板并提交；或
- B) 先把设计文档转换为更简短的实施清单供团队执行。

请选择 A 或 B。
