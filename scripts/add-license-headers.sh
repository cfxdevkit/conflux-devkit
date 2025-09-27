#!/bin/bash

# Script to add Apache 2.0 license headers to source files
# Copyright 2025 Conflux DevKit Team

LICENSE_HEADER='/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */'

# Function to add license header to a file
add_license_header() {
    local file="$1"
    
    # Skip if file already has license header
    if head -n 5 "$file" | grep -q "Copyright.*Conflux DevKit Team"; then
        echo "Skipping $file (already has license header)"
        return
    fi
    
    # Skip if file already has license header (different format)
    if head -n 5 "$file" | grep -q "Licensed under the Apache License"; then
        echo "Skipping $file (already has license header)"
        return
    fi
    
    echo "Adding license header to $file"
    
    # Create temporary file with license header and original content
    {
        echo "$LICENSE_HEADER"
        echo ""
        cat "$file"
    } > "$file.tmp"
    
    # Replace original file
    mv "$file.tmp" "$file"
}

# Add license headers to TypeScript and JavaScript files
echo "Adding Apache 2.0 license headers to source files..."

# Find all TypeScript, JavaScript, and TSX files in source directories
find packages/*/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    add_license_header "$file"
done

# Also add to contract files
find contracts -name "*.ts" -o -name "*.sol" | while read -r file; do
    # For Solidity files, use a different header format
    if [[ "$file" == *.sol ]]; then
        if ! head -n 5 "$file" | grep -q "Copyright.*Conflux DevKit Team"; then
            echo "Adding license header to $file"
            {
                echo "// SPDX-License-Identifier: Apache-2.0"
                echo "/*"
                echo " * Copyright 2025 Conflux DevKit Team"
                echo " *"
                echo " * Licensed under the Apache License, Version 2.0 (the \"License\");"
                echo " * you may not use this file except in compliance with the License."
                echo " * You may obtain a copy of the License at"
                echo " *"
                echo " *     http://www.apache.org/licenses/LICENSE-2.0"
                echo " *"
                echo " * Unless required by applicable law or agreed to in writing, software"
                echo " * distributed under the License is distributed on an \"AS IS\" BASIS,"
                echo " * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied."
                echo " * See the License for the specific language governing permissions and"
                echo " * limitations under the License."
                echo " */"
                echo ""
                cat "$file"
            } > "$file.tmp"
            mv "$file.tmp" "$file"
        fi
    else
        add_license_header "$file"
    fi
done

# Add to main configuration files
for file in tsconfig.json tsconfig.base.json turbo.json; do
    if [[ -f "$file" ]]; then
        echo "Skipping $file (JSON configuration file)"
    fi
done

echo "License headers added successfully!"