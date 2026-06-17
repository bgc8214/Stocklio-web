//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, a) => (a = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule ? t(a, "default", {
	value: n,
	enumerable: !0
}) : a, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, ee = Object.prototype.hasOwnProperty;
	function te(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function ne(e, t) {
		return te(e.type, t, e.props);
	}
	function T(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function E(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var D = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? E("" + e.key) : t.toString(36);
	}
	function ie(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ae(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ae(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(D, "$&/") + "/"), ae(o, r, i, "", function(e) {
			return e;
		})) : o != null && (T(o) && (o = ne(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(D, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += ae(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += ae(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ae(ie(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function O(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ae(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function oe(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var k = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, A = {
		map: O,
		forEach: function(e, t, n) {
			O(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return O(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return O(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!T(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = A, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !ee.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return te(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) ee.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return te(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = T, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: oe
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, k);
		} catch (e) {
			k(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.6";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) if (n(c) !== null) m = !0, S || (S = !0, T());
		else {
			var t = n(l);
			t !== null && re(x, t.startTime - e);
		}
	}
	var S = !1, C = -1, w = 5, ee = -1;
	function te() {
		return g ? !0 : !(e.unstable_now() - ee < w);
	}
	function ne() {
		if (g = !1, S) {
			var t = e.unstable_now();
			ee = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && te());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && re(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? T() : S = !1;
			}
		}
	}
	var T;
	if (typeof y == "function") T = function() {
		y(ne);
	};
	else if (typeof MessageChannel < "u") {
		var E = new MessageChannel(), D = E.port2;
		E.port1.onmessage = ne, T = function() {
			D.postMessage(null);
		};
	} else T = function() {
		_(ne, 0);
	};
	function re(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, re(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, T()))), r;
	}, e.unstable_shouldYield = te, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") if (typeof t == "object" && t) {
			if (t.as == null || t.as === "script") {
				var n = c(t.as, t.crossOrigin);
				i.d.M(e, {
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0
				});
			}
		} else t ?? i.d.M(e);
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") if (t) {
			var n = c(t.as, t.crossOrigin);
			i.d.m(e, {
				as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
				crossOrigin: n,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0
			});
		} else i.d.m(e);
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.6";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), ee = Symbol.for("react.suspense"), te = Symbol.for("react.suspense_list"), ne = Symbol.for("react.memo"), T = Symbol.for("react.lazy"), E = Symbol.for("react.activity"), D = Symbol.for("react.memo_cache_sentinel"), re = Symbol.iterator;
	function ie(e) {
		return typeof e != "object" || !e ? null : (e = re && e[re] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ae = Symbol.for("react.client.reference");
	function O(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ae ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case ee: return "Suspense";
			case te: return "SuspenseList";
			case E: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case ne: return t = e.displayName || null, t === null ? O(e.type) || "Memo" : t;
			case T:
				t = e._payload, e = e._init;
				try {
					return O(e(t));
				} catch {}
		}
		return null;
	}
	var oe = Array.isArray, k = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, A = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, se = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ce = [], le = -1;
	function ue(e) {
		return { current: e };
	}
	function de(e) {
		0 > le || (e.current = ce[le], ce[le] = null, le--);
	}
	function j(e, t) {
		le++, ce[le] = e.current, e.current = t;
	}
	var fe = ue(null), pe = ue(null), me = ue(null), he = ue(null);
	function ge(e, t) {
		switch (j(me, t), j(pe, e), j(fe, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		de(fe), j(fe, e);
	}
	function _e() {
		de(fe), de(pe), de(me);
	}
	function ve(e) {
		e.memoizedState !== null && j(he, e);
		var t = fe.current, n = Hd(t, e.type);
		t !== n && (j(pe, e), j(fe, n));
	}
	function ye(e) {
		pe.current === e && (de(fe), de(pe)), he.current === e && (de(he), Qf._currentValue = se);
	}
	var be, M;
	function xe(e) {
		if (be === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			be = t && t[1] || "", M = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + be + e + M;
	}
	var Se = !1;
	function Ce(e, t) {
		if (!e || Se) return "";
		Se = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Se = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? xe(n) : "";
	}
	function we(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return xe(e.type);
			case 16: return xe("Lazy");
			case 13: return e.child !== t && t !== null ? xe("Suspense Fallback") : xe("Suspense");
			case 19: return xe("SuspenseList");
			case 0:
			case 15: return Ce(e.type, !1);
			case 11: return Ce(e.type.render, !1);
			case 1: return Ce(e.type, !0);
			case 31: return xe("Activity");
			default: return "";
		}
	}
	function Te(e) {
		try {
			var t = "", n = null;
			do
				t += we(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Ee = Object.prototype.hasOwnProperty, De = t.unstable_scheduleCallback, Oe = t.unstable_cancelCallback, ke = t.unstable_shouldYield, Ae = t.unstable_requestPaint, N = t.unstable_now, je = t.unstable_getCurrentPriorityLevel, Me = t.unstable_ImmediatePriority, Ne = t.unstable_UserBlockingPriority, Pe = t.unstable_NormalPriority, Fe = t.unstable_LowPriority, Ie = t.unstable_IdlePriority, Le = t.log, Re = t.unstable_setDisableYieldValue, ze = null, Be = null;
	function Ve(e) {
		if (typeof Le == "function" && Re(e), Be && typeof Be.setStrictMode == "function") try {
			Be.setStrictMode(ze, e);
		} catch {}
	}
	var He = Math.clz32 ? Math.clz32 : Ge, Ue = Math.log, We = Math.LN2;
	function Ge(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ue(e) / We | 0) | 0;
	}
	var Ke = 256, qe = 262144, Je = 4194304;
	function Ye(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function Xe(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Ye(n))) : i = Ye(o) : i = Ye(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Ye(n))) : i = Ye(o)) : i = Ye(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Ze(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Qe(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function $e() {
		var e = Je;
		return Je <<= 1, !(Je & 62914560) && (Je = 4194304), e;
	}
	function et(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function tt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function nt(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - He(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && rt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function rt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - He(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function it(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - He(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function at(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : ot(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function ot(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function st(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ct() {
		var e = A.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function lt(e, t) {
		var n = A.p;
		try {
			return A.p = e, t();
		} finally {
			A.p = n;
		}
	}
	var ut = Math.random().toString(36).slice(2), dt = "__reactFiber$" + ut, ft = "__reactProps$" + ut, pt = "__reactContainer$" + ut, mt = "__reactEvents$" + ut, ht = "__reactListeners$" + ut, gt = "__reactHandles$" + ut, _t = "__reactResources$" + ut, vt = "__reactMarker$" + ut;
	function yt(e) {
		delete e[dt], delete e[ft], delete e[mt], delete e[ht], delete e[gt];
	}
	function bt(e) {
		var t = e[dt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[pt] || n[dt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[dt]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function xt(e) {
		if (e = e[dt] || e[pt]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function St(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Ct(e) {
		var t = e[_t];
		return t ||= e[_t] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function wt(e) {
		e[vt] = !0;
	}
	var Tt = /* @__PURE__ */ new Set(), Et = {};
	function Dt(e, t) {
		Ot(e, t), Ot(e + "Capture", t);
	}
	function Ot(e, t) {
		for (Et[e] = t, e = 0; e < t.length; e++) Tt.add(t[e]);
	}
	var kt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), At = {}, jt = {};
	function Mt(e) {
		return Ee.call(jt, e) ? !0 : Ee.call(At, e) ? !1 : kt.test(e) ? jt[e] = !0 : (At[e] = !0, !1);
	}
	function Nt(e, t, n) {
		if (Mt(t)) if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
					e.removeAttribute(t);
					return;
				case "boolean":
					var r = t.toLowerCase().slice(0, 5);
					if (r !== "data-" && r !== "aria-") {
						e.removeAttribute(t);
						return;
					}
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Pt(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Ft(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function It(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Lt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Rt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function zt(e) {
		if (!e._valueTracker) {
			var t = Lt(e) ? "checked" : "value";
			e._valueTracker = Rt(e, t, "" + e[t]);
		}
	}
	function Bt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Lt(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function Vt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Ht = /[\n"\\]/g;
	function Ut(e) {
		return e.replace(Ht, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Wt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + It(t)) : e.value !== "" + It(t) && (e.value = "" + It(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Kt(e, o, It(n)) : Kt(e, o, It(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + It(s) : e.removeAttribute("name");
	}
	function Gt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				zt(e);
				return;
			}
			n = n == null ? "" : "" + It(n), t = t == null ? n : "" + It(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), zt(e);
	}
	function Kt(e, t, n) {
		t === "number" && Vt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function qt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + It(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Jt(e, t, n) {
		if (t != null && (t = "" + It(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + It(n);
	}
	function Yt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (oe(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = It(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), zt(e);
	}
	function Xt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Zt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Qt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Zt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function $t(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Qt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Qt(e, o, t[o]);
	}
	function en(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var tn = new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), nn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function rn(e) {
		return nn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function an() {}
	var on = null;
	function sn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var cn = null, ln = null;
	function un(e) {
		var t = xt(e);
		if (t && (e = t.stateNode)) {
			var n = e[ft] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Wt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Ut("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[ft] || null;
								if (!a) throw Error(i(90));
								Wt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Bt(r);
					}
					break a;
				case "textarea":
					Jt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && qt(e, !!n.multiple, t, !1);
			}
		}
	}
	var dn = !1;
	function fn(e, t, n) {
		if (dn) return e(t, n);
		dn = !0;
		try {
			return e(t);
		} finally {
			if (dn = !1, (cn !== null || ln !== null) && (bu(), cn && (t = cn, e = ln, ln = cn = null, un(t), e))) for (t = 0; t < e.length; t++) un(e[t]);
		}
	}
	function pn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[ft] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var mn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), hn = !1;
	if (mn) try {
		var gn = {};
		Object.defineProperty(gn, "passive", { get: function() {
			hn = !0;
		} }), window.addEventListener("test", gn, gn), window.removeEventListener("test", gn, gn);
	} catch {
		hn = !1;
	}
	var _n = null, vn = null, yn = null;
	function bn() {
		if (yn) return yn;
		var e, t = vn, n = t.length, r, i = "value" in _n ? _n.value : _n.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return yn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function xn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Sn() {
		return !0;
	}
	function Cn() {
		return !1;
	}
	function wn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Sn : Cn, this.isPropagationStopped = Cn, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Sn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Sn);
			},
			persist: function() {},
			isPersistent: Sn
		}), t;
	}
	var Tn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, En = wn(Tn), Dn = h({}, Tn, {
		view: 0,
		detail: 0
	}), On = wn(Dn), kn, P, An, jn = h({}, Dn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Hn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== An && (An && e.type === "mousemove" ? (kn = e.screenX - An.screenX, P = e.screenY - An.screenY) : P = kn = 0, An = e), kn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : P;
		}
	}), Mn = wn(jn), Nn = wn(h({}, jn, { dataTransfer: 0 })), Pn = wn(h({}, Dn, { relatedTarget: 0 })), Fn = wn(h({}, Tn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), In = wn(h({}, Tn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Ln = wn(h({}, Tn, { data: 0 })), Rn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, zn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Bn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Vn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Bn[e]) ? !!t[e] : !1;
	}
	function Hn() {
		return Vn;
	}
	var Un = wn(h({}, Dn, {
		key: function(e) {
			if (e.key) {
				var t = Rn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = xn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? zn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Hn,
		charCode: function(e) {
			return e.type === "keypress" ? xn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? xn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Wn = wn(h({}, jn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Gn = wn(h({}, Dn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Hn
	})), Kn = wn(h({}, Tn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), qn = wn(h({}, jn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Jn = wn(h({}, Tn, {
		newState: 0,
		oldState: 0
	})), Yn = [
		9,
		13,
		27,
		32
	], Xn = mn && "CompositionEvent" in window, Zn = null;
	mn && "documentMode" in document && (Zn = document.documentMode);
	var Qn = mn && "TextEvent" in window && !Zn, $n = mn && (!Xn || Zn && 8 < Zn && 11 >= Zn), er = " ", tr = !1;
	function nr(e, t) {
		switch (e) {
			case "keyup": return Yn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function rr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var ir = !1;
	function ar(e, t) {
		switch (e) {
			case "compositionend": return rr(t);
			case "keypress": return t.which === 32 ? (tr = !0, er) : null;
			case "textInput": return e = t.data, e === er && tr ? null : e;
			default: return null;
		}
	}
	function or(e, t) {
		if (ir) return e === "compositionend" || !Xn && nr(e, t) ? (e = bn(), yn = vn = _n = null, ir = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return $n && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var sr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function cr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!sr[e.type] : t === "textarea";
	}
	function lr(e, t, n, r) {
		cn ? ln ? ln.push(r) : ln = [r] : cn = r, t = Ed(t, "onChange"), 0 < t.length && (n = new En("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ur = null, dr = null;
	function fr(e) {
		yd(e, 0);
	}
	function F(e) {
		if (Bt(St(e))) return e;
	}
	function pr(e, t) {
		if (e === "change") return t;
	}
	var mr = !1;
	if (mn) {
		var hr;
		if (mn) {
			var gr = "oninput" in document;
			if (!gr) {
				var _r = document.createElement("div");
				_r.setAttribute("oninput", "return;"), gr = typeof _r.oninput == "function";
			}
			hr = gr;
		} else hr = !1;
		mr = hr && (!document.documentMode || 9 < document.documentMode);
	}
	function vr() {
		ur && (ur.detachEvent("onpropertychange", yr), dr = ur = null);
	}
	function yr(e) {
		if (e.propertyName === "value" && F(dr)) {
			var t = [];
			lr(t, dr, e, sn(e)), fn(fr, t);
		}
	}
	function br(e, t, n) {
		e === "focusin" ? (vr(), ur = t, dr = n, ur.attachEvent("onpropertychange", yr)) : e === "focusout" && vr();
	}
	function xr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return F(dr);
	}
	function Sr(e, t) {
		if (e === "click") return F(t);
	}
	function Cr(e, t) {
		if (e === "input" || e === "change") return F(t);
	}
	function wr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Tr = typeof Object.is == "function" ? Object.is : wr;
	function Er(e, t) {
		if (Tr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Ee.call(t, i) || !Tr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Dr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Or(e, t) {
		var n = Dr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Dr(n);
		}
	}
	function kr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? kr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Ar(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Vt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Vt(e.document);
		}
		return t;
	}
	function jr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Mr = mn && "documentMode" in document && 11 >= document.documentMode, Nr = null, Pr = null, Fr = null, Ir = !1;
	function Lr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Ir || Nr == null || Nr !== Vt(r) || (r = Nr, "selectionStart" in r && jr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Fr && Er(Fr, r) || (Fr = r, r = Ed(Pr, "onSelect"), 0 < r.length && (t = new En("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Nr)));
	}
	function Rr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var zr = {
		animationend: Rr("Animation", "AnimationEnd"),
		animationiteration: Rr("Animation", "AnimationIteration"),
		animationstart: Rr("Animation", "AnimationStart"),
		transitionrun: Rr("Transition", "TransitionRun"),
		transitionstart: Rr("Transition", "TransitionStart"),
		transitioncancel: Rr("Transition", "TransitionCancel"),
		transitionend: Rr("Transition", "TransitionEnd")
	}, Br = {}, Vr = {};
	mn && (Vr = document.createElement("div").style, "AnimationEvent" in window || (delete zr.animationend.animation, delete zr.animationiteration.animation, delete zr.animationstart.animation), "TransitionEvent" in window || delete zr.transitionend.transition);
	function Hr(e) {
		if (Br[e]) return Br[e];
		if (!zr[e]) return e;
		var t = zr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Vr) return Br[e] = t[n];
		return e;
	}
	var Ur = Hr("animationend"), Wr = Hr("animationiteration"), Gr = Hr("animationstart"), Kr = Hr("transitionrun"), qr = Hr("transitionstart"), Jr = Hr("transitioncancel"), Yr = Hr("transitionend"), Xr = /* @__PURE__ */ new Map(), Zr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	Zr.push("scrollEnd");
	function Qr(e, t) {
		Xr.set(e, t), Dt(t, [e]);
	}
	var $r = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, ei = [], ti = 0, ni = 0;
	function ri() {
		for (var e = ti, t = ni = ti = 0; t < e;) {
			var n = ei[t];
			ei[t++] = null;
			var r = ei[t];
			ei[t++] = null;
			var i = ei[t];
			ei[t++] = null;
			var a = ei[t];
			if (ei[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && si(n, i, a);
		}
	}
	function ii(e, t, n, r) {
		ei[ti++] = e, ei[ti++] = t, ei[ti++] = n, ei[ti++] = r, ni |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ai(e, t, n, r) {
		return ii(e, t, n, r), ci(e);
	}
	function oi(e, t) {
		return ii(e, null, null, t), ci(e);
	}
	function si(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - He(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ci(e) {
		if (50 < du) throw du = 0, fu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var li = {};
	function ui(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function di(e, t, n, r) {
		return new ui(e, t, n, r);
	}
	function fi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function pi(e, t) {
		var n = e.alternate;
		return n === null ? (n = di(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function mi(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function hi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") fi(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, fe.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case E: return e = di(31, n, t, a), e.elementType = E, e.lanes = o, e;
			case y: return I(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = di(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case ee: return e = di(13, n, t, a), e.elementType = ee, e.lanes = o, e;
			case te: return e = di(19, n, t, a), e.elementType = te, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case C:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case w:
						s = 11;
						break a;
					case ne:
						s = 14;
						break a;
					case T:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = di(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function I(e, t, n, r) {
		return e = di(7, e, r, t), e.lanes = n, e;
	}
	function gi(e, t, n) {
		return e = di(6, e, null, t), e.lanes = n, e;
	}
	function _i(e) {
		var t = di(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function vi(e, t, n) {
		return t = di(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var yi = /* @__PURE__ */ new WeakMap();
	function L(e, t) {
		if (typeof e == "object" && e) {
			var n = yi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Te(t)
			}, yi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Te(t)
		};
	}
	var bi = [], xi = 0, Si = null, Ci = 0, wi = [], Ti = 0, Ei = null, Di = 1, Oi = "";
	function ki(e, t) {
		bi[xi++] = Ci, bi[xi++] = Si, Si = e, Ci = t;
	}
	function Ai(e, t, n) {
		wi[Ti++] = Di, wi[Ti++] = Oi, wi[Ti++] = Ei, Ei = e;
		var r = Di;
		e = Oi;
		var i = 32 - He(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - He(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Di = 1 << 32 - He(t) + i | n << i | r, Oi = a + e;
		} else Di = 1 << a | n << i | r, Oi = e;
	}
	function ji(e) {
		e.return !== null && (ki(e, 1), Ai(e, 1, 0));
	}
	function Mi(e) {
		for (; e === Si;) Si = bi[--xi], bi[xi] = null, Ci = bi[--xi], bi[xi] = null;
		for (; e === Ei;) Ei = wi[--Ti], wi[Ti] = null, Oi = wi[--Ti], wi[Ti] = null, Di = wi[--Ti], wi[Ti] = null;
	}
	function Ni(e, t) {
		wi[Ti++] = Di, wi[Ti++] = Oi, wi[Ti++] = Ei, Di = t.id, Oi = t.overflow, Ei = e;
	}
	var Pi = null, R = null, z = !1, Fi = null, Ii = !1, Li = Error(i(519));
	function Ri(e) {
		throw Wi(L(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Li;
	}
	function zi(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[dt] = e, t[ft] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < _d.length; n++) Q(_d[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), Gt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), Yt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Md(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = an), t = !0) : t = !1, t || Ri(e, !0);
	}
	function Bi(e) {
		for (Pi = e.return; Pi;) switch (Pi.tag) {
			case 5:
			case 31:
			case 13:
				Ii = !1;
				return;
			case 27:
			case 3:
				Ii = !0;
				return;
			default: Pi = Pi.return;
		}
	}
	function Vi(e) {
		if (e !== Pi) return !1;
		if (!z) return Bi(e), z = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = !(n !== "form" && n !== "button") || Ud(e.type, e.memoizedProps)), n = !n), n && R && Ri(e), Bi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			R = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			R = uf(e);
		} else t === 27 ? (t = R, Zd(e.type) ? (e = lf, lf = null, R = e) : R = t) : R = Pi ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Hi() {
		R = Pi = null, z = !1;
	}
	function Ui() {
		var e = Fi;
		return e !== null && (Zl === null ? Zl = e : Zl.push.apply(Zl, e), Fi = null), e;
	}
	function Wi(e) {
		Fi === null ? Fi = [e] : Fi.push(e);
	}
	var Gi = ue(null), Ki = null, qi = null;
	function Ji(e, t, n) {
		j(Gi, t._currentValue), t._currentValue = n;
	}
	function Yi(e) {
		e._currentValue = Gi.current, de(Gi);
	}
	function Xi(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Zi(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Xi(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Xi(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Qi(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					Tr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === he.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Zi(t, e, n, r), t.flags |= 262144;
	}
	function $i(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Tr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ea(e) {
		Ki = e, qi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function ta(e) {
		return ra(Ki, e);
	}
	function na(e, t) {
		return Ki === null && ea(e), ra(e, t);
	}
	function ra(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, qi === null) {
			if (e === null) throw Error(i(308));
			qi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else qi = qi.next = t;
		return n;
	}
	var ia = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, aa = t.unstable_scheduleCallback, oa = t.unstable_NormalPriority, sa = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ca() {
		return {
			controller: new ia(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function la(e) {
		e.refCount--, e.refCount === 0 && aa(oa, function() {
			e.controller.abort();
		});
	}
	var ua = null, da = 0, fa = 0, pa = null;
	function ma(e, t) {
		if (ua === null) {
			var n = ua = [];
			da = 0, fa = dd(), pa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return da++, t.then(ha, ha), t;
	}
	function ha() {
		if (--da === 0 && ua !== null) {
			pa !== null && (pa.status = "fulfilled");
			var e = ua;
			ua = null, fa = 0, pa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ga(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var _a = k.S;
	k.S = function(e, t) {
		eu = N(), typeof t == "object" && t && typeof t.then == "function" && ma(e, t), _a !== null && _a(e, t);
	};
	var va = ue(null);
	function ya() {
		var e = va.current;
		return e === null ? q.pooledCache : e;
	}
	function ba(e, t) {
		t === null ? j(va, va.current) : j(va, t.pool);
	}
	function xa() {
		var e = ya();
		return e === null ? null : {
			parent: sa._currentValue,
			pool: e
		};
	}
	var Sa = Error(i(460)), Ca = Error(i(474)), wa = Error(i(542)), Ta = { then: function() {} };
	function Ea(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Da(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(an, an), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, ja(e), e;
			default:
				if (typeof t.status == "string") t.then(an, an);
				else {
					if (e = q, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, ja(e), e;
				}
				throw ka = t, Sa;
		}
	}
	function Oa(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (ka = e, Sa) : e;
		}
	}
	var ka = null;
	function Aa() {
		if (ka === null) throw Error(i(459));
		var e = ka;
		return ka = null, e;
	}
	function ja(e) {
		if (e === Sa || e === wa) throw Error(i(483));
	}
	var Ma = null, Na = 0;
	function Pa(e) {
		var t = Na;
		return Na += 1, Ma === null && (Ma = []), Da(Ma, e, t);
	}
	function Fa(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Ia(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function La(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = pi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = gi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === T && Oa(i) === t.type) ? (t = a(t, n.props), Fa(t, n), t.return = e, t) : (t = hi(n.type, n.key, n.props, null, e.mode, r), Fa(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = vi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = I(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = gi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = hi(t.type, t.key, t.props, null, e.mode, n), Fa(n, t), n.return = e, n;
					case v: return t = vi(t, e.mode, n), t.return = e, t;
					case T: return t = Oa(t), f(e, t, n);
				}
				if (oe(t) || ie(t)) return t = I(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Pa(t), n);
				if (t.$$typeof === C) return f(e, na(e, t), n);
				Ia(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case T: return n = Oa(n), p(e, t, n, r);
				}
				if (oe(n) || ie(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Pa(n), r);
				if (n.$$typeof === C) return p(e, t, na(e, n), r);
				Ia(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case T: return r = Oa(r), m(e, t, n, r, i);
				}
				if (oe(r) || ie(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Pa(r), i);
				if (r.$$typeof === C) return m(e, t, n, na(t, r), i);
				Ia(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), z && ki(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return z && ki(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), z && ki(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), z && ki(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return z && ki(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), z && ki(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === T && Oa(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Fa(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								} else t(e, r);
								r = r.sibling;
							}
							o.type === y ? (c = I(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = hi(o.type, o.key, o.props, null, e.mode, c), Fa(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
									n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
									break a;
								} else {
									n(e, r);
									break;
								}
								else t(e, r);
								r = r.sibling;
							}
							c = vi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case T: return o = Oa(o), b(e, r, o, c);
				}
				if (oe(o)) return h(e, r, o, c);
				if (ie(o)) {
					if (l = ie(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Pa(o), c);
				if (o.$$typeof === C) return b(e, r, na(e, o), c);
				Ia(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = gi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Na = 0;
				var i = b(e, t, n, r);
				return Ma = null, i;
			} catch (t) {
				if (t === Sa || t === wa) throw t;
				var a = di(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Ra = La(!0), B = La(!1), za = !1;
	function Ba(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Va(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Ha(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ua(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, K & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ci(e), si(e, null, n), t;
		}
		return ii(e, r, t, n), ci(e);
	}
	function Wa(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, it(e, n);
		}
	}
	function Ga(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ka = !1;
	function qa() {
		if (Ka) {
			var e = pa;
			if (e !== null) throw e;
		}
	}
	function Ja(e, t, n, r) {
		Ka = !1;
		var i = e.updateQueue;
		za = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (Y & f) === f : (r & f) === f) {
					f !== 0 && f === fa && (Ka = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (m = g.payload, typeof m == "function") {
									d = m.call(_, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = g.payload, f = typeof m == "function" ? m.call(_, d, f) : m, f == null) break a;
								d = h({}, d, f);
								break a;
							case 2: za = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Gl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ya(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Xa(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ya(n[e], t);
	}
	var Za = ue(null), Qa = ue(0);
	function $a(e, t) {
		e = Ul, j(Qa, e), j(Za, t), Ul = e | t.baseLanes;
	}
	function eo() {
		j(Qa, Ul), j(Za, Za.current);
	}
	function to() {
		Ul = Qa.current, de(Za), de(Qa);
	}
	var no = ue(null), ro = null;
	function io(e) {
		var t = e.alternate;
		j(lo, lo.current & 1), j(no, e), ro === null && (t === null || Za.current !== null || t.memoizedState !== null) && (ro = e);
	}
	function ao(e) {
		j(lo, lo.current), j(no, e), ro === null && (ro = e);
	}
	function oo(e) {
		e.tag === 22 ? (j(lo, lo.current), j(no, e), ro === null && (ro = e)) : so(e);
	}
	function so() {
		j(lo, lo.current), j(no, no.current);
	}
	function co(e) {
		de(no), ro === e && (ro = null), de(lo);
	}
	var lo = ue(0);
	function uo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var fo = 0, V = null, H = null, po = null, mo = !1, ho = !1, go = !1, _o = 0, vo = 0, yo = null, bo = 0;
	function xo() {
		throw Error(i(321));
	}
	function U(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Tr(e[n], t[n])) return !1;
		return !0;
	}
	function So(e, t, n, r, i, a) {
		return fo = a, V = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, k.H = e === null || e.memoizedState === null ? zs : Bs, go = !1, a = n(r, i), go = !1, ho && (a = wo(t, n, r, i)), Co(e), a;
	}
	function Co(e) {
		k.H = Rs;
		var t = H !== null && H.next !== null;
		if (fo = 0, po = H = V = null, mo = !1, vo = 0, yo = null, t) throw Error(i(300));
		e === null || rc || (e = e.dependencies, e !== null && $i(e) && (rc = !0));
	}
	function wo(e, t, n, r) {
		V = e;
		var a = 0;
		do {
			if (ho && (yo = null), vo = 0, ho = !1, 25 <= a) throw Error(i(301));
			if (a += 1, po = H = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			k.H = Vs, o = t(n, r);
		} while (ho);
		return o;
	}
	function To() {
		var e = k.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Mo(t) : t, e = e.useState()[0], (H === null ? null : H.memoizedState) !== e && (V.flags |= 1024), t;
	}
	function Eo() {
		var e = _o !== 0;
		return _o = 0, e;
	}
	function Do(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Oo(e) {
		if (mo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			mo = !1;
		}
		fo = 0, po = H = V = null, ho = !1, vo = _o = 0, yo = null;
	}
	function ko() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return po === null ? V.memoizedState = po = e : po = po.next = e, po;
	}
	function Ao() {
		if (H === null) {
			var e = V.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = H.next;
		var t = po === null ? V.memoizedState : po.next;
		if (t !== null) po = t, H = e;
		else {
			if (e === null) throw V.alternate === null ? Error(i(467)) : Error(i(310));
			H = e, e = {
				memoizedState: H.memoizedState,
				baseState: H.baseState,
				baseQueue: H.baseQueue,
				queue: H.queue,
				next: null
			}, po === null ? V.memoizedState = po = e : po = po.next = e;
		}
		return po;
	}
	function jo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Mo(e) {
		var t = vo;
		return vo += 1, yo === null && (yo = []), e = Da(yo, e, t), t = V, (po === null ? t.memoizedState : po.next) === null && (t = t.alternate, k.H = t === null || t.memoizedState === null ? zs : Bs), e;
	}
	function No(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Mo(e);
			if (e.$$typeof === C) return ta(e);
		}
		throw Error(i(438, String(e)));
	}
	function Po(e) {
		var t = null, n = V.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = V.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = jo(), V.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = D;
		return t.index++, n;
	}
	function Fo(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Io(e) {
		return Lo(Ao(), H, e);
	}
	function Lo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (fo & f) === f : (Y & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === fa && (d = !0);
					else if ((fo & p) === p) {
						u = u.next, p === fa && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, V.lanes |= p, Gl |= p;
					f = u.action, go && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, V.lanes |= f, Gl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Tr(o, e.memoizedState) && (rc = !0, d && (n = pa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Ro(e) {
		var t = Ao(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Tr(o, t.memoizedState) || (rc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function zo(e, t, n) {
		var r = V, a = Ao(), o = z;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Tr((H || a).memoizedState, n);
		if (s && (a.memoizedState = n, rc = !0), a = a.queue, us(Ho.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || po !== null && po.memoizedState.tag & 1) {
			if (r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, a, n, t), null), q === null) throw Error(i(349));
			o || fo & 127 || Bo(r, t, n);
		}
		return n;
	}
	function Bo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = V.updateQueue, t === null ? (t = jo(), V.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Vo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Uo(t) && Wo(e);
	}
	function Ho(e, t, n) {
		return n(function() {
			Uo(t) && Wo(e);
		});
	}
	function Uo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Tr(e, n);
		} catch {
			return !0;
		}
	}
	function Wo(e) {
		var t = oi(e, 2);
		t !== null && hu(t, e, 2);
	}
	function Go(e) {
		var t = ko();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), go) {
				Ve(!0);
				try {
					n();
				} finally {
					Ve(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Fo,
			lastRenderedState: e
		}, t;
	}
	function Ko(e, t, n, r) {
		return e.baseState = n, Lo(e, H, typeof r == "function" ? r : Fo);
	}
	function qo(e, t, n, r, a) {
		if (Fs(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			k.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Jo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Jo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = k.T, o = {};
			k.T = o;
			try {
				var s = n(i, r), c = k.S;
				c !== null && c(o, s), Yo(e, t, s);
			} catch (n) {
				Zo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), k.T = a;
			}
		} else try {
			a = n(i, r), Yo(e, t, a);
		} catch (n) {
			Zo(e, t, n);
		}
	}
	function Yo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Xo(e, t, n);
		}, function(n) {
			return Zo(e, t, n);
		}) : Xo(e, t, n);
	}
	function Xo(e, t, n) {
		t.status = "fulfilled", t.value = n, Qo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Jo(e, n)));
	}
	function Zo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Qo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Qo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function $o(e, t) {
		return t;
	}
	function es(e, t) {
		if (z) {
			var n = q.formState;
			if (n !== null) {
				a: {
					var r = V;
					if (z) {
						if (R) {
							b: {
								for (var i = R, a = Ii; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = cf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								R = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Ri(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = ko(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: $o,
			lastRenderedState: t
		}, n.queue = r, n = Ms.bind(null, V, r), r.dispatch = n, r = Go(!1), a = Ps.bind(null, V, !1, r.queue), r = ko(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = qo.bind(null, V, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function ts(e) {
		return ns(Ao(), H, e);
	}
	function ns(e, t, n) {
		if (t = Lo(e, t, $o)[0], e = Io(Fo)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Mo(t);
		} catch (e) {
			throw e === Sa ? wa : e;
		}
		else r = t;
		t = Ao();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (V.flags |= 2048, as(9, { destroy: void 0 }, rs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function rs(e, t) {
		e.action = t;
	}
	function is(e) {
		var t = Ao(), n = H;
		if (n !== null) return ns(t, n, e);
		Ao(), t = t.memoizedState, n = Ao();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function as(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = V.updateQueue, t === null && (t = jo(), V.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function os() {
		return Ao().memoizedState;
	}
	function ss(e, t, n, r) {
		var i = ko();
		V.flags |= e, i.memoizedState = as(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function cs(e, t, n, r) {
		var i = Ao();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		H !== null && r !== null && U(r, H.memoizedState.deps) ? i.memoizedState = as(t, a, n, r) : (V.flags |= e, i.memoizedState = as(1 | t, a, n, r));
	}
	function ls(e, t) {
		ss(8390656, 8, e, t);
	}
	function us(e, t) {
		cs(2048, 8, e, t);
	}
	function ds(e) {
		V.flags |= 4;
		var t = V.updateQueue;
		if (t === null) t = jo(), V.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function fs(e) {
		var t = Ao().memoizedState;
		return ds({
			ref: t,
			nextImpl: e
		}), function() {
			if (K & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ps(e, t) {
		return cs(4, 2, e, t);
	}
	function ms(e, t) {
		return cs(4, 4, e, t);
	}
	function hs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function gs(e, t, n) {
		n = n == null ? null : n.concat([e]), cs(4, 4, hs.bind(null, t, e), n);
	}
	function _s() {}
	function vs(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && U(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ys(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && U(t, r[1])) return r[0];
		if (r = e(), go) {
			Ve(!0);
			try {
				e();
			} finally {
				Ve(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function bs(e, t, n) {
		return n === void 0 || fo & 1073741824 && !(Y & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = mu(), V.lanes |= e, Gl |= e, n);
	}
	function xs(e, t, n, r) {
		return Tr(n, t) ? n : Za.current === null ? !(fo & 42) || fo & 1073741824 && !(Y & 261930) ? (rc = !0, e.memoizedState = n) : (e = mu(), V.lanes |= e, Gl |= e, t) : (e = bs(e, n, r), Tr(e, t) || (rc = !0), e);
	}
	function Ss(e, t, n, r, i) {
		var a = A.p;
		A.p = a !== 0 && 8 > a ? a : 8;
		var o = k.T, s = {};
		k.T = s, Ps(e, !1, t, n);
		try {
			var c = i(), l = k.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Ns(e, t, ga(c, r), pu(e)) : Ns(e, t, r, pu(e));
		} catch (n) {
			Ns(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, pu());
		} finally {
			A.p = a, o !== null && s.types !== null && (o.types = s.types), k.T = o;
		}
	}
	function Cs() {}
	function ws(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Ts(e).queue;
		Ss(e, a, t, se, n === null ? Cs : function() {
			return Es(e), n(r);
		});
	}
	function Ts(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: se,
			baseState: se,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: se
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Es(e) {
		var t = Ts(e);
		t.next === null && (t = e.alternate.memoizedState), Ns(e, t.next.queue, {}, pu());
	}
	function Ds() {
		return ta(Qf);
	}
	function Os() {
		return Ao().memoizedState;
	}
	function ks() {
		return Ao().memoizedState;
	}
	function As(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = pu();
					e = Ha(n);
					var r = Ua(t, e, n);
					r !== null && (hu(r, t, n), Wa(r, t, n)), t = { cache: ca() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function js(e, t, n) {
		var r = pu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e) ? Is(t, n) : (n = ai(e, t, n, r), n !== null && (hu(n, e, r), Ls(n, t, r)));
	}
	function Ms(e, t, n) {
		Ns(e, t, n, pu());
	}
	function Ns(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Fs(e)) Is(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Tr(s, o)) return ii(e, t, i, 0), q === null && ri(), !1;
			} catch {}
			if (n = ai(e, t, i, r), n !== null) return hu(n, e, r), Ls(n, t, r), !0;
		}
		return !1;
	}
	function Ps(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: dd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e)) {
			if (t) throw Error(i(479));
		} else t = ai(e, n, r, 2), t !== null && hu(t, e, 2);
	}
	function Fs(e) {
		var t = e.alternate;
		return e === V || t !== null && t === V;
	}
	function Is(e, t) {
		ho = mo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Ls(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, it(e, n);
		}
	}
	var Rs = {
		readContext: ta,
		use: No,
		useCallback: xo,
		useContext: xo,
		useEffect: xo,
		useImperativeHandle: xo,
		useLayoutEffect: xo,
		useInsertionEffect: xo,
		useMemo: xo,
		useReducer: xo,
		useRef: xo,
		useState: xo,
		useDebugValue: xo,
		useDeferredValue: xo,
		useTransition: xo,
		useSyncExternalStore: xo,
		useId: xo,
		useHostTransitionStatus: xo,
		useFormState: xo,
		useActionState: xo,
		useOptimistic: xo,
		useMemoCache: xo,
		useCacheRefresh: xo
	};
	Rs.useEffectEvent = xo;
	var zs = {
		readContext: ta,
		use: No,
		useCallback: function(e, t) {
			return ko().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: ta,
		useEffect: ls,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), ss(4194308, 4, hs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ss(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			ss(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = ko();
			t = t === void 0 ? null : t;
			var r = e();
			if (go) {
				Ve(!0);
				try {
					e();
				} finally {
					Ve(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ko();
			if (n !== void 0) {
				var i = n(t);
				if (go) {
					Ve(!0);
					try {
						n(t);
					} finally {
						Ve(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = js.bind(null, V, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = ko();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Go(e);
			var t = e.queue, n = Ms.bind(null, V, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return bs(ko(), e, t);
		},
		useTransition: function() {
			var e = Go(!1);
			return e = Ss.bind(null, V, e.queue, !0, !1), ko().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = V, a = ko();
			if (z) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), q === null) throw Error(i(349));
				Y & 127 || Bo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ls(Ho.bind(null, r, o, e), [e]), r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ko(), t = q.identifierPrefix;
			if (z) {
				var n = Oi, r = Di;
				n = (r & ~(1 << 32 - He(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = _o++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = bo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ds,
		useFormState: es,
		useActionState: es,
		useOptimistic: function(e) {
			var t = ko();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Ps.bind(null, V, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Po,
		useCacheRefresh: function() {
			return ko().memoizedState = As.bind(null, V);
		},
		useEffectEvent: function(e) {
			var t = ko(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (K & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Bs = {
		readContext: ta,
		use: No,
		useCallback: vs,
		useContext: ta,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Io,
		useRef: os,
		useState: function() {
			return Io(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return xs(Ao(), H.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Io(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: ts,
		useActionState: ts,
		useOptimistic: function(e, t) {
			return Ko(Ao(), H, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Bs.useEffectEvent = fs;
	var Vs = {
		readContext: ta,
		use: No,
		useCallback: vs,
		useContext: ta,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Ro,
		useRef: os,
		useState: function() {
			return Ro(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			var n = Ao();
			return H === null ? bs(n, e, t) : xs(n, H.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Ro(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: is,
		useActionState: is,
		useOptimistic: function(e, t) {
			var n = Ao();
			return H === null ? (n.baseState = e, [e, n.queue.dispatch]) : Ko(n, H, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Vs.useEffectEvent = fs;
	function Hs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Us = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Ha(r);
			i.payload = t, n != null && (i.callback = n), t = Ua(e, i, r), t !== null && (hu(t, e, r), Wa(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Ha(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ua(e, i, r), t !== null && (hu(t, e, r), Wa(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pu(), r = Ha(n);
			r.tag = 2, t != null && (r.callback = t), t = Ua(e, r, n), t !== null && (hu(t, e, n), Wa(t, e, n));
		}
	};
	function Ws(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Er(n, r) || !Er(i, a) : !0;
	}
	function Gs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Us.enqueueReplaceState(t, t.state, null);
	}
	function Ks(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function qs(e) {
		$r(e);
	}
	function Js(e) {
		console.error(e);
	}
	function Ys(e) {
		$r(e);
	}
	function Xs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Zs(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Qs(e, t, n) {
		return n = Ha(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Xs(e, t);
		}, n;
	}
	function $s(e) {
		return e = Ha(e), e.tag = 3, e;
	}
	function ec(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Zs(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Zs(t, n, r), typeof i != "function" && (ru === null ? ru = new Set([this]) : ru.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function tc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Qi(t, n, a, !0), n = no.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return ro === null ? Du() : n.alternate === null && Wl === 0 && (Wl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ta ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = new Set([r]) : t.add(r), Gu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ta ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = new Set([r]) : n.add(r)), Gu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Gu(e, r, a), Du(), !1;
		}
		if (z) return t = no.current, t === null ? (r !== Li && (t = Error(i(423), { cause: r }), Wi(L(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = L(r, n), a = Qs(e.stateNode, r, a), Ga(e, a), Wl !== 4 && (Wl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Li && (e = Error(i(422), { cause: r }), Wi(L(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = L(o, n), Xl === null ? Xl = [o] : Xl.push(o), Wl !== 4 && (Wl = 2), t === null) return !0;
		r = L(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Qs(n.stateNode, r, e), Ga(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (ru === null || !ru.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = $s(a), ec(a, e, n, r), Ga(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var nc = Error(i(461)), rc = !1;
	function ic(e, t, n, r) {
		t.child = e === null ? B(t, null, n, r) : Ra(t, e.child, n, r);
	}
	function ac(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ea(t), r = So(e, t, n, o, a, i), s = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (z && s && ji(t), t.flags |= 1, ic(e, t, r, i), t.child);
	}
	function oc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !fi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, sc(e, t, a, r, i)) : (e = hi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Ac(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Er : n, n(o, r) && e.ref === t.ref) return kc(e, t, i);
		}
		return t.flags |= 1, e = pi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function sc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Er(a, r) && e.ref === t.ref) if (rc = !1, t.pendingProps = r = a, Ac(e, i)) e.flags & 131072 && (rc = !0);
			else return t.lanes = e.lanes, kc(e, t, i);
		}
		return hc(e, t, n, r, i);
	}
	function cc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return uc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && ba(t, a === null ? null : a.cachePool), a === null ? eo() : $a(t, a), oo(t);
			else return r = t.lanes = 536870912, uc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && ba(t, null), eo(), so(t)) : (ba(t, a.cachePool), $a(t, a), so(t), t.memoizedState = null);
		return ic(e, t, i, n), t.child;
	}
	function lc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function uc(e, t, n, r, i) {
		var a = ya();
		return a = a === null ? null : {
			parent: sa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && ba(t, null), eo(), oo(t), e !== null && Qi(e, t, r, !0), t.childLanes = i, null;
	}
	function dc(e, t) {
		return t = wc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function fc(e, t, n) {
		return Ra(t, e.child, null, n), e = dc(t, t.pendingProps), e.flags |= 2, co(t), t.memoizedState = null, e;
	}
	function pc(e, t, n) {
		var r = t.pendingProps, a = (t.flags & 128) != 0;
		if (t.flags &= -129, e === null) {
			if (z) {
				if (r.mode === "hidden") return e = dc(t, r), t.lanes = 536870912, lc(null, e);
				if (ao(t), (e = R) ? (e = rf(e, Ii), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ei === null ? null : {
						id: Di,
						overflow: Oi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = _i(e), n.return = t, t.child = n, Pi = t, R = null)) : e = null, e === null) throw Ri(t);
				return t.lanes = 536870912, null;
			}
			return dc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (ao(t), a) if (t.flags & 256) t.flags &= -257, t = fc(e, t, n);
			else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
			else throw Error(i(558));
			else if (rc || Qi(e, t, n, !1), a = (n & e.childLanes) !== 0, rc || a) {
				if (r = q, r !== null && (s = at(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, oi(e, s), hu(r, e, s), nc;
				Du(), t = fc(e, t, n);
			} else e = o.treeContext, R = cf(s.nextSibling), Pi = t, z = !0, Fi = null, Ii = !1, e !== null && Ni(t, e), t = dc(t, r), t.flags |= 4096;
			return t;
		}
		return e = pi(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function mc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function hc(e, t, n, r, i) {
		return ea(t), n = So(e, t, n, r, void 0, i), r = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (z && r && ji(t), t.flags |= 1, ic(e, t, n, i), t.child);
	}
	function gc(e, t, n, r, i, a) {
		return ea(t), t.updateQueue = null, n = wo(t, r, n, i), Co(e), r = Eo(), e !== null && !rc ? (Do(e, t, a), kc(e, t, a)) : (z && r && ji(t), t.flags |= 1, ic(e, t, n, a), t.child);
	}
	function _c(e, t, n, r, i) {
		if (ea(t), t.stateNode === null) {
			var a = li, o = n.contextType;
			typeof o == "object" && o && (a = ta(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Us, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Ba(t), o = n.contextType, a.context = typeof o == "object" && o ? ta(o) : li, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Hs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Us.enqueueReplaceState(a, a.state, null), Ja(t, r, a, i), qa(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ks(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = li, typeof u == "object" && u && (o = ta(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Gs(t, a, r, o), za = !1;
			var f = t.memoizedState;
			a.state = f, Ja(t, r, a, i), qa(), l = t.memoizedState, s || f !== l || za ? (typeof d == "function" && (Hs(t, n, d, r), l = t.memoizedState), (c = za || Ws(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Va(e, t), o = t.memoizedProps, u = Ks(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = li, typeof l == "object" && l && (c = ta(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Gs(t, a, r, c), za = !1, f = t.memoizedState, a.state = f, Ja(t, r, a, i), qa();
			var p = t.memoizedState;
			o !== d || f !== p || za || e !== null && e.dependencies !== null && $i(e.dependencies) ? (typeof s == "function" && (Hs(t, n, s, r), p = t.memoizedState), (u = za || Ws(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && $i(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, mc(e, t), r = (t.flags & 128) != 0, a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ra(t, e.child, null, i), t.child = Ra(t, null, n, i)) : ic(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = kc(e, t, i), e;
	}
	function vc(e, t, n, r) {
		return Hi(), t.flags |= 256, ic(e, t, n, r), t.child;
	}
	var yc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function bc(e) {
		return {
			baseLanes: e,
			cachePool: xa()
		};
	}
	function xc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Jl), e;
	}
	function Sc(e, t, n) {
		var r = t.pendingProps, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (lo.current & 2) != 0), s && (a = !0, t.flags &= -129), s = (t.flags & 32) != 0, t.flags &= -33, e === null) {
			if (z) {
				if (a ? io(t) : so(t), (e = R) ? (e = rf(e, Ii), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ei === null ? null : {
						id: Di,
						overflow: Oi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = _i(e), n.return = t, t.child = n, Pi = t, R = null)) : e = null, e === null) throw Ri(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (so(t), a = t.mode, c = wc({
				mode: "hidden",
				children: c
			}, a), r = I(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(null, r)) : (io(t), Cc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (io(t), t.flags &= -257, t = Tc(e, t, n)) : t.memoizedState === null ? (so(t), c = r.fallback, a = t.mode, r = wc({
				mode: "visible",
				children: r.children
			}, a), c = I(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ra(t, e.child, null, n), r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, t = lc(null, r)) : (so(t), t.child = e.child, t.flags |= 128, t = null);
			else if (io(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Wi({
					value: r,
					source: null,
					stack: null
				}), t = Tc(e, t, n);
			} else if (rc || Qi(e, t, n, !1), s = (n & e.childLanes) !== 0, rc || s) {
				if (s = q, s !== null && (r = at(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, oi(e, r), hu(s, e, r), nc;
				af(c) || Du(), t = Tc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, R = cf(c.nextSibling), Pi = t, z = !0, Fi = null, Ii = !1, e !== null && Ni(t, e), t = Cc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (so(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = pi(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = I(c, a, n, null), c.flags |= 2) : c = pi(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, lc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = bc(n) : (a = c.cachePool, a === null ? a = xa() : (l = sa._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(e.child, r)) : (io(t), n = e.child, e = n.sibling, n = pi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Cc(e, t) {
		return t = wc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function wc(e, t) {
		return e = di(22, e, null, t), e.lanes = 0, e;
	}
	function Tc(e, t, n) {
		return Ra(t, e.child, null, n), e = Cc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ec(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Xi(e.return, t, n);
	}
	function Dc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Oc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = lo.current, s = (o & 2) != 0;
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, j(lo, o), ic(e, t, r, n), r = z ? Ci : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Ec(e, n, t);
			else if (e.tag === 19) Ec(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && uo(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Dc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && uo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Dc(t, !0, n, null, a, r);
				break;
			case "together":
				Dc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function kc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Gl |= t.lanes, (n & t.childLanes) === 0) if (e !== null) {
			if (Qi(e, t, n, !1), (n & t.childLanes) === 0) return null;
		} else return null;
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = pi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = pi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Ac(e, t) {
		return (e.lanes & t) === 0 ? (e = e.dependencies, !!(e !== null && $i(e))) : !0;
	}
	function jc(e, t, n) {
		switch (t.tag) {
			case 3:
				ge(t, t.stateNode.containerInfo), Ji(t, sa, e.memoizedState.cache), Hi();
				break;
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				ge(t, t.stateNode.containerInfo);
				break;
			case 10:
				Ji(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, ao(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (io(t), e = kc(e, t, n), e === null ? null : e.sibling) : Sc(e, t, n) : (io(t), t.flags |= 128, null);
				io(t);
				break;
			case 19:
				var i = (e.flags & 128) != 0;
				if (r = (n & t.childLanes) !== 0, r ||= (Qi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Oc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), j(lo, lo.current), r) break;
				return null;
			case 22: return t.lanes = 0, cc(e, t, n, t.pendingProps);
			case 24: Ji(t, sa, e.memoizedState.cache);
		}
		return kc(e, t, n);
	}
	function Mc(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps) rc = !0;
		else {
			if (!Ac(e, n) && !(t.flags & 128)) return rc = !1, jc(e, t, n);
			rc = !!(e.flags & 131072);
		}
		else rc = !1, z && t.flags & 1048576 && Ai(t, Ci, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Oa(t.elementType), t.type = e, typeof e == "function") fi(e) ? (r = Ks(e, r), t.tag = 1, t = _c(null, t, e, r, n)) : (t.tag = 0, t = hc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = ac(null, t, e, r, n);
								break a;
							} else if (a === ne) {
								t.tag = 14, t = oc(null, t, e, r, n);
								break a;
							}
						}
						throw t = O(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return hc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ks(r, t.pendingProps), _c(e, t, r, a, n);
			case 3:
				a: {
					if (ge(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Va(e, t), Ja(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Ji(t, sa, r), r !== o.cache && Zi(t, [sa], n, !0), qa(), r = s.element, o.isDehydrated) if (o = {
						element: r,
						isDehydrated: !1,
						cache: s.cache
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						t = vc(e, t, r, n);
						break a;
					} else if (r !== a) {
						a = L(Error(i(424)), t), Wi(a), t = vc(e, t, r, n);
						break a;
					} else {
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (R = cf(e.firstChild), Pi = t, z = !0, Fi = null, Ii = !0, n = B(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					}
					else {
						if (Hi(), r === a) {
							t = kc(e, t, n);
							break a;
						}
						ic(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return mc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : z || (n = t.type, e = t.pendingProps, r = Bd(me.current).createElement(n), r[dt] = t, r[ft] = e, Pd(r, n, e), wt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ve(t), e === null && z && (r = t.stateNode = ff(t.type, t.pendingProps, me.current), Pi = t, Ii = !0, a = R, Zd(t.type) ? (lf = a, R = cf(r.firstChild)) : R = a), ic(e, t, t.pendingProps.children, n), mc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && z && ((a = r = R) && (r = tf(r, t.type, t.pendingProps, Ii), r === null ? a = !1 : (t.stateNode = r, Pi = t, R = cf(r.firstChild), Ii = !1, a = !0)), a || Ri(t)), ve(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = So(e, t, To, null, null, n), Qf._currentValue = a), mc(e, t), ic(e, t, r, n), t.child;
			case 6: return e === null && z && ((e = n = R) && (n = nf(n, t.pendingProps, Ii), n === null ? e = !1 : (t.stateNode = n, Pi = t, R = null, e = !0)), e || Ri(t)), null;
			case 13: return Sc(e, t, n);
			case 4: return ge(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ra(t, null, r, n) : ic(e, t, r, n), t.child;
			case 11: return ac(e, t, t.type, t.pendingProps, n);
			case 7: return ic(e, t, t.pendingProps, n), t.child;
			case 8: return ic(e, t, t.pendingProps.children, n), t.child;
			case 12: return ic(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Ji(t, t.type, r.value), ic(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, ea(t), a = ta(a), r = r(a), t.flags |= 1, ic(e, t, r, n), t.child;
			case 14: return oc(e, t, t.type, t.pendingProps, n);
			case 15: return sc(e, t, t.type, t.pendingProps, n);
			case 19: return Oc(e, t, n);
			case 31: return pc(e, t, n);
			case 22: return cc(e, t, n, t.pendingProps);
			case 24: return ea(t), r = ta(sa), e === null ? (a = ya(), a === null && (a = q, o = ca(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Ba(t), Ji(t, sa, a)) : ((e.lanes & n) !== 0 && (Va(e, t), Ja(t, null, null, n), qa()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Ji(t, sa, r), r !== a.cache && Zi(t, [sa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Ji(t, sa, r))), ic(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Nc(e) {
		e.flags |= 4;
	}
	function Pc(e, t, n, r, i) {
		if ((t = (e.mode & 32) != 0) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
			else if (wu()) e.flags |= 8192;
			else throw ka = Ta, Ca;
		} else e.flags &= -16777217;
	}
	function Fc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) if (wu()) e.flags |= 8192;
		else throw ka = Ta, Ca;
	}
	function Ic(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : $e(), e.lanes |= t, Yl |= t);
	}
	function Lc(e, t) {
		if (!z) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function W(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Rc(e, t, n) {
		var r = t.pendingProps;
		switch (Mi(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return W(t), null;
			case 1: return W(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Yi(sa), _e(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Vi(t) ? Nc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Ui())), W(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Nc(t), o === null ? (W(t), Pc(t, a, null, r, n)) : (W(t), Fc(t, o))) : o ? o === e.memoizedState ? (W(t), t.flags &= -16777217) : (Nc(t), W(t), Fc(t, o)) : (e = e.memoizedProps, e !== r && Nc(t), W(t), Pc(t, a, e, r, n)), null;
			case 27:
				if (ye(t), n = me.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return W(t), null;
					}
					e = fe.current, Vi(t) ? zi(t, e) : (e = ff(a, r, n), t.stateNode = e, Nc(t));
				}
				return W(t), null;
			case 5:
				if (ye(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return W(t), null;
					}
					if (o = fe.current, Vi(t)) zi(t, o);
					else {
						var s = Bd(me.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[dt] = t, o[ft] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && Nc(t);
					}
				}
				return W(t), Pc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = me.current, Vi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Pi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[dt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Md(e.nodeValue, n)), e || Ri(t, !0);
					} else e = Bd(e).createTextNode(r), e[dt] = t, t.stateNode = e;
				}
				return W(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Vi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[dt] = t;
						} else Hi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						W(t), e = !1;
					} else n = Ui(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (co(t), t) : (co(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return W(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Vi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[dt] = t;
						} else Hi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						W(t), a = !1;
					} else a = Ui(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (co(t), t) : (co(t), null);
				}
				return co(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Ic(t, t.updateQueue), W(t), null);
			case 4: return _e(), e === null && Sd(t.stateNode.containerInfo), W(t), null;
			case 10: return Yi(t.type), W(t), null;
			case 19:
				if (de(lo), r = t.memoizedState, r === null) return W(t), null;
				if (a = (t.flags & 128) != 0, o = r.rendering, o === null) if (a) Lc(r, !1);
				else {
					if (Wl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (o = uo(e), o !== null) {
							for (t.flags |= 128, Lc(r, !1), e = o.updateQueue, t.updateQueue = e, Ic(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) mi(n, e), n = n.sibling;
							return j(lo, lo.current & 1 | 2), z && ki(t, r.treeForkCount), t.child;
						}
						e = e.sibling;
					}
					r.tail !== null && N() > tu && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
				}
				else {
					if (!a) if (e = uo(o), e !== null) {
						if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Ic(t, e), Lc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !z) return W(t), null;
					} else 2 * N() - r.renderingStartTime > tu && n !== 536870912 && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (W(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = N(), e.sibling = null, n = lo.current, j(lo, a ? n & 1 | 2 : n & 1), z && ki(t, r.treeForkCount), e);
			case 22:
			case 23: return co(t), to(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (W(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : W(t), n = t.updateQueue, n !== null && Ic(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && de(va), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Yi(sa), W(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function zc(e, t) {
		switch (Mi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Yi(sa), _e(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ye(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (co(t), t.alternate === null) throw Error(i(340));
					Hi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (co(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Hi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return de(lo), null;
			case 4: return _e(), null;
			case 10: return Yi(t.type), null;
			case 22:
			case 23: return co(t), to(), e !== null && de(va), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Yi(sa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Bc(e, t) {
		switch (Mi(t), t.tag) {
			case 3:
				Yi(sa), _e();
				break;
			case 26:
			case 27:
			case 5:
				ye(t);
				break;
			case 4:
				_e();
				break;
			case 31:
				t.memoizedState !== null && co(t);
				break;
			case 13:
				co(t);
				break;
			case 19:
				de(lo);
				break;
			case 10:
				Yi(t.type);
				break;
			case 22:
			case 23:
				co(t), to(), e !== null && de(va);
				break;
			case 24: Yi(sa);
		}
	}
	function Vc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Hc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Z(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Uc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Xa(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Wc(e, t, n) {
		n.props = Ks(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Gc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Kc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) if (typeof r == "function") try {
			r();
		} catch (n) {
			Z(e, t, n);
		} finally {
			e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
		}
		else if (typeof n == "function") try {
			n(null);
		} catch (n) {
			Z(e, t, n);
		}
		else n.current = null;
	}
	function qc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Jc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[ft] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Yc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function Xc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Yc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Zc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = an));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Zc(e, t, n), e = e.sibling; e !== null;) Zc(e, t, n), e = e.sibling;
	}
	function Qc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (Qc(e, t, n), e = e.sibling; e !== null;) Qc(e, t, n), e = e.sibling;
	}
	function $c(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[dt] = e, t[ft] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var el = !1, tl = !1, nl = !1, rl = typeof WeakSet == "function" ? WeakSet : Set, il = null;
	function al(e, t) {
		if (e = e.containerInfo, Rd = sp, e = Ar(e), jr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, il = t; il !== null;) if (t = il, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, il = e;
		else for (; il !== null;) {
			switch (t = il, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Ks(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Z(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								ef(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, il = e;
				break;
			}
			il = t.return;
		}
	}
	function ol(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				bl(e, n), r & 4 && Vc(5, n);
				break;
			case 1:
				if (bl(e, n), r & 4) if (e = n.stateNode, t === null) try {
					e.componentDidMount();
				} catch (e) {
					Z(n, n.return, e);
				}
				else {
					var i = Ks(n.type, t.memoizedProps);
					t = t.memoizedState;
					try {
						e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				r & 64 && Uc(n), r & 512 && Gc(n, n.return);
				break;
			case 3:
				if (bl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Xa(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && $c(n);
			case 26:
			case 5:
				bl(e, n), t === null && r & 4 && qc(n), r & 512 && Gc(n, n.return);
				break;
			case 12:
				bl(e, n);
				break;
			case 31:
				bl(e, n), r & 4 && dl(e, n);
				break;
			case 13:
				bl(e, n), r & 4 && fl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Ju.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || el, !r) {
					t = t !== null && t.memoizedState !== null || tl, i = el;
					var a = tl;
					el = r, (tl = t) && !a ? Sl(e, n, (n.subtreeFlags & 8772) != 0) : bl(e, n), el = i, tl = a;
				}
				break;
			case 30: break;
			default: bl(e, n);
		}
	}
	function sl(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, sl(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && yt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var G = null, cl = !1;
	function ll(e, t, n) {
		for (n = n.child; n !== null;) ul(e, t, n), n = n.sibling;
	}
	function ul(e, t, n) {
		if (Be && typeof Be.onCommitFiberUnmount == "function") try {
			Be.onCommitFiberUnmount(ze, n);
		} catch {}
		switch (n.tag) {
			case 26:
				tl || Kc(n, t), ll(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				tl || Kc(n, t);
				var r = G, i = cl;
				Zd(n.type) && (G = n.stateNode, cl = !1), ll(e, t, n), pf(n.stateNode), G = r, cl = i;
				break;
			case 5: tl || Kc(n, t);
			case 6:
				if (r = G, i = cl, G = null, ll(e, t, n), G = r, cl = i, G !== null) if (cl) try {
					(G.nodeType === 9 ? G.body : G.nodeName === "HTML" ? G.ownerDocument.body : G).removeChild(n.stateNode);
				} catch (e) {
					Z(n, t, e);
				}
				else try {
					G.removeChild(n.stateNode);
				} catch (e) {
					Z(n, t, e);
				}
				break;
			case 18:
				G !== null && (cl ? (e = G, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(G, n.stateNode));
				break;
			case 4:
				r = G, i = cl, G = n.stateNode.containerInfo, cl = !0, ll(e, t, n), G = r, cl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Hc(2, n, t), tl || Hc(4, n, t), ll(e, t, n);
				break;
			case 1:
				tl || (Kc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Wc(n, t, r)), ll(e, t, n);
				break;
			case 21:
				ll(e, t, n);
				break;
			case 22:
				tl = (r = tl) || n.memoizedState !== null, ll(e, t, n), tl = r;
				break;
			default: ll(e, t, n);
		}
	}
	function dl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function fl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function pl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new rl()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new rl()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ml(e, t) {
		var n = pl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Yu.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function hl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							G = c.stateNode, cl = !1;
							break a;
						}
						break;
					case 5:
						G = c.stateNode, cl = !1;
						break a;
					case 3:
					case 4:
						G = c.stateNode.containerInfo, cl = !0;
						break a;
				}
				c = c.return;
			}
			if (G === null) throw Error(i(160));
			ul(o, s, a), G = null, cl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) _l(t, e), t = t.sibling;
	}
	var gl = null;
	function _l(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				hl(t, e), vl(e), r & 4 && (Hc(3, e, e.return), Vc(3, e), Hc(5, e, e.return));
				break;
			case 1:
				hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), r & 64 && el && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = gl;
				if (hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) if (r === null) if (e.stateNode === null) {
						a: {
							r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
							b: switch (r) {
								case "title":
									o = a.getElementsByTagName("title")[0], (!o || o[vt] || o[dt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[dt] = e, wt(o), r = o;
									break a;
								case "link":
									var s = Vf("link", "href", a).get(r + (n.href || ""));
									if (s) {
										for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								case "meta":
									if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
										for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								default: throw Error(i(468, r));
							}
							o[dt] = e, wt(o), r = o;
						}
						e.stateNode = r;
					} else Hf(a, e.type, e.stateNode);
					else e.stateNode = If(a, r, e.memoizedProps);
					else o === r ? r === null && e.stateNode !== null && Jc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), n !== null && r & 4 && Jc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Xt(a, "");
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Jc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (nl = !0);
				break;
			case 6:
				if (hl(t, e), vl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = gl, gl = gf(t.containerInfo), hl(t, e), gl = a, vl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				nl && (nl = !1, yl(e));
				break;
			case 4:
				r = gl, gl = gf(e.stateNode.containerInfo), hl(t, e), vl(e), gl = r;
				break;
			case 12:
				hl(t, e), vl(e);
				break;
			case 31:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 13:
				hl(t, e), vl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($l = N()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = el, d = tl;
				if (el = u || a, tl = d || l, hl(t, e), tl = d, el = u, vl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || el || tl || xl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? $d(m, !0) : $d(l.stateNode, !1);
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, ml(e, n))));
				break;
			case 19:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: hl(t, e), vl(e);
		}
	}
	function vl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Yc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						Qc(e, Xc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Xt(o, ""), n.flags &= -33), Qc(e, Xc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Zc(e, Xc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Z(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function yl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			yl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function bl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) ol(e, t.alternate, t), t = t.sibling;
	}
	function xl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Hc(4, t, t.return), xl(t);
					break;
				case 1:
					Kc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Wc(t, t.return, n), xl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Kc(t, t.return), xl(t);
					break;
				case 22:
					t.memoizedState === null && xl(t);
					break;
				case 30:
					xl(t);
					break;
				default: xl(t);
			}
			e = e.sibling;
		}
	}
	function Sl(e, t, n) {
		for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Sl(i, a, n), Vc(4, a);
					break;
				case 1:
					if (Sl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ya(c[i], s);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					n && o & 64 && Uc(a), Gc(a, a.return);
					break;
				case 27: $c(a);
				case 26:
				case 5:
					Sl(i, a, n), n && r === null && o & 4 && qc(a), Gc(a, a.return);
					break;
				case 12:
					Sl(i, a, n);
					break;
				case 31:
					Sl(i, a, n), n && o & 4 && dl(i, a);
					break;
				case 13:
					Sl(i, a, n), n && o & 4 && fl(i, a);
					break;
				case 22:
					a.memoizedState === null && Sl(i, a, n), Gc(a, a.return);
					break;
				case 30: break;
				default: Sl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Cl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && la(n));
	}
	function wl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && la(e));
	}
	function Tl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) El(e, t, n, r), t = t.sibling;
	}
	function El(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Tl(e, t, n, r), i & 2048 && Vc(9, t);
				break;
			case 1:
				Tl(e, t, n, r);
				break;
			case 3:
				Tl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && la(e)));
				break;
			case 12:
				if (i & 2048) {
					Tl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Tl(e, t, n, r);
				break;
			case 31:
				Tl(e, t, n, r);
				break;
			case 13:
				Tl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Tl(e, t, n, r) : (a._visibility |= 2, Dl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1)) : a._visibility & 2 ? Tl(e, t, n, r) : Ol(e, t), i & 2048 && Cl(o, t);
				break;
			case 24:
				Tl(e, t, n, r), i & 2048 && wl(t.alternate, t);
				break;
			default: Tl(e, t, n, r);
		}
	}
	function Dl(e, t, n, r, i) {
		for (i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Dl(a, o, s, c, i), Vc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Dl(a, o, s, c, i)) : u._visibility & 2 ? Dl(a, o, s, c, i) : Ol(a, o), i && l & 2048 && Cl(o.alternate, o);
					break;
				case 24:
					Dl(a, o, s, c, i), i && l & 2048 && wl(o.alternate, o);
					break;
				default: Dl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Ol(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Ol(n, r), i & 2048 && Cl(r.alternate, r);
					break;
				case 24:
					Ol(n, r), i & 2048 && wl(r.alternate, r);
					break;
				default: Ol(n, r);
			}
			t = t.sibling;
		}
	}
	var kl = 8192;
	function Al(e, t, n) {
		if (e.subtreeFlags & kl) for (e = e.child; e !== null;) jl(e, t, n), e = e.sibling;
	}
	function jl(e, t, n) {
		switch (e.tag) {
			case 26:
				Al(e, t, n), e.flags & kl && e.memoizedState !== null && Gf(n, gl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Al(e, t, n);
				break;
			case 3:
			case 4:
				var r = gl;
				gl = gf(e.stateNode.containerInfo), Al(e, t, n), gl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = kl, kl = 16777216, Al(e, t, n), kl = r) : Al(e, t, n));
				break;
			default: Al(e, t, n);
		}
	}
	function Ml(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Nl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				il = r, Il(r, e);
			}
			Ml(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Pl(e), e = e.sibling;
	}
	function Pl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Nl(e), e.flags & 2048 && Hc(9, e, e.return);
				break;
			case 3:
				Nl(e);
				break;
			case 12:
				Nl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Fl(e)) : Nl(e);
				break;
			default: Nl(e);
		}
	}
	function Fl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				il = r, Il(r, e);
			}
			Ml(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Hc(8, t, t.return), Fl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Fl(t));
					break;
				default: Fl(t);
			}
			e = e.sibling;
		}
	}
	function Il(e, t) {
		for (; il !== null;) {
			var n = il;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Hc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: la(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, il = r;
			else a: for (n = e; il !== null;) {
				r = il;
				var i = r.sibling, a = r.return;
				if (sl(r), r === n) {
					il = null;
					break a;
				}
				if (i !== null) {
					i.return = a, il = i;
					break a;
				}
				il = a;
			}
		}
	}
	var Ll = {
		getCacheForType: function(e) {
			var t = ta(sa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return ta(sa).controller.signal;
		}
	}, Rl = typeof WeakMap == "function" ? WeakMap : Map, K = 0, q = null, J = null, Y = 0, X = 0, zl = null, Bl = !1, Vl = !1, Hl = !1, Ul = 0, Wl = 0, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = 0, Xl = null, Zl = null, Ql = !1, $l = 0, eu = 0, tu = Infinity, nu = null, ru = null, iu = 0, au = null, ou = null, su = 0, cu = 0, lu = null, uu = null, du = 0, fu = null;
	function pu() {
		return K & 2 && Y !== 0 ? Y & -Y : k.T === null ? ct() : dd();
	}
	function mu() {
		if (Jl === 0) if (!(Y & 536870912) || z) {
			var e = qe;
			qe <<= 1, !(qe & 3932160) && (qe = 262144), Jl = e;
		} else Jl = 536870912;
		return e = no.current, e !== null && (e.flags |= 32), Jl;
	}
	function hu(e, t, n) {
		(e === q && (X === 2 || X === 9) || e.cancelPendingCommit !== null) && (Su(e, 0), yu(e, Y, Jl, !1)), tt(e, n), (!(K & 2) || e !== q) && (e === q && (!(K & 2) && (Kl |= n), Wl === 4 && yu(e, Y, Jl, !1)), rd(e));
	}
	function gu(e, t, n) {
		if (K & 6) throw Error(i(327));
		var r = !n && (t & 127) == 0 && (t & e.expiredLanes) === 0 || Ze(e, t), a = r ? Au(e, t) : Ou(e, t, !0), o = r;
		do {
			if (a === 0) {
				Vl && !r && yu(e, t, 0, !1);
				break;
			} else {
				if (n = e.current.alternate, o && !vu(n)) {
					a = Ou(e, t, !1), o = !1;
					continue;
				}
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = Xl;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (Su(c, s).flags |= 256), s = Ou(c, s, !1), s !== 2) {
								if (Hl && !l) {
									c.errorRecoveryDisabledLanes |= o, Kl |= o, a = 4;
									break a;
								}
								o = Zl, Zl = a, o !== null && (Zl === null ? Zl = o : Zl.push.apply(Zl, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					Su(e, 0), yu(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t) break;
						case 6:
							yu(r, t, Jl, !Bl);
							break a;
						case 2:
							Zl = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = $l + 300 - N(), 10 < a)) {
						if (yu(r, t, Jl, !Bl), Xe(r, 0, !0) !== 0) break a;
						su = t, r.timeoutHandle = Kd(_u.bind(null, r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, "Throttled", -0, 0), a);
						break a;
					}
					_u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, null, -0, 0);
				}
			}
			break;
		} while (1);
		rd(e);
	}
	function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: an
			}, jl(t, a, d);
			var m = (a & 62914560) === a ? $l - N() : (a & 4194048) === a ? eu - N() : 0;
			if (m = qf(d, m), m !== null) {
				su = a, e.cancelPendingCommit = m(Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), yu(e, a, o, !l);
				return;
			}
		}
		Lu(e, t, a, n, r, i, o, s, c);
	}
	function vu(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Tr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function yu(e, t, n, r) {
		t &= ~ql, t &= ~Kl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - He(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && rt(e, n, t);
	}
	function bu() {
		return K & 6 ? !0 : (id(0, !1), !1);
	}
	function xu() {
		if (J !== null) {
			if (X === 0) var e = J.return;
			else e = J, qi = Ki = null, Oo(e), Ma = null, Na = 0, e = J;
			for (; e !== null;) Bc(e.alternate, e), e = e.return;
			J = null;
		}
	}
	function Su(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), su = 0, xu(), q = e, J = n = pi(e.current, null), Y = t, X = 0, zl = null, Bl = !1, Vl = Ze(e, t), Hl = !1, Yl = Jl = ql = Kl = Gl = Wl = 0, Zl = Xl = null, Ql = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - He(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Ul = t, ri(), n;
	}
	function Cu(e, t) {
		V = null, k.H = Rs, t === Sa || t === wa ? (t = Aa(), X = 3) : t === Ca ? (t = Aa(), X = 4) : X = t === nc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, zl = t, J === null && (Wl = 1, Xs(e, L(t, e.current)));
	}
	function wu() {
		var e = no.current;
		return e === null ? !0 : (Y & 4194048) === Y ? ro === null : (Y & 62914560) === Y || Y & 536870912 ? e === ro : !1;
	}
	function Tu() {
		var e = k.H;
		return k.H = Rs, e === null ? Rs : e;
	}
	function Eu() {
		var e = k.A;
		return k.A = Ll, e;
	}
	function Du() {
		Wl = 4, Bl || (Y & 4194048) !== Y && no.current !== null || (Vl = !0), !(Gl & 134217727) && !(Kl & 134217727) || q === null || yu(q, Y, Jl, !1);
	}
	function Ou(e, t, n) {
		var r = K;
		K |= 2;
		var i = Tu(), a = Eu();
		(q !== e || Y !== t) && (nu = null, Su(e, t)), t = !1;
		var o = Wl;
		a: do
			try {
				if (X !== 0 && J !== null) {
					var s = J, c = zl;
					switch (X) {
						case 8:
							xu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							no.current === null && (t = !0);
							var l = X;
							if (X = 0, zl = null, Pu(e, s, c, l), n && Vl) {
								o = 0;
								break a;
							}
							break;
						default: l = X, X = 0, zl = null, Pu(e, s, c, l);
					}
				}
				ku(), o = Wl;
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, qi = Ki = null, K = r, k.H = i, k.A = a, J === null && (q = null, Y = 0, ri()), o;
	}
	function ku() {
		for (; J !== null;) Mu(J);
	}
	function Au(e, t) {
		var n = K;
		K |= 2;
		var r = Tu(), a = Eu();
		q !== e || Y !== t ? (nu = null, tu = N() + 500, Su(e, t)) : Vl = Ze(e, t);
		a: do
			try {
				if (X !== 0 && J !== null) {
					t = J;
					var o = zl;
					b: switch (X) {
						case 1:
							X = 0, zl = null, Pu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (Ea(o)) {
								X = 0, zl = null, Nu(t);
								break;
							}
							t = function() {
								X !== 2 && X !== 9 || q !== e || (X = 7), rd(e);
							}, o.then(t, t);
							break a;
						case 3:
							X = 7;
							break a;
						case 4:
							X = 5;
							break a;
						case 7:
							Ea(o) ? (X = 0, zl = null, Nu(t)) : (X = 0, zl = null, Pu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (J.tag) {
								case 26: s = J.memoizedState;
								case 5:
								case 27:
									var c = J;
									if (s ? Wf(s) : c.stateNode.complete) {
										X = 0, zl = null;
										var l = c.sibling;
										if (l !== null) J = l;
										else {
											var u = c.return;
											u === null ? J = null : (J = u, Fu(u));
										}
										break b;
									}
							}
							X = 0, zl = null, Pu(e, t, o, 5);
							break;
						case 6:
							X = 0, zl = null, Pu(e, t, o, 6);
							break;
						case 8:
							xu(), Wl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				ju();
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return qi = Ki = null, k.H = r, k.A = a, K = n, J === null ? (q = null, Y = 0, ri(), Wl) : 0;
	}
	function ju() {
		for (; J !== null && !ke();) Mu(J);
	}
	function Mu(e) {
		var t = Mc(e.alternate, e, Ul);
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : J = t;
	}
	function Nu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = gc(n, t, t.pendingProps, t.type, void 0, Y);
				break;
			case 11:
				t = gc(n, t, t.pendingProps, t.type.render, t.ref, Y);
				break;
			case 5: Oo(t);
			default: Bc(n, t), t = J = mi(t, Ul), t = Mc(n, t, Ul);
		}
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : J = t;
	}
	function Pu(e, t, n, r) {
		qi = Ki = null, Oo(t), Ma = null, Na = 0;
		var i = t.return;
		try {
			if (tc(e, i, t, n, Y)) {
				Wl = 1, Xs(e, L(n, e.current)), J = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw J = i, t;
			Wl = 1, Xs(e, L(n, e.current)), J = null;
			return;
		}
		t.flags & 32768 ? (z || r === 1 ? e = !0 : Vl || Y & 536870912 ? e = !1 : (Bl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = no.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Iu(t, e)) : Fu(t);
	}
	function Fu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Iu(t, Bl);
				return;
			}
			e = t.return;
			var n = Rc(t.alternate, t, Ul);
			if (n !== null) {
				J = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				J = t;
				return;
			}
			J = t = e;
		} while (t !== null);
		Wl === 0 && (Wl = 5);
	}
	function Iu(e, t) {
		do {
			var n = zc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, J = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				J = e;
				return;
			}
			J = e = n;
		} while (e !== null);
		Wl = 6, J = null;
	}
	function Lu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Hu();
		while (iu !== 0);
		if (K & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= ni, nt(e, n, o, s, c, l), e === q && (J = q = null, Y = 0), ou = t, au = e, su = n, cu = o, lu = a, uu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Xu(Pe, function() {
				return Uu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = (t.flags & 13878) != 0, t.subtreeFlags & 13878 || r) {
				r = k.T, k.T = null, a = A.p, A.p = 2, s = K, K |= 4;
				try {
					al(e, t, n);
				} finally {
					K = s, A.p = a, k.T = r;
				}
			}
			iu = 1, Ru(), zu(), Bu();
		}
	}
	function Ru() {
		if (iu === 1) {
			iu = 0;
			var e = au, t = ou, n = (t.flags & 13878) != 0;
			if (t.subtreeFlags & 13878 || n) {
				n = k.T, k.T = null;
				var r = A.p;
				A.p = 2;
				var i = K;
				K |= 4;
				try {
					_l(t, e);
					var a = zd, o = Ar(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && kr(s.ownerDocument.documentElement, s)) {
						if (c !== null && jr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Or(s, h), v = Or(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					K = i, A.p = r, k.T = n;
				}
			}
			e.current = t, iu = 2;
		}
	}
	function zu() {
		if (iu === 2) {
			iu = 0;
			var e = au, t = ou, n = (t.flags & 8772) != 0;
			if (t.subtreeFlags & 8772 || n) {
				n = k.T, k.T = null;
				var r = A.p;
				A.p = 2;
				var i = K;
				K |= 4;
				try {
					ol(e, t.alternate, t);
				} finally {
					K = i, A.p = r, k.T = n;
				}
			}
			iu = 3;
		}
	}
	function Bu() {
		if (iu === 4 || iu === 3) {
			iu = 0, Ae();
			var e = au, t = ou, n = su, r = uu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? iu = 5 : (iu = 0, ou = au = null, Vu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (ru = null), st(n), t = t.stateNode, Be && typeof Be.onCommitFiberRoot == "function") try {
				Be.onCommitFiberRoot(ze, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = k.T, i = A.p, A.p = 2, k.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					k.T = t, A.p = i;
				}
			}
			su & 3 && Hu(), rd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === fu ? du++ : (du = 0, fu = e) : du = 0, id(0, !1);
		}
	}
	function Vu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, la(t)));
	}
	function Hu() {
		return Ru(), zu(), Bu(), Uu();
	}
	function Uu() {
		if (iu !== 5) return !1;
		var e = au, t = cu;
		cu = 0;
		var n = st(su), r = k.T, a = A.p;
		try {
			A.p = 32 > n ? 32 : n, k.T = null, n = lu, lu = null;
			var o = au, s = su;
			if (iu = 0, ou = au = null, su = 0, K & 6) throw Error(i(331));
			var c = K;
			if (K |= 4, Pl(o.current), El(o, o.current, s, n), K = c, id(0, !1), Be && typeof Be.onPostCommitFiberRoot == "function") try {
				Be.onPostCommitFiberRoot(ze, o);
			} catch {}
			return !0;
		} finally {
			A.p = a, k.T = r, Vu(e, t);
		}
	}
	function Wu(e, t, n) {
		t = L(n, t), t = Qs(e.stateNode, t, 2), e = Ua(e, t, 2), e !== null && (tt(e, 2), rd(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) Wu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Wu(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (ru === null || !ru.has(r))) {
					e = L(n, e), n = $s(2), r = Ua(t, n, 2), r !== null && (ec(n, r, t, e), tt(r, 2), rd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Rl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Hl = !0, i.add(n), e = Ku.bind(null, e, t, n), t.then(e, e));
	}
	function Ku(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, q === e && (Y & n) === n && (Wl === 4 || Wl === 3 && (Y & 62914560) === Y && 300 > N() - $l ? !(K & 2) && Su(e, 0) : ql |= n, Yl === Y && (Yl = 0)), rd(e);
	}
	function qu(e, t) {
		t === 0 && (t = $e()), e = oi(e, t), e !== null && (tt(e, t), rd(e));
	}
	function Ju(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), qu(e, n);
	}
	function Yu(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), qu(e, n);
	}
	function Xu(e, t) {
		return De(e, t);
	}
	var Zu = null, Qu = null, $u = !1, ed = !1, td = !1, nd = 0;
	function rd(e) {
		e !== Qu && e.next === null && (Qu === null ? Zu = Qu = e : Qu = Qu.next = e), ed = !0, $u || ($u = !0, ud());
	}
	function id(e, t) {
		if (!td && ed) {
			td = !0;
			do
				for (var n = !1, r = Zu; r !== null;) {
					if (!t) if (e !== 0) {
						var i = r.pendingLanes;
						if (i === 0) var a = 0;
						else {
							var o = r.suspendedLanes, s = r.pingedLanes;
							a = (1 << 31 - He(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
						}
						a !== 0 && (n = !0, ld(r, a));
					} else a = Y, a = Xe(r, r === q ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ze(r, a) || (n = !0, ld(r, a));
					r = r.next;
				}
			while (n);
			td = !1;
		}
	}
	function ad() {
		od();
	}
	function od() {
		ed = $u = !1;
		var e = 0;
		nd !== 0 && Gd() && (e = nd);
		for (var t = N(), n = null, r = Zu; r !== null;) {
			var i = r.next, a = sd(r, t);
			a === 0 ? (r.next = null, n === null ? Zu = i : n.next = i, i === null && (Qu = n)) : (n = r, (e !== 0 || a & 3) && (ed = !0)), r = i;
		}
		iu !== 0 && iu !== 5 || id(e, !1), nd !== 0 && (nd = 0);
	}
	function sd(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - He(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Qe(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = q, n = Y, n = Xe(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (X === 2 || X === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Oe(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ze(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Oe(r), st(n)) {
				case 2:
				case 8:
					n = Ne;
					break;
				case 32:
					n = Pe;
					break;
				case 268435456:
					n = Ie;
					break;
				default: n = Pe;
			}
			return r = cd.bind(null, e), n = De(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Oe(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function cd(e, t) {
		if (iu !== 0 && iu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Hu() && e.callbackNode !== n) return null;
		var r = Y;
		return r = Xe(e, e === q ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (gu(e, r, t), sd(e, N()), e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null);
	}
	function ld(e, t) {
		if (Hu()) return null;
		gu(e, t, !0);
	}
	function ud() {
		Yd(function() {
			K & 6 ? De(Me, ad) : od();
		});
	}
	function dd() {
		if (nd === 0) {
			var e = fa;
			e === 0 && (e = Ke, Ke <<= 1, !(Ke & 261888) && (Ke = 256)), nd = e;
		}
		return nd;
	}
	function fd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : rn("" + e);
	}
	function pd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function md(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = fd((i[ft] || null).action), o = r.submitter;
			o && (t = (t = o[ft] || null) ? fd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new En("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (nd !== 0) {
								var e = o ? pd(i, o) : new FormData(i);
								ws(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? pd(i, o) : new FormData(i), ws(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var hd = 0; hd < Zr.length; hd++) {
		var gd = Zr[hd];
		Qr(gd.toLowerCase(), "on" + (gd[0].toUpperCase() + gd.slice(1)));
	}
	Qr(Ur, "onAnimationEnd"), Qr(Wr, "onAnimationIteration"), Qr(Gr, "onAnimationStart"), Qr("dblclick", "onDoubleClick"), Qr("focusin", "onFocus"), Qr("focusout", "onBlur"), Qr(Kr, "onTransitionRun"), Qr(qr, "onTransitionStart"), Qr(Jr, "onTransitionCancel"), Qr(Yr, "onTransitionEnd"), Ot("onMouseEnter", ["mouseout", "mouseover"]), Ot("onMouseLeave", ["mouseout", "mouseover"]), Ot("onPointerEnter", ["pointerout", "pointerover"]), Ot("onPointerLeave", ["pointerout", "pointerover"]), Dt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Dt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Dt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Dt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Dt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Dt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var _d = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), vd = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(_d));
	function yd(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						$r(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						$r(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[mt];
		n === void 0 && (n = t[mt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Cd(t, e, 2, !1), n.add(r));
	}
	function bd(e, t, n) {
		var r = 0;
		t && (r |= 4), Cd(n, e, r, t);
	}
	var xd = "_reactListening" + Math.random().toString(36).slice(2);
	function Sd(e) {
		if (!e[xd]) {
			e[xd] = !0, Tt.forEach(function(t) {
				t !== "selectionchange" && (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[xd] || (t[xd] = !0, bd("selectionchange", !1, t));
		}
	}
	function Cd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !hn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function wd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = bt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		fn(function() {
			var r = a, i = sn(n), s = [];
			a: {
				var c = Xr.get(e);
				if (c !== void 0) {
					var l = En, u = e;
					switch (e) {
						case "keypress": if (xn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Un;
							break;
						case "focusin":
							u = "focus", l = Pn;
							break;
						case "focusout":
							u = "blur", l = Pn;
							break;
						case "beforeblur":
						case "afterblur":
							l = Pn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Mn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Nn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Gn;
							break;
						case Ur:
						case Wr:
						case Gr:
							l = Fn;
							break;
						case Yr:
							l = Kn;
							break;
						case "scroll":
						case "scrollend":
							l = On;
							break;
						case "wheel":
							l = qn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = In;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Wn;
							break;
						case "toggle":
						case "beforetoggle": l = Jn;
					}
					var d = (t & 4) != 0, f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = pn(m, p), g != null && d.push(Td(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== on && (u = n.relatedTarget || n.fromElement) && (bt(u) || u[pt])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? bt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Mn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Wn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : St(l), h = u == null ? c : St(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, bt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Od(s, c, l, d, !1), u !== null && f !== null && Od(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? St(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = pr;
					else if (cr(c)) if (mr) v = Cr;
					else {
						v = xr;
						var y = br;
					}
					else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && en(r.elementType) && (v = pr) : v = Sr;
					if (v &&= v(e, r)) {
						lr(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Kt(c, "number", c.value);
				}
				switch (y = r ? St(r) : window, e) {
					case "focusin":
						(cr(y) || y.contentEditable === "true") && (Nr = y, Pr = r, Fr = null);
						break;
					case "focusout":
						Fr = Pr = Nr = null;
						break;
					case "mousedown":
						Ir = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Ir = !1, Lr(s, n, i);
						break;
					case "selectionchange": if (Mr) break;
					case "keydown":
					case "keyup": Lr(s, n, i);
				}
				var b;
				if (Xn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else ir ? nr(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && ($n && n.locale !== "ko" && (ir || x !== "onCompositionStart" ? x === "onCompositionEnd" && ir && (b = bn()) : (_n = i, vn = "value" in _n ? _n.value : _n.textContent, ir = !0)), y = Ed(r, x), 0 < y.length && (x = new Ln(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = rr(n), b !== null && (x.data = b)))), (b = Qn ? ar(e, n) : or(e, n)) && (x = Ed(r, "onBeforeInput"), 0 < x.length && (y = new Ln("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), md(s, e, r, n, i);
			}
			yd(s, t);
		});
	}
	function Td(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Ed(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = pn(e, n), i != null && r.unshift(Td(e, i, a)), i = pn(e, t), i != null && r.push(Td(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Dd(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Od(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = pn(n, a), l != null && o.unshift(Td(n, l, c))) : i || (l = pn(n, a), l != null && o.push(Td(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var kd = /\r\n?/g, Ad = /\u0000|\uFFFD/g;
	function jd(e) {
		return (typeof e == "string" ? e : "" + e).replace(kd, "\n").replace(Ad, "");
	}
	function Md(e, t) {
		return t = jd(t), jd(e) === t;
	}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Xt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Xt(e, "" + r);
				break;
			case "className":
				Pt(e, "class", r);
				break;
			case "tabIndex":
				Pt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Pt(e, n, r);
				break;
			case "style":
				$t(e, r, o);
				break;
			case "data": if (t !== "object") {
				Pt(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = rn("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				} else typeof o == "function" && (n === "formAction" ? (t !== "input" && $(e, t, "name", a.name, a, null), $(e, t, "formEncType", a.formEncType, a, null), $(e, t, "formMethod", a.formMethod, a, null), $(e, t, "formTarget", a.formTarget, a, null)) : ($(e, t, "encType", a.encType, a, null), $(e, t, "method", a.method, a, null), $(e, t, "target", a.target, a, null)));
				if (r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = rn("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = an);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = rn("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), Nt(e, "popover", r);
				break;
			case "xlinkActuate":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Ft(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Ft(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Ft(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Ft(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Nt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = tn.get(n) || n, Nt(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				$t(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Xt(e, r) : (typeof r == "number" || typeof r == "bigint") && Xt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = an);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!Et.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[ft] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Nt(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: $(e, t, o, s, n, null);
					}
				}
				a && $(e, t, "srcSet", n.srcSet, n, null), r && $(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: $(e, t, r, d, n, null);
					}
				}
				Gt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: $(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && qt(e, !!r, n, !0) : qt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: $(e, t, s, c, n, null);
				}
				Yt(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: $(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < _d.length; r++) Q(_d[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: $(e, t, u, r, n, null);
				}
				return;
			default: if (en(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || $(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				Wt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? qt(e, !!n, n ? [] : "", !1) : qt(e, !!n, t, !0)) : qt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				Jt(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: $(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: $(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: $(e, t, u, p, r, m);
				}
				return;
			default: if (en(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Ud(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Wd = null;
	function Gd() {
		var e = window.event;
		return e && e.type === "popstate" ? e === Wd ? !1 : (Wd = e, !0) : (Wd = null, !1);
	}
	var Kd = typeof setTimeout == "function" ? setTimeout : void 0, qd = typeof clearTimeout == "function" ? clearTimeout : void 0, Jd = typeof Promise == "function" ? Promise : void 0, Yd = typeof queueMicrotask == "function" ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
		return Jd.resolve(null).then(e).catch(Xd);
	};
	function Xd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Zd(e) {
		return e === "head";
	}
	function Qd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$" || n === "/&") {
				if (r === 0) {
					e.removeChild(i), Np(t);
					return;
				}
				r--;
			} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
			else if (n === "html") pf(e.ownerDocument.documentElement);
			else if (n === "head") {
				n = e.ownerDocument.head, pf(n);
				for (var a = n.firstChild; a;) {
					var o = a.nextSibling, s = a.nodeName;
					a[vt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
				}
			} else n === "body" && pf(e.ownerDocument.body);
			n = i;
		} while (n);
		Np(t);
	}
	function $d(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) if (n = r.data, n === "/$") {
				if (e === 0) break;
				e--;
			} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			n = r;
		} while (n);
	}
	function ef(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					ef(n), yt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function tf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) if (t === "input" && e.type === "hidden") {
				var a = i.name == null ? null : "" + i.name;
				if (i.type === "hidden" && e.getAttribute("name") === a) return e;
			} else return e;
			else if (!e[vt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		yt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = A.d;
	A.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = bu();
		return e || t;
	}
	function yf(e) {
		var t = xt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Es(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = Ut(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), wt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Ut(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Ut(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Ut(n.imageSizes) + "\"]")) : i += "[href=\"" + Ut(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), wt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Ut(r) + "\"][href=\"" + Ut(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = h({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), wt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = Ct(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					wt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = Ct(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), wt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = Ct(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), wt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = me.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = Ct(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = Ct(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = Ct(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + Ut(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), wt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + Ut(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Ut(n.href) + "\"]");
				if (r) return t.instance = r, wt(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), wt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, wt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), wt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, wt(a), a) : (r = n, (a = mf.get(o)) && (r = h({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), wt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[vt] || a[dt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, wt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), wt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: C,
		Provider: null,
		Consumer: null,
		_currentValue: se,
		_currentValue2: se,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = et(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = et(0), this.hiddenUpdates = et(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = di(3, null, null, t), e.current = a, a.stateNode = e, t = ca(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Ba(a), e;
	}
	function tp(e) {
		return e ? (e = li, e) : li;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Ha(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ua(e, r, t), n !== null && (hu(n, e, t), Wa(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = oi(e, 67108864);
			t !== null && hu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = pu();
			t = ot(t);
			var n = oi(e, t);
			n !== null && hu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = k.T;
		k.T = null;
		var a = A.p;
		try {
			A.p = 2, up(e, t, n, r);
		} finally {
			A.p = a, k.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = k.T;
		k.T = null;
		var a = A.p;
		try {
			A.p = 8, up(e, t, n, r);
		} finally {
			A.p = a, k.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) wd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = xt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ye(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - He(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									rd(a), !(K & 6) && (tu = N() + 500, id(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = oi(a, 2), s !== null && hu(s, a, 2), bu(), ip(a, 2);
					}
					if (a = dp(r), a === null && wd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else wd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = sn(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = bt(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (je()) {
				case Me: return 2;
				case Ne: return 8;
				case Pe:
				case Fe: return 32;
				case Ie: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = xt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = bt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, lt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, lt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				on = r, n.target.dispatchEvent(r), on = null;
			} else return t = xt(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = xt(n);
				a !== null && (e.splice(t, 3), t -= 3, ws(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[ft] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[ft] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, pu(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), bu(), t[pt] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ct();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.6") throw Error(i(527, Lp, "19.2.6"));
	A.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.6",
		rendererPackageName: "react-dom",
		currentDispatcherRef: k,
		reconcilerVersion: "19.2.6"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			ze = zp.inject(Rp), Be = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = qs, s = Js, c = Ys;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[pt] = t.current, Sd(e), new Fp(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u()), v = g();
function y(e) {
	var t = [...arguments].slice(1);
	throw Error("[Immer] minified error nr: " + e + (t.length ? " " + t.map((function(e) {
		return "'" + e + "'";
	})).join(",") : "") + ". Find the full error at: https://bit.ly/3cXEKWf");
}
function b(e) {
	return !!e && !!e[N];
}
function x(e) {
	return !!e && (function(e) {
		if (!e || typeof e != "object") return !1;
		var t = Object.getPrototypeOf(e);
		if (t === null) return !0;
		var n = Object.hasOwnProperty.call(t, "constructor") && t.constructor;
		return n === Object || typeof n == "function" && Function.toString.call(n) === Me;
	}(e) || Array.isArray(e) || !!e[Ae] || !!e.constructor?.[Ae] || T(e) || E(e));
}
function S(e, t, n) {
	n === void 0 && (n = !1), C(e) === 0 ? (n ? Object.keys : Ne)(e).forEach((function(r) {
		n && typeof r == "symbol" || t(r, e[r], e);
	})) : e.forEach((function(n, r) {
		return t(r, n, e);
	}));
}
function C(e) {
	var t = e[N];
	return t ? t.i > 3 ? t.i - 4 : t.i : Array.isArray(e) ? 1 : T(e) ? 2 : E(e) ? 3 : 0;
}
function w(e, t) {
	return C(e) === 2 ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function ee(e, t) {
	return C(e) === 2 ? e.get(t) : e[t];
}
function te(e, t, n) {
	var r = C(e);
	r === 2 ? e.set(t, n) : r === 3 ? e.add(n) : e[t] = n;
}
function ne(e, t) {
	return e === t ? e !== 0 || 1 / e == 1 / t : e != e && t != t;
}
function T(e) {
	return Ee && e instanceof Map;
}
function E(e) {
	return De && e instanceof Set;
}
function D(e) {
	return e.o || e.t;
}
function re(e) {
	if (Array.isArray(e)) return Array.prototype.slice.call(e);
	var t = Pe(e);
	delete t[N];
	for (var n = Ne(t), r = 0; r < n.length; r++) {
		var i = n[r], a = t[i];
		!1 === a.writable && (a.writable = !0, a.configurable = !0), (a.get || a.set) && (t[i] = {
			configurable: !0,
			writable: !0,
			enumerable: a.enumerable,
			value: e[i]
		});
	}
	return Object.create(Object.getPrototypeOf(e), t);
}
function ie(e, t) {
	return t === void 0 && (t = !1), O(e) || b(e) || !x(e) || (C(e) > 1 && (e.set = e.add = e.clear = e.delete = ae), Object.freeze(e), t && S(e, (function(e, t) {
		return ie(t, !0);
	}), !0)), e;
}
function ae() {
	y(2);
}
function O(e) {
	return typeof e != "object" || !e || Object.isFrozen(e);
}
function oe(e) {
	var t = Fe[e];
	return t || y(18, e), t;
}
function k(e, t) {
	Fe[e] || (Fe[e] = t);
}
function A() {
	return we;
}
function se(e, t) {
	t && (oe("Patches"), e.u = [], e.s = [], e.v = t);
}
function ce(e) {
	le(e), e.p.forEach(de), e.p = null;
}
function le(e) {
	e === we && (we = e.l);
}
function ue(e) {
	return we = {
		p: [],
		l: we,
		h: e,
		m: !0,
		_: 0
	};
}
function de(e) {
	var t = e[N];
	t.i === 0 || t.i === 1 ? t.j() : t.g = !0;
}
function j(e, t) {
	t._ = t.p.length;
	var n = t.p[0], r = e !== void 0 && e !== n;
	return t.h.O || oe("ES5").S(t, e, r), r ? (n[N].P && (ce(t), y(4)), x(e) && (e = fe(t, e), t.l || me(t, e)), t.u && oe("Patches").M(n[N].t, e, t.u, t.s)) : e = fe(t, n, []), ce(t), t.u && t.v(t.u, t.s), e === ke ? void 0 : e;
}
function fe(e, t, n) {
	if (O(t)) return t;
	var r = t[N];
	if (!r) return S(t, (function(i, a) {
		return pe(e, r, t, i, a, n);
	}), !0), t;
	if (r.A !== e) return t;
	if (!r.P) return me(e, r.t, !0), r.t;
	if (!r.I) {
		r.I = !0, r.A._--;
		var i = r.i === 4 || r.i === 5 ? r.o = re(r.k) : r.o, a = i, o = !1;
		r.i === 3 && (a = new Set(i), i.clear(), o = !0), S(a, (function(t, a) {
			return pe(e, r, i, t, a, n, o);
		})), me(e, i, !1), n && e.u && oe("Patches").N(r, n, e.u, e.s);
	}
	return r.o;
}
function pe(e, t, n, r, i, a, o) {
	if (b(i)) {
		var s = fe(e, i, a && t && t.i !== 3 && !w(t.R, r) ? a.concat(r) : void 0);
		if (te(n, r, s), !b(s)) return;
		e.m = !1;
	} else o && n.add(i);
	if (x(i) && !O(i)) {
		if (!e.h.D && e._ < 1) return;
		fe(e, i), t && t.A.l || me(e, i);
	}
}
function me(e, t, n) {
	n === void 0 && (n = !1), !e.l && e.h.D && e.m && ie(t, n);
}
function he(e, t) {
	var n = e[N];
	return (n ? D(n) : e)[t];
}
function ge(e, t) {
	if (t in e) for (var n = Object.getPrototypeOf(e); n;) {
		var r = Object.getOwnPropertyDescriptor(n, t);
		if (r) return r;
		n = Object.getPrototypeOf(n);
	}
}
function _e(e) {
	e.P || (e.P = !0, e.l && _e(e.l));
}
function ve(e) {
	e.o ||= re(e.t);
}
function ye(e, t, n) {
	var r = T(t) ? oe("MapSet").F(t, n) : E(t) ? oe("MapSet").T(t, n) : e.O ? function(e, t) {
		var n = Array.isArray(e), r = {
			i: +!!n,
			A: t ? t.A : A(),
			P: !1,
			I: !1,
			R: {},
			l: t,
			t: e,
			k: null,
			o: null,
			j: null,
			C: !1
		}, i = r, a = Ie;
		n && (i = [r], a = Le);
		var o = Proxy.revocable(i, a), s = o.revoke, c = o.proxy;
		return r.k = c, r.j = s, c;
	}(t, n) : oe("ES5").J(t, n);
	return (n ? n.A : A()).p.push(r), r;
}
function be(e) {
	return b(e) || y(22, e), function e(t) {
		if (!x(t)) return t;
		var n, r = t[N], i = C(t);
		if (r) {
			if (!r.P && (r.i < 4 || !oe("ES5").K(r))) return r.t;
			r.I = !0, n = M(t, i), r.I = !1;
		} else n = M(t, i);
		return S(n, (function(t, i) {
			r && ee(r.t, t) === i || te(n, t, e(i));
		})), i === 3 ? new Set(n) : n;
	}(e);
}
function M(e, t) {
	switch (t) {
		case 2: return new Map(e);
		case 3: return Array.from(e);
	}
	return re(e);
}
function xe() {
	function e(t) {
		if (!x(t)) return t;
		if (Array.isArray(t)) return t.map(e);
		if (T(t)) return new Map(Array.from(t.entries()).map((function(t) {
			return [t[0], e(t[1])];
		})));
		if (E(t)) return new Set(Array.from(t).map(e));
		var n = Object.create(Object.getPrototypeOf(t));
		for (var r in t) n[r] = e(t[r]);
		return w(t, Ae) && (n[Ae] = t[Ae]), n;
	}
	function t(t) {
		return b(t) ? e(t) : t;
	}
	var n = "add";
	k("Patches", {
		$: function(t, r) {
			return r.forEach((function(r) {
				for (var i = r.path, a = r.op, o = t, s = 0; s < i.length - 1; s++) {
					var c = C(o), l = i[s];
					typeof l != "string" && typeof l != "number" && (l = "" + l), c !== 0 && c !== 1 || l !== "__proto__" && l !== "constructor" || y(24), typeof o == "function" && l === "prototype" && y(24), typeof (o = ee(o, l)) != "object" && y(15, i.join("/"));
				}
				var u = C(o), d = e(r.value), f = i[i.length - 1];
				switch (a) {
					case "replace": switch (u) {
						case 2: return o.set(f, d);
						case 3: y(16);
						default: return o[f] = d;
					}
					case n: switch (u) {
						case 1: return f === "-" ? o.push(d) : o.splice(f, 0, d);
						case 2: return o.set(f, d);
						case 3: return o.add(d);
						default: return o[f] = d;
					}
					case "remove": switch (u) {
						case 1: return o.splice(f, 1);
						case 2: return o.delete(f);
						case 3: return o.delete(r.value);
						default: return delete o[f];
					}
					default: y(17, a);
				}
			})), t;
		},
		N: function(e, r, i, a) {
			switch (e.i) {
				case 0:
				case 4:
				case 2: return function(e, r, i, a) {
					var o = e.t, s = e.o;
					S(e.R, (function(e, c) {
						var l = ee(o, e), u = ee(s, e), d = c ? w(o, e) ? "replace" : n : "remove";
						if (l !== u || d !== "replace") {
							var f = r.concat(e);
							i.push(d === "remove" ? {
								op: d,
								path: f
							} : {
								op: d,
								path: f,
								value: u
							}), a.push(d === n ? {
								op: "remove",
								path: f
							} : d === "remove" ? {
								op: n,
								path: f,
								value: t(l)
							} : {
								op: "replace",
								path: f,
								value: t(l)
							});
						}
					}));
				}(e, r, i, a);
				case 5:
				case 1: return function(e, r, i, a) {
					var o = e.t, s = e.R, c = e.o;
					if (c.length < o.length) {
						var l = [c, o];
						o = l[0], c = l[1];
						var u = [a, i];
						i = u[0], a = u[1];
					}
					for (var d = 0; d < o.length; d++) if (s[d] && c[d] !== o[d]) {
						var f = r.concat([d]);
						i.push({
							op: "replace",
							path: f,
							value: t(c[d])
						}), a.push({
							op: "replace",
							path: f,
							value: t(o[d])
						});
					}
					for (var p = o.length; p < c.length; p++) {
						var m = r.concat([p]);
						i.push({
							op: n,
							path: m,
							value: t(c[p])
						});
					}
					o.length < c.length && a.push({
						op: "replace",
						path: r.concat(["length"]),
						value: o.length
					});
				}(e, r, i, a);
				case 3: return function(e, t, r, i) {
					var a = e.t, o = e.o, s = 0;
					a.forEach((function(e) {
						if (!o.has(e)) {
							var a = t.concat([s]);
							r.push({
								op: "remove",
								path: a,
								value: e
							}), i.unshift({
								op: n,
								path: a,
								value: e
							});
						}
						s++;
					})), s = 0, o.forEach((function(e) {
						if (!a.has(e)) {
							var o = t.concat([s]);
							r.push({
								op: n,
								path: o,
								value: e
							}), i.unshift({
								op: "remove",
								path: o,
								value: e
							});
						}
						s++;
					}));
				}(e, r, i, a);
			}
		},
		M: function(e, t, n, r) {
			n.push({
				op: "replace",
				path: [],
				value: t === ke ? void 0 : t
			}), r.push({
				op: "replace",
				path: [],
				value: e
			});
		}
	});
}
function Se() {
	function e(e, t) {
		function n() {
			this.constructor = e;
		}
		i(e, t), e.prototype = (n.prototype = t.prototype, new n());
	}
	function t(e) {
		e.o ||= (e.R = /* @__PURE__ */ new Map(), new Map(e.t));
	}
	function n(e) {
		e.o || (e.o = /* @__PURE__ */ new Set(), e.t.forEach((function(t) {
			if (x(t)) {
				var n = ye(e.A.h, t, e);
				e.p.set(t, n), e.o.add(n);
			} else e.o.add(t);
		})));
	}
	function r(e) {
		e.g && y(3, JSON.stringify(D(e)));
	}
	var i = function(e, t) {
		return (i = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
			e.__proto__ = t;
		} || function(e, t) {
			for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
		})(e, t);
	}, a = function() {
		function n(e, t) {
			return this[N] = {
				i: 2,
				l: t,
				A: t ? t.A : A(),
				P: !1,
				I: !1,
				o: void 0,
				R: void 0,
				t: e,
				k: this,
				C: !1,
				g: !1
			}, this;
		}
		e(n, Map);
		var i = n.prototype;
		return Object.defineProperty(i, "size", { get: function() {
			return D(this[N]).size;
		} }), i.has = function(e) {
			return D(this[N]).has(e);
		}, i.set = function(e, n) {
			var i = this[N];
			return r(i), D(i).has(e) && D(i).get(e) === n || (t(i), _e(i), i.R.set(e, !0), i.o.set(e, n), i.R.set(e, !0)), this;
		}, i.delete = function(e) {
			if (!this.has(e)) return !1;
			var n = this[N];
			return r(n), t(n), _e(n), n.t.has(e) ? n.R.set(e, !1) : n.R.delete(e), n.o.delete(e), !0;
		}, i.clear = function() {
			var e = this[N];
			r(e), D(e).size && (t(e), _e(e), e.R = /* @__PURE__ */ new Map(), S(e.t, (function(t) {
				e.R.set(t, !1);
			})), e.o.clear());
		}, i.forEach = function(e, t) {
			var n = this;
			D(this[N]).forEach((function(r, i) {
				e.call(t, n.get(i), i, n);
			}));
		}, i.get = function(e) {
			var n = this[N];
			r(n);
			var i = D(n).get(e);
			if (n.I || !x(i) || i !== n.t.get(e)) return i;
			var a = ye(n.A.h, i, n);
			return t(n), n.o.set(e, a), a;
		}, i.keys = function() {
			return D(this[N]).keys();
		}, i.values = function() {
			var e, t = this, n = this.keys();
			return (e = {})[je] = function() {
				return t.values();
			}, e.next = function() {
				var e = n.next();
				return e.done ? e : {
					done: !1,
					value: t.get(e.value)
				};
			}, e;
		}, i.entries = function() {
			var e, t = this, n = this.keys();
			return (e = {})[je] = function() {
				return t.entries();
			}, e.next = function() {
				var e = n.next();
				if (e.done) return e;
				var r = t.get(e.value);
				return {
					done: !1,
					value: [e.value, r]
				};
			}, e;
		}, i[je] = function() {
			return this.entries();
		}, n;
	}(), o = function() {
		function t(e, t) {
			return this[N] = {
				i: 3,
				l: t,
				A: t ? t.A : A(),
				P: !1,
				I: !1,
				o: void 0,
				t: e,
				k: this,
				p: /* @__PURE__ */ new Map(),
				g: !1,
				C: !1
			}, this;
		}
		e(t, Set);
		var i = t.prototype;
		return Object.defineProperty(i, "size", { get: function() {
			return D(this[N]).size;
		} }), i.has = function(e) {
			var t = this[N];
			return r(t), t.o ? !!t.o.has(e) || !(!t.p.has(e) || !t.o.has(t.p.get(e))) : t.t.has(e);
		}, i.add = function(e) {
			var t = this[N];
			return r(t), this.has(e) || (n(t), _e(t), t.o.add(e)), this;
		}, i.delete = function(e) {
			if (!this.has(e)) return !1;
			var t = this[N];
			return r(t), n(t), _e(t), t.o.delete(e) || !!t.p.has(e) && t.o.delete(t.p.get(e));
		}, i.clear = function() {
			var e = this[N];
			r(e), D(e).size && (n(e), _e(e), e.o.clear());
		}, i.values = function() {
			var e = this[N];
			return r(e), n(e), e.o.values();
		}, i.entries = function() {
			var e = this[N];
			return r(e), n(e), e.o.entries();
		}, i.keys = function() {
			return this.values();
		}, i[je] = function() {
			return this.values();
		}, i.forEach = function(e, t) {
			for (var n = this.values(), r = n.next(); !r.done;) e.call(t, r.value, r.value, this), r = n.next();
		}, t;
	}();
	k("MapSet", {
		F: function(e, t) {
			return new a(e, t);
		},
		T: function(e, t) {
			return new o(e, t);
		}
	});
}
var Ce, we, Te = typeof Symbol < "u" && typeof Symbol("x") == "symbol", Ee = typeof Map < "u", De = typeof Set < "u", Oe = typeof Proxy < "u" && Proxy.revocable !== void 0 && typeof Reflect < "u", ke = Te ? Symbol.for("immer-nothing") : ((Ce = {})["immer-nothing"] = !0, Ce), Ae = Te ? Symbol.for("immer-draftable") : "__$immer_draftable", N = Te ? Symbol.for("immer-state") : "__$immer_state", je = typeof Symbol < "u" && Symbol.iterator || "@@iterator", Me = "" + Object.prototype.constructor, Ne = typeof Reflect < "u" && Reflect.ownKeys ? Reflect.ownKeys : Object.getOwnPropertySymbols === void 0 ? Object.getOwnPropertyNames : function(e) {
	return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
}, Pe = Object.getOwnPropertyDescriptors || function(e) {
	var t = {};
	return Ne(e).forEach((function(n) {
		t[n] = Object.getOwnPropertyDescriptor(e, n);
	})), t;
}, Fe = {}, Ie = {
	get: function(e, t) {
		if (t === N) return e;
		var n = D(e);
		if (!w(n, t)) return function(e, t, n) {
			var r = ge(t, n);
			return r ? "value" in r ? r.value : r.get?.call(e.k) : void 0;
		}(e, n, t);
		var r = n[t];
		return e.I || !x(r) ? r : r === he(e.t, t) ? (ve(e), e.o[t] = ye(e.A.h, r, e)) : r;
	},
	has: function(e, t) {
		return t in D(e);
	},
	ownKeys: function(e) {
		return Reflect.ownKeys(D(e));
	},
	set: function(e, t, n) {
		var r = ge(D(e), t);
		if (r?.set) return r.set.call(e.k, n), !0;
		if (!e.P) {
			var i = he(D(e), t), a = i?.[N];
			if (a && a.t === n) return e.o[t] = n, e.R[t] = !1, !0;
			if (ne(n, i) && (n !== void 0 || w(e.t, t))) return !0;
			ve(e), _e(e);
		}
		return e.o[t] === n && (n !== void 0 || t in e.o) || Number.isNaN(n) && Number.isNaN(e.o[t]) || (e.o[t] = n, e.R[t] = !0), !0;
	},
	deleteProperty: function(e, t) {
		return he(e.t, t) !== void 0 || t in e.t ? (e.R[t] = !1, ve(e), _e(e)) : delete e.R[t], e.o && delete e.o[t], !0;
	},
	getOwnPropertyDescriptor: function(e, t) {
		var n = D(e), r = Reflect.getOwnPropertyDescriptor(n, t);
		return r && {
			writable: !0,
			configurable: e.i !== 1 || t !== "length",
			enumerable: r.enumerable,
			value: n[t]
		};
	},
	defineProperty: function() {
		y(11);
	},
	getPrototypeOf: function(e) {
		return Object.getPrototypeOf(e.t);
	},
	setPrototypeOf: function() {
		y(12);
	}
}, Le = {};
S(Ie, (function(e, t) {
	Le[e] = function() {
		return arguments[0] = arguments[0][0], t.apply(this, arguments);
	};
})), Le.deleteProperty = function(e, t) {
	return Le.set.call(this, e, t, void 0);
}, Le.set = function(e, t, n) {
	return Ie.set.call(this, e[0], t, n, e[0]);
};
var Re = new (function() {
	function e(e) {
		var t = this;
		this.O = Oe, this.D = !0, this.produce = function(e, n, r) {
			if (typeof e == "function" && typeof n != "function") {
				var i = n;
				n = e;
				var a = t;
				return function(e) {
					var t = this;
					e === void 0 && (e = i);
					var r = [...arguments].slice(1);
					return a.produce(e, (function(e) {
						var i;
						return (i = n).call.apply(i, [t, e].concat(r));
					}));
				};
			}
			var o;
			if (typeof n != "function" && y(6), r !== void 0 && typeof r != "function" && y(7), x(e)) {
				var s = ue(t), c = ye(t, e, void 0), l = !0;
				try {
					o = n(c), l = !1;
				} finally {
					l ? ce(s) : le(s);
				}
				return typeof Promise < "u" && o instanceof Promise ? o.then((function(e) {
					return se(s, r), j(e, s);
				}), (function(e) {
					throw ce(s), e;
				})) : (se(s, r), j(o, s));
			}
			if (!e || typeof e != "object") {
				if ((o = n(e)) === void 0 && (o = e), o === ke && (o = void 0), t.D && ie(o, !0), r) {
					var u = [], d = [];
					oe("Patches").M(e, o, u, d), r(u, d);
				}
				return o;
			}
			y(21, e);
		}, this.produceWithPatches = function(e, n) {
			if (typeof e == "function") return function(n) {
				var r = [...arguments].slice(1);
				return t.produceWithPatches(n, (function(t) {
					return e.apply(void 0, [t].concat(r));
				}));
			};
			var r, i, a = t.produce(e, n, (function(e, t) {
				r = e, i = t;
			}));
			return typeof Promise < "u" && a instanceof Promise ? a.then((function(e) {
				return [
					e,
					r,
					i
				];
			})) : [
				a,
				r,
				i
			];
		}, typeof e?.useProxies == "boolean" && this.setUseProxies(e.useProxies), typeof e?.autoFreeze == "boolean" && this.setAutoFreeze(e.autoFreeze);
	}
	var t = e.prototype;
	return t.createDraft = function(e) {
		x(e) || y(8), b(e) && (e = be(e));
		var t = ue(this), n = ye(this, e, void 0);
		return n[N].C = !0, le(t), n;
	}, t.finishDraft = function(e, t) {
		var n = (e && e[N]).A;
		return se(n, t), j(void 0, n);
	}, t.setAutoFreeze = function(e) {
		this.D = e;
	}, t.setUseProxies = function(e) {
		e && !Oe && y(20), this.O = e;
	}, t.applyPatches = function(e, t) {
		var n;
		for (n = t.length - 1; n >= 0; n--) {
			var r = t[n];
			if (r.path.length === 0 && r.op === "replace") {
				e = r.value;
				break;
			}
		}
		n > -1 && (t = t.slice(n + 1));
		var i = oe("Patches").$;
		return b(e) ? i(e, t) : this.produce(e, (function(e) {
			return i(e, t);
		}));
	}, e;
}())(), ze = Re.produce, Be = Re.produceWithPatches.bind(Re);
Re.setAutoFreeze.bind(Re), Re.setUseProxies.bind(Re);
var Ve = Re.applyPatches.bind(Re);
Re.createDraft.bind(Re), Re.finishDraft.bind(Re);
//#endregion
//#region node_modules/lodash/_listCacheClear.js
var He = /* @__PURE__ */ o(((e, t) => {
	function n() {
		this.__data__ = [], this.size = 0;
	}
	t.exports = n;
})), Ue = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e === t || e !== e && t !== t;
	}
	t.exports = n;
})), We = /* @__PURE__ */ o(((e, t) => {
	var n = Ue();
	function r(e, t) {
		for (var r = e.length; r--;) if (n(e[r][0], t)) return r;
		return -1;
	}
	t.exports = r;
})), Ge = /* @__PURE__ */ o(((e, t) => {
	var n = We(), r = Array.prototype.splice;
	function i(e) {
		var t = this.__data__, i = n(t, e);
		return i < 0 ? !1 : (i == t.length - 1 ? t.pop() : r.call(t, i, 1), --this.size, !0);
	}
	t.exports = i;
})), Ke = /* @__PURE__ */ o(((e, t) => {
	var n = We();
	function r(e) {
		var t = this.__data__, r = n(t, e);
		return r < 0 ? void 0 : t[r][1];
	}
	t.exports = r;
})), qe = /* @__PURE__ */ o(((e, t) => {
	var n = We();
	function r(e) {
		return n(this.__data__, e) > -1;
	}
	t.exports = r;
})), Je = /* @__PURE__ */ o(((e, t) => {
	var n = We();
	function r(e, t) {
		var r = this.__data__, i = n(r, e);
		return i < 0 ? (++this.size, r.push([e, t])) : r[i][1] = t, this;
	}
	t.exports = r;
})), Ye = /* @__PURE__ */ o(((e, t) => {
	var n = He(), r = Ge(), i = Ke(), a = qe(), o = Je();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), Xe = /* @__PURE__ */ o(((e, t) => {
	var n = Ye();
	function r() {
		this.__data__ = new n(), this.size = 0;
	}
	t.exports = r;
})), Ze = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = this.__data__, n = t.delete(e);
		return this.size = t.size, n;
	}
	t.exports = n;
})), Qe = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.get(e);
	}
	t.exports = n;
})), $e = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.has(e);
	}
	t.exports = n;
})), et = /* @__PURE__ */ o(((e, t) => {
	t.exports = typeof global == "object" && global && global.Object === Object && global;
})), tt = /* @__PURE__ */ o(((e, t) => {
	var n = et(), r = typeof self == "object" && self && self.Object === Object && self;
	t.exports = n || r || Function("return this")();
})), nt = /* @__PURE__ */ o(((e, t) => {
	t.exports = tt().Symbol;
})), rt = /* @__PURE__ */ o(((e, t) => {
	var n = nt(), r = Object.prototype, i = r.hasOwnProperty, a = r.toString, o = n ? n.toStringTag : void 0;
	function s(e) {
		var t = i.call(e, o), n = e[o];
		try {
			e[o] = void 0;
			var r = !0;
		} catch {}
		var s = a.call(e);
		return r && (t ? e[o] = n : delete e[o]), s;
	}
	t.exports = s;
})), it = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype.toString;
	function r(e) {
		return n.call(e);
	}
	t.exports = r;
})), at = /* @__PURE__ */ o(((e, t) => {
	var n = nt(), r = rt(), i = it(), a = "[object Null]", o = "[object Undefined]", s = n ? n.toStringTag : void 0;
	function c(e) {
		return e == null ? e === void 0 ? o : a : s && s in Object(e) ? r(e) : i(e);
	}
	t.exports = c;
})), ot = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = typeof e;
		return e != null && (t == "object" || t == "function");
	}
	t.exports = n;
})), st = /* @__PURE__ */ o(((e, t) => {
	var n = at(), r = ot(), i = "[object AsyncFunction]", a = "[object Function]", o = "[object GeneratorFunction]", s = "[object Proxy]";
	function c(e) {
		if (!r(e)) return !1;
		var t = n(e);
		return t == a || t == o || t == i || t == s;
	}
	t.exports = c;
})), ct = /* @__PURE__ */ o(((e, t) => {
	t.exports = tt()["__core-js_shared__"];
})), lt = /* @__PURE__ */ o(((e, t) => {
	var n = ct(), r = function() {
		var e = /[^.]+$/.exec(n && n.keys && n.keys.IE_PROTO || "");
		return e ? "Symbol(src)_1." + e : "";
	}();
	function i(e) {
		return !!r && r in e;
	}
	t.exports = i;
})), ut = /* @__PURE__ */ o(((e, t) => {
	var n = Function.prototype.toString;
	function r(e) {
		if (e != null) {
			try {
				return n.call(e);
			} catch {}
			try {
				return e + "";
			} catch {}
		}
		return "";
	}
	t.exports = r;
})), dt = /* @__PURE__ */ o(((e, t) => {
	var n = st(), r = lt(), i = ot(), a = ut(), o = /[\\^$.*+?()[\]{}|]/g, s = /^\[object .+?Constructor\]$/, c = Function.prototype, l = Object.prototype, u = c.toString, d = l.hasOwnProperty, f = RegExp("^" + u.call(d).replace(o, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
	function p(e) {
		return !i(e) || r(e) ? !1 : (n(e) ? f : s).test(a(e));
	}
	t.exports = p;
})), ft = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e?.[t];
	}
	t.exports = n;
})), pt = /* @__PURE__ */ o(((e, t) => {
	var n = dt(), r = ft();
	function i(e, t) {
		var i = r(e, t);
		return n(i) ? i : void 0;
	}
	t.exports = i;
})), mt = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(tt(), "Map");
})), ht = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(Object, "create");
})), gt = /* @__PURE__ */ o(((e, t) => {
	var n = ht();
	function r() {
		this.__data__ = n ? n(null) : {}, this.size = 0;
	}
	t.exports = r;
})), _t = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = this.has(e) && delete this.__data__[e];
		return this.size -= +!!t, t;
	}
	t.exports = n;
})), vt = /* @__PURE__ */ o(((e, t) => {
	var n = ht(), r = "__lodash_hash_undefined__", i = Object.prototype.hasOwnProperty;
	function a(e) {
		var t = this.__data__;
		if (n) {
			var a = t[e];
			return a === r ? void 0 : a;
		}
		return i.call(t, e) ? t[e] : void 0;
	}
	t.exports = a;
})), yt = /* @__PURE__ */ o(((e, t) => {
	var n = ht(), r = Object.prototype.hasOwnProperty;
	function i(e) {
		var t = this.__data__;
		return n ? t[e] !== void 0 : r.call(t, e);
	}
	t.exports = i;
})), bt = /* @__PURE__ */ o(((e, t) => {
	var n = ht(), r = "__lodash_hash_undefined__";
	function i(e, t) {
		var i = this.__data__;
		return this.size += +!this.has(e), i[e] = n && t === void 0 ? r : t, this;
	}
	t.exports = i;
})), xt = /* @__PURE__ */ o(((e, t) => {
	var n = gt(), r = _t(), i = vt(), a = yt(), o = bt();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), St = /* @__PURE__ */ o(((e, t) => {
	var n = xt(), r = Ye(), i = mt();
	function a() {
		this.size = 0, this.__data__ = {
			hash: new n(),
			map: new (i || r)(),
			string: new n()
		};
	}
	t.exports = a;
})), Ct = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = typeof e;
		return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
	}
	t.exports = n;
})), wt = /* @__PURE__ */ o(((e, t) => {
	var n = Ct();
	function r(e, t) {
		var r = e.__data__;
		return n(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
	}
	t.exports = r;
})), Tt = /* @__PURE__ */ o(((e, t) => {
	var n = wt();
	function r(e) {
		var t = n(this, e).delete(e);
		return this.size -= +!!t, t;
	}
	t.exports = r;
})), Et = /* @__PURE__ */ o(((e, t) => {
	var n = wt();
	function r(e) {
		return n(this, e).get(e);
	}
	t.exports = r;
})), Dt = /* @__PURE__ */ o(((e, t) => {
	var n = wt();
	function r(e) {
		return n(this, e).has(e);
	}
	t.exports = r;
})), Ot = /* @__PURE__ */ o(((e, t) => {
	var n = wt();
	function r(e, t) {
		var r = n(this, e), i = r.size;
		return r.set(e, t), this.size += r.size == i ? 0 : 1, this;
	}
	t.exports = r;
})), kt = /* @__PURE__ */ o(((e, t) => {
	var n = St(), r = Tt(), i = Et(), a = Dt(), o = Ot();
	function s(e) {
		var t = -1, n = e == null ? 0 : e.length;
		for (this.clear(); ++t < n;) {
			var r = e[t];
			this.set(r[0], r[1]);
		}
	}
	s.prototype.clear = n, s.prototype.delete = r, s.prototype.get = i, s.prototype.has = a, s.prototype.set = o, t.exports = s;
})), At = /* @__PURE__ */ o(((e, t) => {
	var n = Ye(), r = mt(), i = kt(), a = 200;
	function o(e, t) {
		var o = this.__data__;
		if (o instanceof n) {
			var s = o.__data__;
			if (!r || s.length < a - 1) return s.push([e, t]), this.size = ++o.size, this;
			o = this.__data__ = new i(s);
		}
		return o.set(e, t), this.size = o.size, this;
	}
	t.exports = o;
})), jt = /* @__PURE__ */ o(((e, t) => {
	var n = Ye(), r = Xe(), i = Ze(), a = Qe(), o = $e(), s = At();
	function c(e) {
		var t = this.__data__ = new n(e);
		this.size = t.size;
	}
	c.prototype.clear = r, c.prototype.delete = i, c.prototype.get = a, c.prototype.has = o, c.prototype.set = s, t.exports = c;
})), Mt = /* @__PURE__ */ o(((e, t) => {
	var n = "__lodash_hash_undefined__";
	function r(e) {
		return this.__data__.set(e, n), this;
	}
	t.exports = r;
})), Nt = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return this.__data__.has(e);
	}
	t.exports = n;
})), Pt = /* @__PURE__ */ o(((e, t) => {
	var n = kt(), r = Mt(), i = Nt();
	function a(e) {
		var t = -1, r = e == null ? 0 : e.length;
		for (this.__data__ = new n(); ++t < r;) this.add(e[t]);
	}
	a.prototype.add = a.prototype.push = r, a.prototype.has = i, t.exports = a;
})), Ft = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
		return !1;
	}
	t.exports = n;
})), It = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return e.has(t);
	}
	t.exports = n;
})), Lt = /* @__PURE__ */ o(((e, t) => {
	var n = Pt(), r = Ft(), i = It(), a = 1, o = 2;
	function s(e, t, s, c, l, u) {
		var d = s & a, f = e.length, p = t.length;
		if (f != p && !(d && p > f)) return !1;
		var m = u.get(e), h = u.get(t);
		if (m && h) return m == t && h == e;
		var g = -1, _ = !0, v = s & o ? new n() : void 0;
		for (u.set(e, t), u.set(t, e); ++g < f;) {
			var y = e[g], b = t[g];
			if (c) var x = d ? c(b, y, g, t, e, u) : c(y, b, g, e, t, u);
			if (x !== void 0) {
				if (x) continue;
				_ = !1;
				break;
			}
			if (v) {
				if (!r(t, function(e, t) {
					if (!i(v, t) && (y === e || l(y, e, s, c, u))) return v.push(t);
				})) {
					_ = !1;
					break;
				}
			} else if (!(y === b || l(y, b, s, c, u))) {
				_ = !1;
				break;
			}
		}
		return u.delete(e), u.delete(t), _;
	}
	t.exports = s;
})), Rt = /* @__PURE__ */ o(((e, t) => {
	t.exports = tt().Uint8Array;
})), zt = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = -1, n = Array(e.size);
		return e.forEach(function(e, r) {
			n[++t] = [r, e];
		}), n;
	}
	t.exports = n;
})), Bt = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = -1, n = Array(e.size);
		return e.forEach(function(e) {
			n[++t] = e;
		}), n;
	}
	t.exports = n;
})), Vt = /* @__PURE__ */ o(((e, t) => {
	var n = nt(), r = Rt(), i = Ue(), a = Lt(), o = zt(), s = Bt(), c = 1, l = 2, u = "[object Boolean]", d = "[object Date]", f = "[object Error]", p = "[object Map]", m = "[object Number]", h = "[object RegExp]", g = "[object Set]", _ = "[object String]", v = "[object Symbol]", y = "[object ArrayBuffer]", b = "[object DataView]", x = n ? n.prototype : void 0, S = x ? x.valueOf : void 0;
	function C(e, t, n, x, C, w, ee) {
		switch (n) {
			case b:
				if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
				e = e.buffer, t = t.buffer;
			case y: return !(e.byteLength != t.byteLength || !w(new r(e), new r(t)));
			case u:
			case d:
			case m: return i(+e, +t);
			case f: return e.name == t.name && e.message == t.message;
			case h:
			case _: return e == t + "";
			case p: var te = o;
			case g:
				var ne = x & c;
				if (te ||= s, e.size != t.size && !ne) return !1;
				var T = ee.get(e);
				if (T) return T == t;
				x |= l, ee.set(e, t);
				var E = a(te(e), te(t), x, C, w, ee);
				return ee.delete(e), E;
			case v: if (S) return S.call(e) == S.call(t);
		}
		return !1;
	}
	t.exports = C;
})), Ht = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
		return e;
	}
	t.exports = n;
})), Ut = /* @__PURE__ */ o(((e, t) => {
	t.exports = Array.isArray;
})), Wt = /* @__PURE__ */ o(((e, t) => {
	var n = Ht(), r = Ut();
	function i(e, t, i) {
		var a = t(e);
		return r(e) ? a : n(a, i(e));
	}
	t.exports = i;
})), Gt = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
			var o = e[n];
			t(o, n, e) && (a[i++] = o);
		}
		return a;
	}
	t.exports = n;
})), Kt = /* @__PURE__ */ o(((e, t) => {
	function n() {
		return [];
	}
	t.exports = n;
})), qt = /* @__PURE__ */ o(((e, t) => {
	var n = Gt(), r = Kt(), i = Object.prototype.propertyIsEnumerable, a = Object.getOwnPropertySymbols;
	t.exports = a ? function(e) {
		return e == null ? [] : (e = Object(e), n(a(e), function(t) {
			return i.call(e, t);
		}));
	} : r;
})), Jt = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
		return r;
	}
	t.exports = n;
})), Yt = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return typeof e == "object" && !!e;
	}
	t.exports = n;
})), Xt = /* @__PURE__ */ o(((e, t) => {
	var n = at(), r = Yt(), i = "[object Arguments]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), Zt = /* @__PURE__ */ o(((e, t) => {
	var n = Xt(), r = Yt(), i = Object.prototype, a = i.hasOwnProperty, o = i.propertyIsEnumerable;
	t.exports = n(function() {
		return arguments;
	}()) ? n : function(e) {
		return r(e) && a.call(e, "callee") && !o.call(e, "callee");
	};
})), Qt = /* @__PURE__ */ o(((e, t) => {
	function n() {
		return !1;
	}
	t.exports = n;
})), $t = /* @__PURE__ */ o(((e, t) => {
	var n = tt(), r = Qt(), i = typeof e == "object" && e && !e.nodeType && e, a = i && typeof t == "object" && t && !t.nodeType && t, o = a && a.exports === i ? n.Buffer : void 0;
	t.exports = (o ? o.isBuffer : void 0) || r;
})), en = /* @__PURE__ */ o(((e, t) => {
	var n = 9007199254740991, r = /^(?:0|[1-9]\d*)$/;
	function i(e, t) {
		var i = typeof e;
		return t ??= n, !!t && (i == "number" || i != "symbol" && r.test(e)) && e > -1 && e % 1 == 0 && e < t;
	}
	t.exports = i;
})), tn = /* @__PURE__ */ o(((e, t) => {
	var n = 9007199254740991;
	function r(e) {
		return typeof e == "number" && e > -1 && e % 1 == 0 && e <= n;
	}
	t.exports = r;
})), nn = /* @__PURE__ */ o(((e, t) => {
	var n = at(), r = tn(), i = Yt(), a = "[object Arguments]", o = "[object Array]", s = "[object Boolean]", c = "[object Date]", l = "[object Error]", u = "[object Function]", d = "[object Map]", f = "[object Number]", p = "[object Object]", m = "[object RegExp]", h = "[object Set]", g = "[object String]", _ = "[object WeakMap]", v = "[object ArrayBuffer]", y = "[object DataView]", b = "[object Float32Array]", x = "[object Float64Array]", S = "[object Int8Array]", C = "[object Int16Array]", w = "[object Int32Array]", ee = "[object Uint8Array]", te = "[object Uint8ClampedArray]", ne = "[object Uint16Array]", T = "[object Uint32Array]", E = {};
	E[b] = E[x] = E[S] = E[C] = E[w] = E[ee] = E[te] = E[ne] = E[T] = !0, E[a] = E[o] = E[v] = E[s] = E[y] = E[c] = E[l] = E[u] = E[d] = E[f] = E[p] = E[m] = E[h] = E[g] = E[_] = !1;
	function D(e) {
		return i(e) && r(e.length) && !!E[n(e)];
	}
	t.exports = D;
})), rn = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		return function(t) {
			return e(t);
		};
	}
	t.exports = n;
})), an = /* @__PURE__ */ o(((e, t) => {
	var n = et(), r = typeof e == "object" && e && !e.nodeType && e, i = r && typeof t == "object" && t && !t.nodeType && t, a = i && i.exports === r && n.process;
	t.exports = function() {
		try {
			return i && i.require && i.require("util").types || a && a.binding && a.binding("util");
		} catch {}
	}();
})), on = /* @__PURE__ */ o(((e, t) => {
	var n = nn(), r = rn(), i = an(), a = i && i.isTypedArray;
	t.exports = a ? r(a) : n;
})), sn = /* @__PURE__ */ o(((e, t) => {
	var n = Jt(), r = Zt(), i = Ut(), a = $t(), o = en(), s = on(), c = Object.prototype.hasOwnProperty;
	function l(e, t) {
		var l = i(e), u = !l && r(e), d = !l && !u && a(e), f = !l && !u && !d && s(e), p = l || u || d || f, m = p ? n(e.length, String) : [], h = m.length;
		for (var g in e) (t || c.call(e, g)) && !(p && (g == "length" || d && (g == "offset" || g == "parent") || f && (g == "buffer" || g == "byteLength" || g == "byteOffset") || o(g, h))) && m.push(g);
		return m;
	}
	t.exports = l;
})), cn = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype;
	function r(e) {
		var t = e && e.constructor;
		return e === (typeof t == "function" && t.prototype || n);
	}
	t.exports = r;
})), ln = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		return function(n) {
			return e(t(n));
		};
	}
	t.exports = n;
})), un = /* @__PURE__ */ o(((e, t) => {
	t.exports = ln()(Object.keys, Object);
})), dn = /* @__PURE__ */ o(((e, t) => {
	var n = cn(), r = un(), i = Object.prototype.hasOwnProperty;
	function a(e) {
		if (!n(e)) return r(e);
		var t = [];
		for (var a in Object(e)) i.call(e, a) && a != "constructor" && t.push(a);
		return t;
	}
	t.exports = a;
})), fn = /* @__PURE__ */ o(((e, t) => {
	var n = st(), r = tn();
	function i(e) {
		return e != null && r(e.length) && !n(e);
	}
	t.exports = i;
})), pn = /* @__PURE__ */ o(((e, t) => {
	var n = sn(), r = dn(), i = fn();
	function a(e) {
		return i(e) ? n(e) : r(e);
	}
	t.exports = a;
})), mn = /* @__PURE__ */ o(((e, t) => {
	var n = Wt(), r = qt(), i = pn();
	function a(e) {
		return n(e, i, r);
	}
	t.exports = a;
})), hn = /* @__PURE__ */ o(((e, t) => {
	var n = mn(), r = 1, i = Object.prototype.hasOwnProperty;
	function a(e, t, a, o, s, c) {
		var l = a & r, u = n(e), d = u.length;
		if (d != n(t).length && !l) return !1;
		for (var f = d; f--;) {
			var p = u[f];
			if (!(l ? p in t : i.call(t, p))) return !1;
		}
		var m = c.get(e), h = c.get(t);
		if (m && h) return m == t && h == e;
		var g = !0;
		c.set(e, t), c.set(t, e);
		for (var _ = l; ++f < d;) {
			p = u[f];
			var v = e[p], y = t[p];
			if (o) var b = l ? o(y, v, p, t, e, c) : o(v, y, p, e, t, c);
			if (!(b === void 0 ? v === y || s(v, y, a, o, c) : b)) {
				g = !1;
				break;
			}
			_ ||= p == "constructor";
		}
		if (g && !_) {
			var x = e.constructor, S = t.constructor;
			x != S && "constructor" in e && "constructor" in t && !(typeof x == "function" && x instanceof x && typeof S == "function" && S instanceof S) && (g = !1);
		}
		return c.delete(e), c.delete(t), g;
	}
	t.exports = a;
})), gn = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(tt(), "DataView");
})), _n = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(tt(), "Promise");
})), vn = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(tt(), "Set");
})), yn = /* @__PURE__ */ o(((e, t) => {
	t.exports = pt()(tt(), "WeakMap");
})), bn = /* @__PURE__ */ o(((e, t) => {
	var n = gn(), r = mt(), i = _n(), a = vn(), o = yn(), s = at(), c = ut(), l = "[object Map]", u = "[object Object]", d = "[object Promise]", f = "[object Set]", p = "[object WeakMap]", m = "[object DataView]", h = c(n), g = c(r), _ = c(i), v = c(a), y = c(o), b = s;
	(n && b(new n(/* @__PURE__ */ new ArrayBuffer(1))) != m || r && b(new r()) != l || i && b(i.resolve()) != d || a && b(new a()) != f || o && b(new o()) != p) && (b = function(e) {
		var t = s(e), n = t == u ? e.constructor : void 0, r = n ? c(n) : "";
		if (r) switch (r) {
			case h: return m;
			case g: return l;
			case _: return d;
			case v: return f;
			case y: return p;
		}
		return t;
	}), t.exports = b;
})), xn = /* @__PURE__ */ o(((e, t) => {
	var n = jt(), r = Lt(), i = Vt(), a = hn(), o = bn(), s = Ut(), c = $t(), l = on(), u = 1, d = "[object Arguments]", f = "[object Array]", p = "[object Object]", m = Object.prototype.hasOwnProperty;
	function h(e, t, h, g, _, v) {
		var y = s(e), b = s(t), x = y ? f : o(e), S = b ? f : o(t);
		x = x == d ? p : x, S = S == d ? p : S;
		var C = x == p, w = S == p, ee = x == S;
		if (ee && c(e)) {
			if (!c(t)) return !1;
			y = !0, C = !1;
		}
		if (ee && !C) return v ||= new n(), y || l(e) ? r(e, t, h, g, _, v) : i(e, t, x, h, g, _, v);
		if (!(h & u)) {
			var te = C && m.call(e, "__wrapped__"), ne = w && m.call(t, "__wrapped__");
			if (te || ne) {
				var T = te ? e.value() : e, E = ne ? t.value() : t;
				return v ||= new n(), _(T, E, h, g, v);
			}
		}
		return ee ? (v ||= new n(), a(e, t, h, g, _, v)) : !1;
	}
	t.exports = h;
})), Sn = /* @__PURE__ */ o(((e, t) => {
	var n = xn(), r = Yt();
	function i(e, t, a, o, s) {
		return e === t ? !0 : e == null || t == null || !r(e) && !r(t) ? e !== e && t !== t : n(e, t, a, o, i, s);
	}
	t.exports = i;
})), Cn = /* @__PURE__ */ o(((e, t) => {
	var n = Sn();
	function r(e, t, r) {
		r = typeof r == "function" ? r : void 0;
		var i = r ? r(e, t) : void 0;
		return i === void 0 ? n(e, t, void 0, r) : !!i;
	}
	t.exports = r;
})), wn = /* @__PURE__ */ o(((e, t) => {
	t.exports = function(e, t, n, r) {
		var i = n ? n.call(r, e, t) : void 0;
		if (i !== void 0) return !!i;
		if (e === t) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var a = Object.keys(e), o = Object.keys(t);
		if (a.length !== o.length) return !1;
		for (var s = Object.prototype.hasOwnProperty.bind(t), c = 0; c < a.length; c++) {
			var l = a[c];
			if (!s(l)) return !1;
			var u = e[l], d = t[l];
			if (i = n ? n.call(r, u, d, l) : void 0, i === !1 || i === void 0 && u !== d) return !1;
		}
		return !0;
	};
})), Tn = /* @__PURE__ */ c(Cn()), En = /* @__PURE__ */ c(wn()), Dn = (e = 21) => crypto.getRandomValues(new Uint8Array(e)).reduce((e, t) => (t &= 63, t < 36 ? e += t.toString(36) : t < 62 ? e += (t - 26).toString(36).toUpperCase() : t > 62 ? e += "-" : e += "_", e), ""), On = !0, kn = "Invariant failed";
function P(e, t) {
	if (!e) {
		if (On) throw Error(kn);
		var n = typeof t == "function" ? t() : t, r = n ? `${kn}: ${n}` : kn;
		throw Error(r);
	}
}
//#endregion
//#region node_modules/@craftjs/utils/dist/esm/index.js
var An = /* @__PURE__ */ c(m());
typeof window < "u" && (window.__CRAFTJS__ || (window.__CRAFTJS__ = {}), window.__CRAFTJS__["@craftjs/utils"] = "0.2.5");
var jn = "ROOT", Mn = "Parent id cannot be ommited", Nn = "Attempting to add a node with duplicated id", Pn = "Node does not exist, it may have been removed", Fn = "A <Element /> that is used inside a User Component must specify an `id` prop, eg: <Element id=\"text_element\">...</Element> ", In = "Target parent rejects incoming node", Ln = "Current parent rejects outgoing node", Rn = "Cannot move node that is not a direct child of a Canvas node", zn = "Cannot move node into a non-Canvas parent", Bn = "A top-level Node cannot be moved", Vn = "Cannot move node into a descendant", Hn = "The component type specified for this node (%node_type%) does not exist in the resolver", Un = "The node has specified a canDrag() rule that prevents it from being dragged", Wn = "Invalid parameter Node Id specified", Gn = "Attempting to delete a top-level Node", Kn = "An Error occurred while deserializing components: Cannot find component <%displayName% /> in resolver map. Please check your resolver in <Editor />\n\nAvailable components in resolver: %availableComponents%\n\nMore info: https://craft.js.org/r/docs/api/editor#props", qn = "You can only use useEditor in the context of <Editor />. \n\nPlease only use useEditor in components that are children of the <Editor /> component.", Jn = "You can only use useNode in the context of <Editor />. \n\nPlease only use useNode in components that are children of the <Editor /> component.";
function Yn(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter((function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		}))), n.push.apply(n, r);
	}
	return n;
}
function Xn(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Yn(Object(n), !0).forEach((function(t) {
			er(e, t, n[t]);
		})) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Yn(Object(n)).forEach((function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		}));
	}
	return e;
}
function Zn(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Qn(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, fr(r.key), r);
	}
}
function $n(e, t, n) {
	return t && Qn(e.prototype, t), n && Qn(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function er(e, t, n) {
	return (t = fr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function tr(e) {
	return tr = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, tr(e);
}
function nr(e, t) {
	return nr = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, nr(e, t);
}
function rr(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function ir() {
	return ir = typeof Reflect < "u" && Reflect.get ? Reflect.get.bind() : function(e, t, n) {
		var r = function(e, t) {
			for (; !Object.prototype.hasOwnProperty.call(e, t) && (e = tr(e)) !== null;);
			return e;
		}(e, t);
		if (r) {
			var i = Object.getOwnPropertyDescriptor(r, t);
			return i.get ? i.get.call(arguments.length < 3 ? e : n) : i.value;
		}
	}, ir.apply(this, arguments);
}
function ar(e, t) {
	return sr(e) || function(e, t) {
		var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (n != null) {
			var r, i, a, o, s = [], c = !0, l = !1;
			try {
				if (a = (n = n.call(e)).next, t === 0) {
					if (Object(n) !== n) return;
					c = !1;
				} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
			} catch (e) {
				l = !0, i = e;
			} finally {
				try {
					if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
				} finally {
					if (l) throw i;
				}
			}
			return s;
		}
	}(e, t) || lr(e, t) || dr();
}
function or(e) {
	return function(e) {
		if (Array.isArray(e)) return ur(e);
	}(e) || cr(e) || lr(e) || function() {
		throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}();
}
function sr(e) {
	if (Array.isArray(e)) return e;
}
function cr(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function lr(e, t) {
	if (e) {
		if (typeof e == "string") return ur(e, t);
		var n = Object.prototype.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ur(e, t) : void 0;
	}
}
function ur(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function dr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function fr(e) {
	var t = function(e, t) {
		if (typeof e != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var r = n.call(e, "string");
			if (typeof r != "object") return r;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return String(e);
	}(e);
	return typeof t == "symbol" ? t : String(t);
}
var F = {
	UNDO: "HISTORY_UNDO",
	REDO: "HISTORY_REDO",
	THROTTLE: "HISTORY_THROTTLE",
	IGNORE: "HISTORY_IGNORE",
	MERGE: "HISTORY_MERGE",
	CLEAR: "HISTORY_CLEAR"
}, pr = function() {
	function e() {
		Zn(this, e), er(this, "timeline", []), er(this, "pointer", -1);
	}
	return $n(e, [
		{
			key: "add",
			value: function(e, t) {
				e.length === 0 && t.length === 0 || (this.pointer += 1, this.timeline.length = this.pointer, this.timeline[this.pointer] = {
					patches: e,
					inversePatches: t,
					timestamp: Date.now()
				});
			}
		},
		{
			key: "throttleAdd",
			value: function(e, t) {
				var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 500;
				if (e.length !== 0 || t.length !== 0) {
					if (this.timeline.length && this.pointer >= 0) {
						var r = this.timeline[this.pointer], i = r.patches, a = r.inversePatches, o = r.timestamp;
						if ((/* @__PURE__ */ new Date()).getTime() - o < n) return void (this.timeline[this.pointer] = {
							timestamp: o,
							patches: [].concat(or(i), or(e)),
							inversePatches: [].concat(or(t), or(a))
						});
					}
					this.add(e, t);
				}
			}
		},
		{
			key: "merge",
			value: function(e, t) {
				if (e.length !== 0 || t.length !== 0) if (this.timeline.length && this.pointer >= 0) {
					var n = this.timeline[this.pointer], r = n.inversePatches;
					this.timeline[this.pointer] = {
						timestamp: n.timestamp,
						patches: [].concat(or(n.patches), or(e)),
						inversePatches: [].concat(or(t), or(r))
					};
				} else this.add(e, t);
			}
		},
		{
			key: "clear",
			value: function() {
				this.timeline = [], this.pointer = -1;
			}
		},
		{
			key: "canUndo",
			value: function() {
				return this.pointer >= 0;
			}
		},
		{
			key: "canRedo",
			value: function() {
				return this.pointer < this.timeline.length - 1;
			}
		},
		{
			key: "undo",
			value: function(e) {
				if (this.canUndo()) {
					var t = this.timeline[this.pointer].inversePatches;
					return --this.pointer, Ve(e, t);
				}
			}
		},
		{
			key: "redo",
			value: function(e) {
				if (this.canRedo()) return this.pointer += 1, Ve(e, this.timeline[this.pointer].patches);
			}
		}
	]), e;
}();
function mr(e, t, n, r) {
	var i, a = (0, _.useMemo)((function() {
		return new pr();
	}), []), o = (0, _.useRef)([]), s = (0, _.useRef)((function() {}));
	typeof e == "function" ? i = e : (i = e.methods, o.current = e.ignoreHistoryForActions, s.current = e.normalizeHistory);
	var c = (0, _.useRef)(r);
	c.current = r;
	var l = (0, _.useRef)(t), u = (0, _.useMemo)((function() {
		var e = s.current, t = o.current, r = c.current;
		return function(o, s) {
			var c, l = n && hr(n, (function() {
				return o;
			}), a), u = ar(Be(o, (function(e) {
				var t, n;
				switch (s.type) {
					case F.UNDO: return a.undo(e);
					case F.REDO: return a.redo(e);
					case F.CLEAR: return a.clear(), Xn({}, e);
					case F.IGNORE:
					case F.MERGE:
					case F.THROTTLE:
						var r, o = sr(n = s.payload) || cr(n) || lr(n) || dr(), c = o[0], u = o.slice(1);
						(r = i(e, l))[c].apply(r, or(u));
						break;
					default: (t = i(e, l))[s.type].apply(t, or(s.payload));
				}
			})), 3), d = u[0], f = u[1], p = u[2];
			return c = d, r && r(d, o, {
				type: s.type,
				params: s.payload,
				patches: f
			}, l, (function(e) {
				var t = Be(d, e);
				c = t[0], f = [].concat(or(f), or(t[1])), p = [].concat(or(t[2]), or(p));
			})), [F.UNDO, F.REDO].includes(s.type) && e && (c = ze(c, e)), [].concat(or(t), [
				F.UNDO,
				F.REDO,
				F.IGNORE,
				F.CLEAR
			]).includes(s.type) || (s.type === F.THROTTLE ? a.throttleAdd(f, p, s.config && s.config.rate) : s.type === F.MERGE ? a.merge(f, p) : a.add(f, p)), c;
		};
	}), [
		a,
		i,
		n
	]), d = (0, _.useCallback)((function() {
		return l.current;
	}), []), f = (0, _.useMemo)((function() {
		return new gr(d);
	}), [d]), p = (0, _.useCallback)((function(e) {
		l.current = u(l.current, e), f.notify();
	}), [u, f]);
	(0, _.useEffect)((function() {
		f.notify();
	}), [f]);
	var m = (0, _.useMemo)((function() {
		return n ? hr(n, (function() {
			return l.current;
		}), a) : [];
	}), [a, n]), h = (0, _.useMemo)((function() {
		var e = Object.keys(i(null, null)), t = o.current;
		return Xn(Xn({}, e.reduce((function(e, t) {
			return e[t] = function() {
				return p({
					type: t,
					payload: [...arguments]
				});
			}, e;
		}), {})), {}, { history: {
			undo: function() {
				return p({ type: F.UNDO });
			},
			redo: function() {
				return p({ type: F.REDO });
			},
			clear: function() {
				return p({ type: F.CLEAR });
			},
			throttle: function(n) {
				return Xn({}, e.filter((function(e) {
					return !t.includes(e);
				})).reduce((function(e, t) {
					return e[t] = function() {
						var e = [...arguments];
						return p({
							type: F.THROTTLE,
							payload: [t].concat(e),
							config: { rate: n }
						});
					}, e;
				}), {}));
			},
			ignore: function() {
				return Xn({}, e.filter((function(e) {
					return !t.includes(e);
				})).reduce((function(e, t) {
					return e[t] = function() {
						var e = [...arguments];
						return p({
							type: F.IGNORE,
							payload: [t].concat(e)
						});
					}, e;
				}), {}));
			},
			merge: function() {
				return Xn({}, e.filter((function(e) {
					return !t.includes(e);
				})).reduce((function(e, t) {
					return e[t] = function() {
						var e = [...arguments];
						return p({
							type: F.MERGE,
							payload: [t].concat(e)
						});
					}, e;
				}), {}));
			}
		} });
	}), [p, i]);
	return (0, _.useMemo)((function() {
		return {
			getState: d,
			subscribe: function(e, t, n) {
				return f.subscribe(e, t, n);
			},
			actions: h,
			query: m,
			history: a
		};
	}), [
		h,
		m,
		f,
		d,
		a
	]);
}
function hr(e, t, n) {
	return Xn(Xn({}, Object.keys(e()).reduce((function(n, r) {
		return Xn(Xn({}, n), {}, er({}, r, (function() {
			var n;
			return (n = e(t()))[r].apply(n, arguments);
		})));
	}), {})), {}, { history: {
		canUndo: function() {
			return n.canUndo();
		},
		canRedo: function() {
			return n.canRedo();
		}
	} });
}
Se(), xe();
var gr = function() {
	function e(t) {
		Zn(this, e), er(this, "getState", void 0), er(this, "subscribers", []), this.getState = t;
	}
	return $n(e, [
		{
			key: "subscribe",
			value: function(e, t, n) {
				var r = this, i = new _r((function() {
					return e(r.getState());
				}), t, n);
				return this.subscribers.push(i), this.unsubscribe.bind(this, i);
			}
		},
		{
			key: "unsubscribe",
			value: function(e) {
				if (this.subscribers.length) {
					var t = this.subscribers.indexOf(e);
					if (t > -1) return this.subscribers.splice(t, 1);
				}
			}
		},
		{
			key: "notify",
			value: function() {
				this.subscribers.forEach((function(e) {
					return e.collect();
				}));
			}
		}
	]), e;
}(), _r = function() {
	function e(t, n) {
		var r = arguments.length > 2 && arguments[2] !== void 0 && arguments[2];
		Zn(this, e), er(this, "collected", void 0), er(this, "collector", void 0), er(this, "onChange", void 0), er(this, "id", void 0), this.collector = t, this.onChange = n, r && this.collect();
	}
	return $n(e, [{
		key: "collect",
		value: function() {
			try {
				var e = this.collector();
				(0, Tn.default)(e, this.collected) || (this.collected = e, this.onChange && this.onChange(this.collected));
			} catch (e) {
				console.warn(e);
			}
		}
	}]), e;
}(), vr = function(e) {
	var t = e.getBoundingClientRect(), n = t.x, r = t.y, i = t.top, a = t.left, o = t.bottom, s = t.right, c = t.width, l = t.height, u = window.getComputedStyle(e), d = {
		left: parseInt(u.marginLeft),
		right: parseInt(u.marginRight),
		bottom: parseInt(u.marginBottom),
		top: parseInt(u.marginTop)
	}, f = {
		left: parseInt(u.paddingLeft),
		right: parseInt(u.paddingRight),
		bottom: parseInt(u.paddingBottom),
		top: parseInt(u.paddingTop)
	};
	return {
		x: n,
		y: r,
		top: i,
		left: a,
		bottom: o,
		right: s,
		width: c,
		height: l,
		outerWidth: Math.round(c + d.left + d.right),
		outerHeight: Math.round(l + d.top + d.bottom),
		margin: d,
		padding: f,
		inFlow: e.parentElement && !!function(t) {
			var n = getComputedStyle(t);
			if (!(u.overflow && u.overflow !== "visible" || n.float !== "none" || n.display === "grid" || n.display === "flex" && n["flex-direction"] !== "column")) {
				switch (u.position) {
					case "static":
					case "relative": break;
					default: return;
				}
				switch (e.tagName) {
					case "TR":
					case "TBODY":
					case "THEAD":
					case "TFOOT": return !0;
				}
				switch (u.display) {
					case "block":
					case "list-item":
					case "table":
					case "flex":
					case "grid": return !0;
				}
			}
		}(e.parentElement)
	};
};
function yr(e, t) {
	let { subscribe: n, getState: r, actions: i, query: a } = e, o = (0, _.useRef)(!0), s = (0, _.useRef)(null), c = (0, _.useRef)(t);
	c.current = t;
	let l = (0, _.useCallback)(((e) => ({
		...e,
		actions: i,
		query: a
	})), [i, a]);
	o.current && t && (s.current = t(r(), a), o.current = !1);
	let [u, d] = (0, _.useState)(l(s.current));
	return (0, _.useEffect)((() => {
		let e;
		return c.current && (e = n(((e) => c.current(e, a)), ((e) => {
			d(l(e));
		}))), () => {
			e && e();
		};
	}), [
		l,
		a,
		n
	]), u;
}
var br, xr = function() {
	return Dn(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 10);
}, Sr = function() {
	function e() {
		Zn(this, e), er(this, "isEnabled", !0), er(this, "elementIdMap", /* @__PURE__ */ new WeakMap()), er(this, "registry", /* @__PURE__ */ new Map());
	}
	return $n(e, [
		{
			key: "getElementId",
			value: function(e) {
				var t = this.elementIdMap.get(e);
				if (t) return t;
				var n = xr();
				return this.elementIdMap.set(e, n), n;
			}
		},
		{
			key: "getConnectorId",
			value: function(e, t) {
				return `${t}--${this.getElementId(e)}`;
			}
		},
		{
			key: "register",
			value: function(e, t) {
				var n = this, r = this.getByElement(e, t.name);
				if (r) {
					if ((0, En.default)(t.required, r.required)) return r;
					this.getByElement(e, t.name).disable();
				}
				var i = null, a = this.getConnectorId(e, t.name);
				return this.registry.set(a, {
					id: a,
					required: t.required,
					enable: function() {
						i && i(), i = t.connector(e, t.required, t.options);
					},
					disable: function() {
						i && i();
					},
					remove: function() {
						return n.remove(a);
					}
				}), this.isEnabled && this.registry.get(a).enable(), this.registry.get(a);
			}
		},
		{
			key: "get",
			value: function(e) {
				return this.registry.get(e);
			}
		},
		{
			key: "remove",
			value: function(e) {
				var t = this.get(e);
				t && (t.disable(), this.registry.delete(t.id));
			}
		},
		{
			key: "enable",
			value: function() {
				this.isEnabled = !0, this.registry.forEach((function(e) {
					e.enable();
				}));
			}
		},
		{
			key: "disable",
			value: function() {
				this.isEnabled = !1, this.registry.forEach((function(e) {
					e.disable();
				}));
			}
		},
		{
			key: "getByElement",
			value: function(e, t) {
				return this.get(this.getConnectorId(e, t));
			}
		},
		{
			key: "removeByElement",
			value: function(e, t) {
				return this.remove(this.getConnectorId(e, t));
			}
		},
		{
			key: "clear",
			value: function() {
				this.disable(), this.elementIdMap = /* @__PURE__ */ new WeakMap(), this.registry = /* @__PURE__ */ new Map();
			}
		}
	]), e;
}();
(function(e) {
	e[e.HandlerDisabled = 0] = "HandlerDisabled", e[e.HandlerEnabled = 1] = "HandlerEnabled";
})(br ||= {});
var Cr = function() {
	function e(t) {
		Zn(this, e), er(this, "options", void 0), er(this, "registry", new Sr()), er(this, "subscribers", /* @__PURE__ */ new Set()), this.options = t;
	}
	return $n(e, [
		{
			key: "listen",
			value: function(e) {
				var t = this;
				return this.subscribers.add(e), function() {
					return t.subscribers.delete(e);
				};
			}
		},
		{
			key: "disable",
			value: function() {
				this.onDisable && this.onDisable(), this.registry.disable(), this.subscribers.forEach((function(e) {
					e(br.HandlerDisabled);
				}));
			}
		},
		{
			key: "enable",
			value: function() {
				this.onEnable && this.onEnable(), this.registry.enable(), this.subscribers.forEach((function(e) {
					e(br.HandlerEnabled);
				}));
			}
		},
		{
			key: "cleanup",
			value: function() {
				this.disable(), this.subscribers.clear(), this.registry.clear();
			}
		},
		{
			key: "addCraftEventListener",
			value: function(e, t, n, r) {
				var i = function(r) {
					(function(e, t, n) {
						e.craft ||= {
							stopPropagation: function() {},
							blockedEvents: {}
						};
						for (var r = e.craft && e.craft.blockedEvents[t] || [], i = 0; i < r.length; i++) {
							var a = r[i];
							if (n !== a && n.contains(a)) return !0;
						}
						return !1;
					})(r, t, e) || (r.craft.stopPropagation = function() {
						r.craft.blockedEvents[t] || (r.craft.blockedEvents[t] = []), r.craft.blockedEvents[t].push(e);
					}, n(r));
				};
				return e.addEventListener(t, i, r), function() {
					return e.removeEventListener(t, i, r);
				};
			}
		},
		{
			key: "createConnectorsUsage",
			value: function() {
				var e = this, t = this.handlers(), n = /* @__PURE__ */ new Set(), r = !1, i = /* @__PURE__ */ new Map();
				return {
					connectors: Object.entries(t).reduce((function(t, a) {
						var o = ar(a, 2), s = o[0], c = o[1];
						return Xn(Xn({}, t), {}, er({}, s, (function(t, a, o) {
							var l = function() {
								var r = e.registry.register(t, {
									required: a,
									name: s,
									options: o,
									connector: c
								});
								return n.add(r.id), r;
							};
							return i.set(e.registry.getConnectorId(t, s), l), r && l(), t;
						})));
					}), {}),
					register: function() {
						r = !0, i.forEach((function(e) {
							e();
						}));
					},
					cleanup: function() {
						r = !1, n.forEach((function(t) {
							return e.registry.remove(t);
						}));
					}
				};
			}
		},
		{
			key: "derive",
			value: function(e, t) {
				return new e(this, t);
			}
		},
		{
			key: "createProxyHandlers",
			value: function(e, t) {
				var n = [], r = e.handlers();
				return t(new Proxy(r, { get: function(e, t, i) {
					return t in r == 0 ? Reflect.get(e, t, i) : function(e) {
						var i = [...arguments].slice(1), a = r[t].apply(r, [e].concat(i));
						a && n.push(a);
					};
				} })), function() {
					n.forEach((function(e) {
						e();
					}));
				};
			}
		},
		{
			key: "reflect",
			value: function(e) {
				return this.createProxyHandlers(this, e);
			}
		}
	]), e;
}(), wr = function(e) {
	(function(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && nr(e, t);
	})(i, Cr);
	var t, n, r = (t = i, n = function() {
		if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
		if (typeof Proxy == "function") return !0;
		try {
			return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {}))), !0;
		} catch {
			return !1;
		}
	}(), function() {
		var e, r = tr(t);
		if (n) {
			var i = tr(this).constructor;
			e = Reflect.construct(r, arguments, i);
		} else e = r.apply(this, arguments);
		return function(e, t) {
			if (t && (typeof t == "object" || typeof t == "function")) return t;
			if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
			return rr(e);
		}(this, e);
	});
	function i(e, t) {
		var n;
		return Zn(this, i), er(rr(n = r.call(this, t)), "derived", void 0), er(rr(n), "unsubscribeParentHandlerListener", void 0), n.derived = e, n.options = t, n.unsubscribeParentHandlerListener = n.derived.listen((function(e) {
			switch (e) {
				case br.HandlerEnabled: return n.enable();
				case br.HandlerDisabled: return n.disable();
				default: return;
			}
		})), n;
	}
	return $n(i, [{
		key: "inherit",
		value: function(e) {
			return this.createProxyHandlers(this.derived, e);
		}
	}, {
		key: "cleanup",
		value: function() {
			ir(tr(i.prototype), "cleanup", this).call(this), this.unsubscribeParentHandlerListener();
		}
	}]), i;
}();
function Tr(e, t) {
	t && (typeof e == "function" ? e(t) : e.current = t);
}
function Er(e, t) {
	let n = e.ref;
	return P(typeof n != "string", "Cannot connect to an element with an existing string ref. Please convert it to use a callback ref instead, or wrap it into a <span> or <div>. Read more: https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute"), (0, _.cloneElement)(e, n ? { ref: (e) => {
		Tr(n, e), Tr(t, e);
	} } : { ref: t });
}
function Dr(e) {
	return (t = null, ...n) => {
		if (!(0, _.isValidElement)(t)) {
			if (!t) return;
			let r = t;
			return r && e(r, ...n), r;
		}
		let r = t;
		return function(e) {
			if (typeof e.type != "string") throw Error();
		}(r), Er(r, e);
	};
}
function Or(e) {
	return Object.keys(e).reduce(((t, n) => (t[n] = Dr(((...t) => e[n](...t))), t)), {});
}
var kr = ({ style: e, className: t, parentDom: n }) => {
	let r = _.createElement("div", {
		className: t,
		style: {
			position: "fixed",
			display: "block",
			opacity: 1,
			borderStyle: "solid",
			borderWidth: "1px",
			borderColor: "transparent",
			zIndex: 99999,
			...e
		}
	});
	return n && n.ownerDocument !== document ? An.createPortal(r, n.ownerDocument.body) : r;
}, Ar = function(e, t) {
	var n = `Deprecation warning: ${e} will be deprecated in future relases.`, r = t.suggest, i = t.doc;
	r && (n += ` Please use ${r} instead.`), i && (n += `(${i})`), console.warn(n);
}, jr = function() {
	return typeof window < "u";
}, Mr = function() {
	return jr() && /Linux/i.test(window.navigator.userAgent);
}, Nr = function() {
	return jr() && /Chrome/i.test(window.navigator.userAgent);
}, Pr = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
		return e;
	}
	t.exports = n;
})), Fr = /* @__PURE__ */ o(((e, t) => {
	var n = pt();
	t.exports = function() {
		try {
			var e = n(Object, "defineProperty");
			return e({}, "", {}), e;
		} catch {}
	}();
})), Ir = /* @__PURE__ */ o(((e, t) => {
	var n = Fr();
	function r(e, t, r) {
		t == "__proto__" && n ? n(e, t, {
			configurable: !0,
			enumerable: !0,
			value: r,
			writable: !0
		}) : e[t] = r;
	}
	t.exports = r;
})), Lr = /* @__PURE__ */ o(((e, t) => {
	var n = Ir(), r = Ue(), i = Object.prototype.hasOwnProperty;
	function a(e, t, a) {
		var o = e[t];
		(!(i.call(e, t) && r(o, a)) || a === void 0 && !(t in e)) && n(e, t, a);
	}
	t.exports = a;
})), Rr = /* @__PURE__ */ o(((e, t) => {
	var n = Lr(), r = Ir();
	function i(e, t, i, a) {
		var o = !i;
		i ||= {};
		for (var s = -1, c = t.length; ++s < c;) {
			var l = t[s], u = a ? a(i[l], e[l], l, i, e) : void 0;
			u === void 0 && (u = e[l]), o ? r(i, l, u) : n(i, l, u);
		}
		return i;
	}
	t.exports = i;
})), zr = /* @__PURE__ */ o(((e, t) => {
	var n = Rr(), r = pn();
	function i(e, t) {
		return e && n(t, r(t), e);
	}
	t.exports = i;
})), Br = /* @__PURE__ */ o(((e, t) => {
	function n(e) {
		var t = [];
		if (e != null) for (var n in Object(e)) t.push(n);
		return t;
	}
	t.exports = n;
})), Vr = /* @__PURE__ */ o(((e, t) => {
	var n = ot(), r = cn(), i = Br(), a = Object.prototype.hasOwnProperty;
	function o(e) {
		if (!n(e)) return i(e);
		var t = r(e), o = [];
		for (var s in e) s == "constructor" && (t || !a.call(e, s)) || o.push(s);
		return o;
	}
	t.exports = o;
})), Hr = /* @__PURE__ */ o(((e, t) => {
	var n = sn(), r = Vr(), i = fn();
	function a(e) {
		return i(e) ? n(e, !0) : r(e);
	}
	t.exports = a;
})), Ur = /* @__PURE__ */ o(((e, t) => {
	var n = Rr(), r = Hr();
	function i(e, t) {
		return e && n(t, r(t), e);
	}
	t.exports = i;
})), Wr = /* @__PURE__ */ o(((e, t) => {
	var n = tt(), r = typeof e == "object" && e && !e.nodeType && e, i = r && typeof t == "object" && t && !t.nodeType && t, a = i && i.exports === r ? n.Buffer : void 0, o = a ? a.allocUnsafe : void 0;
	function s(e, t) {
		if (t) return e.slice();
		var n = e.length, r = o ? o(n) : new e.constructor(n);
		return e.copy(r), r;
	}
	t.exports = s;
})), Gr = /* @__PURE__ */ o(((e, t) => {
	function n(e, t) {
		var n = -1, r = e.length;
		for (t ||= Array(r); ++n < r;) t[n] = e[n];
		return t;
	}
	t.exports = n;
})), Kr = /* @__PURE__ */ o(((e, t) => {
	var n = Rr(), r = qt();
	function i(e, t) {
		return n(e, r(e), t);
	}
	t.exports = i;
})), qr = /* @__PURE__ */ o(((e, t) => {
	t.exports = ln()(Object.getPrototypeOf, Object);
})), Jr = /* @__PURE__ */ o(((e, t) => {
	var n = Ht(), r = qr(), i = qt(), a = Kt();
	t.exports = Object.getOwnPropertySymbols ? function(e) {
		for (var t = []; e;) n(t, i(e)), e = r(e);
		return t;
	} : a;
})), Yr = /* @__PURE__ */ o(((e, t) => {
	var n = Rr(), r = Jr();
	function i(e, t) {
		return n(e, r(e), t);
	}
	t.exports = i;
})), Xr = /* @__PURE__ */ o(((e, t) => {
	var n = Wt(), r = Jr(), i = Hr();
	function a(e) {
		return n(e, i, r);
	}
	t.exports = a;
})), Zr = /* @__PURE__ */ o(((e, t) => {
	var n = Object.prototype.hasOwnProperty;
	function r(e) {
		var t = e.length, r = new e.constructor(t);
		return t && typeof e[0] == "string" && n.call(e, "index") && (r.index = e.index, r.input = e.input), r;
	}
	t.exports = r;
})), Qr = /* @__PURE__ */ o(((e, t) => {
	var n = Rt();
	function r(e) {
		var t = new e.constructor(e.byteLength);
		return new n(t).set(new n(e)), t;
	}
	t.exports = r;
})), $r = /* @__PURE__ */ o(((e, t) => {
	var n = Qr();
	function r(e, t) {
		var r = t ? n(e.buffer) : e.buffer;
		return new e.constructor(r, e.byteOffset, e.byteLength);
	}
	t.exports = r;
})), ei = /* @__PURE__ */ o(((e, t) => {
	var n = /\w*$/;
	function r(e) {
		var t = new e.constructor(e.source, n.exec(e));
		return t.lastIndex = e.lastIndex, t;
	}
	t.exports = r;
})), ti = /* @__PURE__ */ o(((e, t) => {
	var n = nt(), r = n ? n.prototype : void 0, i = r ? r.valueOf : void 0;
	function a(e) {
		return i ? Object(i.call(e)) : {};
	}
	t.exports = a;
})), ni = /* @__PURE__ */ o(((e, t) => {
	var n = Qr();
	function r(e, t) {
		var r = t ? n(e.buffer) : e.buffer;
		return new e.constructor(r, e.byteOffset, e.length);
	}
	t.exports = r;
})), ri = /* @__PURE__ */ o(((e, t) => {
	var n = Qr(), r = $r(), i = ei(), a = ti(), o = ni(), s = "[object Boolean]", c = "[object Date]", l = "[object Map]", u = "[object Number]", d = "[object RegExp]", f = "[object Set]", p = "[object String]", m = "[object Symbol]", h = "[object ArrayBuffer]", g = "[object DataView]", _ = "[object Float32Array]", v = "[object Float64Array]", y = "[object Int8Array]", b = "[object Int16Array]", x = "[object Int32Array]", S = "[object Uint8Array]", C = "[object Uint8ClampedArray]", w = "[object Uint16Array]", ee = "[object Uint32Array]";
	function te(e, t, te) {
		var ne = e.constructor;
		switch (t) {
			case h: return n(e);
			case s:
			case c: return new ne(+e);
			case g: return r(e, te);
			case _:
			case v:
			case y:
			case b:
			case x:
			case S:
			case C:
			case w:
			case ee: return o(e, te);
			case l: return new ne();
			case u:
			case p: return new ne(e);
			case d: return i(e);
			case f: return new ne();
			case m: return a(e);
		}
	}
	t.exports = te;
})), ii = /* @__PURE__ */ o(((e, t) => {
	var n = ot(), r = Object.create;
	t.exports = function() {
		function e() {}
		return function(t) {
			if (!n(t)) return {};
			if (r) return r(t);
			e.prototype = t;
			var i = new e();
			return e.prototype = void 0, i;
		};
	}();
})), ai = /* @__PURE__ */ o(((e, t) => {
	var n = ii(), r = qr(), i = cn();
	function a(e) {
		return typeof e.constructor == "function" && !i(e) ? n(r(e)) : {};
	}
	t.exports = a;
})), oi = /* @__PURE__ */ o(((e, t) => {
	var n = bn(), r = Yt(), i = "[object Map]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), si = /* @__PURE__ */ o(((e, t) => {
	var n = oi(), r = rn(), i = an(), a = i && i.isMap;
	t.exports = a ? r(a) : n;
})), ci = /* @__PURE__ */ o(((e, t) => {
	var n = bn(), r = Yt(), i = "[object Set]";
	function a(e) {
		return r(e) && n(e) == i;
	}
	t.exports = a;
})), li = /* @__PURE__ */ o(((e, t) => {
	var n = ci(), r = rn(), i = an(), a = i && i.isSet;
	t.exports = a ? r(a) : n;
})), ui = /* @__PURE__ */ o(((e, t) => {
	var n = jt(), r = Pr(), i = Lr(), a = zr(), o = Ur(), s = Wr(), c = Gr(), l = Kr(), u = Yr(), d = mn(), f = Xr(), p = bn(), m = Zr(), h = ri(), g = ai(), _ = Ut(), v = $t(), y = si(), b = ot(), x = li(), S = pn(), C = Hr(), w = 1, ee = 2, te = 4, ne = "[object Arguments]", T = "[object Array]", E = "[object Boolean]", D = "[object Date]", re = "[object Error]", ie = "[object Function]", ae = "[object GeneratorFunction]", O = "[object Map]", oe = "[object Number]", k = "[object Object]", A = "[object RegExp]", se = "[object Set]", ce = "[object String]", le = "[object Symbol]", ue = "[object WeakMap]", de = "[object ArrayBuffer]", j = "[object DataView]", fe = "[object Float32Array]", pe = "[object Float64Array]", me = "[object Int8Array]", he = "[object Int16Array]", ge = "[object Int32Array]", _e = "[object Uint8Array]", ve = "[object Uint8ClampedArray]", ye = "[object Uint16Array]", be = "[object Uint32Array]", M = {};
	M[ne] = M[T] = M[de] = M[j] = M[E] = M[D] = M[fe] = M[pe] = M[me] = M[he] = M[ge] = M[O] = M[oe] = M[k] = M[A] = M[se] = M[ce] = M[le] = M[_e] = M[ve] = M[ye] = M[be] = !0, M[re] = M[ie] = M[ue] = !1;
	function xe(e, t, T, E, D, re) {
		var O, oe = t & w, A = t & ee, se = t & te;
		if (T && (O = D ? T(e, E, D, re) : T(e)), O !== void 0) return O;
		if (!b(e)) return e;
		var ce = _(e);
		if (ce) {
			if (O = m(e), !oe) return c(e, O);
		} else {
			var le = p(e), ue = le == ie || le == ae;
			if (v(e)) return s(e, oe);
			if (le == k || le == ne || ue && !D) {
				if (O = A || ue ? {} : g(e), !oe) return A ? u(e, o(O, e)) : l(e, a(O, e));
			} else {
				if (!M[le]) return D ? e : {};
				O = h(e, le, oe);
			}
		}
		re ||= new n();
		var de = re.get(e);
		if (de) return de;
		re.set(e, O), x(e) ? e.forEach(function(n) {
			O.add(xe(n, t, T, n, e, re));
		}) : y(e) && e.forEach(function(n, r) {
			O.set(r, xe(n, t, T, r, e, re));
		});
		var j = ce ? void 0 : (se ? A ? f : d : A ? C : S)(e);
		return r(j || e, function(n, r) {
			j && (r = n, n = e[r]), i(O, r, xe(n, t, T, r, e, re));
		}), O;
	}
	t.exports = xe;
})), di = /* @__PURE__ */ o(((e, t) => {
	var n = ui(), r = 1, i = 4;
	function a(e) {
		return n(e, r | i);
	}
	t.exports = a;
})), fi = /* @__PURE__ */ c(st());
di(), typeof window < "u" && (window.__CRAFTJS__ || (window.__CRAFTJS__ = {}), window.__CRAFTJS__["@craftjs/core"] = "0.2.12");
var pi = _.createContext(null), mi = ({ id: e, related: t = !1, children: n }) => _.createElement(pi.Provider, { value: {
	id: e,
	related: t
} }, n);
function hi(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter((function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		}))), n.push.apply(n, r);
	}
	return n;
}
function I(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? hi(Object(n), !0).forEach((function(t) {
			L(e, t, n[t]);
		})) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : hi(Object(n)).forEach((function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		}));
	}
	return e;
}
function gi(e) {
	return gi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, gi(e);
}
function _i(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function vi(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Ai(r.key), r);
	}
}
function yi(e, t, n) {
	return t && vi(e.prototype, t), n && vi(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function L(e, t, n) {
	return (t = Ai(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function bi(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Si(e, t);
}
function xi(e) {
	return xi = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, xi(e);
}
function Si(e, t) {
	return Si = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Si(e, t);
}
function Ci(e, t) {
	if (e == null) return {};
	var n, r, i = function(e, t) {
		if (e == null) return {};
		var n, r, i = {}, a = Object.keys(e);
		for (r = 0; r < a.length; r++) t.indexOf(n = a[r]) >= 0 || (i[n] = e[n]);
		return i;
	}(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) t.indexOf(n = a[r]) >= 0 || Object.prototype.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
function wi(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Ti(e) {
	var t = function() {
		if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
		if (typeof Proxy == "function") return !0;
		try {
			return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {}))), !0;
		} catch {
			return !1;
		}
	}();
	return function() {
		var n, r = xi(e);
		if (t) {
			var i = xi(this).constructor;
			n = Reflect.construct(r, arguments, i);
		} else n = r.apply(this, arguments);
		return function(e, t) {
			if (t && (typeof t == "object" || typeof t == "function")) return t;
			if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
			return wi(e);
		}(this, n);
	};
}
function Ei(e, t) {
	return function(e) {
		if (Array.isArray(e)) return e;
	}(e) || function(e, t) {
		var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (n != null) {
			var r, i, a, o, s = [], c = !0, l = !1;
			try {
				if (a = (n = n.call(e)).next, t === 0) {
					if (Object(n) !== n) return;
					c = !1;
				} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
			} catch (e) {
				l = !0, i = e;
			} finally {
				try {
					if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
				} finally {
					if (l) throw i;
				}
			}
			return s;
		}
	}(e, t) || Oi(e, t) || function() {
		throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}();
}
function Di(e) {
	return function(e) {
		if (Array.isArray(e)) return ki(e);
	}(e) || function(e) {
		if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
	}(e) || Oi(e) || function() {
		throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}();
}
function Oi(e, t) {
	if (e) {
		if (typeof e == "string") return ki(e, t);
		var n = Object.prototype.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ki(e, t) : void 0;
	}
}
function ki(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Ai(e) {
	var t = function(e, t) {
		if (typeof e != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var r = n.call(e, "string");
			if (typeof r != "object") return r;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return String(e);
	}(e);
	return typeof t == "symbol" ? t : String(t);
}
var ji = (0, _.createContext)(null), Mi = (0, _.createContext)(null), Ni = function() {
	return (0, _.useContext)(Mi);
};
function Pi(e) {
	var t = Ni(), n = (0, _.useContext)(ji);
	P(n, qn);
	var r = yr(n, e), i = (0, _.useMemo)((function() {
		return t && t.createConnectorsUsage();
	}), [t]);
	(0, _.useEffect)((function() {
		return i.register(), function() {
			i.cleanup();
		};
	}), [i]);
	var a = (0, _.useMemo)((function() {
		return i && Or(i.connectors);
	}), [i]);
	return I(I({}, r), {}, {
		connectors: a,
		inContext: !!n,
		store: n
	});
}
var R = [
	"actions",
	"query",
	"connectors"
];
function z(e) {
	var t = (0, _.useContext)(pi);
	P(t, Jn);
	var n = t.id, r = t.related, i = Pi((function(t) {
		return n && t.nodes[n] && e && e(t.nodes[n]);
	})), a = i.actions, o = i.connectors, s = Ci(i, R), c = (0, _.useMemo)((function() {
		return Or({
			connect: function(e) {
				return o.connect(e, n);
			},
			drag: function(e) {
				return o.drag(e, n);
			}
		});
	}), [o, n]), l = (0, _.useMemo)((function() {
		return {
			setProp: function(e, t) {
				t ? a.history.throttle(t).setProp(n, e) : a.setProp(n, e);
			},
			setCustom: function(e, t) {
				t ? a.history.throttle(t).setCustom(n, e) : a.setCustom(n, e);
			},
			setHidden: function(e) {
				return a.setHidden(n, e);
			}
		};
	}), [a, n]);
	return I(I({}, s), {}, {
		id: n,
		related: r,
		inNodeContext: !!t,
		actions: l,
		connectors: c
	});
}
var Fi = [
	"id",
	"related",
	"actions",
	"inNodeContext",
	"connectors"
];
function Ii(e) {
	var t = z(e), n = t.id, r = t.related, i = t.actions, a = t.inNodeContext, o = t.connectors;
	return I(I({}, Ci(t, Fi)), {}, {
		actions: i,
		id: n,
		related: r,
		setProp: function(e, t) {
			return Ar("useNode().setProp()", { suggest: "useNode().actions.setProp()" }), i.setProp(e, t);
		},
		inNodeContext: a,
		connectors: o
	});
}
var Li = ({ render: e }) => {
	let { connectors: { connect: t, drag: n } } = Ii();
	return typeof e.type == "string" ? t(n(_.cloneElement(e))) : e;
}, Ri = () => {
	let { type: e, props: t, nodes: n, hydrationTimestamp: r } = z(((e) => ({
		type: e.data.type,
		props: e.data.props,
		nodes: e.data.nodes,
		hydrationTimestamp: e._hydrationTimestamp
	})));
	return (0, _.useMemo)((() => {
		let r = t.children;
		n && n.length > 0 && (r = _.createElement(_.Fragment, null, n.map(((e) => _.createElement(Bi, {
			id: e,
			key: e
		})))));
		let i = _.createElement(e, t, r);
		return typeof e == "string" ? _.createElement(Li, { render: i }) : i;
	}), [
		e,
		t,
		r,
		n
	]);
}, zi = ({ render: e }) => {
	let { hidden: t } = z(((e) => ({ hidden: e.data.hidden }))), { onRender: n } = Pi(((e) => ({ onRender: e.options.onRender })));
	return t ? null : _.createElement(n, { render: e || _.createElement(Ri, null) });
}, Bi = ({ id: e, render: t }) => _.createElement(mi, { id: e }, _.createElement(zi, { render: t })), Vi = {
	is: "div",
	canvas: !1,
	custom: {},
	hidden: !1
}, Hi = {
	is: "type",
	canvas: "isCanvas"
};
function Ui({ id: e, children: t, ...n }) {
	let { is: r } = {
		...Vi,
		...n
	}, { query: i, actions: a } = Pi(), { id: o, inNodeContext: s } = z(), [c] = (0, _.useState)((() => {
		P(!!e, Fn);
		let c = i.node(o).get();
		if (s) {
			let s = c.data.linkedNodes[e] ? i.node(c.data.linkedNodes[e]).get() : null;
			if (s && s.data.type === r) return s.id;
			let l = _.createElement(Ui, n, t), u = i.parseReactElement(l).toNodeTree();
			return a.history.ignore().addLinkedNodeFromTree(u, o, e), u.rootNodeId;
		}
		return null;
	}));
	return c ? _.createElement(Bi, { id: c }) : null;
}
var Wi = () => Ar("<Canvas />", { suggest: "<Element canvas={true} />" });
function Gi({ ...e }) {
	return (0, _.useEffect)((() => Wi()), []), _.createElement(Ui, {
		...e,
		canvas: !0
	});
}
var Ki = () => {
	let { timestamp: e } = Pi(((e) => ({ timestamp: e.nodes.ROOT && e.nodes.ROOT._hydrationTimestamp })));
	return e ? _.createElement(Bi, {
		id: jn,
		key: e
	}) : null;
}, qi = ({ children: e, json: t, data: n }) => {
	let { actions: r, query: i } = Pi();
	t && Ar("<Frame json={...} />", { suggest: "<Frame data={...} />" });
	let a = (0, _.useRef)(!1);
	if (!a.current) {
		let o = n || t;
		if (o) r.history.ignore().deserialize(o);
		else if (e) {
			let t = _.Children.only(e), n = i.parseReactElement(t).toNodeTree(((e, n) => (n === t && (e.id = "ROOT"), e)));
			r.history.ignore().addNodeTree(n);
		}
		a.current = !0;
	}
	return _.createElement(Ki, null);
}, Ji;
(function(e) {
	e[e.Any = 0] = "Any", e[e.Id = 1] = "Id", e[e.Obj = 2] = "Obj";
})(Ji ||= {});
var Yi = function(e) {
	return Object.fromEntries ? Object.fromEntries(e) : e.reduce((function(e, t) {
		var n = Ei(t, 2), r = n[0], i = n[1];
		return I(I({}, e), {}, L({}, r, i));
	}), {});
}, Xi = function(e, t, n) {
	var r = Array.isArray(t) ? t : [t], i = I({
		existOnly: !1,
		idOnly: !1
	}, n || {}), a = r.filter((function(e) {
		return !!e;
	})).map((function(t) {
		return typeof t == "string" ? {
			node: e[t],
			exists: !!e[t]
		} : gi(t) !== "object" || i.idOnly ? {
			node: null,
			exists: !1
		} : {
			node: t,
			exists: !!e[t.id]
		};
	}));
	return i.existOnly && P(a.filter((function(e) {
		return !e.exists;
	})).length === 0, "Node does not exist, it may have been removed"), a;
}, Zi = ["history"], Qi = null, $i = function(e, t) {
	if (typeof t == "string") return t;
	var n, r = function(e, t) {
		var n = function(e) {
			if (Qi && Qi.resolver === e) return Qi.reversed;
			Qi = {
				resolver: e,
				reversed: /* @__PURE__ */ new Map()
			};
			for (var t = 0, n = Object.entries(e); t < n.length; t++) {
				var r = Ei(n[t], 2);
				Qi.reversed.set(r[1], r[0]);
			}
			return Qi.reversed;
		}(e).get(t);
		return n === void 0 ? null : n;
	}(e, t);
	return P(r, Hn.replace("%node_type%", (n = t).name || n.displayName)), r;
}, ea = (e, t) => typeof e == "string" ? e : { resolvedName: $i(t, e) }, ta = (e, t) => {
	let { type: n, isCanvas: r, props: i } = e;
	return i = Object.keys(i).reduce(((e, n) => {
		let r = i[n];
		return r == null || typeof r == "function" || (e[n] = n === "children" && typeof r != "string" ? _.Children.map(r, ((e) => typeof e == "string" ? e : ta(e, t))) : typeof r.type == "function" ? ta(r, t) : r), e;
	}), {}), {
		type: ea(n, t),
		isCanvas: !!r,
		props: i
	};
}, na = (e, t) => {
	let { type: n, props: r, isCanvas: i, name: a, ...o } = e;
	return {
		...ta({
			type: n,
			isCanvas: i,
			props: r
		}, t),
		...o
	};
};
function ra(e, t) {
	P(typeof t == "string", Wn);
	var n = e.nodes[t], r = function(t) {
		return ra(e, t);
	};
	return {
		isCanvas: function() {
			return !!n.data.isCanvas;
		},
		isRoot: function() {
			return n.id === jn;
		},
		isLinkedNode: function() {
			return n.data.parent && r(n.data.parent).linkedNodes().includes(n.id);
		},
		isTopLevelNode: function() {
			return this.isRoot() || this.isLinkedNode();
		},
		isDeletable: function() {
			return !this.isTopLevelNode();
		},
		isParentOfTopLevelNodes: function() {
			return n.data.linkedNodes && Object.keys(n.data.linkedNodes).length > 0;
		},
		isParentOfTopLevelCanvas: function() {
			return Ar("query.node(id).isParentOfTopLevelCanvas", { suggest: "query.node(id).isParentOfTopLevelNodes" }), this.isParentOfTopLevelNodes();
		},
		isSelected: function() {
			return e.events.selected.has(t);
		},
		isHovered: function() {
			return e.events.hovered.has(t);
		},
		isDragged: function() {
			return e.events.dragged.has(t);
		},
		get: function() {
			return n;
		},
		ancestors: function() {
			var t = arguments.length > 0 && arguments[0] !== void 0 && arguments[0];
			return function n(r) {
				var i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [], a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0, o = e.nodes[r];
				return o ? (i.push(r), o.data.parent && (t || !t && a === 0) && (i = n(o.data.parent, i, a + 1)), i) : i;
			}(n.data.parent);
		},
		descendants: function() {
			var n = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], i = arguments.length > 1 ? arguments[1] : void 0;
			return function t(a) {
				var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [], s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
				return (n || !n && s === 0) && e.nodes[a] ? (i !== "childNodes" && r(a).linkedNodes().forEach((function(e) {
					o.push(e), o = t(e, o, s + 1);
				})), i !== "linkedNodes" && r(a).childNodes().forEach((function(e) {
					o.push(e), o = t(e, o, s + 1);
				})), o) : o;
			}(t);
		},
		linkedNodes: function() {
			return Object.values(n.data.linkedNodes || {});
		},
		childNodes: function() {
			return n.data.nodes || [];
		},
		isDraggable: function(t) {
			try {
				var i = n;
				return P(!this.isTopLevelNode(), Bn), P(ra(e, i.data.parent).isCanvas(), Rn), P(i.rules.canDrag(i, r), Un), !0;
			} catch (e) {
				return t && t(e), !1;
			}
		},
		isDroppable: function(t, i) {
			var a = Xi(e.nodes, t), o = n;
			try {
				P(this.isCanvas(), zn), P(o.rules.canMoveIn(a.map((function(e) {
					return e.node;
				})), o, r), In);
				var s = {};
				return a.forEach((function(t) {
					var n = t.node, i = t.exists;
					if (P(n.rules.canDrop(o, n, r), "Node cannot be dropped into target parent"), i) {
						P(!r(n.id).isTopLevelNode(), Bn), P(!r(n.id).descendants(!0).includes(o.id) && o.id !== n.id, Vn);
						var a = n.data.parent && e.nodes[n.data.parent];
						P(a.data.isCanvas, Rn), P(a || !a && !e.nodes[n.id], Nn), a.id !== o.id && (s[a.id] || (s[a.id] = []), s[a.id].push(n));
					}
				})), Object.keys(s).forEach((function(t) {
					var n = e.nodes[t];
					P(n.rules.canMoveOut(s[t], n, r), Ln);
				})), !0;
			} catch (e) {
				return i && i(e), !1;
			}
		},
		toSerializedNode: function() {
			return na(n.data, e.options.resolver);
		},
		toNodeTree: function(e) {
			return {
				rootNodeId: t,
				nodes: [t].concat(Di(this.descendants(!0, e))).reduce((function(e, t) {
					return e[t] = r(t).get(), e;
				}), {})
			};
		},
		decendants: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 && arguments[0];
			return Ar("query.node(id).decendants", { suggest: "query.node(id).descendants" }), this.descendants(e);
		},
		isTopLevelCanvas: function() {
			return !this.isRoot() && !n.data.parent;
		}
	};
}
function ia(e, t, n, r) {
	for (var i = {
		parent: e,
		index: 0,
		where: "before"
	}, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = 0, f = t.length; d < f; d++) {
		var p = t[d];
		if (u = p.top + p.outerHeight, c = p.left + p.outerWidth / 2, l = p.top + p.outerHeight / 2, !(o && p.left > o || s && l >= s || a && p.left + p.outerWidth < a)) if (i.index = d, p.inFlow) {
			if (r < l) {
				i.where = "before";
				break;
			}
			i.where = "after";
		} else r < u && (s = u), n < c ? (o = c, i.where = "before") : (a = c, i.where = "after");
	}
	return i;
}
var aa = function(e) {
	return typeof e == "string" ? e : e.name;
};
function oa(e, t) {
	var n = e.data.type, r = {
		id: e.id || xr(),
		_hydrationTimestamp: Date.now(),
		data: I({
			type: n,
			name: aa(n),
			displayName: aa(n),
			props: {},
			custom: {},
			parent: null,
			isCanvas: !1,
			hidden: !1,
			nodes: [],
			linkedNodes: {}
		}, e.data),
		info: {},
		related: {},
		events: {
			selected: !1,
			dragged: !1,
			hovered: !1
		},
		rules: {
			canDrag: function() {
				return !0;
			},
			canDrop: function() {
				return !0;
			},
			canMoveIn: function() {
				return !0;
			},
			canMoveOut: function() {
				return !0;
			}
		},
		dom: null
	};
	if (r.data.type === Ui || r.data.type === Gi) {
		var i = I(I({}, Vi), r.data.props);
		r.data.props = Object.keys(r.data.props).reduce((function(e, t) {
			return Object.keys(Vi).includes(t) ? r.data[Hi[t] || t] = i[t] : e[t] = r.data.props[t], e;
		}), {}), r.data.name = aa(n = r.data.type), r.data.displayName = aa(n), r.data.type === Gi && (r.data.isCanvas = !0, Wi());
	}
	t && t(r);
	var a = n.craft;
	if (a) {
		if (r.data.displayName = a.displayName || a.name || r.data.displayName, r.data.props = I(I({}, a.props || a.defaultProps || {}), r.data.props), r.data.custom = I(I({}, a.custom || {}), r.data.custom), a.isCanvas != null && (r.data.isCanvas = a.isCanvas), a.rules && Object.keys(a.rules).forEach((function(e) {
			[
				"canDrag",
				"canDrop",
				"canMoveIn",
				"canMoveOut"
			].includes(e) && (r.rules[e] = a.rules[e]);
		})), a.related) {
			var o = {
				id: r.id,
				related: !0
			};
			Object.keys(a.related).forEach((function(e) {
				r.related[e] = function(t) {
					return _.createElement(mi, o, _.createElement(a.related[e], t));
				};
			}));
		}
		a.info && (r.info = a.info);
	}
	return r;
}
var sa = (e, t, n) => {
	let { type: r, props: i } = e, a = ((e, t) => typeof e == "object" && e.resolvedName ? e.resolvedName === "Canvas" ? Gi : t[e.resolvedName] : typeof e == "string" ? e : null)(r, t);
	if (!a) return;
	i = Object.keys(i).reduce(((e, n) => {
		let r = i[n];
		return e[n] = r == null ? null : typeof r == "object" && r.resolvedName ? sa(r, t) : n === "children" && Array.isArray(r) ? r.map(((e) => typeof e == "string" ? e : sa(e, t))) : r, e;
	}), {}), n && (i.key = n);
	let o = { ..._.createElement(a, { ...i }) };
	return {
		...o,
		name: $i(t, o.type)
	};
}, ca = (e, t) => {
	let { type: n, props: r, ...i } = e;
	P(n !== void 0 && typeof n == "string" || n !== void 0 && n.resolvedName !== void 0, Kn.replace("%displayName%", e.displayName).replace("%availableComponents%", Object.keys(t).join(", ")));
	let { type: a, name: o, props: s } = sa(e, t), { parent: c, custom: l, displayName: u, isCanvas: d, nodes: f, hidden: p } = i;
	return {
		type: a,
		name: o,
		displayName: u || o,
		props: s,
		custom: l || {},
		isCanvas: !!d,
		hidden: !!p,
		parent: c,
		linkedNodes: i.linkedNodes || i._childCanvas || {},
		nodes: f || []
	};
}, la = (e, t) => {
	if (t.length < 1) return { [e.id]: e };
	let n = t.map((({ rootNodeId: e }) => e)), r = {
		...e,
		data: {
			...e.data,
			nodes: n
		}
	};
	return t.reduce(((t, n) => {
		let r = n.nodes[n.rootNodeId];
		return {
			...t,
			...n.nodes,
			[r.id]: {
				...r,
				data: {
					...r.data,
					parent: e.id
				}
			}
		};
	}), { [e.id]: r });
}, ua = (e, t) => ({
	rootNodeId: e.id,
	nodes: la(e, t)
});
function da(e) {
	let t = e && e.options, n = () => da(e);
	return {
		getDropPlaceholder: (t, r, i, a = ((t) => e.nodes[t.id].dom)) => {
			let o = e.nodes[r], s = n().node(o.id).isCanvas() ? o : e.nodes[o.data.parent];
			if (!s) return;
			let c = s.data.nodes || [], l = ia(s, c ? c.reduce(((t, n) => {
				let r = a(e.nodes[n]);
				if (r) {
					let e = {
						id: n,
						...vr(r)
					};
					t.push(e);
				}
				return t;
			}), []) : [], i.x, i.y), u = c.length && e.nodes[c[l.index]], d = {
				placement: {
					...l,
					currentNode: u
				},
				error: null
			};
			return Xi(e.nodes, t).forEach((({ node: e, exists: t }) => {
				t && n().node(e.id).isDraggable(((e) => d.error = e));
			})), n().node(s.id).isDroppable(t, ((e) => d.error = e)), d;
		},
		getOptions: () => t,
		getNodes: () => e.nodes,
		node: (t) => ra(e, t),
		getSerializedNodes() {
			return Yi(Object.keys(e.nodes).map(((e) => [e, this.node(e).toSerializedNode()])));
		},
		getEvent: (t) => function(e, t) {
			var n = e.events[t];
			return {
				contains: function(e) {
					return n.has(e);
				},
				isEmpty: function() {
					return this.all().length === 0;
				},
				first: function() {
					return this.all()[0];
				},
				last: function() {
					var e = this.all();
					return e[e.length - 1];
				},
				all: function() {
					return Array.from(n);
				},
				size: function() {
					return this.all().length;
				},
				at: function(e) {
					return this.all()[e];
				},
				raw: function() {
					return n;
				}
			};
		}(e, t),
		serialize() {
			return JSON.stringify(this.getSerializedNodes());
		},
		parseReactElement: (t) => ({ toNodeTree(r) {
			let i = function(e, t) {
				let n = e;
				return typeof n == "string" && (n = _.createElement(_.Fragment, {}, n)), oa({ data: {
					type: n.type,
					props: { ...n.props }
				} }, ((e) => {
					t && t(e, n);
				}));
			}(t, ((t, n) => {
				let i = $i(e.options.resolver, t.data.type);
				t.data.displayName = t.data.displayName || i, t.data.name = i, r && r(t, n);
			})), a = [];
			return t.props && t.props.children && (a = _.Children.toArray(t.props.children).reduce(((e, t) => (_.isValidElement(t) && e.push(n().parseReactElement(t).toNodeTree(r)), e)), [])), ua(i, a);
		} }),
		parseSerializedNode: (t) => ({ toNode(r) {
			let i = ca(t, e.options.resolver);
			P(i.type, Hn);
			let a = typeof r == "string" && r;
			return a && Ar("query.parseSerializedNode(...).toNode(id)", { suggest: "query.parseSerializedNode(...).toNode(node => node.id = id)" }), n().parseFreshNode({
				...a ? { id: a } : {},
				data: i
			}).toNode(!a && r);
		} }),
		parseFreshNode: (t) => ({ toNode: (n) => oa(t, ((t) => {
			t.data.parent === "canvas-ROOT" && (t.data.parent = "ROOT");
			let r = $i(e.options.resolver, t.data.type);
			P(r !== null, Hn), t.data.displayName = t.data.displayName || r, t.data.name = r, n && n(t);
		})) }),
		createNode(e, t) {
			Ar(`query.createNode(${e})`, { suggest: `query.parseReactElement(${e}).toNodeTree()` });
			let n = this.parseReactElement(e).toNodeTree(), r = n.nodes[n.rootNodeId];
			return t ? (t.id && (r.id = t.id), t.data && (r.data = {
				...r.data,
				...t.data
			}), r) : r;
		},
		getState: () => e
	};
}
var fa = function(e) {
	bi(n, Cr);
	var t = Ti(n);
	function n() {
		return _i(this, n), t.apply(this, arguments);
	}
	return yi(n, [{
		key: "handlers",
		value: function() {
			return {
				connect: function(e, t) {},
				select: function(e, t) {},
				hover: function(e, t) {},
				drag: function(e, t) {},
				drop: function(e, t) {},
				create: function(e, t, n) {}
			};
		}
	}]), n;
}();
(function(e) {
	bi(n, wr);
	var t = Ti(n);
	function n() {
		return _i(this, n), t.apply(this, arguments);
	}
	return yi(n);
})();
var pa = function(e) {
	e.preventDefault();
}, ma = function() {
	function e(t, n) {
		_i(this, e), L(this, "store", void 0), L(this, "dragTarget", void 0), L(this, "currentDropTargetId", void 0), L(this, "currentDropTargetCanvasAncestorId", void 0), L(this, "currentIndicator", null), L(this, "currentTargetId", void 0), L(this, "currentTargetChildDimensions", void 0), L(this, "dragError", void 0), L(this, "draggedNodes", void 0), L(this, "onScrollListener", void 0), this.store = t, this.dragTarget = n, this.currentDropTargetId = null, this.currentDropTargetCanvasAncestorId = null, this.currentTargetId = null, this.currentTargetChildDimensions = null, this.currentIndicator = null, this.dragError = null, this.draggedNodes = this.getDraggedNodes(), this.validateDraggedNodes(), this.onScrollListener = this.onScroll.bind(this), window.addEventListener("scroll", this.onScrollListener, !0), window.addEventListener("dragover", pa, !1);
	}
	return yi(e, [
		{
			key: "cleanup",
			value: function() {
				window.removeEventListener("scroll", this.onScrollListener, !0), window.removeEventListener("dragover", pa, !1);
			}
		},
		{
			key: "onScroll",
			value: function(e) {
				var t = e.target, n = this.store.query.node(jn).get();
				t instanceof Element && n && n.dom && t.contains(n.dom) && (this.currentTargetChildDimensions = null);
			}
		},
		{
			key: "getDraggedNodes",
			value: function() {
				return Xi(this.store.query.getNodes(), this.dragTarget.type === "new" ? this.dragTarget.tree.nodes[this.dragTarget.tree.rootNodeId] : this.dragTarget.nodes);
			}
		},
		{
			key: "validateDraggedNodes",
			value: function() {
				var e = this;
				this.dragTarget.type !== "new" && this.draggedNodes.forEach((function(t) {
					t.exists && e.store.query.node(t.node.id).isDraggable((function(t) {
						e.dragError = t;
					}));
				}));
			}
		},
		{
			key: "isNearBorders",
			value: function(t, n, r) {
				return t.top + e.BORDER_OFFSET > r || t.bottom - e.BORDER_OFFSET < r || t.left + e.BORDER_OFFSET > n || t.right - e.BORDER_OFFSET < n;
			}
		},
		{
			key: "isDiff",
			value: function(e) {
				return !this.currentIndicator || this.currentIndicator.placement.parent.id !== e.parent.id || this.currentIndicator.placement.index !== e.index || this.currentIndicator.placement.where !== e.where;
			}
		},
		{
			key: "getChildDimensions",
			value: function(e) {
				var t = this, n = this.currentTargetChildDimensions;
				return this.currentTargetId === e.id && n ? n : e.data.nodes.reduce((function(e, n) {
					var r = t.store.query.node(n).get().dom;
					return r && e.push(I({ id: n }, vr(r))), e;
				}), []);
			}
		},
		{
			key: "getCanvasAncestor",
			value: function(e) {
				var t = this;
				if (e === this.currentDropTargetId && this.currentDropTargetCanvasAncestorId) {
					var n = this.store.query.node(this.currentDropTargetCanvasAncestorId).get();
					if (n) return n;
				}
				return function e(n) {
					var r = t.store.query.node(n).get();
					return r && r.data.isCanvas ? r : r.data.parent ? e(r.data.parent) : null;
				}(e);
			}
		},
		{
			key: "computeIndicator",
			value: function(e, t, n) {
				var r = this.getCanvasAncestor(e);
				if (r && (this.currentDropTargetId = e, this.currentDropTargetCanvasAncestorId = r.id, r.data.parent && this.isNearBorders(vr(r.dom), t, n) && !this.store.query.node(r.id).isLinkedNode() && (r = this.store.query.node(r.data.parent).get()), r)) {
					this.currentTargetChildDimensions = this.getChildDimensions(r), this.currentTargetId = r.id;
					var i = ia(r, this.currentTargetChildDimensions, t, n);
					if (this.isDiff(i)) {
						var a = this.dragError;
						a || this.store.query.node(r.id).isDroppable(this.draggedNodes.map((function(e) {
							return e.node;
						})), (function(e) {
							a = e;
						}));
						var o = r.data.nodes[i.index], s = o && this.store.query.node(o).get();
						return this.currentIndicator = {
							placement: I(I({}, i), {}, { currentNode: s }),
							error: a
						}, this.currentIndicator;
					}
				}
			}
		},
		{
			key: "getIndicator",
			value: function() {
				return this.currentIndicator;
			}
		}
	]), e;
}();
L(ma, "BORDER_OFFSET", 10);
var ha = function(e, t) {
	if (t.length === 1 || arguments.length > 2 && arguments[2] !== void 0 && arguments[2]) {
		var n = t[0].getBoundingClientRect(), r = n.width, i = n.height, a = t[0].cloneNode(!0);
		return a.style.position = "absolute", a.style.left = "-100%", a.style.top = "-100%", a.style.width = `${r}px`, a.style.height = `${i}px`, a.style.pointerEvents = "none", a.classList.add("drag-shadow"), document.body.appendChild(a), e.dataTransfer.setDragImage(a, 0, 0), a;
	}
	var o = document.createElement("div");
	return o.style.position = "absolute", o.style.left = "-100%", o.style.top = "-100%", o.style.width = "100%", o.style.height = "100%", o.style.pointerEvents = "none", o.classList.add("drag-shadow-container"), t.forEach((function(e) {
		var t = e.getBoundingClientRect(), n = t.width, r = t.height, i = t.top, a = t.left, s = e.cloneNode(!0);
		s.style.position = "absolute", s.style.left = `${a}px`, s.style.top = `${i}px`, s.style.width = `${n}px`, s.style.height = `${r}px`, s.classList.add("drag-shadow"), o.appendChild(s);
	})), document.body.appendChild(o), e.dataTransfer.setDragImage(o, e.clientX, e.clientY), o;
}, ga = function(e) {
	bi(n, fa);
	var t = Ti(n);
	function n() {
		var e;
		_i(this, n);
		var r = [...arguments];
		return L(wi(e = t.call.apply(t, [this].concat(r))), "draggedElementShadow", void 0), L(wi(e), "dragTarget", void 0), L(wi(e), "positioner", null), L(wi(e), "currentSelectedElementIds", []), e;
	}
	return yi(n, [
		{
			key: "onDisable",
			value: function() {
				this.options.store.actions.clearEvents();
			}
		},
		{
			key: "handlers",
			value: function() {
				var e = this, t = this.options.store;
				return {
					connect: function(n, r) {
						return t.actions.setDOM(r, n), e.reflect((function(e) {
							e.select(n, r), e.hover(n, r), e.drop(n, r);
						}));
					},
					select: function(n, r) {
						var i = e.addCraftEventListener(n, "mousedown", (function(n) {
							n.craft.stopPropagation();
							var i = [];
							if (r) {
								var a = t.query, o = a.getEvent("selected").all();
								(e.options.isMultiSelectEnabled(n) || o.includes(r)) && (i = o.filter((function(e) {
									var t = a.node(e).descendants(!0), n = a.node(e).ancestors(!0);
									return !t.includes(r) && !n.includes(r);
								}))), i.includes(r) || i.push(r);
							}
							t.actions.setNodeEvent("selected", i);
						})), a = e.addCraftEventListener(n, "click", (function(n) {
							n.craft.stopPropagation();
							var i = t.query.getEvent("selected").all(), a = e.options.isMultiSelectEnabled(n), o = e.currentSelectedElementIds.includes(r), s = Di(i);
							a && o ? (s.splice(s.indexOf(r), 1), t.actions.setNodeEvent("selected", s)) : !a && i.length > 1 && t.actions.setNodeEvent("selected", s = [r]), e.currentSelectedElementIds = s;
						}));
						return function() {
							i(), a();
						};
					},
					hover: function(n, r) {
						var i = e.addCraftEventListener(n, "mouseover", (function(e) {
							e.craft.stopPropagation(), t.actions.setNodeEvent("hovered", r);
						})), a = null;
						return e.options.removeHoverOnMouseleave && (a = e.addCraftEventListener(n, "mouseleave", (function(e) {
							e.craft.stopPropagation(), t.actions.setNodeEvent("hovered", null);
						}))), function() {
							i(), a && a();
						};
					},
					drop: function(n, r) {
						var i = e.addCraftEventListener(n, "dragover", (function(n) {
							if (n.craft.stopPropagation(), n.preventDefault(), e.positioner) {
								var i = e.positioner.computeIndicator(r, n.clientX, n.clientY);
								i && t.actions.setIndicator(i);
							}
						})), a = e.addCraftEventListener(n, "dragenter", (function(e) {
							e.craft.stopPropagation(), e.preventDefault();
						}));
						return function() {
							a(), i();
						};
					},
					drag: function(r, i) {
						if (!t.query.node(i).isDraggable()) return function() {};
						r.setAttribute("draggable", "true");
						var a = e.addCraftEventListener(r, "dragstart", (function(r) {
							r.craft.stopPropagation();
							var a = t.query, o = t.actions, s = a.getEvent("selected").all(), c = e.options.isMultiSelectEnabled(r);
							e.currentSelectedElementIds.includes(i) || (s = c ? [].concat(Di(s), [i]) : [i], t.actions.setNodeEvent("selected", s)), o.setNodeEvent("dragged", s), e.draggedElementShadow = ha(r, s.map((function(e) {
								return a.node(e).get().dom;
							})), n.forceSingleDragShadow), e.dragTarget = {
								type: "existing",
								nodes: s
							}, e.positioner = new ma(e.options.store, e.dragTarget);
						})), o = e.addCraftEventListener(r, "dragend", (function(n) {
							n.craft.stopPropagation(), e.dropElement((function(e, n) {
								e.type !== "new" && t.actions.move(e.nodes, n.placement.parent.id, n.placement.index + +(n.placement.where === "after"));
							}));
						}));
						return function() {
							r.setAttribute("draggable", "false"), a(), o();
						};
					},
					create: function(r, i, a) {
						r.setAttribute("draggable", "true");
						var o = e.addCraftEventListener(r, "dragstart", (function(r) {
							var a;
							if (r.craft.stopPropagation(), typeof i == "function") {
								var o = i();
								a = _.isValidElement(o) ? t.query.parseReactElement(o).toNodeTree() : o;
							} else a = t.query.parseReactElement(i).toNodeTree();
							e.draggedElementShadow = ha(r, [r.currentTarget], n.forceSingleDragShadow), e.dragTarget = {
								type: "new",
								tree: a
							}, e.positioner = new ma(e.options.store, e.dragTarget);
						})), s = e.addCraftEventListener(r, "dragend", (function(n) {
							n.craft.stopPropagation(), e.dropElement((function(e, n) {
								e.type !== "existing" && (t.actions.addNodeTree(e.tree, n.placement.parent.id, n.placement.index + +(n.placement.where === "after")), a && (0, fi.default)(a.onCreate) && a.onCreate(e.tree));
							}));
						}));
						return function() {
							r.removeAttribute("draggable"), o(), s();
						};
					}
				};
			}
		},
		{
			key: "dropElement",
			value: function(e) {
				var t = this.options.store;
				if (this.positioner) {
					var n = this.draggedElementShadow, r = this.positioner.getIndicator();
					this.dragTarget && r && !r.error && e(this.dragTarget, r), n && (n.parentNode.removeChild(n), this.draggedElementShadow = null), this.dragTarget = null, t.actions.setIndicator(null), t.actions.setNodeEvent("dragged", null), this.positioner.cleanup(), this.positioner = null;
				}
			}
		}
	]), n;
}();
function _a(e, t, n) {
	var r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 2, i = 0, a = 0, o = 0, s = 0, c = e.where;
	return n ? n.inFlow ? (o = n.outerWidth, s = r, i = c === "before" ? n.top : n.bottom, a = n.left) : (o = r, s = n.outerHeight, i = n.top, a = c === "before" ? n.left : n.left + n.outerWidth) : t && (i = t.top + t.padding.top, a = t.left + t.padding.left, o = t.outerWidth - t.padding.right - t.padding.left - t.margin.left - t.margin.right, s = r), {
		top: `${i}px`,
		left: `${a}px`,
		width: `${o}px`,
		height: `${s}px`
	};
}
L(ga, "forceSingleDragShadow", Nr() && Mr());
var va = () => {
	let { indicator: e, indicatorOptions: t, enabled: n } = Pi(((e) => ({
		indicator: e.indicator,
		indicatorOptions: e.options.indicator,
		enabled: e.options.enabled
	}))), r = Ni();
	return (0, _.useEffect)((() => {
		r && (n ? r.enable() : r.disable());
	}), [n, r]), e ? _.createElement(kr, {
		className: t.className,
		style: {
			..._a(e.placement, vr(e.placement.parent.dom), e.placement.currentNode && vr(e.placement.currentNode.dom), t.thickness),
			backgroundColor: e.error ? t.error : t.success,
			transition: t.transition || "0.2s ease-in",
			...t.style ?? {}
		},
		parentDom: e.placement.parent.dom
	}) : null;
}, ya = ({ children: e }) => {
	let t = (0, _.useContext)(ji), n = (0, _.useMemo)((() => t.query.getOptions().handlers(t)), [t]);
	return n ? _.createElement(Mi.Provider, { value: n }, _.createElement(va, null), e) : null;
}, ba = {
	nodes: {},
	events: {
		dragged: /* @__PURE__ */ new Set(),
		selected: /* @__PURE__ */ new Set(),
		hovered: /* @__PURE__ */ new Set()
	},
	indicator: null,
	options: {
		onNodesChange: () => null,
		onRender: ({ render: e }) => e,
		onBeforeMoveEnd: () => null,
		resolver: {},
		enabled: !0,
		indicator: {
			error: "red",
			success: "rgb(98, 196, 98)"
		},
		handlers: (e) => new ga({
			store: e,
			removeHoverOnMouseleave: !1,
			isMultiSelectEnabled: (e) => !!e.metaKey
		}),
		normalizeNodes: () => {}
	}
}, xa = {
	methods: function(e, t) {
		return I(I({}, function(e, t) {
			var n = function(t, n, i) {
				if (function n(r, i) {
					var a = t.nodes[r];
					typeof a.data.type != "string" && P(e.options.resolver[a.data.name], "The component type specified for this node (%node_type%) does not exist in the resolver".replace("%node_type%", `${a.data.type.name}`)), e.nodes[r] = I(I({}, a), {}, { data: I(I({}, a.data), {}, { parent: i }) }), a.data.nodes.length > 0 && (delete e.nodes[r].data.props.children, a.data.nodes.forEach((function(e) {
						return n(e, a.id);
					}))), Object.values(a.data.linkedNodes).forEach((function(e) {
						return n(e, a.id);
					}));
				}(t.rootNodeId, n), n || t.rootNodeId !== "ROOT") {
					var a = r(n);
					if (i.type !== "child") a.data.linkedNodes[i.id] = t.rootNodeId;
					else {
						var o = i.index;
						o == null ? a.data.nodes.push(t.rootNodeId) : a.data.nodes.splice(o, 0, t.rootNodeId);
					}
				}
			}, r = function(t) {
				P(t, Mn);
				var n = e.nodes[t];
				return P(n, Pn), n;
			}, i = function t(n) {
				var r = e.nodes[n], i = e.nodes[r.data.parent];
				if (r.data.nodes && Di(r.data.nodes).forEach((function(e) {
					return t(e);
				})), r.data.linkedNodes && Object.values(r.data.linkedNodes).map((function(e) {
					return t(e);
				})), i.data.nodes.includes(n)) {
					var a = i.data.nodes;
					a.splice(a.indexOf(n), 1);
				} else {
					var o = Object.keys(i.data.linkedNodes).find((function(e) {
						return i.data.linkedNodes[e] === e;
					}));
					o && delete i.data.linkedNodes[o];
				}
				(function(e, t) {
					Object.keys(e.events).forEach((function(n) {
						var r = e.events[n];
						r && r.has && r.has(t) && (e.events[n] = new Set(Array.from(r).filter((function(e) {
							return t !== e;
						}))));
					}));
				})(e, n), delete e.nodes[n];
			};
			return {
				addLinkedNodeFromTree: function(e, t, a) {
					var o = r(t).data.linkedNodes[a];
					o && i(o), n(e, t, {
						type: "linked",
						id: a
					});
				},
				add: function(e, t, r) {
					var i = [e];
					Array.isArray(e) && (Ar("actions.add(node: Node[])", { suggest: "actions.add(node: Node)" }), i = e), i.forEach((function(e) {
						n({
							nodes: L({}, e.id, e),
							rootNodeId: e.id
						}, t, {
							type: "child",
							index: r
						});
					}));
				},
				addNodeTree: function(e, t, r) {
					n(e, t, {
						type: "child",
						index: r
					});
				},
				delete: function(n) {
					Xi(e.nodes, n, {
						existOnly: !0,
						idOnly: !0
					}).forEach((function(e) {
						var n = e.node;
						P(!t.node(n.id).isTopLevelNode(), Gn), i(n.id);
					}));
				},
				deserialize: function(e) {
					var n = typeof e == "string" ? JSON.parse(e) : e, r = Object.keys(n).map((function(e) {
						var r = e;
						return e === "canvas-ROOT" && (r = "ROOT"), [r, t.parseSerializedNode(n[e]).toNode((function(e) {
							return e.id = r;
						}))];
					}));
					this.replaceNodes(Yi(r));
				},
				move: function(n, r, i) {
					var a = Xi(e.nodes, n, { existOnly: !0 }), o = e.nodes[r], s = /* @__PURE__ */ new Set();
					a.forEach((function(n, a) {
						var c = n.node, l = c.id, u = c.data.parent;
						t.node(r).isDroppable([l], (function(e) {
							throw Error(e);
						})), e.options.onBeforeMoveEnd(c, o, e.nodes[u]);
						var d = e.nodes[u].data.nodes;
						s.add(d);
						var f = d.indexOf(l);
						d[f] = "$$", o.data.nodes.splice(i + a, 0, l), e.nodes[l].data.parent = r;
					})), s.forEach((function(e) {
						var t = e.length;
						Di(e).reverse().forEach((function(n, r) {
							n === "$$" && e.splice(t - 1 - r, 1);
						}));
					}));
				},
				replaceNodes: function(t) {
					this.clearEvents(), e.nodes = t;
				},
				clearEvents: function() {
					this.setNodeEvent("selected", null), this.setNodeEvent("hovered", null), this.setNodeEvent("dragged", null), this.setIndicator(null);
				},
				reset: function() {
					this.clearEvents(), this.replaceNodes({});
				},
				setOptions: function(t) {
					t(e.options);
				},
				setNodeEvent: function(t, n) {
					if (e.events[t].forEach((function(n) {
						e.nodes[n] && (e.nodes[n].events[t] = !1);
					})), e.events[t] = /* @__PURE__ */ new Set(), n) {
						var r = Xi(e.nodes, n, {
							idOnly: !0,
							existOnly: !0
						}), i = new Set(r.map((function(e) {
							return e.node.id;
						})));
						i.forEach((function(n) {
							e.nodes[n].events[t] = !0;
						})), e.events[t] = i;
					}
				},
				setCustom: function(t, n) {
					Xi(e.nodes, t, {
						idOnly: !0,
						existOnly: !0
					}).forEach((function(t) {
						return n(e.nodes[t.node.id].data.custom);
					}));
				},
				setDOM: function(t, n) {
					e.nodes[t] && (e.nodes[t].dom = n);
				},
				setIndicator: function(t) {
					t && (!t.placement.parent.dom || t.placement.currentNode && !t.placement.currentNode.dom) || (e.indicator = t);
				},
				setHidden: function(t, n) {
					e.nodes[t].data.hidden = n;
				},
				setProp: function(t, n) {
					Xi(e.nodes, t, {
						idOnly: !0,
						existOnly: !0
					}).forEach((function(t) {
						return n(e.nodes[t.node.id].data.props);
					}));
				},
				selectNode: function(t) {
					if (t) {
						var n = Xi(e.nodes, t, {
							idOnly: !0,
							existOnly: !0
						});
						this.setNodeEvent("selected", n.map((function(e) {
							return e.node.id;
						})));
					} else this.setNodeEvent("selected", null);
					this.setNodeEvent("hovered", null);
				}
			};
		}(e, t)), {}, { setState: function(t) {
			t(e, Ci(this, Zi));
		} });
	},
	ignoreHistoryForActions: [
		"setDOM",
		"setNodeEvent",
		"selectNode",
		"clearEvents",
		"setOptions",
		"setIndicator"
	],
	normalizeHistory: (e) => {
		Object.keys(e.events).forEach(((t) => {
			Array.from(e.events[t] || []).forEach(((n) => {
				e.nodes[n] || e.events[t].delete(n);
			}));
		})), Object.keys(e.nodes).forEach(((t) => {
			let n = e.nodes[t];
			Object.keys(n.events).forEach(((t) => {
				n.events[t] && e.events[t] && !e.events[t].has(n.id) && (n.events[t] = !1);
			}));
		}));
	}
}, Sa = (e, t) => mr(xa, {
	...ba,
	options: {
		...ba.options,
		...e
	}
}, da, t), Ca = ({ children: e, ...t }) => {
	t.resolver !== void 0 && P(typeof t.resolver == "object" && !Array.isArray(t.resolver) && t.resolver !== null, "Resolver in <Editor /> has to be an object. For (de)serialization Craft.js needs a list of all the User Components. \n    \nMore info: https://craft.js.org/r/docs/api/editor#props");
	let n = Sa(_.useRef(t).current, ((e, t, n, r, i) => {
		if (!n) return;
		let { patches: a, ...o } = n;
		for (let n = 0; n < a.length; n++) {
			let { path: s } = a[n], c = s.length > 2 && s[0] === "nodes" && s[2] === "data";
			if ([F.IGNORE, F.THROTTLE].includes(o.type) && o.params && (o.type = o.params[0]), ["setState", "deserialize"].includes(o.type) || c) {
				i(((n) => {
					e.options.normalizeNodes && e.options.normalizeNodes(n, t, o, r);
				}));
				break;
			}
		}
	}));
	return _.useEffect((() => {
		n && t.enabled !== void 0 && n.query.getOptions().enabled !== t.enabled && n.actions.setOptions(((e) => {
			e.enabled = t.enabled;
		}));
	}), [n, t.enabled]), _.useEffect((() => {
		n.subscribe(((e) => ({ json: n.query.serialize() })), (() => {
			n.query.getOptions().onNodesChange(n.query);
		}));
	}), [n]), n ? _.createElement(ji.Provider, { value: n }, _.createElement(ya, null, e)) : null;
}, wa = 1440 * 60 * 1e3;
function Ta(e = Aa(/* @__PURE__ */ new Date(), "Asia/Seoul")) {
	let t = ka(e, -1), n = Da(t), r = Oa(t), i = Ia(t), a = n === t;
	return {
		market: "US",
		seoulDate: e,
		referenceUsDate: t,
		latestTradingDate: n,
		isTradingDay: a,
		isMarketClosed: !a,
		closedReason: a ? "" : r || (i ? "주말" : "휴장일"),
		label: a ? "미국장 마감 기준" : `${r || (i ? "주말" : "휴장일")} · ${n} 종가 기준`
	};
}
function Ea(e) {
	return !Ia(e) && !Oa(e);
}
function Da(e) {
	let t = e;
	for (let e = 0; e < 14; e += 1) {
		if (Ea(t)) return t;
		t = ka(t, -1);
	}
	return e;
}
function Oa(e) {
	return ja(Number(e.slice(0, 4))).get(e) || "";
}
function ka(e, t) {
	let n = /* @__PURE__ */ new Date(`${e}T00:00:00.000Z`);
	return La(new Date(n.getTime() + t * wa));
}
function Aa(e, t) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(e);
}
function ja(e) {
	let t = /* @__PURE__ */ new Map(), n = (e, n) => t.set(e, n);
	return n(Ma(e, 1, 1), "New Year's Day"), n(Na(e, 1, 1, 3), "Martin Luther King Jr. Day"), n(Na(e, 2, 1, 3), "Presidents Day"), n(ka(Fa(e), -2), "Good Friday"), n(Pa(e, 5, 1), "Memorial Day"), n(Ma(e, 6, 19), "Juneteenth"), n(Ma(e, 7, 4), "Independence Day"), n(Na(e, 9, 1, 1), "Labor Day"), n(Na(e, 11, 4, 4), "Thanksgiving Day"), n(Ma(e, 12, 25), "Christmas Day"), t;
}
function Ma(e, t, n) {
	let r = new Date(Date.UTC(e, t - 1, n)), i = r.getUTCDay();
	return La(i === 0 ? new Date(Date.UTC(e, t - 1, n + 1)) : i === 6 ? new Date(Date.UTC(e, t - 1, n - 1)) : r);
}
function Na(e, t, n, r) {
	let i = (n - new Date(Date.UTC(e, t - 1, 1)).getUTCDay() + 7) % 7;
	return La(new Date(Date.UTC(e, t - 1, 1 + i + (r - 1) * 7)));
}
function Pa(e, t, n) {
	let r = new Date(Date.UTC(e, t, 0)), i = (r.getUTCDay() - n + 7) % 7;
	return La(new Date(Date.UTC(e, t - 1, r.getUTCDate() - i)));
}
function Fa(e) {
	let t = e % 19, n = Math.floor(e / 100), r = e % 100, i = Math.floor(n / 4), a = n % 4, o = Math.floor((n + 8) / 25), s = Math.floor((n - o + 1) / 3), c = (19 * t + n - i - s + 15) % 30, l = Math.floor(r / 4), u = r % 4, d = (32 + 2 * a + 2 * l - c - u) % 7, f = Math.floor((t + 11 * c + 22 * d) / 451), p = Math.floor((c + d - 7 * f + 114) / 31), m = (c + d - 7 * f + 114) % 31 + 1;
	return La(new Date(Date.UTC(e, p - 1, m)));
}
function Ia(e) {
	let t = (/* @__PURE__ */ new Date(`${e}T00:00:00.000Z`)).getUTCDay();
	return t === 0 || t === 6;
}
function La(e) {
	return e.toISOString().slice(0, 10);
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var Ra = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), B = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Ra();
})))(), za = [
	{
		id: "total-value",
		widthPct: 25,
		span: 3,
		minHeight: 128,
		visible: !0
	},
	{
		id: "total-cost",
		widthPct: 25,
		span: 3,
		minHeight: 128,
		visible: !0
	},
	{
		id: "total-gain",
		widthPct: 25,
		span: 3,
		minHeight: 128,
		visible: !0
	},
	{
		id: "cash-total",
		widthPct: 25,
		span: 3,
		minHeight: 128,
		visible: !0
	},
	{
		id: "fx-rate",
		widthPct: 25,
		span: 3,
		minHeight: 128,
		visible: !0
	},
	{
		id: "allocation",
		widthPct: 50,
		span: 6,
		minHeight: 320,
		visible: !0
	},
	{
		id: "performance-flow",
		widthPct: 100,
		span: 12,
		minHeight: 360,
		visible: !0
	},
	{
		id: "breakdown",
		widthPct: 50,
		span: 6,
		minHeight: 320,
		visible: !0
	}
], Ba = {
	"total-value": "총자산",
	"total-cost": "주식 매입금액",
	"total-gain": "주식 평가손익",
	"cash-total": "예수금",
	"fx-rate": "USD/KRW",
	allocation: "자산 비중",
	"performance-flow": "성과 흐름",
	breakdown: "오늘 변동 원인"
}, Va = [
	"#1F4431",
	"#3366a8",
	"#a97819",
	"#7b5aa6",
	"#b94343"
], Ha = {
	direct_investment: "직접투자 계좌",
	pension: "연금 계좌"
}, Ua = {
	strategy: "전략",
	holding: "종목",
	account: "계좌",
	investor: "투자자",
	accountType: "계좌 유형"
};
function Wa() {
	let [e, t] = (0, _.useState)(null), [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)(0);
	(0, _.useEffect)(() => {
		t(window.StocklioApp?.getState?.() || null);
		let e = (e) => {
			t(e.detail), a((e) => e + 1);
		};
		return window.addEventListener("stocklio:state", e), () => window.removeEventListener("stocklio:state", e);
	}, []);
	let o = (0, _.useMemo)(() => lo(e?.dashboardLayout), [e?.dashboardLayout]), s = o.filter((e) => e.visible !== !1).length, c = (0, _.useCallback)((e) => {
		let n = lo(e);
		t((e) => e && {
			...e,
			dashboardLayout: n
		}), a((e) => e + 1), window.StocklioApp?.setDashboardLayout?.(n);
	}, [t]);
	return (0, _.useEffect)(() => {
		let e = document.querySelector("#layoutEditButton"), t = document.querySelector("#layoutResetButton"), i = document.querySelector("#layoutStatus");
		if (!e || !t || !i) return;
		let a = () => r((e) => !e), l = () => {
			r(!1), c(za);
		};
		return e.textContent = n ? "완료" : "편집", t.hidden = !n, i.textContent = n ? `${s}/${o.length} 카드` : "", e.addEventListener("click", a), t.addEventListener("click", l), () => {
			e.removeEventListener("click", a), t.removeEventListener("click", l);
		};
	}, [
		n,
		o.length,
		c,
		s
	]), e ? /* @__PURE__ */ (0, B.jsx)(Ca, {
		enabled: n,
		resolver: {
			CraftCard: Ka,
			CraftCanvas: Ga
		},
		children: /* @__PURE__ */ (0, B.jsx)(qi, { children: /* @__PURE__ */ (0, B.jsx)(Ui, {
			is: Ga,
			canvas: !0,
			children: o.map((t) => t.visible === !1 && !n ? null : /* @__PURE__ */ (0, B.jsx)(Ui, {
				is: Ka,
				canvas: !1,
				item: t,
				appState: e,
				editing: n,
				layout: o,
				saveLayout: c
			}, t.id))
		}) }, `${H(o)}:${n}:${i}`)
	}) : /* @__PURE__ */ (0, B.jsx)("div", {
		className: "empty-state",
		children: "대시보드를 불러오는 중입니다"
	});
}
function Ga({ children: e }) {
	return /* @__PURE__ */ (0, B.jsx)(B.Fragment, { children: e });
}
function Ka({ item: e, appState: t, editing: n, layout: r, saveLayout: i }) {
	let { connectors: { connect: a, drag: o } } = Ii(), [s, c] = (0, _.useState)(null), l = (0, _.useRef)(!1), u = s || e, d = {
		"--card-span": u.span,
		"--card-width-pct": `${u.widthPct}%`,
		"--card-min-height": `${u.minHeight}px`
	}, f = (t) => {
		if (l.current) return;
		l.current = !0, t.preventDefault(), t.stopPropagation();
		let n = t.target.closest("[data-dashboard-card]"), a = {
			x: t.clientX,
			y: t.clientY,
			span: e.span,
			widthPct: e.widthPct,
			height: n.getBoundingClientRect().height
		}, o = document.querySelector("#dashboardBoard"), s = Math.max(1, o?.clientWidth || n.parentElement?.clientWidth || 1), u = t.type === "mousedown" ? "mousemove" : "pointermove", d = t.type === "mousedown" ? "mouseup" : "pointerup", f = (t) => {
			let n = Oo(a.widthPct + (t.clientX - a.x) / s * 100, 18, 100);
			c({
				...e,
				widthPct: n,
				span: Oo(Math.round(n / 100 * 12), 2, 12),
				minHeight: Oo(Math.round(a.height + t.clientY - a.y), 112, 720)
			});
		};
		window.addEventListener(u, f), window.addEventListener(d, (t) => {
			window.removeEventListener(u, f);
			let n = Oo(a.widthPct + (t.clientX - a.x) / s * 100, 18, 100), o = {
				...e,
				widthPct: ko(n, .1),
				span: Oo(Math.round(n / 100 * 12), 2, 12),
				minHeight: Oo(Math.round(a.height + t.clientY - a.y), 112, 720)
			};
			c(null), l.current = !1, i(r.map((t) => t.id === e.id ? o : t));
		}, { once: !0 });
	};
	return /* @__PURE__ */ (0, B.jsxs)("article", {
		ref: (e) => e && a(o(e)),
		className: [
			V(e.id),
			"dashboard-card",
			n ? "is-layout-editing" : "",
			e.visible === !1 && n ? "is-hidden-card" : ""
		].filter(Boolean).join(" "),
		"data-dashboard-card": e.id,
		draggable: n,
		onDragStart: (t) => {
			if (!n || t.target.closest(".layout-resize-handle, button")) {
				t.preventDefault();
				return;
			}
			t.dataTransfer.effectAllowed = "move", t.dataTransfer.setData("text/plain", e.id);
		},
		onMouseDownCapture: (e) => {
			e.target.closest(".layout-resize-handle") && f(e);
		},
		onPointerDownCapture: (e) => {
			e.target.closest(".layout-resize-handle") && f(e);
		},
		onDragOver: (e) => n && e.preventDefault(),
		onDrop: (t) => {
			if (!n) return;
			t.preventDefault();
			let a = t.dataTransfer.getData("text/plain");
			!a || a === e.id || i(uo(r, a, e.id, fo(t, t.currentTarget)));
		},
		style: d,
		children: [
			n ? /* @__PURE__ */ (0, B.jsxs)("div", {
				className: "layout-controls",
				children: [
					/* @__PURE__ */ (0, B.jsx)("span", {
						className: "layout-drag-handle",
						children: "이동"
					}),
					/* @__PURE__ */ (0, B.jsx)("span", {
						className: "layout-card-label",
						children: Ba[e.id] || e.id
					}),
					/* @__PURE__ */ (0, B.jsxs)("span", {
						className: "layout-size-readout",
						children: [
							Math.round(u.widthPct),
							"% · ",
							Math.round(u.minHeight),
							"px"
						]
					}),
					/* @__PURE__ */ (0, B.jsx)("button", {
						className: "ghost layout-visibility-button",
						type: "button",
						onClick: (t) => {
							t.stopPropagation(), i(r.map((t) => t.id === e.id ? {
								...t,
								visible: t.visible === !1
							} : t));
						},
						children: e.visible === !1 ? "표시" : "숨김"
					})
				]
			}) : null,
			n ? /* @__PURE__ */ (0, B.jsx)("span", {
				className: "layout-resize-handle",
				"aria-label": "카드 크기 조절"
			}) : null,
			/* @__PURE__ */ (0, B.jsx)(qa, {
				id: e.id,
				state: t
			})
		]
	});
}
function qa({ id: e, state: t }) {
	let n = po(t);
	if (e === "total-value") {
		let e = to(), r = [...t.holdings].filter((e) => e.priceAsOf).sort((e, t) => String(t.priceAsOf).localeCompare(String(e.priceAsOf)))[0]?.priceAsOf || t.fxRate?.asOf, i = [
			r ? `${To(r.slice(0, 10))} 종가` : e.isMarketClosed ? e.label : "",
			t.fxRate?.rate ? `USD/KRW ${So(t.fxRate.rate, 2)}` : "",
			e.isMarketClosed ? e.closedReason || "미국장 휴장" : ""
		].filter(Boolean);
		return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
			/* @__PURE__ */ (0, B.jsx)("span", { children: "총자산" }),
			/* @__PURE__ */ (0, B.jsx)("strong", { children: U(n.valueKrw) }),
			/* @__PURE__ */ (0, B.jsx)("small", { children: `주식 ${U(n.stockValueKrw)} · 예수금 ${U(n.cashKrw)}` }),
			i.length > 0 && /* @__PURE__ */ (0, B.jsx)("div", {
				className: "metric-badges",
				children: i.map((e) => /* @__PURE__ */ (0, B.jsx)("span", {
					className: "metric-badge",
					children: e
				}, e))
			})
		] });
	}
	if (e === "total-cost") {
		let e = t.holdings.filter((e) => e.type !== "cash").length;
		return /* @__PURE__ */ (0, B.jsx)(Ja, {
			label: "주식 매입금액",
			value: U(n.costKrw),
			hint: `${e}개 종목 · 평단 기준`
		});
	}
	return e === "total-gain" ? /* @__PURE__ */ (0, B.jsx)(Ja, {
		label: "주식 평가순익",
		value: U(n.gainKrw),
		hint: wo(n.returnRate),
		tone: n.gainKrw >= 0 ? "positive" : "negative"
	}) : e === "cash-total" ? /* @__PURE__ */ (0, B.jsx)(Ja, {
		label: "예수금",
		value: U(n.cashKrw),
		hint: "총자산에 포함"
	}) : e === "fx-rate" ? /* @__PURE__ */ (0, B.jsx)(Ja, {
		label: "USD/KRW",
		value: So(t.fxRate?.rate || 0, 2),
		hint: `${t.fxRate?.source || "환율 기준"} · ${Do(t.fxRate?.asOf)}`
	}) : e === "allocation" ? /* @__PURE__ */ (0, B.jsx)(Ya, { state: t }) : e === "performance-flow" ? /* @__PURE__ */ (0, B.jsx)(Xa, { state: t }) : /* @__PURE__ */ (0, B.jsx)(Qa, { state: t });
}
function Ja({ label: e, value: t, hint: n, tone: r }) {
	return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
		/* @__PURE__ */ (0, B.jsx)("span", { children: e }),
		/* @__PURE__ */ (0, B.jsx)("strong", {
			className: r || "",
			children: t
		}),
		/* @__PURE__ */ (0, B.jsx)("small", {
			className: r || "",
			children: n
		})
	] });
}
function Ya({ state: e }) {
	let [t, n] = (0, _.useState)("strategy"), r = go(e, t), i = r.reduce((e, t) => e + t.value, 0);
	return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [/* @__PURE__ */ (0, B.jsxs)("div", {
		className: "section-heading",
		children: [
			/* @__PURE__ */ (0, B.jsxs)("div", {
				className: "section-heading-title",
				children: [/* @__PURE__ */ (0, B.jsx)("h2", { children: "자산 비중" }), /* @__PURE__ */ (0, B.jsxs)("span", {
					className: "section-badge",
					children: [
						r.length,
						"개 ",
						Ua[t] || "항목"
					]
				})]
			}),
			/* @__PURE__ */ (0, B.jsx)("span", { children: "현재 평가가격 기준" }),
			/* @__PURE__ */ (0, B.jsx)("div", {
				className: "segmented-control compact-segmented",
				role: "group",
				"aria-label": "자산 비중 기준",
				children: Object.entries(Ua).map(([e, r]) => /* @__PURE__ */ (0, B.jsx)("button", {
					className: t === e ? "is-active" : "",
					type: "button",
					onClick: () => n(e),
					children: r
				}, e))
			})
		]
	}), /* @__PURE__ */ (0, B.jsxs)("div", {
		className: "donut-wrap",
		children: [/* @__PURE__ */ (0, B.jsxs)("svg", {
			viewBox: "0 0 220 220",
			role: "img",
			"aria-label": "자산 비중 차트",
			children: [
				/* @__PURE__ */ (0, B.jsx)("circle", {
					cx: "110",
					cy: "110",
					r: "78",
					fill: "none",
					stroke: "#e6ebe5",
					strokeWidth: "28"
				}),
				xo(r),
				/* @__PURE__ */ (0, B.jsx)("text", {
					x: "110",
					y: "106",
					textAnchor: "middle",
					fontSize: "19",
					fontWeight: "800",
					fill: "#17211b",
					children: r.length
				}),
				/* @__PURE__ */ (0, B.jsx)("text", {
					x: "110",
					y: "130",
					textAnchor: "middle",
					fontSize: "12",
					fill: "#66736b",
					children: Ua[t]
				})
			]
		}), /* @__PURE__ */ (0, B.jsx)("div", {
			className: "legend",
			children: r.map((e, t) => /* @__PURE__ */ (0, B.jsxs)("div", {
				className: "legend-row",
				children: [
					/* @__PURE__ */ (0, B.jsx)("span", {
						className: "swatch",
						style: { background: Va[t % Va.length] }
					}),
					/* @__PURE__ */ (0, B.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, B.jsxs)("strong", { children: [wo(i ? e.value / i : 0), /* @__PURE__ */ (0, B.jsx)("small", { children: U(e.value) })] })
				]
			}, e.label))
		})]
	})] });
}
function Xa({ state: e }) {
	let t = [...e.portfolioSnapshots || []].slice(-20);
	if (!t.length) return /* @__PURE__ */ (0, B.jsx)("div", {
		className: "empty-state",
		children: "저장된 성과 스냅샷이 없습니다"
	});
	let n = t[t.length - 1], r = t[0], i = t[t.length - 2], a = i ? n.totalValueKrw - i.totalValueKrw : 0, o = n.totalValueKrw - r.totalValueKrw, s = Za(t), c = Math.max(...t.map((e) => e.totalValueKrw)), l = Math.min(...t.map((e) => e.totalValueKrw)), u = Math.max(1, c - l), d = 1e3, f = {
		left: 72,
		right: 28,
		top: 28,
		bottom: 48
	}, p = d - f.left - f.right, m = 280 - f.top - f.bottom, h = t.map((e, n) => ({
		x: f.left + (t.length === 1 ? p : p * n / (t.length - 1)),
		y: f.top + m - (Number(e.totalValueKrw || 0) - l) / u * m,
		point: e
	})), g = h.map((e, t) => `${t === 0 ? "M" : "L"}${e.x.toFixed(1)} ${e.y.toFixed(1)}`).join(" "), _ = `${g} L${h[h.length - 1].x.toFixed(1)} ${280 - f.bottom} L${h[0].x.toFixed(1)} ${280 - f.bottom} Z`, v = [
		0,
		.33,
		.66,
		1
	].map((e) => ({
		y: f.top + m * e,
		value: c - u * e
	}));
	return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
		/* @__PURE__ */ (0, B.jsxs)("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ (0, B.jsx)("h2", { children: "성과 흐름" }), /* @__PURE__ */ (0, B.jsx)("span", { children: "금액과 증감" })]
		}),
		/* @__PURE__ */ (0, B.jsxs)("div", {
			className: "performance-stats",
			children: [
				/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("span", { children: "최근 총자산" }), /* @__PURE__ */ (0, B.jsx)("strong", { children: U(n.totalValueKrw) })] }),
				/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("span", { children: "최근 일 증감" }), /* @__PURE__ */ (0, B.jsx)("strong", {
					className: a >= 0 ? "positive" : "negative",
					children: U(a)
				})] }),
				/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("span", { children: "표시기간 증감" }), /* @__PURE__ */ (0, B.jsx)("strong", {
					className: o >= 0 ? "positive" : "negative",
					children: U(o)
				})] }),
				/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("span", { children: "최대 낙폭" }), /* @__PURE__ */ (0, B.jsx)("strong", {
					className: "negative",
					children: U(s)
				})] })
			]
		}),
		/* @__PURE__ */ (0, B.jsx)("div", {
			className: "dashboard-line-chart",
			"aria-label": "성과 차트",
			children: /* @__PURE__ */ (0, B.jsxs)("svg", {
				viewBox: `0 0 ${d} 280`,
				role: "img",
				"aria-label": "총자산 추이 차트",
				children: [
					/* @__PURE__ */ (0, B.jsx)("defs", { children: /* @__PURE__ */ (0, B.jsxs)("linearGradient", {
						id: "dashboardAreaGradient",
						x1: "0",
						x2: "0",
						y1: "0",
						y2: "1",
						children: [/* @__PURE__ */ (0, B.jsx)("stop", {
							offset: "0%",
							stopColor: "rgba(31, 68, 49, 0.24)"
						}), /* @__PURE__ */ (0, B.jsx)("stop", {
							offset: "100%",
							stopColor: "rgba(31, 68, 49, 0.05)"
						})]
					}) }),
					v.map((e) => /* @__PURE__ */ (0, B.jsxs)("g", { children: [/* @__PURE__ */ (0, B.jsx)("line", {
						className: "trend-grid",
						x1: f.left,
						x2: d - f.right,
						y1: e.y,
						y2: e.y
					}), /* @__PURE__ */ (0, B.jsx)("text", {
						className: "dashboard-chart-axis",
						x: f.left - 14,
						y: e.y + 5,
						textAnchor: "end",
						children: Co(e.value)
					})] }, e.y)),
					/* @__PURE__ */ (0, B.jsx)("path", {
						className: "trend-area",
						d: _
					}),
					/* @__PURE__ */ (0, B.jsx)("path", {
						className: "trend-line",
						d: g
					}),
					h.map(({ x: e, y: t, point: n }, r) => {
						let i = h[r - 1], a = i ? n.totalValueKrw - i.point.totalValueKrw : 0, o = a >= 0, s = o ? "▲" : "▼", c = o ? "tooltip-positive" : "tooltip-negative", l = Math.max(f.left, Math.min(d - f.right - 160, e - 160 / 2)), u = Math.max(6, t - 64 - 12);
						return /* @__PURE__ */ (0, B.jsxs)("g", {
							className: "trend-point-group",
							tabIndex: 0,
							"aria-label": `${n.date} 총자산 ${U(n.totalValueKrw)}, 일 증감 ${o ? "+" : ""}${U(a)}`,
							children: [
								/* @__PURE__ */ (0, B.jsx)("circle", {
									className: "trend-hit",
									cx: e,
									cy: t,
									r: "13"
								}),
								/* @__PURE__ */ (0, B.jsx)("circle", {
									className: "trend-point",
									cx: e,
									cy: t,
									r: "2.5"
								}),
								/* @__PURE__ */ (0, B.jsxs)("g", {
									className: "trend-tooltip",
									transform: `translate(${l} ${u})`,
									children: [
										/* @__PURE__ */ (0, B.jsx)("rect", {
											width: 160,
											height: 64,
											rx: "8"
										}),
										/* @__PURE__ */ (0, B.jsx)("text", {
											className: "tooltip-date",
											x: "12",
											y: "19",
											children: Eo(n.date)
										}),
										/* @__PURE__ */ (0, B.jsx)("text", {
											className: "tooltip-value",
											x: "12",
											y: "38",
											children: U(n.totalValueKrw)
										}),
										/* @__PURE__ */ (0, B.jsxs)("text", {
											className: c,
											x: "12",
											y: "56",
											children: [
												s,
												" ",
												U(Math.abs(a))
											]
										})
									]
								})
							]
						}, n.id || n.date);
					}),
					[
						h[0],
						h[Math.floor(h.length / 2)],
						h[h.length - 1]
					].filter(Boolean).map(({ x: e, point: t }, n) => /* @__PURE__ */ (0, B.jsx)("text", {
						className: "trend-label",
						x: e,
						y: 266,
						textAnchor: n === 0 ? "start" : n === 2 ? "end" : "middle",
						children: To(t.date)
					}, `${t.date}-${n}`)),
					/* @__PURE__ */ (0, B.jsx)("text", {
						className: "trend-last-label",
						x: h[h.length - 1].x - 6,
						y: Math.max(16, h[h.length - 1].y - 10),
						textAnchor: "end",
						children: Co(n.totalValueKrw)
					})
				]
			})
		})
	] });
}
function Za(e) {
	let t = Number(e[0]?.totalValueKrw || 0), n = 0;
	for (let r of e) {
		let e = Number(r.totalValueKrw || 0);
		t = Math.max(t, e), n = Math.min(n, e - t);
	}
	return n;
}
function Qa({ state: e }) {
	let t = to(), n = $a(e, t).slice(0, 5), r = ro(e), i = (e.holdings || []).map((e) => ({
		...e,
		accountType: co(e.accountType)
	})), a = [...bo(e.holdings || [], e, "investor"), ...bo(i, e, "accountType")], o = n.reduce((e, t) => e + t.value, 0), s = n.reduce((e, t) => e + t.priceEffectKrw, 0), c = n.reduce((e, t) => e + t.fxEffectKrw, 0), l = oo(n, o, s, c);
	return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [/* @__PURE__ */ (0, B.jsxs)("div", {
		className: "section-heading",
		children: [/* @__PURE__ */ (0, B.jsx)("h2", { children: "오늘 변동 원인" }), /* @__PURE__ */ (0, B.jsx)("span", { children: "종목 기여도" })]
	}), /* @__PURE__ */ (0, B.jsx)("div", {
		className: "breakdown-list",
		children: n.length ? /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
			/* @__PURE__ */ (0, B.jsxs)("div", {
				className: "daily-move-summary",
				children: [
					/* @__PURE__ */ (0, B.jsx)("span", { children: "오늘 추정 변동" }),
					/* @__PURE__ */ (0, B.jsx)("strong", {
						className: o >= 0 ? "positive" : "negative",
						children: U(o)
					}),
					/* @__PURE__ */ (0, B.jsxs)("small", { children: [
						"가격 ",
						s >= 0 ? "+" : "",
						Co(s),
						" · 환율 ",
						c >= 0 ? "+" : "",
						Co(c)
					] })
				]
			}),
			/* @__PURE__ */ (0, B.jsx)("div", {
				className: "daily-move-insight",
				children: l
			}),
			n.map((e) => /* @__PURE__ */ (0, B.jsxs)("div", {
				className: "daily-move-row",
				children: [/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, B.jsxs)("small", { children: [
					e.ticker,
					" · ",
					ao(e),
					" · 영향 ",
					wo(Math.abs(e.contributionShare || 0))
				] })] }), /* @__PURE__ */ (0, B.jsxs)("span", {
					className: e.value >= 0 ? "positive" : "negative",
					children: [e.value >= 0 ? "+" : "", U(e.value)]
				})]
			}, e.id || e.ticker)),
			r && Math.abs(r.totalDeltaKrw) > Math.max(1e5, Math.abs(o) * 3) ? /* @__PURE__ */ (0, B.jsx)(no, {
				impact: r,
				compact: !0
			}) : null
		] }) : /* @__PURE__ */ (0, B.jsx)(B.Fragment, { children: t.isMarketClosed ? /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
			/* @__PURE__ */ (0, B.jsxs)("div", {
				className: "daily-move-empty",
				children: [/* @__PURE__ */ (0, B.jsxs)("strong", { children: [
					"미국장 ",
					t.closedReason || "휴장",
					"에는 새 종목별 변동을 표시하지 않습니다"
				] }), /* @__PURE__ */ (0, B.jsxs)("span", { children: [t.label, "입니다. 총자산 변화가 있다면 입출금 또는 환율/현금 변화일 수 있습니다."] })]
			}),
			/* @__PURE__ */ (0, B.jsx)("div", {
				className: "breakdown-subtitle",
				children: "구성 참고"
			}),
			a.map((e, t) => /* @__PURE__ */ (0, B.jsxs)("div", {
				className: "breakdown-row",
				children: [
					/* @__PURE__ */ (0, B.jsx)("span", {
						className: "swatch",
						style: { background: Va[t % Va.length] }
					}),
					/* @__PURE__ */ (0, B.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, B.jsx)("strong", { children: U(e.value) })
				]
			}, `${e.label}-${t}`))
		] }) : r?.rows?.length ? /* @__PURE__ */ (0, B.jsx)(no, { impact: r }) : /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
			/* @__PURE__ */ (0, B.jsxs)("div", {
				className: "daily-move-empty",
				children: [/* @__PURE__ */ (0, B.jsx)("strong", { children: "가격 갱신 후 원인을 분석할 수 있습니다" }), /* @__PURE__ */ (0, B.jsx)("span", { children: "전일 대비 가격 데이터가 없는 캐시나 일부 종목 실패가 있으면 원인 분석이 제한됩니다. 가격을 다시 가져오면 새 데이터로 분석합니다." })]
			}),
			/* @__PURE__ */ (0, B.jsx)("div", {
				className: "breakdown-subtitle",
				children: "구성 참고"
			}),
			a.map((e, t) => /* @__PURE__ */ (0, B.jsxs)("div", {
				className: "breakdown-row",
				children: [
					/* @__PURE__ */ (0, B.jsx)("span", {
						className: "swatch",
						style: { background: Va[t % Va.length] }
					}),
					/* @__PURE__ */ (0, B.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, B.jsx)("strong", { children: U(e.value) })
				]
			}, `${e.label}-${t}`))
		] }) })
	})] });
}
function $a(e, t = null) {
	if (t?.isMarketClosed) return [];
	let n = /* @__PURE__ */ new Map();
	for (let t of e.holdings || []) {
		let r = eo(e, t);
		if (!r.hasData) continue;
		let i = t.ticker;
		if (n.has(i)) {
			let e = n.get(i);
			e.quantity += Number(t.quantity || 0), e.value += r.valueKrw, e.priceEffectKrw += r.priceEffectKrw, e.fxEffectKrw += r.fxEffectKrw;
		} else n.set(i, {
			id: t.id,
			name: t.name || t.ticker,
			ticker: t.ticker,
			quantity: Number(t.quantity || 0),
			value: r.valueKrw,
			priceEffectKrw: r.priceEffectKrw,
			fxEffectKrw: r.fxEffectKrw,
			changePercent: r.changePercent,
			hasData: !0
		});
	}
	let r = [...n.values()].filter((e) => e.value !== 0).sort((e, t) => Math.abs(t.value) - Math.abs(e.value)), i = r.reduce((e, t) => e + Math.abs(t.value), 0);
	return r.map((e) => ({
		...e,
		contributionShare: i ? Math.abs(e.value) / i : 0
	}));
}
function eo(e, t) {
	let n = Number(t.priceChange), r = Number(t.priceChangePercent || 0);
	if (!Number.isFinite(n)) return {
		hasData: !1,
		valueKrw: 0,
		priceEffectKrw: 0,
		fxEffectKrw: 0,
		changePercent: 0
	};
	let i = Number(e.fxRate?.rate || 1), a = Number(e.fxRate?.previousClose || e.fxRate?.rate || 1), o = Number(t.quantity || 0), s = t.currency === "USD", c = Number(t.price), l = o * n * (s ? a : 1), u = s && Number.isFinite(c) ? o * c * (i - a) : 0;
	return {
		hasData: !0,
		valueKrw: l + u,
		priceEffectKrw: l,
		fxEffectKrw: u,
		changePercent: r
	};
}
function to() {
	return Ta(Aa(/* @__PURE__ */ new Date(), "Asia/Seoul"));
}
function no({ impact: e, compact: t = !1 }) {
	let n = (e.rows || []).slice(0, t ? 3 : 5);
	return /* @__PURE__ */ (0, B.jsxs)(B.Fragment, { children: [
		/* @__PURE__ */ (0, B.jsxs)("div", {
			className: "daily-move-summary price-refresh-impact",
			children: [
				/* @__PURE__ */ (0, B.jsx)("span", { children: t ? "이번 가격 갱신 전후" : "최근 가격 갱신 영향" }),
				/* @__PURE__ */ (0, B.jsxs)("strong", {
					className: e.totalDeltaKrw >= 0 ? "positive" : "negative",
					children: [e.totalDeltaKrw >= 0 ? "+" : "", U(e.totalDeltaKrw)]
				}),
				/* @__PURE__ */ (0, B.jsxs)("small", { children: [
					Do(e.at),
					" · 갱신 전 ",
					Co(e.previousTotalKrw),
					" → 갱신 후 ",
					Co(e.nextTotalKrw)
				] })
			]
		}),
		/* @__PURE__ */ (0, B.jsx)("div", {
			className: "daily-move-insight",
			children: io(e)
		}),
		n.map((e) => /* @__PURE__ */ (0, B.jsxs)("div", {
			className: "daily-move-row",
			children: [/* @__PURE__ */ (0, B.jsxs)("div", { children: [/* @__PURE__ */ (0, B.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, B.jsxs)("small", { children: [
				e.ticker,
				" · ",
				Co(e.beforeValueKrw),
				" → ",
				Co(e.afterValueKrw)
			] })] }), /* @__PURE__ */ (0, B.jsxs)("span", {
				className: e.deltaKrw >= 0 ? "positive" : "negative",
				children: [e.deltaKrw >= 0 ? "+" : "", U(e.deltaKrw)]
			})]
		}, `${e.id || e.ticker}-refresh-impact`))
	] });
}
function ro(e) {
	let t = e.lastPriceRefreshImpact;
	if (!t?.at || !Array.isArray(t.rows)) return null;
	let n = Date.now() - new Date(t.at).getTime();
	return !Number.isFinite(n) || n > 1440 * 60 * 1e3 ? null : t;
}
function io(e) {
	let t = e.rows?.[0];
	return !t || Math.abs(e.totalDeltaKrw) < 1e3 ? "이번 가격 갱신으로 평가금액 변화가 거의 없었습니다." : `이번 ${e.totalDeltaKrw >= 0 ? "증가" : "감소"}는 ${t.name} 등 Yahoo 가격으로 바뀐 종목 영향이 큽니다.`;
}
function ao(e) {
	return Math.abs(e.fxEffectKrw) >= 1e3 ? `가격 ${e.priceEffectKrw >= 0 ? "+" : ""}${Co(e.priceEffectKrw)} · 환율 ${e.fxEffectKrw >= 0 ? "+" : ""}${Co(e.fxEffectKrw)}` : `${So(e.quantity, 4)}주 · ${wo(e.changePercent)}`;
}
function oo(e, t, n, r) {
	let i = e.slice(0, 2).map((e) => e.name).filter(Boolean);
	if (!i.length || Math.abs(t) < 1e3) return "오늘은 뚜렷하게 총자산을 움직인 종목이 없습니다.";
	let a = t >= 0 ? "증가" : "하락", o = i.join(", ");
	return Math.abs(r) > Math.abs(n) * .35 ? `오늘 ${a}는 ${o}와 ${r >= 0 ? "환율 상승" : "환율 하락"} 영향이 큽니다.` : `오늘 ${a}는 ${o}의 가격 변동이 대부분 설명합니다.`;
}
function so(e) {
	return [
		"pension",
		"irp",
		"retirement_pension"
	].includes(String(e || "")) ? "pension" : "direct_investment";
}
function co(e) {
	return Ha[so(e)] || "직접투자 계좌";
}
function lo(e) {
	let t = new Map(za.map((e) => [e.id, e])), n = {
		small: 3,
		medium: 4,
		wide: 6,
		full: 12
	}, r = /* @__PURE__ */ new Set(), i = [];
	for (let a of Array.isArray(e) ? e : []) {
		if (!t.has(a.id) || r.has(a.id)) continue;
		let e = t.get(a.id), o = Oo(Math.round(Number(a.span ?? n[a.size] ?? e.span)), 2, 12), s = Number(a.widthPct ?? o / 12 * 100);
		i.push({
			id: a.id,
			widthPct: Oo(ko(s, .1), 18, 100),
			span: o,
			minHeight: Oo(Math.round(Number(a.minHeight ?? e.minHeight)), 112, 720),
			visible: a.visible !== !1
		}), r.add(a.id);
	}
	for (let e of za) r.has(e.id) || i.push({ ...e });
	return i;
}
function uo(e, t, n, r) {
	let i = [...e], a = i.findIndex((e) => e.id === t);
	if (a < 0) return i;
	let [o] = i.splice(a, 1), s = i.findIndex((e) => e.id === n);
	return i.splice(s + +!!r, 0, o), i;
}
function fo(e, t) {
	let n = t.getBoundingClientRect();
	return e.clientY > n.top + n.height / 2 || e.clientX > n.left + n.width / 2;
}
function V(e) {
	return [
		"allocation",
		"performance-flow",
		"breakdown"
	].includes(e) ? "panel" : "metric";
}
function H(e) {
	return e.map((e) => `${e.id}:${e.span}:${e.minHeight}:${e.visible}`).join("|");
}
function po(e) {
	let t = Number(e.fxRate?.rate || 1), n = e.holdings || [], r = ho(e), i = n.reduce((e, n) => e + mo(n, t).valueKrw, 0), a = n.reduce((e, n) => e + mo(n, t).costKrw, 0), o = i - a;
	return {
		valueKrw: i + r,
		stockValueKrw: i,
		cashKrw: r,
		costKrw: a,
		gainKrw: o,
		returnRate: a ? o / a : 0
	};
}
function mo(e, t) {
	let n = e.currency === "USD" ? t : 1, r = Number(e.quantity || 0) * Number(e.price || 0), i = Number(e.quantity || 0) * Number(e.averageCost || 0);
	return {
		valueKrw: r * n,
		costKrw: i * n
	};
}
function ho(e) {
	let t = Number(e.fxRate?.rate || 1);
	return (e.cashBalances || []).reduce((e, n) => e + Number(n.amount || 0) * (n.currency === "USD" ? t : 1), 0);
}
function go(e, t = "strategy") {
	return yo(t === "holding" ? vo(_o(e, (e) => e.name || e.ticker), e, () => "예수금") : t === "account" ? vo(_o(e, (e) => `${e.investor} · ${e.account}`), e, (e) => `${e.investor} · ${e.account}`) : t === "investor" ? vo(_o(e, (e) => e.investor), e, (e) => e.investor) : t === "accountType" ? vo(_o(e, (e) => co(e.accountType)), e, () => "직접투자 계좌") : vo(_o(e, (e) => e.strategy || "기타"), e, () => "예수금"));
}
function _o(e, t) {
	let n = Number(e.fxRate?.rate || 1), r = /* @__PURE__ */ new Map();
	for (let i of e.holdings || []) {
		let e = t(i) || "미분류";
		r.set(e, (r.get(e) || 0) + mo(i, n).valueKrw);
	}
	return [...r.entries()].map(([e, t]) => ({
		label: e,
		value: t
	})).sort((e, t) => t.value - e.value);
}
function vo(e, t, n) {
	let r = Number(t.fxRate?.rate || 1), i = new Map(e.map((e) => [e.label, e.value]));
	for (let e of t.cashBalances || []) {
		let t = n(e) || "예수금", a = Number(e.amount || 0) * (e.currency === "USD" ? r : 1);
		i.set(t, (i.get(t) || 0) + a);
	}
	return [...i.entries()].map(([e, t]) => ({
		label: e,
		value: t
	})).sort((e, t) => t.value - e.value);
}
function yo(e, t = 5) {
	let n = [...e].filter((e) => e.value > 0).sort((e, t) => t.value - e.value);
	if (n.length <= t) return n;
	let r = n.slice(0, t), i = n.slice(t).reduce((e, t) => e + t.value, 0);
	return i > 0 ? [...r, {
		label: "기타",
		value: i
	}] : r;
}
function bo(e, t, n) {
	let r = Number(t.fxRate?.rate || 1), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t[n] || "미분류";
		i.set(e, (i.get(e) || 0) + mo(t, r).valueKrw);
	}
	return [...i.entries()].map(([e, t]) => ({
		label: e,
		value: t
	})).sort((e, t) => t.value - e.value);
}
function xo(e) {
	let t = e.reduce((e, t) => e + t.value, 0), n = 2 * Math.PI * 78, r = 0;
	return e.map((e, i) => {
		let a = (t ? e.value / t : 0) * n, o = /* @__PURE__ */ (0, B.jsx)("circle", {
			cx: "110",
			cy: "110",
			r: 78,
			fill: "none",
			stroke: Va[i % Va.length],
			strokeWidth: "28",
			strokeDasharray: `${a} ${n - a}`,
			strokeDashoffset: -r,
			transform: "rotate(-90 110 110)"
		}, e.label);
		return r += a, o;
	});
}
function U(e) {
	return new Intl.NumberFormat("ko-KR", {
		style: "currency",
		currency: "KRW",
		maximumFractionDigits: 0
	}).format(e || 0);
}
function So(e, t = 2) {
	return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: t }).format(e || 0);
}
function Co(e) {
	return new Intl.NumberFormat("ko-KR", {
		notation: "compact",
		maximumFractionDigits: 1
	}).format(e || 0);
}
function wo(e) {
	return new Intl.NumberFormat("en-US", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(e || 0);
}
function To(e) {
	let t = /* @__PURE__ */ new Date(`${e}T00:00:00`);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleDateString("ko-KR", {
		month: "numeric",
		day: "numeric"
	});
}
function Eo(e) {
	let t = /* @__PURE__ */ new Date(`${e}T00:00:00`);
	return Number.isNaN(t.getTime()) ? e : `${t.getMonth() + 1}/${t.getDate()}`;
}
function Do(e) {
	if (!e || e === "샘플" || e === "Sample") return "샘플";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString("ko-KR", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function Oo(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function ko(e, t) {
	return Math.round(e / t) * t;
}
var Ao = document.querySelector("#dashboardBoard");
Ao && (Ao.classList.add("craft-dashboard-board"), (0, v.createRoot)(Ao).render(/* @__PURE__ */ (0, B.jsx)(Wa, {})));
//#endregion
