# ============================================================
#  Meeyland – Mac Development Makefile
#  Backend  : meeyland-be  (.NET 10 / ASP.NET Core)
#  Frontend : meeyland-fe  (Next.js)
# ============================================================

BE_DIR  := meeyland-be
FE_DIR  := meeyland-fe

BE_LOG  := /tmp/meeyland-be.log
FE_LOG  := /tmp/meeyland-fe.log

BE_PID  := /tmp/meeyland-be.pid
FE_PID  := /tmp/meeyland-fe.pid

# ── Colors ──────────────────────────────────────────────────
BOLD   := \033[1m
GREEN  := \033[0;32m
CYAN   := \033[0;36m
YELLOW := \033[0;33m
RED    := \033[0;31m
RESET  := \033[0m

.DEFAULT_GOAL := help

# ── Help ────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)  🏠 Meeyland – Dev Commands$(RESET)"
	@echo "$(CYAN)  ─────────────────────────────────────────────$(RESET)"
	@echo "  $(GREEN)make install$(RESET)      Install all dependencies (BE + FE)"
	@echo "  $(GREEN)make start$(RESET)        Start both BE and FE in the background"
	@echo "  $(GREEN)make start-be$(RESET)     Start backend only"
	@echo "  $(GREEN)make start-fe$(RESET)     Start frontend only"
	@echo "  $(GREEN)make stop$(RESET)         Stop both BE and FE"
	@echo "  $(GREEN)make stop-be$(RESET)      Stop backend only"
	@echo "  $(GREEN)make stop-fe$(RESET)      Stop frontend only"
	@echo "  $(GREEN)make restart$(RESET)      Restart both services"
	@echo "  $(GREEN)make status$(RESET)       Show running status of services"
	@echo "  $(GREEN)make logs$(RESET)         Tail logs from both services"
	@echo "  $(GREEN)make logs-be$(RESET)      Tail backend logs"
	@echo "  $(GREEN)make logs-fe$(RESET)      Tail frontend logs"
	@echo "  $(GREEN)make build-be$(RESET)     Build the backend"
	@echo "  $(GREEN)make build-fe$(RESET)     Build the frontend (production)"
	@echo "  $(GREEN)make clean$(RESET)        Remove build artifacts & stop services"
	@echo ""

# ── Install ─────────────────────────────────────────────────
.PHONY: install
install: install-be install-fe
	@echo "$(GREEN)✅  All dependencies installed.$(RESET)"

.PHONY: install-be
install-be:
	@echo "$(CYAN)📦  Restoring .NET packages…$(RESET)"
	cd $(BE_DIR) && dotnet restore

.PHONY: install-fe
install-fe:
	@echo "$(CYAN)📦  Installing Node packages…$(RESET)"
	cd $(FE_DIR) && npm install

# ── Start ────────────────────────────────────────────────────
.PHONY: start
start: start-be start-fe
	@echo ""
	@echo "$(GREEN)$(BOLD)🚀  Meeyland is running!$(RESET)"
	@echo "   Backend  → http://localhost:5229  (logs: $(BE_LOG))"
	@echo "   Frontend → http://localhost:3000  (logs: $(FE_LOG))"
	@echo ""
	@echo "   Run $(CYAN)make logs$(RESET) to follow both, or $(CYAN)make stop$(RESET) to shut down."

.PHONY: start-be
start-be:
	@if [ -f $(BE_PID) ] && kill -0 $$(cat $(BE_PID)) 2>/dev/null; then \
		echo "$(YELLOW)⚠️   Backend is already running (PID $$(cat $(BE_PID))).$(RESET)"; \
	else \
		echo "$(CYAN)▶   Starting backend…$(RESET)"; \
		cd $(BE_DIR) && nohup dotnet run > $(BE_LOG) 2>&1 & echo $$! > $(BE_PID); \
		echo "$(GREEN)✅  Backend started (PID $$(cat $(BE_PID))).$(RESET)"; \
	fi

.PHONY: start-fe
start-fe:
	@if [ -f $(FE_PID) ] && kill -0 $$(cat $(FE_PID)) 2>/dev/null; then \
		echo "$(YELLOW)⚠️   Frontend is already running (PID $$(cat $(FE_PID))).$(RESET)"; \
	else \
		echo "$(CYAN)▶   Starting frontend…$(RESET)"; \
		cd $(FE_DIR) && nohup npm run dev > $(FE_LOG) 2>&1 & echo $$! > $(FE_PID); \
		echo "$(GREEN)✅  Frontend started (PID $$(cat $(FE_PID))).$(RESET)"; \
	fi

# ── Stop ─────────────────────────────────────────────────────
.PHONY: stop
stop: stop-be stop-fe
	@echo "$(GREEN)🛑  All services stopped.$(RESET)"

.PHONY: stop-be
stop-be:
	@if [ -f $(BE_PID) ] && kill -0 $$(cat $(BE_PID)) 2>/dev/null; then \
		echo "$(CYAN)⏹   Stopping backend (PID $$(cat $(BE_PID)))…$(RESET)"; \
		kill $$(cat $(BE_PID)) && rm -f $(BE_PID); \
		echo "$(GREEN)✅  Backend stopped.$(RESET)"; \
	else \
		echo "$(YELLOW)⚠️   Backend is not running.$(RESET)"; \
		rm -f $(BE_PID); \
	fi

.PHONY: stop-fe
stop-fe:
	@if [ -f $(FE_PID) ] && kill -0 $$(cat $(FE_PID)) 2>/dev/null; then \
		echo "$(CYAN)⏹   Stopping frontend (PID $$(cat $(FE_PID)))…$(RESET)"; \
		kill $$(cat $(FE_PID)) && rm -f $(FE_PID); \
		echo "$(GREEN)✅  Frontend stopped.$(RESET)"; \
	else \
		echo "$(YELLOW)⚠️   Frontend is not running.$(RESET)"; \
		rm -f $(FE_PID); \
	fi

# ── Restart ──────────────────────────────────────────────────
.PHONY: restart
restart: stop start

.PHONY: restart-be
restart-be: stop-be start-be

.PHONY: restart-fe
restart-fe: stop-fe start-fe

# ── Status ───────────────────────────────────────────────────
.PHONY: status
status:
	@echo ""
	@echo "$(BOLD)$(CYAN)  Service Status$(RESET)"
	@echo "$(CYAN)  ──────────────────────$(RESET)"
	@if [ -f $(BE_PID) ] && kill -0 $$(cat $(BE_PID)) 2>/dev/null; then \
		echo "  Backend  $(GREEN)● RUNNING$(RESET) (PID $$(cat $(BE_PID)))"; \
	else \
		echo "  Backend  $(RED)○ STOPPED$(RESET)"; \
	fi
	@if [ -f $(FE_PID) ] && kill -0 $$(cat $(FE_PID)) 2>/dev/null; then \
		echo "  Frontend $(GREEN)● RUNNING$(RESET) (PID $$(cat $(FE_PID)))"; \
	else \
		echo "  Frontend $(RED)○ STOPPED$(RESET)"; \
	fi
	@echo ""

# ── Logs ─────────────────────────────────────────────────────
.PHONY: logs
logs:
	@echo "$(CYAN)📋  Tailing logs (Ctrl+C to exit)…$(RESET)"
	tail -f $(BE_LOG) $(FE_LOG)

.PHONY: logs-be
logs-be:
	@echo "$(CYAN)📋  Backend logs (Ctrl+C to exit)…$(RESET)"
	tail -f $(BE_LOG)

.PHONY: logs-fe
logs-fe:
	@echo "$(CYAN)📋  Frontend logs (Ctrl+C to exit)…$(RESET)"
	tail -f $(FE_LOG)

# ── Build ────────────────────────────────────────────────────
.PHONY: build-be
build-be:
	@echo "$(CYAN)🔨  Building backend…$(RESET)"
	cd $(BE_DIR) && dotnet build --configuration Release
	@echo "$(GREEN)✅  Backend build complete.$(RESET)"

.PHONY: build-fe
build-fe:
	@echo "$(CYAN)🔨  Building frontend…$(RESET)"
	cd $(FE_DIR) && npm run build
	@echo "$(GREEN)✅  Frontend build complete.$(RESET)"

# ── Clean ────────────────────────────────────────────────────
.PHONY: clean
clean: stop
	@echo "$(CYAN)🧹  Cleaning build artifacts…$(RESET)"
	cd $(BE_DIR) && dotnet clean
	rm -rf $(FE_DIR)/.next $(FE_DIR)/node_modules/.cache
	@echo "$(GREEN)✅  Clean complete.$(RESET)"
