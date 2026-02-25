# Ansible deploy templates

This folder contains initial Ansible playbooks and roles for blue/green and rolling deployments.

Quick usage (CI runner):

1. Write deploy SSH key to a temporary file (from GitHub Secret) and set `ANSIBLE_HOST_KEY_CHECKING=false`.
2. Run:
   ```bash
   ansible-playbook -i deploy/ansible/inventory.yml deploy/ansible/playbooks/bluegreen-deploy.yml -e deploy_color=blue
   ```

Notes:
- Before running, copy `deploy/files/check_health.sh` to remote hosts (or let Ansible copy it). Ensure it's executable.
- Playbooks are templates — adapt `inventory.yml` and `vars/production.yml` to your environment.
