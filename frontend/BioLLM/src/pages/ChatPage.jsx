import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";

const API_BASE_URL =
	(import.meta.env.VITE_API_URL || "https://biochat-production.up.railway.app").replace(/\/$/, "");

export default function ChatPage() {
	const navigate = useNavigate();
	const fileInputRef = useRef(null);
	const chatScrollRef = useRef(null);
	const [query, setQuery] = useState("");
	const [messages, setMessages] = useState([
		{
			id: "welcome",
			role: "assistant",
			type: "text",
			content:
				"Welcome to Helix AI. Upload a document, ask a grounded question, or run a medical analysis workflow from the left panel.",
		},
	]);
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [chatLoading, setChatLoading] = useState(false);
	const [uploadLoading, setUploadLoading] = useState(false);
	const [analysisLoading, setAnalysisLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [analysisSummary, setAnalysisSummary] = useState("");

	const token = localStorage.getItem("helix_token");
	const tokenType = localStorage.getItem("helix_token_type") || "Bearer";
	const userEmail = localStorage.getItem("helix_user_email") || "Signed-in User";

	const authHeader = useMemo(
		() => ({ Authorization: `${capitalizeTokenType(tokenType)} ${token}` }),
		[token, tokenType],
	);

	useEffect(() => {
		if (!token) {
			navigate("/", { replace: true });
		}
	}, [navigate, token]);

	useEffect(() => {
		if (!chatScrollRef.current) return;
		chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
	}, [messages, analysisSummary]);

	function handleLogout() {
		localStorage.removeItem("helix_token");
		localStorage.removeItem("helix_token_type");
		localStorage.removeItem("helix_user_email");
		navigate("/", { replace: true });
	}

	async function handleUpload(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploadLoading(true);
		setErrorMessage("");

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch(`${API_BASE_URL}/upload`, {
				method: "POST",
				headers: authHeader,
				body: formData,
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || data.message || "Unable to upload file.");
			}

			setUploadedFiles((current) => [
				{
					id: `${file.name}-${Date.now()}`,
					name: file.name,
					status: "Uploaded",
				},
				...current,
			]);
		} catch (uploadError) {
			setErrorMessage(
				uploadError instanceof Error ? uploadError.message : "Upload failed.",
			);
		} finally {
			setUploadLoading(false);
			if (event.target) {
				event.target.value = "";
			}
		}
	}

	async function handleAnalyze() {
		setAnalysisLoading(true);
		setErrorMessage("");
		setAnalysisSummary("");

		try {
			const response = await fetch(`${API_BASE_URL}/analyze`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...authHeader,
				},
				body: JSON.stringify({}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || data.message || "Analysis failed.");
			}

			const analysis = data.analysis || "Analysis complete.";
			setAnalysisSummary(analysis);
			setMessages((current) => [
				...current,
				{
					id: `assistant-analysis-${Date.now()}`,
					role: "assistant",
					type: "text",
					content: analysis,
				},
			]);
		} catch (analysisError) {
			setErrorMessage(
				analysisError instanceof Error ? analysisError.message : "Unable to run analysis.",
			);
		} finally {
			setAnalysisLoading(false);
		}
	}

	async function handleAsk(event) {
		event.preventDefault();
		const trimmedQuery = query.trim();
		if (!trimmedQuery || chatLoading) return;

		const userMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			type: "text",
			content: trimmedQuery,
		};

		setMessages((current) => [...current, userMessage]);
		setQuery("");
		setChatLoading(true);
		setErrorMessage("");

		try {
			const response = await fetch(`${API_BASE_URL}/ask`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...authHeader,
				},
				body: JSON.stringify({ query: trimmedQuery }),
			});

			const contentType = response.headers.get("content-type") || "";
			if (!response.ok) {
				const errorPayload = contentType.includes("application/json")
					? await response.json()
					: {};
				throw new Error(
					errorPayload.detail || errorPayload.message || "Unable to process your question.",
				);
			}

			if (contentType.includes("image/png")) {
				const imageBlob = await response.blob();
				const imageUrl = URL.createObjectURL(imageBlob);
				setMessages((current) => [
					...current,
					{
						id: `assistant-image-${Date.now()}`,
						role: "assistant",
						type: "image",
						content: imageUrl,
					},
				]);
				return;
			}

			const data = await response.json();
			setMessages((current) => [
				...current,
				{
					id: `assistant-text-${Date.now()}`,
					role: "assistant",
					type: "text",
					content: data.response || "No response returned.",
				},
			]);
		} catch (askError) {
			const message =
				askError instanceof Error ? askError.message : "Unable to reach Helix AI.";
			setErrorMessage(message);
			setMessages((current) => [
				...current,
				{
					id: `assistant-error-${Date.now()}`,
					role: "assistant",
					type: "text",
					content: `Error: ${message}`,
				},
			]);
		} finally {
			setChatLoading(false);
		}
	}

	return (
		<div className="app-shell chat-shell">
			<div className="chat-header">
				<div className="page-layout chat-header-inner">
					<div>
						<div className="chat-brand">Helix AI</div>
						<div className="chat-header-copy">Medical knowledge workspace</div>
					</div>
					<div className="chat-header-actions">
						<div className="chat-user-badge">{userEmail}</div>
						<button type="button" className="ghost-button chat-logout" onClick={handleLogout}>
							Logout
						</button>
					</div>
				</div>
			</div>

			<div className="page-layout chat-layout">
				<aside className="surface-card sidebar-panel">
					<div className="sidebar-block">
						<div className="section-label">Documents</div>
						<button
							type="button"
							className="primary-button sidebar-upload"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadLoading}
						>
							{uploadLoading ? "Uploading..." : "Upload Document"}
						</button>
						<input
							ref={fileInputRef}
							type="file"
							className="hidden-input"
							onChange={handleUpload}
						/>
					</div>

					<div className="sidebar-block">
						<div className="section-label">Uploaded Files</div>
						<div className="file-list">
							{uploadedFiles.length === 0 ? (
								<div className="empty-note">No files uploaded yet.</div>
							) : (
								uploadedFiles.map((file) => (
									<div key={file.id} className="file-item">
										<strong>{file.name}</strong>
										<span>{file.status}</span>
									</div>
								))
							)}
						</div>
					</div>

					<div className="sidebar-block">
						<div className="section-label">Analysis</div>
						<button
							type="button"
							className="secondary-button sidebar-analyze"
							onClick={handleAnalyze}
							disabled={analysisLoading}
						>
							{analysisLoading ? "Running Analysis..." : "Analyze"}
						</button>
						{analysisSummary ? <div className="analysis-card">{analysisSummary}</div> : null}
					</div>

					{errorMessage ? <div className="sidebar-error">{errorMessage}</div> : null}
				</aside>

				<section className="surface-card chat-panel">
					<div className="chat-stream" ref={chatScrollRef}>
						{messages.map((message) => (
							<div
								key={message.id}
								className={message.role === "user" ? "chat-message user" : "chat-message assistant"}
							>
								<div className="message-bubble">
									{message.type === "image" ? (
										<img className="message-image" src={message.content} alt="Helix response visual" />
									) : (
										<p>{message.content}</p>
									)}
								</div>
							</div>
						))}

						{chatLoading ? (
							<div className="chat-message assistant">
								<div className="message-bubble loading-bubble">
									<span />
									<span />
									<span />
								</div>
							</div>
						) : null}
					</div>

					<form className="chat-composer" onSubmit={handleAsk}>
						<textarea
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Ask a question about your uploaded medical material..."
							rows={1}
						/>
						<button type="submit" className="primary-button composer-send" disabled={chatLoading}>
							{chatLoading ? "Sending..." : "Send"}
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}

function capitalizeTokenType(value) {
	if (!value) return "Bearer";
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
