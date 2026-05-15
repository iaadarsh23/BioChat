import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

const API_BASE_URL =
	(import.meta.env.VITE_API_URL || "https://biochat-production.up.railway.app").replace(/\/$/, "");

export default function AuthPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const submitLabel = useMemo(
		() => (loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"),
		[loading, mode],
	);

	async function handleSubmit(event) {
		event.preventDefault();

		if (!email.trim() || !password.trim()) {
			setError("Please enter both email and password.");
			setSuccess("");
			return;
		}

		setLoading(true);
		setError("");
		setSuccess("");

		try {
			if (mode === "signup") {
				const signupResponse = await fetch(`${API_BASE_URL}/signup`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});

				const signupData = await signupResponse.json();
				if (!signupResponse.ok) {
					throw new Error(signupData.detail || signupData.message || "Unable to create account.");
				}

				setSuccess("Account created. Signing you in...");
			}

			const loginResponse = await fetch(`${API_BASE_URL}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const loginData = await loginResponse.json();
			if (!loginResponse.ok || !loginData.access_token) {
				throw new Error(loginData.detail || loginData.message || "Login failed.");
			}

			localStorage.setItem("helix_token", loginData.access_token);
			localStorage.setItem("helix_token_type", loginData.token_type || "bearer");
			localStorage.setItem("helix_user_email", email);
			navigate("/chat", { replace: true });
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
			setSuccess("");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="app-shell auth-shell">
			<div className="page-layout auth-page">
				<section className="auth-hero">
					<div className="section-label">Medical AI Workspace</div>
					<h1>Helix AI</h1>
					<p>
						A secure clinical and research assistant for document-grounded
						question answering, analysis, and scientific exploration.
					</p>
					<div className="auth-highlights">
						<div className="surface-card highlight-card">
							<strong>RAG Chat</strong>
							<span>Ask grounded questions from your uploaded medical documents.</span>
						</div>
						<div className="surface-card highlight-card">
							<strong>Diagram Output</strong>
							<span>Render visual responses when the backend returns an image.</span>
						</div>
						<div className="surface-card highlight-card">
							<strong>Clinical Analysis</strong>
							<span>Trigger backend analysis workflows from the document sidebar.</span>
						</div>
					</div>
				</section>

				<section className="surface-card auth-card">
					<div className="auth-mode-switch">
						<button
							type="button"
							className={mode === "login" ? "mode-pill active" : "mode-pill"}
							onClick={() => {
								setMode("login");
								setError("");
								setSuccess("");
							}}
						>
							Login
						</button>
						<button
							type="button"
							className={mode === "signup" ? "mode-pill active" : "mode-pill"}
							onClick={() => {
								setMode("signup");
								setError("");
								setSuccess("");
							}}
						>
							Sign Up
						</button>
					</div>

					<div className="auth-copy">
						<h2>{mode === "login" ? "Welcome back" : "Create your workspace"}</h2>
						<p>
							{mode === "login"
								? "Access your secure Helix AI dashboard."
								: "Get started with a protected account for your research and medical workflows."}
						</p>
					</div>

					<form className="auth-form" onSubmit={handleSubmit}>
						<label>
							<span>Email</span>
							<input
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="doctor@clinic.com"
								autoComplete="email"
								required
							/>
						</label>

						<label>
							<span>Password</span>
							<input
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Enter your password"
								autoComplete={mode === "login" ? "current-password" : "new-password"}
								required
							/>
						</label>

						{error ? <div className="auth-feedback error">{error}</div> : null}
						{success ? <div className="auth-feedback success">{success}</div> : null}

						<button type="submit" className="primary-button auth-submit" disabled={loading}>
							{submitLabel}
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}
