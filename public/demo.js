function animatePulse(element) {
	element.classList.remove("pulse");

	// Force reflow so repeated clicks retrigger the CSS animation.
	void element.offsetWidth;

	element.classList.add("pulse");
}

function updateLabProgress() {
	const checks = Array.from(document.querySelectorAll(".lab-check"));
	const progressBar = document.getElementById("labProgressBar");
	const label = document.getElementById("labProgressLabel");

	if (!checks.length || !progressBar || !label) {
		return;
	}

	const done = checks.filter((item) => item.checked).length;
	const pct = Math.round((done / checks.length) * 100);

	progressBar.style.width = `${pct}%`;
	label.textContent = `Progress: ${done} of ${checks.length} labs completed`;
}

async function postRegisterForm(form) {
	const resultNode = document.getElementById("registerResult");
	const submitNode = document.getElementById("registerSubmitBtn");

	if (!resultNode || !submitNode) {
		return;
	}

	const formData = new FormData(form);
	const payload = Object.fromEntries(formData.entries());

	if (!formData.get("terms")) {
		payload.terms = "";
	}

	submitNode.disabled = true;
	resultNode.textContent = "Submitting...";

	try {
		const response = await fetch("/api/forms/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		const body = await response.json();
		if (!response.ok) {
			resultNode.textContent = `Validation failed: ${body.missing.join(", ")}`;
			return;
		}

		resultNode.textContent = `Success: ${body.message} (${body.userId})`;
	} catch (_error) {
		resultNode.textContent = "Request failed due to network issue.";
	}

	submitNode.disabled = false;
}

function setupJourneyWizard() {
	const form = document.getElementById("journeyForm");
	if (!form) {
		return;
	}

	const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
	const pills = Array.from(document.querySelectorAll("[data-step-pill]"));
	const nextBtn = document.getElementById("journeyNextBtn");
	const prevBtn = document.getElementById("journeyPrevBtn");
	const finishBtn = document.getElementById("journeyFinishBtn");
	const errorNode = document.getElementById("journeyError");
	let step = 1;

	const setStep = (nextStep) => {
		step = nextStep;
		panels.forEach((panel) => {
			panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === step);
		});

		pills.forEach((pill) => {
			pill.classList.toggle("is-active", Number(pill.dataset.stepPill) === step);
		});

		if (prevBtn) {
			prevBtn.disabled = step === 1;
		}

		if (nextBtn && finishBtn) {
			nextBtn.hidden = step === panels.length;
			finishBtn.hidden = step !== panels.length;
		}
	};

	const validateCurrentStep = () => {
		const currentPanel = panels.find((panel) => Number(panel.dataset.stepPanel) === step);
		if (!currentPanel) {
			return true;
		}

		const inputs = Array.from(currentPanel.querySelectorAll("input, select, textarea"));
		const invalid = inputs.find((input) => !input.checkValidity());
		if (invalid) {
			if (errorNode) {
				errorNode.hidden = false;
			}
			invalid.reportValidity();
			return false;
		}

		if (errorNode) {
			errorNode.hidden = true;
		}

		return true;
	};

	setStep(step);

	if (nextBtn) {
		nextBtn.addEventListener("click", () => {
			if (!validateCurrentStep()) {
				return;
			}

			setStep(Math.min(step + 1, panels.length));
		});
	}

	if (prevBtn) {
		prevBtn.addEventListener("click", () => {
			if (errorNode) {
				errorNode.hidden = true;
			}

			setStep(Math.max(step - 1, 1));
		});
	}

	if (finishBtn) {
		finishBtn.addEventListener("click", () => {
			if (!validateCurrentStep()) {
				return;
			}

			window.location.href = "/result?source=journey-lab&status=completed";
		});
	}
}

function setupRedirectLab() {
	const delayedBtn = document.getElementById("delayedRedirectBtn");
	const conditionalBtn = document.getElementById("conditionalRedirectBtn");
	const statusNode = document.getElementById("redirectStatus");

	if (delayedBtn) {
		delayedBtn.addEventListener("click", () => {
			const delay = 400 + Math.floor(Math.random() * 1800);
			const target = delayedBtn.dataset.url || "/result?source=delayed-button";
			if (statusNode) {
				statusNode.textContent = `Redirecting in ${delay}ms`;
			}

			window.setTimeout(() => {
				window.location.href = target;
			}, delay);
		});
	}

	if (conditionalBtn) {
		conditionalBtn.addEventListener("click", async () => {
			conditionalBtn.disabled = true;
			if (statusNode) {
				statusNode.textContent = "Checking flaky ping before redirect...";
			}

			try {
				const response = await fetch("/api/flaky/ping");
				if (!response.ok) {
					throw new Error("Flaky ping failed");
				}

				window.location.href = "/result?source=conditional-redirect&status=ok";
			} catch (_error) {
				if (statusNode) {
					statusNode.textContent =
						"Ping failed, no redirect this time. Retry for flaky behavior.";
				}
				conditionalBtn.disabled = false;
			}
		});
	}
}

function setupFlakyLab() {
	const pingBtn = document.getElementById("flakyPingBtn");
	const stablePingBtn = document.getElementById("stablePingBtn");
	const pingStatus = document.getElementById("flakyPingStatus");
	const feedBtn = document.getElementById("flakyFeedBtn");
	const stableFeedBtn = document.getElementById("stableFeedBtn");
	const feedList = document.getElementById("flakyFeedList");
	const bannerBtn = document.getElementById("bannerCheckBtn");
	const bannerNode = document.getElementById("intermittentBanner");
	const flakyBox = document.getElementById("flakyBox");
	const stopBoxBtn = document.getElementById("stopFlakyBoxBtn");

	const runPing = async (stable) => {
		if (!pingStatus) {
			return;
		}

		pingStatus.textContent = "Calling ping endpoint...";
		const query = stable ? "?stable=1" : "";

		try {
			const response = await fetch(`/api/flaky/ping${query}`);
			const body = await response.json();
			if (!response.ok) {
				pingStatus.textContent = `Ping failed: ${body.error}`;
				return;
			}

			pingStatus.textContent = `Ping ok in ${body.delayMs}ms`;
		} catch (_error) {
			pingStatus.textContent = "Ping request failed unexpectedly";
		}
	};

	const runFeed = async (stable) => {
		if (!feedList) {
			return;
		}

		feedList.innerHTML = "";
		const query = stable ? "?stable=1" : "";
		const response = await fetch(`/api/flaky/feed${query}`);
		const body = await response.json();

		body.items.forEach((item) => {
			const li = document.createElement("li");
			li.textContent = `${item.id}: ${item.label}`;
			feedList.appendChild(li);
		});
	};

	if (pingBtn) {
		pingBtn.addEventListener("click", () => runPing(false));
	}

	if (stablePingBtn) {
		stablePingBtn.addEventListener("click", () => runPing(true));
	}

	if (feedBtn) {
		feedBtn.addEventListener("click", () => runFeed(false));
	}

	if (stableFeedBtn) {
		stableFeedBtn.addEventListener("click", () => runFeed(true));
	}

	if (bannerBtn && bannerNode) {
		bannerBtn.addEventListener("click", async () => {
			const response = await fetch("/api/flaky/banner");
			const body = await response.json();
			bannerNode.hidden = !body.show;
			bannerNode.textContent = body.text;
		});
	}

	let timer = null;
	if (flakyBox) {
		const scheduleToggle = () => {
			const delay = 1000 + Math.floor(Math.random() * 2000);
			timer = window.setTimeout(() => {
				flakyBox.hidden = !flakyBox.hidden;
				scheduleToggle();
			}, delay);
		};

		scheduleToggle();

		if (stopBoxBtn) {
			stopBoxBtn.addEventListener("click", () => {
				if (timer) {
					window.clearTimeout(timer);
					timer = null;
				}
			});
		}
	}
}

function setupIframeWidget() {
	const refreshFrameBtn = document.getElementById("refreshFrameBtn");
	const widgetStatus = document.getElementById("widgetStatus");

	if (!refreshFrameBtn) {
		return;
	}

	refreshFrameBtn.addEventListener("click", async () => {
		refreshFrameBtn.disabled = true;
		if (widgetStatus) {
			widgetStatus.textContent = "Refreshing widget state...";
		}

		try {
			const response = await fetch("/api/flaky/ping");
			const body = await response.json();
			if (!response.ok) {
				throw new Error(body.error || "refresh failed");
			}

			if (widgetStatus) {
				widgetStatus.textContent = `Widget synced in ${body.delayMs}ms`;
			}
		} catch (_error) {
			if (widgetStatus) {
				widgetStatus.textContent = "Widget sync failed, retry to continue.";
			}
		}

		refreshFrameBtn.disabled = false;
	});
}

document.addEventListener("DOMContentLoaded", () => {
	const pulseBtn = document.getElementById("pulseBtn");
	const highlightGrid = document.getElementById("highlightGrid");
	const labChecks = document.querySelectorAll(".lab-check");
	const registerForm = document.getElementById("registerForm");

	if (pulseBtn && highlightGrid) {
		pulseBtn.addEventListener("click", () => {
			animatePulse(highlightGrid);
		});
	}

	labChecks.forEach((checkbox) => {
		checkbox.addEventListener("change", updateLabProgress);
	});

	updateLabProgress();

	if (registerForm) {
		registerForm.addEventListener("submit", async (event) => {
			event.preventDefault();
			await postRegisterForm(registerForm);
		});
	}

	setupJourneyWizard();
	setupRedirectLab();
	setupFlakyLab();
	setupIframeWidget();
});
