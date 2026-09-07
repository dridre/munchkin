var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/game.js
var MAX_LEVEL = 10;
var MAX_GEAR = 99;
var MAX_BAD = 99;
var clamp = /* @__PURE__ */ __name((n, min, max) => Math.min(max, Math.max(min, n)), "clamp");
var LIMITS = {
  level: [1, MAX_LEVEL],
  gear: [0, MAX_GEAR],
  bad: [0, MAX_BAD]
};
var mapPlayer = /* @__PURE__ */ __name((state, id, change) => ({
  ...state,
  players: state.players.map((p) => p.id === id ? change(p) : p)
}), "mapPlayer");
function reduce(state, action) {
  switch (action.type) {
    case "add":
      return { ...state, players: [...state.players, action.player] };
    case "remove":
      return { ...state, players: state.players.filter((p) => p.id !== action.id) };
    case "set":
      return mapPlayer(state, action.id, (p) => ({ ...p, [action.field]: action.value }));
    case "bump": {
      const [min, max] = LIMITS[action.field] ?? [];
      if (min === void 0) return state;
      return mapPlayer(state, action.id, (p) => ({
        ...p,
        [action.field]: clamp(p[action.field] + action.delta, min, max)
      }));
    }
    case "start":
      return {
        ...state,
        started: true,
        players: state.players.map((p, i) => ({ ...p, name: p.name.trim() || `Jugador ${i + 1}` }))
      };
    case "edit":
      return { ...state, started: false };
    case "reset":
      return { ...state, players: state.players.map((p) => ({ ...p, level: 1, gear: 0, bad: 0 })) };
    default:
      return state;
  }
}
__name(reduce, "reduce");

// worker/index.js
var ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
var CODE_LENGTH = 4;
var TRIES = 5;
var ROOM_LIFE = 24 * 60 * 60 * 1e3;
var CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json", ...CORS }
}), "json");
var newCode = /* @__PURE__ */ __name(() => Array.from(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)), (n) => ALPHABET[n % ALPHABET.length]).join(""), "newCode");
var roomFor = /* @__PURE__ */ __name((env, code) => env.ROOMS.get(env.ROOMS.idFromName(code)), "roomFor");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "POST" && url.pathname === "/room") {
      const state = await request.json().catch(() => null);
      if (!state?.players) return json({ error: "partida no valida" }, 400);
      for (let intento = 0; intento < TRIES; intento++) {
        const code = newCode();
        const res = await roomFor(env, code).fetch("https://sala/create", {
          method: "POST",
          body: JSON.stringify(state)
        });
        if (res.ok) return json({ code });
      }
      return json({ error: "no hay codigos libres" }, 503);
    }
    const joining = url.pathname.match(/^\/room\/([A-Z0-9]{4})\/ws$/);
    if (joining) return roomFor(env, joining[1]).fetch(request);
    return new Response("Salas de Munchkin", { headers: CORS });
  }
};
var Room = class {
  static {
    __name(this, "Room");
  }
  constructor(ctx) {
    this.ctx = ctx;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/create") {
      if (await this.ctx.storage.get("state")) return new Response("cogido", { status: 409 });
      await this.save(await request.json());
      return new Response("ok");
    }
    if (request.headers.get("upgrade") !== "websocket") {
      return new Response("esperaba un websocket", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    const state = await this.ctx.storage.get("state");
    if (state) {
      server.send(JSON.stringify({ type: "sync", state }));
    } else {
      server.send(JSON.stringify({ type: "missing" }));
      server.close(1e3, "esa sala no existe");
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (message?.type !== "action") return;
    const state = await this.ctx.storage.get("state");
    if (!state) return;
    const next = reduce(state, message.action);
    await this.save(next);
    const payload = JSON.stringify({ type: "sync", state: next });
    for (const open of this.ctx.getWebSockets()) {
      try {
        open.send(payload);
      } catch {
      }
    }
  }
  async save(state) {
    await this.ctx.storage.put("state", state);
    await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFE);
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
};

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-SPEaZt/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-SPEaZt/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Room,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
