export function initVeilleur() {

        const MAX_ENCLOSURES = 6;
        const MAX_FUEL = 100000;
        const FUEL_INCREMENT = 10;
        const DEFAULT_ACCOUNT_NAME = "Personnage 1";
        const STORAGE_KEY = "le-veilleur-des-enclos-web";
        const TIER_MAX_VALUES = [40000, 70000, 90000, 100000];
        const FUEL_TIER_LABELS = ["T1", "T2", "T3", "T4"];

        const icons = {
          clock:
            '<span class="v-inline-icon v-timer-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>',
          play:
            '<span class="v-inline-icon v-control-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M8 5.5v13l10-6.5z" fill="currentColor"/></svg></span>',
          pause:
            '<span class="v-inline-icon v-control-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/><rect x="13.2" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/></svg></span>',
        };

        const dom = {
          accountsRoot: document.getElementById("veilleur-accounts-root"),
          contextMenu: document.getElementById("veilleur-context-menu"),
        };

        let state = loadState();
        let saveTimeoutId = null;
        let openContext = null;

        processAllRunningRows();
        render();
        window.setInterval(tick, 500);
        document.addEventListener("click", closeContextMenu);
        window.addEventListener("resize", closeContextMenu);
        window.addEventListener("scroll", closeContextMenu, true);

        function createDefaultState() {
          return {
            accounts: [createAccount(DEFAULT_ACCOUNT_NAME, 1)],
          };
        }

        function createAccount(name, activeEnclosures) {
          return {
            name,
            active_enclosures: clamp(activeEnclosures, 1, MAX_ENCLOSURES),
            rows: Array.from({ length: MAX_ENCLOSURES }, createRow),
          };
        }

        function createRow() {
          return {
            start: "0",
            target: "0",
            fuel_value: 0,
            remaining_points: 0,
            running: false,
            progress_started: false,
            unused: false,
            flash_finished: false,
            end_reason: null,
            lastTickAtMs: null,
          };
        }

        function loadState() {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
              return createDefaultState();
            }
            const payload = JSON.parse(raw);
            return normalizeState(payload);
          } catch (_error) {
            return createDefaultState();
          }
        }

        function normalizeState(payload) {
          const accounts = Array.isArray(payload && payload.accounts) ? payload.accounts : [];
          if (!accounts.length) {
            return createDefaultState();
          }

          return {
            accounts: accounts.map((account, index) => normalizeAccount(account, index)),
          };
        }

        function normalizeAccount(account, index) {
          const rowsSource = Array.isArray(account && account.rows) ? account.rows : [];
          const rows = Array.from({ length: MAX_ENCLOSURES }, (_, rowIndex) =>
            normalizeRow(rowsSource[rowIndex])
          );
          const active = clamp(
            Number(account && account.active_enclosures) || inferActiveEnclosures(rows),
            1,
            MAX_ENCLOSURES
          );

          return {
            name: sanitizeAccountName(account && account.name, index),
            active_enclosures: active,
            rows,
          };
        }

        function normalizeRow(row) {
          const normalized = createRow();
          normalized.start = String(row && row.start != null ? row.start : "0");
          normalized.target = String(row && row.target != null ? row.target : "0");
          normalized.fuel_value = clampFuel(Number(row && row.fuel_value) || 0);
          normalized.remaining_points = Math.max(0, Number(row && row.remaining_points) || 0);
          normalized.progress_started = Boolean(row && row.progress_started);
          normalized.unused = Boolean(row && row.unused);
          normalized.flash_finished = Boolean(row && row.flash_finished);
          normalized.end_reason = row && row.end_reason ? String(row.end_reason) : null;

          if (!rowHasValues(normalized)) {
            normalized.remaining_points = 0;
            normalized.progress_started = false;
            normalized.flash_finished = false;
            normalized.end_reason = null;
          } else if (!normalized.progress_started && !normalized.flash_finished) {
            normalized.remaining_points = requiredPoints(normalized);
          } else {
            normalized.remaining_points = clamp(
              normalized.remaining_points,
              0,
              requiredPoints(normalized)
            );
          }

          const savedWallTime = Number(row && row.last_tick_wall_time);
          if (row && row.running && Number.isFinite(savedWallTime) && !normalized.unused) {
            normalized.running = true;
            normalized.progress_started = true;
            normalized.lastTickAtMs = savedWallTime * 1000;
          }

          return normalized;
        }

        function inferActiveEnclosures(rows) {
          let highest = 1;
          rows.forEach((row, index) => {
            if (
              String(row.start || "").trim() ||
              String(row.target || "").trim() ||
              row.fuel_value ||
              row.progress_started ||
              row.running ||
              row.unused ||
              row.flash_finished
            ) {
              highest = index + 1;
            }
          });
          return highest;
        }

        function sanitizeAccountName(name, index) {
          const trimmed = String(name || "").trim();
          if (trimmed) {
            return trimmed;
          }
          return "Personnage " + (index + 1);
        }

        function nextAccountName() {
          if (!state.accounts.length) {
            return DEFAULT_ACCOUNT_NAME;
          }
          return "Personnage " + (state.accounts.length + 1);
        }

        function render() {
          const focusSnapshot = captureFocusState();

          if (!state.accounts.length) {
            dom.accountsRoot.innerHTML =
              '<div class="v-empty-state">Aucun compte. Ajoute un compte avec le bouton + du bandeau.</div>';
            return;
          }

          dom.accountsRoot.innerHTML = state.accounts
            .map((account, accountIndex) => renderAccount(account, accountIndex))
            .join("");

          bindEvents();
          restoreFocusState(focusSnapshot);
        }

        function renderAccount(account, accountIndex) {
          const activeRows = account.rows.slice(0, account.active_enclosures);
          return `
            <section class="v-account-panel" data-account-index="${accountIndex}">
              <header class="v-account-header">
                <button type="button" class="v-account-title" data-action="rename-account" data-account-index="${accountIndex}">
                  ${escapeHtml(account.name)}
                </button>
                <div class="v-header-controls">
                  <button type="button" class="v-header-button v-row-button" data-action="add-row" data-account-index="${accountIndex}" ${account.active_enclosures >= MAX_ENCLOSURES ? "disabled" : ""}>E+</button>
                  <button type="button" class="v-header-button v-row-button" data-action="remove-row" data-account-index="${accountIndex}">E-</button>
                  <button type="button" class="v-header-button" data-action="remove-account" data-account-index="${accountIndex}">-</button>
                </div>
              </header>
              <div class="v-enclos-grid">
                ${activeRows.map((row, rowIndex) => renderRow(accountIndex, rowIndex, row)).join("")}
              </div>
            </section>
          `;
        }

        function renderRow(accountIndex, rowIndex, row) {
          const timerClass = getTimerClass(row);
          const control = getControlMeta(row);
          const fuelPercent = clamp((row.fuel_value / MAX_FUEL) * 100, 0, 100);

          return `
            <div class="v-enclos-card ${row.unused ? "unused" : ""} ${row.flash_finished ? "finished" : ""} ${row.running ? "running" : ""}"
              data-action-context data-account-index="${accountIndex}" data-row-index="${rowIndex}"
              data-role="row" data-account-index="${accountIndex}" data-row-index="${rowIndex}">

              <div class="v-card-header">
                <span class="v-enclos-num">${rowIndex + 1}</span>
                <span class="v-fuel-step">${getFuelStep(row.fuel_value)}/10s</span>
              </div>

              <div class="v-inputs-row">
                <div class="v-input-group">
                  <label class="v-input-label">Actuel</label>
                  <input type="text" inputmode="numeric"
                    class="v-value-input"
                    data-role="start-input"
                    data-account-index="${accountIndex}"
                    data-row-index="${rowIndex}"
                    value="${escapeAttribute(row.start)}"
                    ${row.running || row.flash_finished ? "disabled" : ""} />
                </div>
                <span class="v-arrow">→</span>
                <div class="v-input-group">
                  <label class="v-input-label">Cible</label>
                  <input type="text" inputmode="numeric"
                    class="v-value-input"
                    data-role="target-input"
                    data-account-index="${accountIndex}"
                    data-row-index="${rowIndex}"
                    value="${escapeAttribute(row.target)}"
                    ${row.running || row.flash_finished ? "disabled" : ""} />
                </div>
              </div>

              <div class="v-gauge-wrap">
                <div class="v-fuel-gauge">
                  <div class="v-fuel-gauge-inner"></div>
                  <div class="v-fuel-fill" style="--fuel-scale: ${(fuelPercent / 100).toFixed(4)}"></div>
                  ${[40, 70, 90].map(pct => `<div class="v-fuel-cut" style="left: calc(${pct}% - 0.5px)"></div>`).join("")}
                  <input type="range" class="v-fuel-slider"
                    data-role="fuel-slider"
                    data-account-index="${accountIndex}"
                    data-row-index="${rowIndex}"
                    min="0" max="${MAX_FUEL}" step="${FUEL_INCREMENT}"
                    value="${row.fuel_value}"
                    ${row.running ? "disabled" : ""} />
                </div>
              </div>

              <div class="v-tier-row">
                ${TIER_MAX_VALUES.map((cap, tierIndex) => renderTierButton(accountIndex, rowIndex, row, cap, tierIndex + 1)).join("")}
              </div>
              <div class="v-fuel-entry-row">
                <input type="text" inputmode="numeric"
                  class="v-fuel-entry"
                  data-role="fuel-input"
                  data-account-index="${accountIndex}"
                  data-row-index="${rowIndex}"
                  value="${escapeAttribute(formatNumber(row.fuel_value))}" />
              </div>

              <div class="v-card-footer">
                <button type="button" class="v-timer-button ${timerClass}"
                  data-action="toggle-row"
                  data-account-index="${accountIndex}"
                  data-row-index="${rowIndex}">
                  ${icons.clock}
                  <span class="v-timer-value">${formatDuration(remainingSeconds(row))}</span>
                </button>
                <button type="button" class="v-control-button ${row.running ? "active" : ""}"
                  data-action="toggle-row"
                  data-account-index="${accountIndex}"
                  data-row-index="${rowIndex}">
                  ${control.icon}
                </button>
              </div>
            </div>
          `;
        }

        function renderTierButton(accountIndex, rowIndex, row, cap, tierIndex) {
          const active = getFuelTierIndex(row.fuel_value) === tierIndex && row.fuel_value > 0;
          return `
            <button type="button"
              class="v-tier-button ${active ? "active" : ""}"
              data-action="set-tier"
              data-account-index="${accountIndex}"
              data-row-index="${rowIndex}"
              data-tier-cap="${cap}">
              <span class="v-tier-label">${FUEL_TIER_LABELS[tierIndex - 1]}</span>
            </button>
          `;
        }

        function bindEvents() {
          document.querySelectorAll("[data-action]").forEach((button) => {
            if (button.dataset.action === "rename-account") {
              button.addEventListener("dblclick", handleAction);
            } else {
              button.addEventListener("click", handleAction);
            }
          });

          document.querySelectorAll("[data-role='start-input'], [data-role='target-input']").forEach((input) => {
            input.addEventListener("input", handleValueInput);
            input.addEventListener("blur", handleValueBlur);
          });

          document.querySelectorAll("[data-role='fuel-input']").forEach((input) => {
            input.addEventListener("blur", handleFuelBlur);
            input.addEventListener("keydown", (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleFuelBlur(event);
              }
            });
          });

          document.querySelectorAll("[data-role='fuel-slider']").forEach((slider) => {
            slider.addEventListener("input", handleFuelSlider);
          });

          document.querySelectorAll("[data-role='row']").forEach((rowElement) => {
            rowElement.addEventListener("contextmenu", openRowContextMenu);
          });
        }

        function handleAction(event) {
          event.stopPropagation();
          const action = event.currentTarget.dataset.action;
          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex =
            event.currentTarget.dataset.rowIndex != null
              ? Number(event.currentTarget.dataset.rowIndex)
              : null;

          switch (action) {
            case "add-row":
              addRow(accountIndex);
              break;
            case "remove-row":
              removeRow(accountIndex);
              break;
            case "add-account":
              state.accounts.push(createAccount(nextAccountName(), 1));
              break;
            case "remove-account":
              removeAccount(accountIndex);
              break;
            case "rename-account":
              renameAccount(accountIndex);
              break;
            case "toggle-row":
              activateRowControl(accountIndex, rowIndex);
              break;
            case "set-tier":
              setFuelValue(getRow(accountIndex, rowIndex), Number(event.currentTarget.dataset.tierCap));
              break;
            default:
              return;
          }

          saveAndRender();
        }

        function handleValueInput(event) {
          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex = Number(event.currentTarget.dataset.rowIndex);
          const row = getRow(accountIndex, rowIndex);

          if (event.currentTarget.dataset.role === "start-input") {
            row.start = event.currentTarget.value;
          } else {
            row.target = event.currentTarget.value;
          }

          resetRuntimeState(row);
          scheduleSave();
        }

        function handleValueBlur(event) {
          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex = Number(event.currentTarget.dataset.rowIndex);
          const row = getRow(accountIndex, rowIndex);
          const parsed = parseNumber(event.currentTarget.value);

          if (parsed !== null) {
            if (event.currentTarget.dataset.role === "start-input") {
              row.start = formatNumber(parsed);
            } else {
              row.target = formatNumber(parsed);
            }
          }

          resetRuntimeState(row);
          saveAndRender();
        }

        function handleFuelBlur(event) {
          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex = Number(event.currentTarget.dataset.rowIndex);
          const row = getRow(accountIndex, rowIndex);
          const parsed = parseNumber(event.currentTarget.value);

          if (parsed === null) {
            saveAndRender();
            return;
          }

          setFuelValue(row, parsed);
          saveAndRender();
        }

        function handleFuelSlider(event) {
          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex = Number(event.currentTarget.dataset.rowIndex);
          const row = getRow(accountIndex, rowIndex);
          setFuelValue(row, Number(event.currentTarget.value));
          saveAndRender();
        }

        function addRow(accountIndex) {
          const account = state.accounts[accountIndex];
          if (account && account.active_enclosures < MAX_ENCLOSURES) {
            account.active_enclosures += 1;
          }
        }

        function removeRow(accountIndex) {
          const account = state.accounts[accountIndex];
          if (!account || account.active_enclosures <= 1) {
            return;
          }
          const row = account.rows[account.active_enclosures - 1];
          clearRow(row);
          account.active_enclosures -= 1;
        }

        function removeAccount(accountIndex) {
          if (state.accounts.length <= 1) {
            window.alert("Il faut garder au moins un compte.");
            return;
          }
          const account = state.accounts[accountIndex];
          if (!account) {
            return;
          }
          if (!window.confirm("Supprimer " + account.name + " ?")) {
            return;
          }
          state.accounts.splice(accountIndex, 1);
        }

        function renameAccount(accountIndex) {
          const account = state.accounts[accountIndex];
          if (!account) {
            return;
          }
          const value = window.prompt("Nom du compte :", account.name);
          if (!value) {
            return;
          }
          account.name = sanitizeAccountName(value, accountIndex);
        }

        function activateRowControl(accountIndex, rowIndex) {
          const row = getRow(accountIndex, rowIndex);
          if (!row || row.unused) {
            return;
          }

          commitFuelInput(accountIndex, rowIndex);

          if (row.flash_finished && !row.running) {
            stopAlert(row);
            return;
          }

          if (row.running) {
            pauseRow(row);
            return;
          }

          if (!rowHasValues(row)) {
            window.alert("Renseigne Actuel et Cible.");
            return;
          }

          if (row.remaining_points <= 0) {
            row.remaining_points = requiredPoints(row);
          }

          if (row.remaining_points <= 0) {
            row.running = false;
            row.lastTickAtMs = null;
            row.flash_finished = false;
            row.end_reason = null;
            row.progress_started = false;
            return;
          }

          if (row.fuel_value <= 0) {
            focusFuelInput(accountIndex, rowIndex);
            return;
          }

          row.flash_finished = false;
          row.end_reason = null;
          row.running = true;
          row.progress_started = true;
          row.lastTickAtMs = Date.now();
        }

        function pauseRow(row) {
          processRowTicks(row);
          row.running = false;
          row.lastTickAtMs = null;
        }

        function stopAlert(row) {
          row.running = false;
          row.lastTickAtMs = null;
          row.flash_finished = false;
          row.end_reason = null;
          row.progress_started = false;
          row.remaining_points = requiredPoints(row);
        }

        function clearRow(row) {
          row.start = "0";
          row.target = "0";
          row.fuel_value = 0;
          resetRuntimeState(row);
        }

        function toggleUnused(row) {
          row.unused = !row.unused;
          if (row.unused) {
            row.running = false;
            row.lastTickAtMs = null;
          } else if (!row.progress_started) {
            row.remaining_points = requiredPoints(row);
          }
          row.flash_finished = false;
          row.end_reason = null;
        }

        function resetRuntimeState(row) {
          row.running = false;
          row.lastTickAtMs = null;
          row.flash_finished = false;
          row.end_reason = null;
          row.progress_started = false;
          row.remaining_points = requiredPoints(row);
        }

        function clearRuntime(row) {
          row.running = false;
          row.lastTickAtMs = null;
          row.progress_started = false;
          row.flash_finished = false;
          row.end_reason = null;
          row.remaining_points = requiredPoints(row);
        }

        function setFuelValue(row, value) {
          if (row.running) {
            processRowTicks(row);
          }

          row.fuel_value = clampFuel(value);
          row.flash_finished = false;
          row.end_reason = null;

          if (!row.progress_started) {
            row.remaining_points = requiredPoints(row);
          } else if (row.fuel_value <= 0) {
            row.running = false;
            row.lastTickAtMs = null;
          } else if (row.running) {
            row.lastTickAtMs = Date.now();
          }
        }

        function requiredPoints(row) {
          const values = getRowValues(row);
          if (!values) {
            return 0;
          }
          return Math.abs(values.target - values.start);
        }

        function rowHasValues(row) {
          return getRowValues(row) !== null;
        }

        function getRowValues(row) {
          const start = parseNumber(row.start);
          const target = parseNumber(row.target);
          if (start === null || target === null) {
            return null;
          }
          return { start, target };
        }

        function remainingSeconds(row) {
          const pointsLeft =
            row.progress_started || row.running ? row.remaining_points : requiredPoints(row);
          const result = simulateProgress(row.fuel_value, pointsLeft);
          let total = result.elapsedSeconds;

          if (row.running && row.lastTickAtMs != null) {
            const elapsed = Math.max(0, (Date.now() - row.lastTickAtMs) / 1000);
            total = Math.max(0, Math.ceil(total - elapsed));
          }

          return total;
        }

        function processAllRunningRows() {
          state.accounts.forEach((account) => {
            account.rows.forEach((row) => {
              if (row.running) {
                processRowTicks(row);
              }
            });
          });
        }

        function tick() {
          let dirty = false;
          let needsTimerRefresh = false;

          state.accounts.forEach((account) => {
            account.rows.slice(0, account.active_enclosures).forEach((row) => {
              if (row.running) {
                needsTimerRefresh = true;
                dirty = processRowTicks(row) || dirty;
              } else if (row.flash_finished) {
                needsTimerRefresh = true;
              }
            });
          });

          if (dirty) {
            scheduleSave();
          }

          if (document.activeElement instanceof HTMLInputElement) {
            return;
          }

          if (dirty || needsTimerRefresh) {
            render();
          }
        }

        function processRowTicks(row) {
          if (!row.running || row.lastTickAtMs == null) {
            return false;
          }

          const elapsedMs = Math.max(0, Date.now() - row.lastTickAtMs);
          const cycles = Math.floor(elapsedMs / 10000);
          if (cycles <= 0) {
            return false;
          }

          let progressed = 0;
          const startingFuel = row.fuel_value;

          for (let index = 0; index < cycles; index += 1) {
            if (row.remaining_points <= 0) {
              row.running = false;
              row.flash_finished = true;
              row.end_reason = "target_reached";
              break;
            }

            const step = getFuelStep(row.fuel_value);
            if (step <= 0) {
              row.running = false;
              row.flash_finished = true;
              row.end_reason = "fuel_empty";
              break;
            }

            progressed += Math.min(step, row.remaining_points);
            row.fuel_value = Math.max(0, row.fuel_value - step);
            row.remaining_points = Math.max(0, row.remaining_points - step);

            if (row.remaining_points <= 0) {
              row.running = false;
              row.flash_finished = true;
              row.end_reason = "target_reached";
              break;
            }

            if (row.fuel_value <= 0) {
              row.running = false;
              row.flash_finished = true;
              row.end_reason = "fuel_empty";
              break;
            }
          }

          advanceStart(row, progressed);

          if (row.running) {
            row.lastTickAtMs += cycles * 10000;
          } else {
            row.lastTickAtMs = null;
          }

          return row.fuel_value !== startingFuel || progressed > 0 || row.flash_finished;
        }

        function advanceStart(row, amount) {
          if (amount <= 0) {
            return;
          }

          const values = getRowValues(row);
          if (!values || values.start === values.target) {
            return;
          }

          const direction = values.target > values.start ? 1 : -1;
          const nextValue =
            values.start + direction * Math.min(amount, Math.abs(values.target - values.start));
          row.start = formatNumber(nextValue);
        }

        function simulateProgress(fuelValue, remainingPoints) {
          let fuelLeft = clampFuel(fuelValue);
          let pointsLeft = Math.max(0, Number(remainingPoints) || 0);
          let elapsedSeconds = 0;

          [
            [90000, 40],
            [70000, 30],
            [40000, 20],
            [0, 10],
          ].forEach(([lowerBound, step]) => {
            if (fuelLeft <= 0 || pointsLeft <= 0 || fuelLeft <= lowerBound) {
              return;
            }
            const fuelTicks = Math.ceil((fuelLeft - lowerBound) / step);
            const pointTicks = Math.ceil(pointsLeft / step);
            const ticks = Math.min(fuelTicks, pointTicks);
            fuelLeft = Math.max(0, fuelLeft - ticks * step);
            pointsLeft = Math.max(0, pointsLeft - ticks * step);
            elapsedSeconds += ticks * 10;
          });

          return { elapsedSeconds, fuelLeft, pointsLeft };
        }

        function getFuelStep(fuelValue) {
          const fuel = clampFuel(fuelValue);
          if (fuel <= 0) {
            return 0;
          }
          if (fuel <= 40000) {
            return 10;
          }
          if (fuel <= 70000) {
            return 20;
          }
          if (fuel <= 90000) {
            return 30;
          }
          return 40;
        }

        function getFuelTierIndex(fuelValue) {
          const fuel = clampFuel(fuelValue);
          if (fuel <= 0) {
            return 0;
          }
          if (fuel <= 40000) {
            return 1;
          }
          if (fuel <= 70000) {
            return 2;
          }
          if (fuel <= 90000) {
            return 3;
          }
          return 4;
        }

        function getTimerClass(row) {
          if (row.flash_finished) {
            return "done";
          }
          const seconds = remainingSeconds(row);
          if (seconds === 0) {
            return "";
          }
          if (seconds <= 180) {
            return "short";
          }
          if (seconds <= 480) {
            return "medium";
          }
          return "long";
        }

        function getControlMeta(row) {
          if (row.running) {
            return { label: "Pause", icon: icons.pause };
          }
          if (row.flash_finished) {
            return { label: "Arreter l'alerte", icon: icons.pause };
          }
          return { label: "Demarrer", icon: icons.play };
        }

        function commitFuelInput(accountIndex, rowIndex) {
          const input = document.querySelector(
            "[data-role='fuel-input'][data-account-index='" +
              accountIndex +
              "'][data-row-index='" +
              rowIndex +
              "']"
          );
          if (!(input instanceof HTMLInputElement)) {
            return;
          }
          const parsed = parseNumber(input.value);
          if (parsed === null) {
            return;
          }
          setFuelValue(getRow(accountIndex, rowIndex), parsed);
        }

        function focusFuelInput(accountIndex, rowIndex) {
          const input = document.querySelector(
            "[data-role='fuel-input'][data-account-index='" +
              accountIndex +
              "'][data-row-index='" +
              rowIndex +
              "']"
          );
          if (!(input instanceof HTMLInputElement)) {
            return;
          }
          input.focus();
          input.select();
        }

        function getRow(accountIndex, rowIndex) {
          return state.accounts[accountIndex].rows[rowIndex];
        }

        function parseNumber(rawValue) {
          const cleaned = String(rawValue || "")
            .trim()
            .replace(/[\s\u00a0\u202f_,]/g, "");

          if (!cleaned) {
            return null;
          }

          const negative = cleaned.startsWith("-");
          const digits = negative ? cleaned.slice(1) : cleaned;
          if (!digits || /[^0-9]/.test(digits)) {
            return null;
          }

          return Number(cleaned);
        }

        function formatNumber(value) {
          if (value == null) {
            return "";
          }
          return Number(value).toLocaleString("fr-FR");
        }

        function formatDuration(totalSeconds) {
          const safe = Math.max(0, Math.floor(totalSeconds));
          const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
          const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
          const seconds = String(safe % 60).padStart(2, "0");
          return hours + ":" + minutes + ":" + seconds;
        }

        function clampFuel(value) {
          const numeric = Number(value) || 0;
          return clamp(Math.round(numeric / FUEL_INCREMENT) * FUEL_INCREMENT, 0, MAX_FUEL);
        }

        function clamp(value, min, max) {
          return Math.max(min, Math.min(max, value));
        }

        function buildStoragePayload() {
          return {
            accounts: state.accounts.map((account) => ({
              name: account.name,
              active_enclosures: account.active_enclosures,
              rows: account.rows.map((row) => ({
                start: row.start,
                target: row.target,
                fuel_value: row.fuel_value,
                remaining_points: row.remaining_points,
                running: row.running,
                progress_started: row.progress_started,
                unused: row.unused,
                flash_finished: row.flash_finished,
                end_reason: row.end_reason,
                last_tick_wall_time:
                  row.running && row.lastTickAtMs != null ? row.lastTickAtMs / 1000 : null,
              })),
            })),
          };
        }

        function scheduleSave() {
          if (saveTimeoutId != null) {
            window.clearTimeout(saveTimeoutId);
          }

          saveTimeoutId = window.setTimeout(() => {
            saveTimeoutId = null;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStoragePayload()));
            } catch (_error) {
              // Ignore localStorage errors silently.
            }
          }, 200);
        }

        function saveAndRender() {
          scheduleSave();
          render();
        }

        function captureFocusState() {
          const active = document.activeElement;
          if (!(active instanceof HTMLInputElement) || !active.dataset.role) {
            return null;
          }
          return {
            role: active.dataset.role,
            accountIndex: active.dataset.accountIndex,
            rowIndex: active.dataset.rowIndex,
            selectionStart: active.selectionStart,
            selectionEnd: active.selectionEnd,
          };
        }

        function restoreFocusState(snapshot) {
          if (!snapshot) {
            return;
          }

          const selector = [
            "[data-role='" + snapshot.role + "']",
            snapshot.accountIndex != null
              ? "[data-account-index='" + snapshot.accountIndex + "']"
              : "",
            snapshot.rowIndex != null ? "[data-row-index='" + snapshot.rowIndex + "']" : "",
          ].join("");

          const input = document.querySelector(selector);
          if (!(input instanceof HTMLInputElement)) {
            return;
          }

          input.focus({ preventScroll: true });
          if (snapshot.selectionStart != null && snapshot.selectionEnd != null) {
            try {
              input.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
            } catch (_error) {
              return;
            }
          }
        }

        function openRowContextMenu(event) {
          event.preventDefault();
          event.stopPropagation();

          const accountIndex = Number(event.currentTarget.dataset.accountIndex);
          const rowIndex = Number(event.currentTarget.dataset.rowIndex);
          const row = getRow(accountIndex, rowIndex);

          openContext = { accountIndex, rowIndex };

          const toggleLabel = row.running ? "Arreter l'enclos" : "Demarrer l'enclos";
          const unusedLabel = row.unused ? "Reactiver la ligne" : "Griser la ligne";

          dom.contextMenu.innerHTML = [
            `<button type="button" class="v-context-button" data-menu-action="toggle">${toggleLabel}</button>`,
            `<button type="button" class="v-context-button" data-menu-action="reset-line">Reinitialiser la ligne</button>`,
            `<button type="button" class="v-context-button" data-menu-action="toggle-unused">${unusedLabel}</button>`,
            `<button type="button" class="v-context-button" data-menu-action="reset-runtime">Remettre le chrono a zero</button>`,
          ].join("");

          dom.contextMenu.hidden = false;

          const maxLeft = window.innerWidth - 230;
          const maxTop = window.innerHeight - 210;
          dom.contextMenu.style.left = Math.min(event.clientX, maxLeft) + "px";
          dom.contextMenu.style.top = Math.min(event.clientY, maxTop) + "px";

          dom.contextMenu.querySelectorAll("[data-menu-action]").forEach((button) => {
            button.addEventListener("click", handleContextAction);
          });
        }

        function handleContextAction(event) {
          event.stopPropagation();
          if (!openContext) {
            closeContextMenu();
            return;
          }

          const { accountIndex, rowIndex } = openContext;
          const row = getRow(accountIndex, rowIndex);

          switch (event.currentTarget.dataset.menuAction) {
            case "toggle":
              activateRowControl(accountIndex, rowIndex);
              break;
            case "reset-line":
              clearRow(row);
              break;
            case "toggle-unused":
              toggleUnused(row);
              break;
            case "reset-runtime":
              clearRuntime(row);
              break;
            default:
              break;
          }

          closeContextMenu();
          saveAndRender();
        }

        function closeContextMenu() {
          openContext = null;
          dom.contextMenu.hidden = true;
          dom.contextMenu.innerHTML = "";
        }

        function escapeHtml(value) {
          return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
        }

        function escapeAttribute(value) {
          return escapeHtml(value);
        }

        // Expose add account globally for React toolbar
        window.veilleurAddAccount = function() {
          state.accounts.push(createAccount(nextAccountName(), 1));
          saveAndRender();
        };
      
}