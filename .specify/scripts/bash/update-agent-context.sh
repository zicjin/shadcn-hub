#!/usr/bin/env bash

# Update agent context files with information from plan.md
#
# This script maintains AI agent context files by parsing feature specifications 
# and updating agent-specific configuration files with project information.
#
# MAIN FUNCTIONS:
# 1. Environment Validation
#    - Verifies git repository structure and branch information
#    - Checks for required plan.md files and templates
#    - Validates file permissions and accessibility
#
# 2. Plan Data Extraction
#    - Parses plan.md files to extract project metadata
#    - Identifies language/version, frameworks, databases, and project types
#    - Handles missing or incomplete specification data gracefully
#
# 3. Agent File Management
#    - Creates new agent context files from templates when needed
#    - Updates existing agent files with new project information
#    - Preserves manual additions and custom configurations
#    - Supports multiple AI agent formats and directory structures
#
# 4. Content Generation
#    - Generates language-specific build/test commands
#    - Creates appropriate project directory structures
#    - Updates technology stacks and recent changes sections
#    - Maintains consistent formatting and timestamps
#
# 5. Multi-Agent Support
#    - Handles agent-specific file paths and naming conventions
#    - Supports: Claude, Gemini, Copilot, Cursor, Qwen, opencode, Codex, Windsurf
#    - Can update single agents or all existing agent files
#    - Creates default Claude file if no agent files exist
#
# Usage: ./update-agent-context.sh [agent_type]
# Agent types: claude|gemini|copilot|cursor|qwen|opencode|codex|windsurf
# Leave empty to update all existing agent files

set -e

# Enable strict error handling
set -u
set -o pipefail

#==============================================================================
# Configuration and Global Variables
#==============================================================================

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
FEATURE_DIR="$REPO_ROOT/specs/$CURRENT_BRANCH"
NEW_PLAN="$FEATURE_DIR/plan.md"
AGENT_TYPE="${1:-}"

# Agent-specific file paths
CLAUDE_FILE="$REPO_ROOT/CLAUDE.md"
GEMINI_FILE="$REPO_ROOT/GEMINI.md"
COPILOT_FILE="$REPO_ROOT/.github/copilot-instructions.md"
CURSOR_FILE="$REPO_ROOT/.cursor/rules/specify-rules.mdc"
QWEN_FILE="$REPO_ROOT/QWEN.md"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"
WINDSURF_FILE="$REPO_ROOT/.windsurf/rules/specify-rules.md"

# Template file
TEMPLATE_FILE="$REPO_ROOT/.specify/templates/agent-file-template.md"

# Global variables for parsed plan data
NEW_LANG=""
NEW_FRAMEWORK=""
NEW_DB=""
NEW_PROJECT_TYPE=""

#==============================================================================
# Utility Functions
#==============================================================================

log_info() {
    echo "INFO: $1"
}

log_success() {
    echo "✓ $1"
}

log_error() {
    echo "ERROR: $1" >&2
}

log_warning() {
    echo "WARNING: $1" >&2
}

# Cleanup function for temporary files
cleanup() {
    local exit_code=$?
    rm -f /tmp/agent_update_*_$$
    rm -f /tmp/manual_additions_$$
    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

#==============================================================================
# Validation Functions
#==============================================================================

validate_environment() {
    # Check if we're in a git repository
    if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check if we have a current branch
    if [[ -z "$CURRENT_BRANCH" ]]; then
        log_error "Unable to determine current git branch"
        exit 1
    fi
    
    # Check if plan.md exists
    if [[ ! -f "$NEW_PLAN" ]]; then
        log_error "No plan.md found at $NEW_PLAN"
        log_info "Make sure you're on a feature branch with a corresponding spec directory"
        exit 1
    fi
    
    # Check if template exists (needed for new files)
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_warning "Template file not found at $TEMPLATE_FILE"
        log_warning "Creating new agent files will fail"
    fi
}

#==============================================================================
# Plan Parsing Functions
#==============================================================================

extract_plan_field() {
    local field_pattern="$1"
    local plan_file="$2"
    
    grep "^**${field_pattern}**: " "$plan_file" 2>/dev/null | \
        head -1 | \
        sed "s/^**${field_pattern}**: //" | \
        grep -v "NEEDS CLARIFICATION" | \
        grep -v "^N/A$" || echo ""
}

parse_plan_data() {
    local plan_file="$1"
    
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file not found: $plan_file"
        return 1
    fi
    
    if [[ ! -r "$plan_file" ]]; then
        log_error "Plan file is not readable: $plan_file"
        return 1
    fi
    
    log_info "Parsing plan data from $plan_file"
    
    NEW_LANG=$(extract_plan_field "Language/Version" "$plan_file")
    NEW_FRAMEWORK=$(extract_plan_field "Primary Dependencies" "$plan_file")
    NEW_DB=$(extract_plan_field "Storage" "$plan_file")
    NEW_PROJECT_TYPE=$(extract_plan_field "Project Type" "$plan_file")
    
    # Log what we found
    if [[ -n "$NEW_LANG" ]]; then
        log_info "Found language: $NEW_LANG"
    else
        log_warning "No language information found in plan"
    fi
    
    if [[ -n "$NEW_FRAMEWORK" ]]; then
        log_info "Found framework: $NEW_FRAMEWORK"
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]]; then
        log_info "Found database: $NEW_DB"
    fi
    
    if [[ -n "$NEW_PROJECT_TYPE" ]]; then
        log_info "Found project type: $NEW_PROJECT_TYPE"
    fi
}
#==============================================================================
# Template and Content Generation Functions
#==============================================================================

get_project_structure() {
    local project_type="$1"
    
    if [[ "$project_type" == *"web"* ]]; then
        echo "backend/
frontend/
tests/"
    else
        echo "src/
tests/"
    fi
}

get_commands_for_language() {
    local lang="$1"
    
    case "$lang" in
        *"Python"*)
            echo "cd src && pytest && ruff check ."
            ;;
        *"Rust"*)
            echo "cargo test && cargo clippy"
            ;;
        *"JavaScript"*|*"TypeScript"*)
            echo "npm test && npm run lint"
            ;;
        *)
            echo "# Add commands for $lang"
            ;;
    esac
}

get_language_conventions() {
    local lang="$1"
    echo "$lang: Follow standard conventions"
}

create_new_agent_file() {
    local target_file="$1"
    local temp_file="$2"
    local project_name="$3"
    local current_date="$4"
    
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "Template not found at $TEMPLATE_FILE"
        return 1
    fi
    
    if [[ ! -r "$TEMPLATE_FILE" ]]; then
        log_error "Template file is not readable: $TEMPLATE_FILE"
        return 1
    fi
    
    log_info "Creating new agent context file from template..."
    
    if ! cp "$TEMPLATE_FILE" "$temp_file"; then
        log_error "Failed to copy template file"
        return 1
    fi
    
    # Replace template placeholders
    local project_structure
    project_structure=$(get_project_structure "$NEW_PROJECT_TYPE")
    
    local commands
    commands=$(get_commands_for_language "$NEW_LANG")
    
    local language_conventions
    language_conventions=$(get_language_conventions "$NEW_LANG")
    
    # Perform substitutions with error checking
    local substitutions=(
        "s/\[PROJECT NAME\]/$project_name/"
        "s/\[DATE\]/$current_date/"
        "s/\[EXTRACTED FROM ALL PLAN.MD FILES\]/- $NEW_LANG + $NEW_FRAMEWORK ($CURRENT_BRANCH)/"
        "s|\[ACTUAL STRUCTURE FROM PLANS\]|$project_structure|"
        "s|\[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES\]|$commands|"
        "s|\[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE\]|$language_conventions|"
        "s|\[LAST 3 FEATURES AND WHAT THEY ADDED\]|- $CURRENT_BRANCH: Added $NEW_LANG + $NEW_FRAMEWORK|"
    )
    
    for substitution in "${substitutions[@]}"; do
        if ! sed -i.bak "$substitution" "$temp_file"; then
            log_error "Failed to perform substitution: $substitution"
            rm -f "$temp_file" "$temp_file.bak"
            return 1
        fi
    done
    
    # Clean up backup files
    rm -f "$temp_file.bak"
    
    return 0
}
update_active_technologies() {
    local target_file="$1"
    local temp_file="$2"
    
    # Find the Active Technologies section and add new entries
    local tech_section_start
    tech_section_start=$(grep -n "## Active Technologies" "$target_file" | cut -d: -f1)
    
    if [[ -z "$tech_section_start" ]]; then
        return 0  # No Active Technologies section found
    fi
    
    # Find the end of the Active Technologies section (next ## heading or empty line)
    local tech_section_end
    tech_section_end=$(tail -n +$((tech_section_start + 1)) "$target_file" | grep -n "^## \|^$" | head -1 | cut -d: -f1)
    
    if [[ -n "$tech_section_end" ]]; then
        tech_section_end=$((tech_section_start + tech_section_end))
    else
        tech_section_end=$(wc -l < "$target_file")
    fi
    
    # Extract existing technologies section
    local existing_tech
    existing_tech=$(sed -n "${tech_section_start},${tech_section_end}p" "$target_file")
    
    # Build list of new additions
    local additions=()
    if [[ -n "$NEW_LANG" ]] && ! echo "$existing_tech" | grep -q "$NEW_LANG"; then
        additions+=("- $NEW_LANG + $NEW_FRAMEWORK ($CURRENT_BRANCH)")
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]] && ! echo "$existing_tech" | grep -q "$NEW_DB"; then
        additions+=("- $NEW_DB ($CURRENT_BRANCH)")
    fi
    
    # If we have additions, update the section
    if [[ ${#additions[@]} -gt 0 ]]; then
        {
            # Copy everything before the Active Technologies section
            head -n $((tech_section_start)) "$target_file"
            
            # Copy existing tech section content
            sed -n "$((tech_section_start + 1)),$((tech_section_end - 1))p" "$target_file"
            
            # Add new technologies
            printf '%s\n' "${additions[@]}"
            echo
            
            # Copy everything after the Active Technologies section
            tail -n +$((tech_section_end + 1)) "$target_file"
        } > "$temp_file"
    else
        cp "$target_file" "$temp_file"
    fi
}

update_recent_changes() {
    local temp_file="$1"
    local temp_file2="$2"
    
    # Find Recent Changes section
    local changes_section_start
    changes_section_start=$(grep -n "## Recent Changes" "$temp_file" | cut -d: -f1)
    
    if [[ -z "$changes_section_start" ]]; then
        return 0  # No Recent Changes section found
    fi
    
    # Find the end of the Recent Changes section
    local changes_section_end
    changes_section_end=$(tail -n +$((changes_section_start + 1)) "$temp_file" | grep -n "^## \|^$" | head -1 | cut -d: -f1)
    
    if [[ -n "$changes_section_end" ]]; then
        changes_section_end=$((changes_section_start + changes_section_end))
    else
        changes_section_end=$(wc -l < "$temp_file")
    fi
    
    # Extract existing changes, keep only non-empty lines, and limit to 2 (so we can add 1 new one)
    local existing_changes=()
    while IFS= read -r line; do
        if [[ -n "$line" ]] && [[ "$line" == "- "* ]]; then
            existing_changes+=("$line")
        fi
    done < <(sed -n "$((changes_section_start + 1)),$((changes_section_end - 1))p" "$temp_file")
    
    # Keep only the first 2 existing changes
    existing_changes=("${existing_changes[@]:0:2}")
    
    # Create updated Recent Changes section
    {
        # Copy everything before Recent Changes
        head -n "$changes_section_start" "$temp_file"
        
        # Add new change at the top
        echo "- $CURRENT_BRANCH: Added $NEW_LANG + $NEW_FRAMEWORK"
        
        # Add existing changes (up to 2)
        printf '%s\n' "${existing_changes[@]}"
        echo
        
        # Copy everything after Recent Changes section
        tail -n +$((changes_section_end + 1)) "$temp_file"
    } > "$temp_file2"
}

update_last_updated() {
    local temp_file="$1"
    local current_date="$2"
    
    # Update the "Last updated" timestamp
    sed -i.bak "s/Last updated: [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/Last updated: $current_date/" "$temp_file"
    rm -f "$temp_file.bak"
}

preserve_manual_additions() {
    local target_file="$1"
    local temp_file="$2"
    
    # Check if there are manual additions to preserve
    local manual_start manual_end
    manual_start=$(grep -n "<!-- MANUAL ADDITIONS START -->" "$target_file" 2>/dev/null | cut -d: -f1 || echo "")
    manual_end=$(grep -n "<!-- MANUAL ADDITIONS END -->" "$target_file" 2>/dev/null | cut -d: -f1 || echo "")
    
    if [[ -n "$manual_start" ]] && [[ -n "$manual_end" ]]; then
        # Extract manual additions
        local manual_file="/tmp/manual_additions_$$"
        sed -n "${manual_start},${manual_end}p" "$target_file" > "$manual_file"
        
        # Remove any existing manual additions from temp file
        sed -i.bak '/<!-- MANUAL ADDITIONS START -->/,/<!-- MANUAL ADDITIONS END -->/d' "$temp_file"
        rm -f "$temp_file.bak"
        
        # Append preserved manual additions
        cat "$manual_file" >> "$temp_file"
        rm -f "$manual_file"
    fi
}

update_existing_agent_file() {
    local target_file="$1"
    local current_date="$2"
    
    log_info "Updating existing agent context file..."
    
    local temp_file1="/tmp/agent_update_1_$$"
    local temp_file2="/tmp/agent_update_2_$$"
    
    # Step 1: Update Active Technologies section
    update_active_technologies "$target_file" "$temp_file1"
    
    # Step 2: Update Recent Changes section
    update_recent_changes "$temp_file1" "$temp_file2"
    
    # Step 3: Update timestamp
    update_last_updated "$temp_file2" "$current_date"
    
    # Step 4: Preserve manual additions
    preserve_manual_additions "$target_file" "$temp_file2"
    
    # Move the final result to target
    mv "$temp_file2" "$target_file"
    
    # Cleanup
    rm -f "$temp_file1"
}
#==============================================================================
# Main Agent File Update Function
#==============================================================================

update_agent_file() {
    local target_file="$1"
    local agent_name="$2"
    
    if [[ -z "$target_file" ]] || [[ -z "$agent_name" ]]; then
        log_error "update_agent_file requires target_file and agent_name parameters"
        return 1
    fi
    
    log_info "Updating $agent_name context file: $target_file"
    
    local project_name
    project_name=$(basename "$REPO_ROOT")
    local current_date
    current_date=$(date +%Y-%m-%d)
    
    # Create directory if it doesn't exist
    local target_dir
    target_dir=$(dirname "$target_file")
    if [[ ! -d "$target_dir" ]]; then
        if ! mkdir -p "$target_dir"; then
            log_error "Failed to create directory: $target_dir"
            return 1
        fi
    fi
    
    if [[ ! -f "$target_file" ]]; then
        # Create new file from template
        local temp_file
        temp_file=$(mktemp) || {
            log_error "Failed to create temporary file"
            return 1
        }
        
        if create_new_agent_file "$target_file" "$temp_file" "$project_name" "$current_date"; then
            if mv "$temp_file" "$target_file"; then
                log_success "Created new $agent_name context file"
            else
                log_error "Failed to move temporary file to $target_file"
                rm -f "$temp_file"
                return 1
            fi
        else
            log_error "Failed to create new agent file"
            rm -f "$temp_file"
            return 1
        fi
    else
        # Update existing file
        if [[ ! -r "$target_file" ]]; then
            log_error "Cannot read existing file: $target_file"
            return 1
        fi
        
        if [[ ! -w "$target_file" ]]; then
            log_error "Cannot write to existing file: $target_file"
            return 1
        fi
        
        if update_existing_agent_file "$target_file" "$current_date"; then
            log_success "Updated existing $agent_name context file"
        else
            log_error "Failed to update existing agent file"
            return 1
        fi
    fi
    
    return 0
}

#==============================================================================
# Agent Selection and Processing
#==============================================================================

update_specific_agent() {
    local agent_type="$1"
    
    case "$agent_type" in
        claude)
            update_agent_file "$CLAUDE_FILE" "Claude Code"
            ;;
        gemini)
            update_agent_file "$GEMINI_FILE" "Gemini CLI"
            ;;
        copilot)
            update_agent_file "$COPILOT_FILE" "GitHub Copilot"
            ;;
        cursor)
            update_agent_file "$CURSOR_FILE" "Cursor IDE"
            ;;
        qwen)
            update_agent_file "$QWEN_FILE" "Qwen Code"
            ;;
        opencode)
            update_agent_file "$AGENTS_FILE" "opencode"
            ;;
        codex)
            update_agent_file "$AGENTS_FILE" "Codex CLI"
            ;;
        windsurf)
            update_agent_file "$WINDSURF_FILE" "Windsurf"
            ;;
        *)
            log_error "Unknown agent type '$agent_type'"
            log_error "Expected: claude|gemini|copilot|cursor|qwen|opencode|codex|windsurf"
            exit 1
            ;;
    esac
}

update_all_existing_agents() {
    local found_agent=false
    
    # Check each possible agent file and update if it exists
    if [[ -f "$CLAUDE_FILE" ]]; then
        update_agent_file "$CLAUDE_FILE" "Claude Code"
        found_agent=true
    fi
    
    if [[ -f "$GEMINI_FILE" ]]; then
        update_agent_file "$GEMINI_FILE" "Gemini CLI"
        found_agent=true
    fi
    
    if [[ -f "$COPILOT_FILE" ]]; then
        update_agent_file "$COPILOT_FILE" "GitHub Copilot"
        found_agent=true
    fi
    
    if [[ -f "$CURSOR_FILE" ]]; then
        update_agent_file "$CURSOR_FILE" "Cursor IDE"
        found_agent=true
    fi
    
    if [[ -f "$QWEN_FILE" ]]; then
        update_agent_file "$QWEN_FILE" "Qwen Code"
        found_agent=true
    fi
    
    if [[ -f "$AGENTS_FILE" ]]; then
        update_agent_file "$AGENTS_FILE" "Codex/opencode"
        found_agent=true
    fi
    
    if [[ -f "$WINDSURF_FILE" ]]; then
        update_agent_file "$WINDSURF_FILE" "Windsurf"
        found_agent=true
    fi
    
    # If no agent files exist, create a default Claude file
    if [[ "$found_agent" == false ]]; then
        log_info "No existing agent files found, creating default Claude file..."
        update_agent_file "$CLAUDE_FILE" "Claude Code"
    fi
}
print_summary() {
    echo
    log_info "Summary of changes:"
    
    if [[ -n "$NEW_LANG" ]]; then
        echo "  - Added language: $NEW_LANG"
    fi
    
    if [[ -n "$NEW_FRAMEWORK" ]]; then
        echo "  - Added framework: $NEW_FRAMEWORK"
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]]; then
        echo "  - Added database: $NEW_DB"
    fi
    
    echo
    log_info "Usage: $0 [claude|gemini|copilot|cursor|qwen|opencode|codex|windsurf]"
}

#==============================================================================
# Main Execution
#==============================================================================

main() {
    # Validate environment before proceeding
    validate_environment
    
    log_info "=== Updating agent context files for feature $CURRENT_BRANCH ==="
    
    # Parse the plan file to extract project information
    if ! parse_plan_data "$NEW_PLAN"; then
        log_error "Failed to parse plan data"
        exit 1
    fi
    
    # Process based on agent type argument
    local success=true
    
    if [[ -z "$AGENT_TYPE" ]]; then
        # No specific agent provided - update all existing agent files
        log_info "No agent specified, updating all existing agent files..."
        if ! update_all_existing_agents; then
            success=false
        fi
    else
        # Specific agent provided - update only that agent
        log_info "Updating specific agent: $AGENT_TYPE"
        if ! update_specific_agent "$AGENT_TYPE"; then
            success=false
        fi
    fi
    
    # Print summary
    print_summary
    
    if [[ "$success" == true ]]; then
        log_success "Agent context update completed successfully"
        exit 0
    else
        log_error "Agent context update completed with errors"
        exit 1
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
