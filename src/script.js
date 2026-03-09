/* ================================================================
   Smart Home Dashboard — App Logic + WebMCP Tool Registration
   ================================================================ */

const app = {
  /* ── State ────────────────────────────────────────────── */
  state: {
    lights: {
      living_room: { on: false, color: "#ffd54f" },
      bedroom:     { on: false, color: "#ffd54f" },
    },
    thermostat: { temperature: 72 },
    locks: {
      front_door: { locked: false },
    },
  },

  VALID_LIGHT_IDS: ["living_room", "bedroom"],
  VALID_LOCK_IDS:  ["front_door"],
  TEMP_MIN: 50,
  TEMP_MAX: 90,
  SCENES: ["morning", "night", "away", "movie"],

  /* ── Rendering ────────────────────────────────────────── */
  render() {
    this.renderLights();
    this.renderThermostat();
    this.renderLocks();
  },

  renderLights() {
    for (const id of this.VALID_LIGHT_IDS) {
      const light = this.state.lights[id];
      const domId  = id.replace("_", "-");
      const card   = document.getElementById(`card-${domId}`);
      const status = document.getElementById(`status-${domId}`);
      const dot    = document.getElementById(`color-dot-${domId}`);
      const bulb   = document.getElementById(`bulb-${domId}`);

      card.classList.toggle("is-on", light.on);
      status.textContent = light.on ? "On" : "Off";
      dot.style.background = light.color;

      if (light.on) {
        bulb.style.fill = light.color;
      } else {
        bulb.style.fill = "";
      }
    }
  },

  renderThermostat() {
    const temp   = this.state.thermostat.temperature;
    const status = document.getElementById("status-thermostat");
    const fill   = document.getElementById("thermo-fill");
    const bulb   = document.getElementById("thermo-bulb");

    status.innerHTML = `${temp} &deg;F`;

    const pct = Math.max(0, Math.min(1, (temp - this.TEMP_MIN) / (this.TEMP_MAX - this.TEMP_MIN)));
    const maxH = 32;
    const h = 4 + pct * (maxH - 4);
    fill.setAttribute("height", h);
    fill.setAttribute("y", 52 - h);

    const hue = 220 - pct * 220;
    const color = `hsl(${hue}, 80%, 50%)`;
    fill.style.fill = color;
    bulb.style.fill = color;
  },

  renderLocks() {
    for (const id of this.VALID_LOCK_IDS) {
      const lock   = this.state.locks[id];
      const domId  = id.replace("_", "-");
      const card   = document.getElementById(`card-${domId}`);
      const status = document.getElementById(`status-${domId}`);

      card.classList.toggle("is-locked", lock.locked);
      status.textContent = lock.locked ? "Locked" : "Unlocked";
    }
  },

  /* ── Activity Log ─────────────────────────────────────── */
  log(message) {
    const ul = document.getElementById("activity-log");
    const li = document.createElement("li");
    const now = new Date().toLocaleTimeString();
    li.innerHTML = `<span class="log-time">${now}</span>${message}`;
    ul.prepend(li);
    while (ul.children.length > 50) ul.lastChild.remove();
  },

  flash(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove("agent-flash");
    void el.offsetWidth;
    el.classList.add("agent-flash");
  },

  /* ── App Actions ──────────────────────────────────────── */
  toggleLight(lightId) {
    if (!this.VALID_LIGHT_IDS.includes(lightId)) return;
    const light = this.state.lights[lightId];
    light.on = !light.on;
    this.renderLights();
    const label = lightId.replace("_", " ");
    this.log(`${label} light turned ${light.on ? "on" : "off"}.`);
    this.flash(`card-${lightId.replace("_", "-")}`);
  },

  setTemperature(degrees) {
    const temp = Math.round(Math.max(this.TEMP_MIN, Math.min(this.TEMP_MAX, degrees)));
    this.state.thermostat.temperature = temp;
    this.renderThermostat();
    this.log(`Thermostat set to ${temp} °F.`);
    this.flash("card-thermostat");
  },

  setLightColor(lightId, color) {
    if (!this.VALID_LIGHT_IDS.includes(lightId)) return;
    this.state.lights[lightId].color = color;
    this.renderLights();
    const label = lightId.replace("_", " ");
    this.log(`${label} light color changed to ${color}.`);
    this.flash(`card-${lightId.replace("_", "-")}`);
  },

  toggleLock(lockId) {
    if (!this.VALID_LOCK_IDS.includes(lockId)) return;
    const lock = this.state.locks[lockId];
    lock.locked = !lock.locked;
    this.renderLocks();
    const label = lockId.replace("_", " ");
    this.log(`${label} ${lock.locked ? "locked" : "unlocked"}.`);
    this.flash(`card-${lockId.replace("_", "-")}`);
  },

  triggerScene(scene) {
    switch (scene) {
      case "morning":
        this.state.lights.living_room.on = true;
        this.state.lights.bedroom.on = true;
        this.state.lights.living_room.color = "#ffd54f";
        this.state.lights.bedroom.color = "#ffd54f";
        this.state.thermostat.temperature = 72;
        this.state.locks.front_door.locked = false;
        break;
      case "night":
        this.state.lights.living_room.on = false;
        this.state.lights.bedroom.on = false;
        this.state.thermostat.temperature = 65;
        this.state.locks.front_door.locked = true;
        break;
      case "away":
        this.state.lights.living_room.on = false;
        this.state.lights.bedroom.on = false;
        this.state.thermostat.temperature = 60;
        this.state.locks.front_door.locked = true;
        break;
      case "movie":
        this.state.lights.living_room.on = true;
        this.state.lights.living_room.color = "#3a0ca3";
        this.state.lights.bedroom.on = false;
        this.state.thermostat.temperature = 70;
        break;
      default:
        return;
    }
    this.render();
    this.log(`Scene "${scene}" activated.`);
  },
};

/* ── Initial render ─────────────────────────────────────── */
app.render();

/* ================================================================
   WebMCP Tool Registration
   ================================================================ */
window.addEventListener("load", () => {
  if (!("modelContext" in navigator)) return;

  document.getElementById("webmcp-badge").classList.remove("hidden");

  /* ── 1. get_home_status ──────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "get_home_status",
    description:
      "Returns the current state of every device in the smart home: lights (on/off and color), thermostat temperature, and door lock status.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: () => {
      return JSON.stringify({
        success: true,
        message: "Current home status retrieved.",
        new_state: app.state,
      });
    },
  });

  /* ── 2. toggle_light ─────────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "toggle_light",
    description:
      "Toggles a specific light on or off. If the light is currently on it will be turned off, and vice-versa. Returns the new light state.",
    inputSchema: {
      type: "object",
      properties: {
        light_id: {
          type: "string",
          enum: ["living_room", "bedroom"],
          description: "The identifier of the light to toggle.",
        },
      },
      required: ["light_id"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    execute: ({ light_id }) => {
      if (!app.VALID_LIGHT_IDS.includes(light_id)) {
        return JSON.stringify({
          success: false,
          error: `Unknown light_id "${light_id}". Valid options: ${app.VALID_LIGHT_IDS.join(", ")}.`,
        });
      }
      app.toggleLight(light_id);
      return JSON.stringify({
        success: true,
        message: `${light_id.replace("_", " ")} light turned ${app.state.lights[light_id].on ? "on" : "off"}.`,
        new_state: { light_id, ...app.state.lights[light_id] },
      });
    },
  });

  /* ── 3. set_temperature ──────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "set_temperature",
    description:
      "Sets the thermostat to a specific temperature in degrees Fahrenheit. Accepted range is 50–90 °F. Values outside this range are clamped.",
    inputSchema: {
      type: "object",
      properties: {
        degrees: {
          type: "number",
          description: "Target temperature in °F (50–90).",
          minimum: 50,
          maximum: 90,
        },
      },
      required: ["degrees"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: ({ degrees }) => {
      if (typeof degrees !== "number" || isNaN(degrees)) {
        return JSON.stringify({
          success: false,
          error: `"degrees" must be a number. Received: ${degrees}.`,
        });
      }
      app.setTemperature(degrees);
      return JSON.stringify({
        success: true,
        message: `Thermostat set to ${app.state.thermostat.temperature} °F.`,
        new_state: app.state.thermostat,
      });
    },
  });

  /* ── 4. set_light_color ──────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "set_light_color",
    description:
      "Changes the color of a specific light. Accepts any valid CSS color value (hex, rgb, named color). The light does not need to be on; the new color will show when the light is next turned on.",
    inputSchema: {
      type: "object",
      properties: {
        light_id: {
          type: "string",
          enum: ["living_room", "bedroom"],
          description: "The identifier of the light whose color to change.",
        },
        color: {
          type: "string",
          description:
            'A valid CSS color value, e.g. "#ff0000", "rgb(255,0,0)", or "red".',
        },
      },
      required: ["light_id", "color"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: ({ light_id, color }) => {
      if (!app.VALID_LIGHT_IDS.includes(light_id)) {
        return JSON.stringify({
          success: false,
          error: `Unknown light_id "${light_id}". Valid options: ${app.VALID_LIGHT_IDS.join(", ")}.`,
        });
      }
      if (!color || typeof color !== "string" || !color.trim()) {
        return JSON.stringify({
          success: false,
          error: `"color" must be a non-empty string (CSS color value).`,
        });
      }
      app.setLightColor(light_id, color.trim());
      return JSON.stringify({
        success: true,
        message: `${light_id.replace("_", " ")} light color set to ${color.trim()}.`,
        new_state: { light_id, ...app.state.lights[light_id] },
      });
    },
  });

  /* ── 5. toggle_lock ──────────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "toggle_lock",
    description:
      "Locks or unlocks a specific door. If the door is currently locked it will be unlocked, and vice-versa. Returns the new lock state.",
    inputSchema: {
      type: "object",
      properties: {
        lock_id: {
          type: "string",
          enum: ["front_door"],
          description: "The identifier of the lock to toggle.",
        },
      },
      required: ["lock_id"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    execute: ({ lock_id }) => {
      if (!app.VALID_LOCK_IDS.includes(lock_id)) {
        return JSON.stringify({
          success: false,
          error: `Unknown lock_id "${lock_id}". Valid options: ${app.VALID_LOCK_IDS.join(", ")}.`,
        });
      }
      app.toggleLock(lock_id);
      return JSON.stringify({
        success: true,
        message: `${lock_id.replace("_", " ")} ${app.state.locks[lock_id].locked ? "locked" : "unlocked"}.`,
        new_state: { lock_id, ...app.state.locks[lock_id] },
      });
    },
  });

  /* ── 6. trigger_scene ────────────────────────────────── */
  navigator.modelContext.registerTool({
    name: "trigger_scene",
    description:
      'Activates a pre-defined scene that adjusts multiple devices at once. Available scenes: "morning" (lights on, warm color, 72 °F, door unlocked), "night" (lights off, 65 °F, door locked), "away" (lights off, 60 °F, door locked), "movie" (living room dim purple, bedroom off, 70 °F).',
    inputSchema: {
      type: "object",
      properties: {
        scene: {
          type: "string",
          enum: ["morning", "night", "away", "movie"],
          description: "The name of the scene to activate.",
        },
      },
      required: ["scene"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    execute: ({ scene }) => {
      if (!app.SCENES.includes(scene)) {
        return JSON.stringify({
          success: false,
          error: `Unknown scene "${scene}". Valid options: ${app.SCENES.join(", ")}.`,
        });
      }
      app.triggerScene(scene);
      return JSON.stringify({
        success: true,
        message: `Scene "${scene}" activated.`,
        new_state: app.state,
      });
    },
  });
});
