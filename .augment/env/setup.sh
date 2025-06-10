#!/bin/bash
set -e

# Update system packages
sudo apt-get update

# Install Node.js 22 (required for this project based on tsconfig.node.json)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Install project dependencies
cd /mnt/persist/workspace
npm install

# Install Playwright browsers for e2e tests
npx playwright install --with-deps

# Add npm global bin to PATH in user profile
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> $HOME/.profile

# Source the profile to make PATH available immediately
source $HOME/.profile

echo "Setup completed successfully!"