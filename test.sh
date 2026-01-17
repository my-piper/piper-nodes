#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
FILTER=""
FILE_PATTERN="**/*test.js"
PERMISSIONS="--allow-net --allow-read --allow-env"
WATCH=false
COVERAGE=false
NO_CHECK=true

# Help message
show_help() {
  echo -e "${BLUE}Usage:${NC}"
  echo "  ./test.sh [filter] [options]"
  echo ""
  echo -e "${BLUE}Examples:${NC}"
  echo "  ./test.sh                           # Run all tests"
  echo "  ./test.sh \"SD 3.5\"                  # Run tests matching 'SD 3.5'"
  echo "  ./test.sh \"should generate\"         # Run tests matching 'should generate'"
  echo "  ./test.sh --watch                   # Run tests in watch mode"
  echo "  ./test.sh \"SD 3.5\" --watch          # Run filtered tests in watch mode"
  echo "  ./test.sh --coverage                # Run tests with coverage"
  echo ""
  echo -e "${BLUE}Options:${NC}"
  echo "  -w, --watch       Run tests in watch mode"
  echo "  -c, --coverage    Run tests with coverage"
  echo "  -h, --help        Show this help message"
  echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -w|--watch)
      WATCH=true
      shift
      ;;
    -c|--coverage)
      COVERAGE=true
      shift
      ;;
    *)
      if [ -z "$FILTER" ]; then
        FILTER="$1"
      fi
      shift
      ;;
  esac
done

# Build the command
CMD="deno test"

# Add file pattern
CMD="$CMD $FILE_PATTERN"

# Add filter if provided
if [ -n "$FILTER" ]; then
  echo -e "${YELLOW}Running tests matching:${NC} ${GREEN}\"$FILTER\"${NC}"
  CMD="$CMD --filter \"$FILTER\""
else
  echo -e "${YELLOW}Running all tests${NC}"
fi

# Add permissions
CMD="$CMD $PERMISSIONS"

# Add no-check flag
if [ "$NO_CHECK" = true ]; then
  CMD="$CMD --no-check"
fi

# Add sloppy-imports flag
CMD="$CMD --sloppy-imports"

# Add watch mode
if [ "$WATCH" = true ]; then
  echo -e "${BLUE}Watch mode enabled${NC}"
  CMD="$CMD --watch"
fi

# Add coverage
if [ "$COVERAGE" = true ]; then
  echo -e "${BLUE}Coverage enabled${NC}"
  CMD="$CMD --coverage=coverage"
fi

# Print the command
echo -e "${BLUE}Command:${NC} $CMD"
echo ""

# Run the command
eval $CMD

# If coverage was enabled, generate report
if [ "$COVERAGE" = true ] && [ "$WATCH" = false ]; then
  echo ""
  echo -e "${BLUE}Generating coverage report...${NC}"
  deno coverage coverage --lcov > coverage/coverage.lcov
  echo -e "${GREEN}Coverage report saved to coverage/coverage.lcov${NC}"
fi

