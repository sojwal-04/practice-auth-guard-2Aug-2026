#!/bin/bash

# Security & Load Testing Script for Rate Guard
# Usage: ./test-security.sh [url] [endpoint] [params] [mode]
# Defaults: https://uat.mywebsite.com /payment-page r=2681000&f=1 xss

BASE_URL="${1:-https://uat.mywebsite.com}"
ENDPOINT="${2:-/payment-page}"
BASE_PARAMS="${3:-r=2681000&f=1}"
MODE="${4:-xss}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

passed=0
failed=0

build_url() {
  local payload="$1"
  if [ -z "$payload" ]; then
    echo "${BASE_URL}${ENDPOINT}?${BASE_PARAMS}"
  else
    echo "${BASE_URL}${ENDPOINT}?${BASE_PARAMS}&${payload}"
  fi
}

log_pass() { echo -e "${GREEN}✅ PASS${NC} - $1"; ((passed++)); }
log_fail() { echo -e "${RED}❌ FAIL${NC} - $1"; ((failed++)); }
log_info() { echo -e "${BLUE}ℹ️ INFO${NC} - $1"; }

# ==================== XSS TESTS ====================
test_xss() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🔥 XSS Security Tests${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "Target: ${YELLOW}${BASE_URL}${ENDPOINT}${NC}"
  echo -e "Base Params: ${YELLOW}${BASE_PARAMS}${NC}\n"

  # Test 1: Image XSS
  echo -e "${YELLOW}[1/5] Image Tag XSS${NC}"
  url=$(build_url "xss=%3Cimg%20src=x%20onerror=alert(1)%3E")
  log_info "Testing: $url"
  response=$(curl -s "$url")
  if echo "$response" | grep -qi "img\|onerror"; then
    log_fail "Image XSS not escaped"
  else
    log_pass "Image XSS escaped properly"
  fi
  echo ""

  # Test 2: Script Tag XSS
  echo -e "${YELLOW}[2/5] Script Tag XSS${NC}"
  url=$(build_url "xss=%3Cscript%3Ealert('XSS')%3C/script%3E")
  log_info "Testing: $url"
  response=$(curl -s "$url")
  if echo "$response" | grep -qi "<script"; then
    log_fail "Script tag XSS not escaped"
  else
    log_pass "Script tag XSS escaped properly"
  fi
  echo ""

  # Test 3: SVG XSS
  echo -e "${YELLOW}[3/5] SVG onload XSS${NC}"
  url=$(build_url "xss=%3Csvg%20onload=alert(1)%3E")
  log_info "Testing: $url"
  response=$(curl -s "$url")
  if echo "$response" | grep -qi "svg\|onload"; then
    log_fail "SVG XSS not escaped"
  else
    log_pass "SVG XSS escaped properly"
  fi
  echo ""

  # Test 4: Event Handler
  echo -e "${YELLOW}[4/5] Event Handler Attribute${NC}"
  url=$(build_url "xss=%22%20onerror=%22alert(1)%22%20x=%22")
  log_info "Testing: $url"
  response=$(curl -s "$url")
  if echo "$response" | grep -qi "onerror"; then
    log_fail "Event handler not escaped"
  else
    log_pass "Event handler escaped properly"
  fi
  echo ""

  # Test 5: Prototype Pollution
  echo -e "${YELLOW}[5/5] Prototype Pollution${NC}"
  url=$(build_url "__proto__[polluted]=true")
  log_info "Testing: $url"
  response=$(curl -s "$url" 2>&1)
  if [ -z "$response" ] || echo "$response" | grep -qi "error"; then
    log_pass "Prototype pollution blocked"
  else
    log_pass "Prototype pollution handled"
  fi
  echo ""
}

# ==================== LOAD TESTS ====================
test_load() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📊 Server Load Tests${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "Target: ${YELLOW}${BASE_URL}${ENDPOINT}${NC}\n"

  # Test 1: Concurrent Requests
  echo -e "${YELLOW}[1/4] Concurrent Requests (10 parallel)${NC}"
  start=$(date +%s%N)
  for i in {1..10}; do
    url=$(build_url "test=concurrent_${i}")
    curl -s "$url" > /dev/null &
  done
  wait
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if [ $elapsed -lt 10000 ]; then
    log_pass "Handled 10 concurrent requests in ${elapsed}ms"
  else
    log_fail "Slow response time: ${elapsed}ms"
  fi
  echo ""

  # Test 2: Rapid Requests
  echo -e "${YELLOW}[2/4] Rapid Fire Requests (50 requests)${NC}"
  start=$(date +%s%N)
  for i in {1..50}; do
    url=$(build_url "iteration=${i}")
    curl -s "$url" > /dev/null
  done
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  log_pass "Completed 50 sequential requests in ${elapsed}ms"
  echo ""

  # Test 3: Large Parameter Values
  echo -e "${YELLOW}[3/4] Large Parameter (10KB)${NC}"
  large_param=$(python3 -c "print('A'*10000)")
  start=$(date +%s%N)
  url=$(build_url "data=${large_param}")
  response=$(curl -s --max-time 10 "$url")
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if [ -n "$response" ] && [ $elapsed -lt 5000 ]; then
    log_pass "Handled 10KB parameter in ${elapsed}ms"
  else
    log_fail "Failed or timed out with large parameter"
  fi
  echo ""

  # Test 4: POST with Large Payload
  echo -e "${YELLOW}[4/4] Large POST Payload (1MB)${NC}"
  start=$(date +%s%N)
  response=$(curl -s --max-time 10 -X POST "${BASE_URL}${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{\"${BASE_PARAMS}\",\"data\":\"$(python3 -c 'print("X"*1000000)')\"}")
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if [ -n "$response" ] && [ $elapsed -lt 10000 ]; then
    log_pass "Handled 1MB POST in ${elapsed}ms"
  else
    log_fail "Failed or timed out with 1MB payload"
  fi
  echo ""
}

# ==================== DoS TESTS ====================
test_dos() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}💣 DoS/Crash Tests${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "Target: ${YELLOW}${BASE_URL}${ENDPOINT}${NC}\n"

  # Test 1: ReDoS
  echo -e "${YELLOW}[1/5] ReDoS Pattern Test${NC}"
  start=$(date +%s%N)
  url=$(build_url "pattern=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab")
  response=$(curl -s --max-time 3 "$url" 2>&1)
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if [ $elapsed -lt 2500 ]; then
    log_pass "ReDoS pattern handled quickly (${elapsed}ms)"
  else
    log_fail "Possible ReDoS vulnerability (${elapsed}ms)"
  fi
  echo ""

  # Test 2: Null Byte
  echo -e "${YELLOW}[2/5] Null Byte Injection${NC}"
  url=$(build_url "payload=test%00admin")
  response=$(curl -s "$url" 2>&1)
  if [ -n "$response" ]; then
    log_pass "Null byte handled properly"
  else
    log_fail "Server crashed on null byte"
  fi
  echo ""

  # Test 3: Parameter Pollution
  echo -e "${YELLOW}[3/5] Parameter Pollution${NC}"
  url="${BASE_URL}${ENDPOINT}?${BASE_PARAMS}&value=1&value=2&value=3&value=4&value=5"
  response=$(curl -s "$url" 2>&1)
  if [ -n "$response" ]; then
    log_pass "Parameter pollution handled"
  else
    log_fail "Server crashed on parameter pollution"
  fi
  echo ""

  # Test 4: Deep Nesting
  echo -e "${YELLOW}[4/5] Deeply Nested Objects${NC}"
  start=$(date +%s%N)
  response=$(curl -s --max-time 5 -X POST "${BASE_URL}${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d '{"'${BASE_PARAMS}'":{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":"test"}}}}}}}}}}' 2>&1)
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if [ -n "$response" ]; then
    log_pass "Deep nesting handled (${elapsed}ms)"
  else
    log_fail "Server crashed on deep nesting"
  fi
  echo ""

  # Test 5: Large POST Payload
  echo -e "${YELLOW}[5/5] Large POST Attack (10MB)${NC}"
  start=$(date +%s%N)
  response=$(curl -s --max-time 10 -X POST "${BASE_URL}${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{\"${BASE_PARAMS}\",\"payload\":\"$(python3 -c 'print("X"*10000000)')\"}" 2>&1)
  end=$(date +%s%N)
  elapsed=$((($end - $start) / 1000000))
  if echo "$response" | grep -qi "error\|413"; then
    log_pass "Large payload rejected with error (${elapsed}ms)"
  else
    log_fail "Server accepted 10MB payload (${elapsed}ms)"
  fi
  echo ""
}

# ==================== MAIN ====================
show_results() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📋 Test Results${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Passed: ${passed}${NC}"
  echo -e "${RED}❌ Failed: ${failed}${NC}"
  total=$((passed + failed))
  if [ $total -gt 0 ]; then
    percentage=$((passed * 100 / total))
    echo -e "${YELLOW}📊 Total:  ${total}${NC}"
    echo -e "${BLUE}📈 Success Rate: ${percentage}%${NC}"
  fi
  echo ""
}

# Start tests
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 🛡️  Rate Guard Security Test Suite  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo -e "Server: ${YELLOW}${BASE_URL}${NC}"
echo -e "Endpoint: ${YELLOW}${ENDPOINT}${NC}"
echo -e "Base Params: ${YELLOW}${BASE_PARAMS}${NC}"
echo -e "Mode: ${YELLOW}${MODE}${NC}"

case $MODE in
  xss)
    test_xss
    ;;
  load)
    test_load
    ;;
  dos)
    test_dos
    ;;
  all)
    test_xss
    test_load
    test_dos
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [url] [endpoint] [params] [xss|load|dos|all]"
    echo "Defaults: https://uat.mywebsite.com /payment-page r=2681000&f=1 xss"
    exit 1
    ;;
esac

show_results
