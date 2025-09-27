#!/bin/bash

# Script to check for missing license headers
# Copyright 2025 Conflux DevKit Team

echo "🔍 Checking for missing license headers..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

missing_count=0
total_count=0

# Function to check if a file has a license header
check_license_header() {
    local file="$1"
    local file_type="$2"
    
    total_count=$((total_count + 1))
    
    # Check for copyright notice in first 20 lines (support both /* */ and <!-- --> comments)
    if head -n 20 "$file" | grep -q "Copyright.*Conflux DevKit Team"; then
        echo -e "${GREEN}✅${NC} $file"
        return 0
    else
        echo -e "${RED}❌${NC} $file (missing license header)"
        missing_count=$((missing_count + 1))
        return 1
    fi
}

echo "Checking TypeScript/JavaScript source files..."
echo "=============================================="

# Check TypeScript and JavaScript files in source directories (exclude generated files)
find packages/*/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    check_license_header "$file" "source"
done

echo ""
echo "Checking contract files..."
echo "=========================="

# Check contract files (exclude generated/artifacts)
find contracts -name "*.sol" -not -path "*/node_modules/*" -not -path "*/artifacts/*" | while read -r file; do
    check_license_header "$file" "contract"
done

# Check TypeScript files in contracts (ignition modules, etc.) - exclude generated files
find contracts -name "*.ts" -not -path "*/node_modules/*" -not -path "*/artifacts/*" -not -path "*/typechain-types/*" | while read -r file; do
    check_license_header "$file" "contract-ts"
done

echo ""
echo "Note: Generated files (artifacts/, typechain-types/) are excluded from license header checks."

echo ""
echo "Checking documentation files..."
echo "==============================="

# Check main documentation files
for file in README.md API.md PROJECT_ANALYSIS.md PROJECT_COMPLETION_PLAN.md CONTRIBUTING.md; do
    if [[ -f "$file" ]]; then
        check_license_header "$file" "doc"
    fi
done

# Check package-specific documentation
find packages -name "*.md" | while read -r file; do
    check_license_header "$file" "package-doc"
done

echo ""
echo "📊 Summary:"
echo "==========="
echo "Total files checked: $total_count"
echo "Files missing headers: $missing_count"

if [ $missing_count -eq 0 ]; then
    echo -e "${GREEN}🎉 All files have proper license headers!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some files are missing license headers. Please add them.${NC}"
    echo ""
    echo "To add license headers to missing files, run:"
    echo "  ./scripts/add-license-headers.sh"
    exit 1
fi