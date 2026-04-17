const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const scenarios = [
	{
		title: "Form Lab",
		description: "Mandatory fields, server validation, and success/error states.",
		path: "/forms",
		tags: ["required", "validation", "submit"]
	},
	{
		title: "Journey Lab",
		description: "A multi-step user journey with step transitions and final state.",
		path: "/journey",
		tags: ["wizard", "state", "navigation"]
	},
	{
		title: "Redirect Lab",
		description: "Immediate and delayed redirects triggered by user actions.",
		path: "/redirects",
		tags: ["redirect", "timing", "buttons"]
	},
	{
		title: "Flaky Lab",
		description: "Random latency, intermittent failures, and unstable UI content.",
		path: "/flaky",
		tags: ["flaky", "retry", "timeout"]
	}
];

const feedItems = [
	{
		id: "card-1",
		label: "Sign in with valid credentials"
	},
	{
		id: "card-2",
		label: "Add item to cart and verify badge"
	},
	{
		id: "card-3",
		label: "Retry on transient 500 response"
	},
	{
		id: "card-4",
		label: "Assert toast disappears after save"
	}
];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

function renderPage(res, view, pageData = {}) {
	res.render("layout", {
		title: pageData.title || "Playwright Practice Platform",
		description:
			pageData.description ||
			"A scenario platform for practicing Playwright with realistic UI behaviors.",
		view,
		launchYear: new Date().getFullYear(),
		...pageData
	});
}

app.get("/", (_req, res) => {
	renderPage(res, "index", {
		title: "Playwright Practice Platform",
		description:
			"Run automation on forms, redirects, journey flows, and intentionally flaky behavior.",
		scenarios
	});
});

app.get("/index", (_req, res) => {
	res.redirect(302, "/");
});

app.get("/home", (_req, res) => {
	res.redirect(302, "/");
});


app.get("/forms", (req, res) => {
	renderPage(res, "forms", {
		title: "Form Lab | Playwright Practice Platform",
		description: "Practice required fields, invalid states, and server-side validation.",
		formResult: req.query.formResult || ""
	});
});

app.get("/journey", (_req, res) => {
	renderPage(res, "journey", {
		title: "Journey Lab | Playwright Practice Platform",
		description: "Practice a multi-step user journey with deterministic and flaky checkpoints."
	});
});

app.get("/redirects", (_req, res) => {
	renderPage(res, "redirects", {
		title: "Redirect Lab | Playwright Practice Platform",
		description: "Practice handling immediate, delayed, and conditional redirects."
	});
});

app.get("/flaky", (_req, res) => {
	renderPage(res, "flaky", {
		title: "Flaky Lab | Playwright Practice Platform",
		description: "Simulated flaky UI and APIs for retry and wait strategy practice."
	});
});

app.get("/iframe", (_req, res) => {
	renderPage(res, "iframe", {
		title: "Playwright Widget Lab",
		description: "Small embeddable widget with dynamic data for iframe testing.",
		frameMode: true,
		testsToday: 132,
		passRate: "93.4%",
		nextDrill: "toast disappearance"
	});
});

app.get("/result", (req, res) => {
	renderPage(res, "result", {
		title: "Result Page | Playwright Practice Platform",
		description: "Landing page for redirect and journey assertions.",
		source: req.query.source || "unknown",
		status: req.query.status || "ok"
	});
});

app.get("/go", (req, res) => {
	const destination = String(req.query.to || "/result?source=go-route");
	res.redirect(302, destination);
});

app.get("/api/scenarios", (_req, res) => {
	res.json({
		generatedAt: new Date().toISOString(),
		items: scenarios
	});
});

app.get("/api/modules", (_req, res) => {
	res.json({
		generatedAt: new Date().toISOString(),
		items: scenarios
	});
});

app.get("/api/highlights", (_req, res) => {
	res.json({
		generatedAt: new Date().toISOString(),
		items: scenarios.map((item) => ({
			title: item.title,
			copy: item.description,
			stat: item.tags.join(" | ")
		}))
	});
});

app.post("/api/forms/register", (req, res) => {
	const requiredFields = ["fullName", "email", "password", "role", "terms"];
	const missing = requiredFields.filter((field) => {
		const value = req.body[field];
		return value === undefined || value === null || String(value).trim() === "";
	});

	if (missing.length) {
		return res.status(422).json({
			ok: false,
			error: "Validation failed",
			missing
		});
	}

	return res.json({
		ok: true,
		message: "Registration accepted",
		userId: `u-${Math.floor(Math.random() * 10000)}`
	});
});

app.get("/api/flaky/ping", (req, res) => {
	const stableMode = String(req.query.stable || "") === "1";
	const failRate = stableMode ? 0 : 0.35;
	const delay = Math.floor(150 + Math.random() * 1400);

	setTimeout(() => {
		if (Math.random() < failRate) {
			return res.status(500).json({
				ok: false,
				error: "Transient backend failure"
			});
		}

		return res.json({
			ok: true,
			delayMs: delay,
			timestamp: Date.now()
		});
	}, delay);
});

app.get("/api/flaky/feed", (req, res) => {
	const stableMode = String(req.query.stable || "") === "1";
	const delay = stableMode ? 120 : Math.floor(100 + Math.random() * 1200);
	const max = stableMode ? feedItems.length : 2 + Math.floor(Math.random() * feedItems.length);
	const shuffled = [...feedItems].sort(() => Math.random() - 0.5).slice(0, max);

	setTimeout(() => {
		res.json({
			ok: true,
			count: shuffled.length,
			items: shuffled
		});
	}, delay);
});

app.get("/api/flaky/banner", (_req, res) => {
	res.json({
		show: Math.random() > 0.45,
		text: "Intermittent banner: this appears only sometimes"
	});
});

app.get("/healthz", (_req, res) => {
	res.status(200).json({ ok: true });
});

app.get("/readyz", (_req, res) => {
	res.status(200).json({ ready: true });
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
