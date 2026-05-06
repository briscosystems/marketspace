#!/bin/bash
set -e

# Projektordner anlegen
mkdir -p ~/projekte/marketplace/.devcontainer
cd ~/projekte/marketplace

# .devcontainer/devcontainer.json
cat > .devcontainer/devcontainer.json << 'EOF'
{
  "name": "Marketplace Dev",
  "build": {
    "dockerfile": "Dockerfile"
  },
  "remoteUser": "node",
  "workspaceFolder": "/workspace",
  "mounts": [
    "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached"
  ],
  "forwardPorts": [3000, 5432, 8081, 19000, 19001, 19002],
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "remoteEnv": {
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}"
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "Prisma.prisma",
        "bradlc.vscode-tailwindcss"
      ]
    }
  }
}
EOF

# .devcontainer/Dockerfile
cat > .devcontainer/Dockerfile << 'EOF'
FROM node:20-alpine

RUN apk add --no-cache \
    git \
    openssh \
    bash \
    sudo \
    postgresql16 \
    postgresql16-client \
    postgresql16-contrib \
    python3 \
    make \
    g++ \
    curl

# sudo für node-User
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# PostgreSQL Datenverzeichnis vorbereiten
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql

USER node
WORKDIR /workspace

EXPOSE 3000 5432 8081 19000 19001 19002
EOF

# .devcontainer/post-create.sh
cat > .devcontainer/post-create.sh << 'EOF'
#!/bin/bash
set -e

echo "==> Installing global tools..."
sudo npm install -g @anthropic-ai/claude-code expo-cli

echo "==> Initializing PostgreSQL..."
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  sudo -u postgres initdb -D /var/lib/postgresql/data
  echo "host all all 0.0.0.0/0 trust" | sudo tee -a /var/lib/postgresql/data/pg_hba.conf
  echo "listen_addresses = '*'" | sudo tee -a /var/lib/postgresql/data/postgresql.conf
fi

echo "==> Starting PostgreSQL..."
sudo -u postgres pg_ctl -D /var/lib/postgresql/data -l /tmp/pg.log start || true

echo "==> Creating marketplace database..."
sudo -u postgres psql -c "CREATE DATABASE marketplace;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER marketplace WITH PASSWORD 'marketplace';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marketplace TO marketplace;" 2>/dev/null || true

echo "==> Setup complete. Run 'claude' to start coding."
EOF
chmod +x .devcontainer/post-create.sh

# .gitignore
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
.expo/
dist/
build/
*.log
.DS_Store
.vscode/settings.json
EOF

# README.md
cat > README.md << 'EOF'
# Marketplace - Industrial Oil Trading Platform

B2B-Marktplatz für KSS/Industrieöl-Reseller und OEM-Hersteller im DACH-Raum.

## Stack
- Backend + Web: Next.js
- Mobile: React Native (Expo)
- Datenbank: PostgreSQL
- Payments: Stripe
- Computer Vision: Google ML Kit

## Dev Setup
1. VS Code öffnen
2. Command Palette → "Dev Containers: Reopen in Container"
3. Im Container-Terminal: `claude`
EOF

# Git initialisieren
git init -b main
git add .
git commit -m "Initial dev container setup"

echo ""
echo "=========================================="
echo "  Setup fertig!"
echo "=========================================="
echo ""
echo "Naechste Schritte:"
echo "  1. ANTHROPIC_API_KEY in deiner Shell exportieren (falls noch nicht):"
echo "     echo 'export ANTHROPIC_API_KEY=\"sk-ant-...\"' >> ~/.bashrc"
echo "     source ~/.bashrc"
echo ""
echo "  2. VS Code oeffnen:"
echo "     code ~/projekte/marketplace"
echo ""
echo "  3. Command Palette (Ctrl+Shift+P) → 'Dev Containers: Reopen in Container'"
echo ""
echo "  4. Wenn Container laeuft, im Terminal:"
echo "     claude"
echo ""
echo "Dann uebernehme ich den Rest."
echo ""
