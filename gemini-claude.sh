#!/bin/bash

# ============================================================================
# Gemini-Claude Workflow Automation Script
# ============================================================================
# Automates the workflow between Gemini CLI and Claude Code to save tokens
# and context by generating focused, specific commands.
#
# Author: Created for Synexa-SIS-2025 project
# Version: 1.0.0
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION AND CONSTANTS
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
WORK_DIR="$PROJECT_ROOT/.gemini-claude"
ANALYSIS_DIR="$WORK_DIR/analysis"
TASKS_DIR="$WORK_DIR/tasks"
COMMANDS_DIR="$WORK_DIR/commands"
LOGS_DIR="$WORK_DIR/logs"
CACHE_DIR="$WORK_DIR/cache"
CONFIG_FILE="$WORK_DIR/config.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_GEMINI_MODEL="gemini-pro"
DEFAULT_MAX_TOKENS=8192
DEFAULT_TEMPERATURE=0.1
DEFAULT_CACHE_TTL=3600 # 1 hour

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${CYAN}[DEBUG]${NC} $message" ;;
        *)       echo -e "[LOG] $message" ;;
    esac
    
    # Log to file only if logs directory exists
    if [[ -d "$LOGS_DIR" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOGS_DIR/gemini-claude.log"
    fi
}

create_directories() {
    log "INFO" "Creating directory structure..."
    mkdir -p "$ANALYSIS_DIR" "$TASKS_DIR" "$COMMANDS_DIR" "$LOGS_DIR" "$CACHE_DIR"
}

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log "DEBUG" "Loading configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "INFO" "Creating default configuration..."
        cat > "$CONFIG_FILE" << EOF
# Gemini-Claude Workflow Configuration
GEMINI_MODEL=${GEMINI_MODEL:-$DEFAULT_GEMINI_MODEL}
MAX_TOKENS=${MAX_TOKENS:-$DEFAULT_MAX_TOKENS}
TEMPERATURE=${TEMPERATURE:-$DEFAULT_TEMPERATURE}
CACHE_TTL=${CACHE_TTL:-$DEFAULT_CACHE_TTL}
INTERACTIVE_MODE=${INTERACTIVE_MODE:-true}
AUTO_COMMIT=${AUTO_COMMIT:-false}
DRY_RUN=${DRY_RUN:-false}
EOF
        source "$CONFIG_FILE"
    fi
}

check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v gemini &> /dev/null; then
        missing_deps+=("gemini")
    fi
    
    if ! command -v claude-code &> /dev/null; then
        missing_deps+=("claude-code")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        log "ERROR" "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log "INFO" "All dependencies found ✓"
}

validate_git_repo() {
    if ! git rev-parse --git-dir &> /dev/null; then
        log "ERROR" "Not in a git repository. Please run this script from within a git project."
        exit 1
    fi
    log "DEBUG" "Git repository validated ✓"
}

# ============================================================================
# GEMINI CLI INTEGRATION
# ============================================================================

generate_analysis_prompt() {
    local task_type=$1
    local task_description=$2
    local context_files=""
    
    # Get relevant files based on task type
    case $task_type in
        "analyze-feature"|"feature")
            context_files=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" | head -20)
            ;;
        "fix-issues"|"debug")
            context_files=$(git diff --name-only HEAD~1 2>/dev/null || find . -name "*.log" -o -name "*.error" | head -10)
            ;;
        "refactor-module"|"refactor")
            if [[ -n "$task_description" && -d "$task_description" ]]; then
                context_files=$(find "$task_description" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \))
            fi
            ;;
        "full-analysis")
            context_files=$(find . -name "package.json" -o -name "README.md" -o -name "*.config.*" | head -10)
            ;;
    esac
    
    cat << EOF
You are a senior software architect analyzing a codebase for automated workflow optimization.

TASK: $task_type - $task_description

PROJECT CONTEXT:
$(git log --oneline -5 2>/dev/null || echo "No recent commits")

RELEVANT FILES:
$context_files

INSTRUCTIONS:
1. Analyze the codebase and identify specific, atomic tasks needed to complete: $task_description
2. For each task, specify:
   - EXACT file paths that need modification
   - SPECIFIC changes required
   - DEPENDENCIES between tasks
   - PRIORITY level (HIGH/MEDIUM/LOW)
   - ESTIMATED complexity (SIMPLE/MEDIUM/COMPLEX)

3. Output format should be JSON with this structure:
{
  "analysis_summary": "Brief overview of what needs to be done",
  "tasks": [
    {
      "id": "unique_task_id",
      "title": "Descriptive task title",
      "description": "Detailed task description",
      "files": ["exact/file/path1.js", "exact/file/path2.ts"],
      "priority": "HIGH|MEDIUM|LOW",
      "complexity": "SIMPLE|MEDIUM|COMPLEX",
      "dependencies": ["task_id1", "task_id2"],
      "claude_prompt": "Optimized prompt for Claude Code",
      "estimated_tokens": 500
    }
  ],
  "total_estimated_tokens": 2500,
  "recommended_order": ["task_id1", "task_id2", "task_id3"]
}

Focus on breaking down the work into the smallest possible atomic tasks that Claude Code can execute efficiently.
EOF
}

run_gemini_analysis() {
    local task_type=$1
    local task_description=$2
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local analysis_file="$ANALYSIS_DIR/analysis_${task_type}_${timestamp}.json"
    local prompt_file="$ANALYSIS_DIR/prompt_${task_type}_${timestamp}.txt"
    
    log "INFO" "Running Gemini analysis for: $task_type - $task_description"
    
    # Generate and save prompt
    generate_analysis_prompt "$task_type" "$task_description" > "$prompt_file"
    
    # Check cache first
    local cache_key=$(echo "$task_type:$task_description" | sha256sum | cut -d' ' -f1)
    local cache_file="$CACHE_DIR/$cache_key.json"
    
    if [[ -f "$cache_file" ]]; then
        local cache_age=$(($(date +%s) - $(stat -c %Y "$cache_file")))
        if [[ $cache_age -lt $CACHE_TTL ]]; then
            log "INFO" "Using cached analysis (age: ${cache_age}s)"
            cp "$cache_file" "$analysis_file"
            echo "$analysis_file"
            return 0
        fi
    fi
    
    # Run Gemini CLI
    if gemini -m "$GEMINI_MODEL" -t "$MAX_TOKENS" -temp "$TEMPERATURE" -f "$prompt_file" > "$analysis_file" 2>/dev/null; then
        log "INFO" "Gemini analysis completed successfully"
        
        # Validate JSON output
        if jq . "$analysis_file" >/dev/null 2>&1; then
            # Cache the result
            cp "$analysis_file" "$cache_file"
            echo "$analysis_file"
        else
            log "ERROR" "Invalid JSON output from Gemini"
            return 1
        fi
    else
        log "ERROR" "Gemini analysis failed"
        return 1
    fi
}

# ============================================================================
# CLAUDE CODE COMMAND GENERATION
# ============================================================================

parse_analysis() {
    local analysis_file=$1
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    log "INFO" "Parsing analysis and generating Claude Code commands..."
    
    # Extract tasks from analysis
    local task_count=$(jq '.tasks | length' "$analysis_file")
    log "INFO" "Found $task_count tasks to process"
    
    local commands_file="$COMMANDS_DIR/commands_${timestamp}.sh"
    echo "#!/bin/bash" > "$commands_file"
    echo "# Generated Claude Code commands from Gemini analysis" >> "$commands_file"
    echo "# Generated at: $(date)" >> "$commands_file"
    echo "" >> "$commands_file"
    
    # Generate individual task files and commands
    for ((i=0; i<task_count; i++)); do
        local task=$(jq ".tasks[$i]" "$analysis_file")
        local task_id=$(echo "$task" | jq -r '.id')
        local title=$(echo "$task" | jq -r '.title')
        local claude_prompt=$(echo "$task" | jq -r '.claude_prompt')
        local priority=$(echo "$task" | jq -r '.priority')
        local files=$(echo "$task" | jq -r '.files[]' | tr '\n' ' ')
        
        # Create individual task file
        local task_file="$TASKS_DIR/task_${task_id}.json"
        echo "$task" > "$task_file"
        
        # Generate Claude Code command
        cat >> "$commands_file" << EOF
# Task: $title (Priority: $priority)
# Files: $files
echo "Executing task: $title"
claude-code "$claude_prompt"
echo "Task completed: $task_id"
echo ""

EOF
    done
    
    chmod +x "$commands_file"
    log "INFO" "Commands generated: $commands_file"
    echo "$commands_file"
}

# ============================================================================
# INTERACTIVE MODE
# ============================================================================

show_task_menu() {
    local analysis_file=$1
    local task_count=$(jq '.tasks | length' "$analysis_file")
    
    echo -e "\n${PURPLE}=== TASK SELECTION MENU ===${NC}"
    echo -e "${CYAN}Total tasks found: $task_count${NC}\n"
    
    for ((i=0; i<task_count; i++)); do
        local task=$(jq ".tasks[$i]" "$analysis_file")
        local task_id=$(echo "$task" | jq -r '.id')
        local title=$(echo "$task" | jq -r '.title')
        local priority=$(echo "$task" | jq -r '.priority')
        local complexity=$(echo "$task" | jq -r '.complexity')
        local estimated_tokens=$(echo "$task" | jq -r '.estimated_tokens')
        
        local priority_color=""
        case $priority in
            "HIGH") priority_color=$RED ;;
            "MEDIUM") priority_color=$YELLOW ;;
            "LOW") priority_color=$GREEN ;;
        esac
        
        echo -e "$((i+1)). ${BLUE}$title${NC}"
        echo -e "   Priority: ${priority_color}$priority${NC} | Complexity: $complexity | Tokens: $estimated_tokens"
        echo -e "   ID: $task_id"
        echo ""
    done
    
    echo -e "${YELLOW}Options:${NC}"
    echo "  a) Execute all tasks in recommended order"
    echo "  s) Select specific tasks by number (e.g., 1,3,5)"
    echo "  q) Quit without executing"
    echo ""
}

get_user_selection() {
    local analysis_file=$1
    local task_count=$(jq '.tasks | length' "$analysis_file")
    
    while true; do
        read -p "Your choice: " choice
        
        case $choice in
            "a"|"all")
                # Return all task indices in recommended order
                local recommended_order=$(jq -r '.recommended_order[]' "$analysis_file")
                local selected_indices=()
                for task_id in $recommended_order; do
                    for ((i=0; i<task_count; i++)); do
                        local current_id=$(jq -r ".tasks[$i].id" "$analysis_file")
                        if [[ "$current_id" == "$task_id" ]]; then
                            selected_indices+=($i)
                            break
                        fi
                    done
                done
                echo "${selected_indices[*]}"
                return 0
                ;;
            "q"|"quit")
                log "INFO" "User cancelled execution"
                exit 0
                ;;
            *[0-9]*)
                # Parse comma-separated numbers
                IFS=',' read -ra NUMBERS <<< "$choice"
                local selected_indices=()
                local valid=true
                
                for num in "${NUMBERS[@]}"; do
                    num=$(echo "$num" | tr -d ' ')
                    if [[ "$num" =~ ^[0-9]+$ ]] && [[ $num -ge 1 ]] && [[ $num -le $task_count ]]; then
                        selected_indices+=($((num-1)))
                    else
                        echo -e "${RED}Invalid selection: $num${NC}"
                        valid=false
                        break
                    fi
                done
                
                if [[ $valid == true ]]; then
                    echo "${selected_indices[*]}"
                    return 0
                fi
                ;;
            *)
                echo -e "${RED}Invalid choice. Please try again.${NC}"
                ;;
        esac
    done
}

# ============================================================================
# EXECUTION ENGINE
# ============================================================================

execute_tasks() {
    local analysis_file=$1
    local selected_indices=($2)
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local execution_log="$LOGS_DIR/execution_${timestamp}.log"
    
    log "INFO" "Starting task execution..."
    echo "Execution started at: $(date)" > "$execution_log"
    
    local total_tokens=0
    local completed_tasks=0
    local failed_tasks=0
    
    for index in "${selected_indices[@]}"; do
        local task=$(jq ".tasks[$index]" "$analysis_file")
        local task_id=$(echo "$task" | jq -r '.id')
        local title=$(echo "$task" | jq -r '.title')
        local claude_prompt=$(echo "$task" | jq -r '.claude_prompt')
        local estimated_tokens=$(echo "$task" | jq -r '.estimated_tokens')
        
        echo -e "\n${CYAN}=== Executing Task: $title ===${NC}"
        echo "Task ID: $task_id"
        echo "Estimated tokens: $estimated_tokens"
        
        if [[ $DRY_RUN == "true" ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would execute: claude-code \"$claude_prompt\""
            echo "Task: $task_id - DRY RUN" >> "$execution_log"
            completed_tasks=$((completed_tasks + 1))
        else
            echo "Command: claude-code \"$claude_prompt\""
            echo ""
            
            if claude-code "$claude_prompt"; then
                log "INFO" "Task completed successfully: $task_id"
                echo "Task: $task_id - SUCCESS" >> "$execution_log"
                completed_tasks=$((completed_tasks + 1))
                total_tokens=$((total_tokens + estimated_tokens))
                
                # Auto-commit if enabled
                if [[ $AUTO_COMMIT == "true" ]]; then
                    git add . && git commit -m "feat: $title (automated via gemini-claude)" || true
                fi
            else
                log "ERROR" "Task failed: $task_id"
                echo "Task: $task_id - FAILED" >> "$execution_log"
                failed_tasks=$((failed_tasks + 1))
                
                if [[ $INTERACTIVE_MODE == "true" ]]; then
                    read -p "Continue with next task? (y/n): " continue_choice
                    if [[ $continue_choice != "y" ]]; then
                        break
                    fi
                fi
            fi
        fi
        
        echo "----------------------------------------"
    done
    
    # Execution summary
    echo -e "\n${PURPLE}=== EXECUTION SUMMARY ===${NC}"
    echo "Completed tasks: $completed_tasks"
    echo "Failed tasks: $failed_tasks"
    echo "Total estimated tokens used: $total_tokens"
    echo "Execution log: $execution_log"
    
    log "INFO" "Execution completed. Completed: $completed_tasks, Failed: $failed_tasks"
}

# ============================================================================
# MAIN WORKFLOW FUNCTIONS
# ============================================================================

analyze_feature() {
    local description=$1
    log "INFO" "Starting feature analysis: $description"
    
    local analysis_file=$(run_gemini_analysis "analyze-feature" "$description")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Analysis failed"
        return 1
    fi
    
    if [[ $INTERACTIVE_MODE == "true" ]]; then
        show_task_menu "$analysis_file"
        local selected_indices=$(get_user_selection "$analysis_file")
        execute_tasks "$analysis_file" "$selected_indices"
    else
        local commands_file=$(parse_analysis "$analysis_file")
        if [[ $DRY_RUN == "true" ]]; then
            log "INFO" "Dry run mode - commands generated: $commands_file"
        else
            bash "$commands_file"
        fi
    fi
}

fix_issues() {
    local context=${1:-"automatic detection"}
    log "INFO" "Starting issue analysis: $context"
    
    local analysis_file=$(run_gemini_analysis "fix-issues" "$context")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Analysis failed"
        return 1
    fi
    
    if [[ $INTERACTIVE_MODE == "true" ]]; then
        show_task_menu "$analysis_file"
        local selected_indices=$(get_user_selection "$analysis_file")
        execute_tasks "$analysis_file" "$selected_indices"
    else
        local commands_file=$(parse_analysis "$analysis_file")
        bash "$commands_file"
    fi
}

refactor_module() {
    local module_path=$1
    if [[ ! -d "$module_path" ]]; then
        log "ERROR" "Module path not found: $module_path"
        return 1
    fi
    
    log "INFO" "Starting module refactoring: $module_path"
    
    local analysis_file=$(run_gemini_analysis "refactor-module" "$module_path")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Analysis failed"
        return 1
    fi
    
    if [[ $INTERACTIVE_MODE == "true" ]]; then
        show_task_menu "$analysis_file"
        local selected_indices=$(get_user_selection "$analysis_file")
        execute_tasks "$analysis_file" "$selected_indices"
    else
        local commands_file=$(parse_analysis "$analysis_file")
        bash "$commands_file"
    fi
}

full_analysis() {
    log "INFO" "Starting full project analysis"
    
    local analysis_file=$(run_gemini_analysis "full-analysis" "complete project assessment")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Analysis failed"
        return 1
    fi
    
    show_task_menu "$analysis_file"
    local selected_indices=$(get_user_selection "$analysis_file")
    execute_tasks "$analysis_file" "$selected_indices"
}

# ============================================================================
# CLI INTERFACE
# ============================================================================

show_help() {
    cat << EOF
${PURPLE}Gemini-Claude Workflow Automation Script${NC}
${CYAN}Automates the workflow between Gemini CLI and Claude Code${NC}

${YELLOW}USAGE:${NC}
  $0 <command> [arguments]

${YELLOW}COMMANDS:${NC}
  analyze-feature <description>  Analyze and implement a new feature
  fix-issues [context]          Analyze and fix issues in the codebase
  refactor-module <path>        Refactor a specific module or directory
  full-analysis                 Complete project analysis and recommendations
  
  config                        Show current configuration
  clean                         Clean cache and temporary files
  logs                          Show recent execution logs
  help                          Show this help message

${YELLOW}EXAMPLES:${NC}
  $0 analyze-feature "add user authentication with JWT"
  $0 fix-issues "login form validation errors"
  $0 refactor-module "src/components/auth"
  $0 full-analysis

${YELLOW}CONFIGURATION:${NC}
  Configuration file: $CONFIG_FILE
  
  Environment variables:
    INTERACTIVE_MODE=true|false   Enable/disable interactive mode
    DRY_RUN=true|false           Preview commands without execution
    AUTO_COMMIT=true|false       Auto-commit successful changes
    GEMINI_MODEL=model-name      Gemini model to use
    MAX_TOKENS=number            Maximum tokens per request
    CACHE_TTL=seconds            Cache time-to-live

${YELLOW}FILES CREATED:${NC}
  $WORK_DIR/
  ├── analysis/     Gemini analyses with timestamps
  ├── tasks/        Individual task definitions
  ├── commands/     Generated Claude Code commands
  ├── logs/         Execution logs and history
  └── cache/        Cached analyses for performance

EOF
}

show_config() {
    echo -e "${PURPLE}=== CURRENT CONFIGURATION ===${NC}"
    echo "Working directory: $WORK_DIR"
    echo "Gemini model: $GEMINI_MODEL"
    echo "Max tokens: $MAX_TOKENS"
    echo "Temperature: $TEMPERATURE"
    echo "Cache TTL: $CACHE_TTL seconds"
    echo "Interactive mode: $INTERACTIVE_MODE"
    echo "Dry run mode: $DRY_RUN"
    echo "Auto commit: $AUTO_COMMIT"
    echo ""
    echo "Configuration file: $CONFIG_FILE"
}

clean_workspace() {
    log "INFO" "Cleaning workspace..."
    
    if [[ -d "$CACHE_DIR" ]]; then
        rm -rf "$CACHE_DIR"/*
        log "INFO" "Cache cleared"
    fi
    
    # Keep recent logs but clean old ones
    find "$LOGS_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    log "INFO" "Old logs cleaned"
    
    # Clean old analysis files
    find "$ANALYSIS_DIR" -name "*.json" -mtime +3 -delete 2>/dev/null || true
    find "$ANALYSIS_DIR" -name "*.txt" -mtime +3 -delete 2>/dev/null || true
    log "INFO" "Old analysis files cleaned"
    
    log "INFO" "Workspace cleaned successfully"
}

show_logs() {
    echo -e "${PURPLE}=== RECENT EXECUTION LOGS ===${NC}"
    if [[ -f "$LOGS_DIR/gemini-claude.log" ]]; then
        tail -50 "$LOGS_DIR/gemini-claude.log"
    else
        echo "No logs found"
    fi
}

# ============================================================================
# MAIN SCRIPT EXECUTION
# ============================================================================

main() {
    # Initialize
    create_directories
    load_config
    check_dependencies
    validate_git_repo
    
    # Parse command line arguments
    case "${1:-help}" in
        "analyze-feature"|"feature")
            if [[ $# -lt 2 ]]; then
                log "ERROR" "Feature description required"
                echo "Usage: $0 analyze-feature \"description of feature\""
                exit 1
            fi
            analyze_feature "$2"
            ;;
        "fix-issues"|"debug"|"fix")
            fix_issues "${2:-automatic detection}"
            ;;
        "refactor-module"|"refactor")
            if [[ $# -lt 2 ]]; then
                log "ERROR" "Module path required"
                echo "Usage: $0 refactor-module \"path/to/module\""
                exit 1
            fi
            refactor_module "$2"
            ;;
        "full-analysis"|"analyze")
            full_analysis
            ;;
        "config")
            show_config
            ;;
        "clean")
            clean_workspace
            ;;
        "logs")
            show_logs
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log "ERROR" "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"