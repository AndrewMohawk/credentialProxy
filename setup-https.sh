#!/bin/bash

# Script to set up HTTPS for development with mkcert
# Based on: https://web.dev/how-to-use-local-https/

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Please install it first:"
    echo "macOS: brew install mkcert nss"
    echo "Linux: apt install mkcert"
    echo "Windows: choco install mkcert"
    exit 1
fi

# Create certs directory if it doesn't exist
mkdir -p certs

# Set up mkcert CA if it hasn't been set up
if [ ! -d "$(mkcert -CAROOT)" ]; then
    echo "Setting up mkcert CA..."
    mkcert -install
fi

# Create certificates for our development domain
echo "Creating certificates for credentialproxy.andrewmohawk.xyz and localhost..."
mkcert -key-file certs/key.pem -cert-file certs/cert.pem "credentialproxy.andrewmohawk.xyz" "*.credentialproxy.andrewmohawk.xyz" localhost 127.0.0.1 ::1

echo "Done! Certificates created in the certs directory."
echo "Make sure to update your hosts file to point credentialproxy.andrewmohawk.xyz to 127.0.0.1"
echo "e.g., add this line to /etc/hosts: 127.0.0.1 credentialproxy.andrewmohawk.xyz" 