import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const marketingPages = ["science", "accuracy", "enterprise"];
const helixLogoSrc = "/helix-logo-mark.png";

const partnerLogos = ["GENE-TECH", "BIO-CORE", "SYNTHETIX", "QUANTUM-BIO", "NEXUS"];

const imageAssets = {
	scienceClinical:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuB_DAEzaOddMzgNAe8vxVvEfke_KRj4W2ihYprB-uHYHMzHIhIekufwvWABq9c5_vt0v2e32Nj8MuCUa6HjODFv6Aw3K3m-BheRNMG3nh6Lk64tifXpWpHZINGO1Np6gB_49XRomqiIlmOM7OxmLntYmVjcyItuJRFTTYEF-caEi7gtD9ZoQoL8GCBwKCHvhgktAosU0_3r8_mQplg1bT_ZwVpnHJVD6jXV5zbcGmmUnMlqmc3dUKLfPsVUIgq_ZvLmrx0p8GSAAnI",
	accuracySpecimen:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuAqUy4beNtDWVTzKGE7jptwovwMafHOsYgxobfngovVCAumRsPIF6wg85Tt4lKWLifQGfFG19xDtoXcG5AP2mPoa50_blROkPaEtwA38kKJ9oJfgWE4NxlIKwhMSVx71iFtbrg05zQYxG8BbwAuHS1jy1IvAsmLpHs916uQmHwdRsQvAID-Q3uZc0Pf8XmTSy_0XOP8IX6LgBNpnfvg0QglrnUBLt13of58SP461P_luK4IV3BTA991zrLlSNhdlZUqyaURvknGrVM",
	accuracyStatus:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuDSEecoDrWwMxq7t2o4sap_1YuYbuey5tUNovPfwCwQs9BPhY8L7OJqCQ-oeYVc10KQe56buRR4IvIdwdkzc4ju6peSlkBYGTNcq97X4xhbQ0zHxWA0MYWCt6aWsldBNTXvNNni9NRDxOdl5WNyFyXNvNJNRKkUhVwB4Nw8DN9FWLJnR2iUOQbljeWaW8QT3GmtqI4AV1yQUOQnXoCsZgqsKFzJPTAEXkCkXlWCahFpiIdMXpKQ8RnAr7zDzh1g_XTtwy78rZKbLms",
	enterpriseHero:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuDnedAWwxJW86sz-E5b4FipOxFDz67BVcSCP2eG5xOyMIhhQekRCvzy_jEpiiUSCEH_toeXfdSVuqQkeTgDQ37WCf_rNH3xOhJhxk7w42Pkz1Z2_MHB0BAi1c0ovF2OP8ZEeM2XF8InCaFJPjW2MC07pwFmPgw5HrwzccGkM0DrxrTGc9AJN_aPkYFA2DgvfJi0kOMFK2bbuUkZhNZgDzOwb1v_jfxK8svVJC7b_-yKXWcwZOd5-As7U6JAJBPJQN0qz6ERHfqdl48",
	enterpriseTraining:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuBkcTRgAdNRPVLCEyyb1FpqU_15esNwmPJktcy8V3wS4z9UR73hZ2Tkk2AlJPiHIzrGwrYftm6vXfXP0E9ELPIhfSf9G3dne69cz9SNhMJA1ogdybo9D_Rz-AtMEREPlJSRB95tQx-dGak8j_4gUxYv-OP88oDXwhUshQunzEogFElSg8PezdVP69NyvcYcvp5XZEneuUvl-E-Yj1ocOJpL0gU7XDMIcRrPHfdyZN_wdoVeo3ojIjvtm69k5pxfn0NxH3tHDyP0ybU",
};

const scienceCards = [
	{
		title: "Protein Folding",
		body: "Predict tertiary structures with sub-angstrom accuracy using our proprietary folding engine.",
		tone: "compact",
	},
	{
		title: "Genomics",
		body: "Analyze complex variant datasets in seconds, from single-cell RNA sequencing to whole genome assembly.",
		tone: "small",
	},
	{
		title: "Clinical Grade Data",
		body: "Helix filters out noise. We prioritize clean, actionable data from verified laboratory environments over general-purpose datasets.",
		tone: "image",
	},
];

const accuracyCapabilities = [
	{
		title: "Genomic Sequence Analysis",
		body: "Cross-referencing mutation patterns against 40M+ annotated sequences in the Helix Global Vault.",
	},
	{
		title: "Molecular Dynamics",
		body: "Real-time folding simulations derived from high-fidelity cryo-EM data and alpha-fold vectors.",
	},
	{
		title: "Clinical Correlation",
		body: "Bridging molecular findings with longitudinal patient outcomes and FDA-approved clinical trials.",
	},
];

const integrityRows = [
	{
		id: "01",
		title: "Source Verification Layer",
		body: "Cryptographic validation of peer-reviewed origins.",
		progress: "100%",
	},
	{
		id: "02",
		title: "Bias Neutralization Engine",
		body: "Statistical de-noising of conflicting clinical trial results.",
		progress: "74%",
	},
	{
		id: "03",
		title: "Contextual Synthesis",
		body: "AI-driven mapping of chemical properties to physiological effects.",
		progress: "52%",
	},
];

const enterpriseCards = [
	{
		title: "Global Collaboration",
		body: "Synchronize datasets across continents with sub-millisecond latency. Our distributed edge network ensures your research teams remain in perpetual alignment.",
		className: "enterprise-card enterprise-card-wide",
	},
	{
		title: "Secure Data Archiving",
		body: "HIPAA and GDPR-compliant cold storage with immutable audit trails for clinical integrity.",
		className: "enterprise-card enterprise-card-tall",
	},
	{
		title: "Custom Model Training",
		body: "Fine-tune LLMs on your proprietary molecular data within your own VPC perimeter.",
		className: "enterprise-card",
	},
];

const initialWorkspaceSessions = [
	{
		id: "session-1",
		title: "Untitled Session",
		messages: [],
		updatedAt: Date.now(),
	},
];

function App() {
	const [activePage, setActivePage] = useState("science");
	const [workspaceOpen, setWorkspaceOpen] = useState(false);

	if (workspaceOpen) {
		return <WorkspacePage onClose={() => setWorkspaceOpen(false)} />;
	}

	return (
		<div className={`helix-app ${activePage !== "science" ? `theme-${activePage}` : ""}`}>
			<MarketingHeader
				activePage={activePage}
				onPageChange={setActivePage}
				onOpenWorkspace={() => setWorkspaceOpen(true)}
			/>
			<main>
				{activePage === "science" && <SciencePage />}
				{activePage === "accuracy" && <AccuracyPage />}
				{activePage === "enterprise" && <EnterprisePage />}
			</main>
		</div>
	);
}

function MarketingHeader({ activePage, onPageChange, onOpenWorkspace }) {
	return (
		<header className="topbar">
			<BrandLockup label="HELIX" className="brand" size="marketing" />
			<nav className="main-nav">
				{marketingPages.map((page) => (
					<button
						key={page}
						type="button"
						className={page === activePage ? "nav-item active" : "nav-item"}
						onClick={() => onPageChange(page)}
					>
						{capitalize(page)}
					</button>
				))}
			</nav>
			<div className="topbar-actions">
				{activePage === "science" ? (
					<>
						<button type="button" className="text-button">
							Sign In
						</button>
						<button type="button" className="primary-button" onClick={onOpenWorkspace}>
							Get Started
						</button>
					</>
				) : (
					<button type="button" className="primary-button small" onClick={onOpenWorkspace}>
						Sign In
					</button>
				)}
			</div>
		</header>
	);
}

function SciencePage() {
	return (
		<section className="page science-page">
			<div className="science-hero">
				<div className="hero-video-shell" aria-hidden="true">
					<video
						className="hero-video"
						autoPlay
						loop
						muted
						playsInline
						preload="metadata"
					>
						<source src="/dna-hero.mp4" type="video/mp4" />
					</video>
				</div>
				<div className="hero-orbit" />
				<div className="hero-content">
					<div className="status-pill">System Status: Optimal</div>
					<h1 className="hero-title">
						Accelerate the
						<br />
						<span>Future of Life.</span>
					</h1>
					<p className="hero-copy">
						The biology-only AI assistant designed for the laboratory,
						<br />
						the clinic, and the frontier of research.
					</p>
					<div className="hero-actions">
						<button type="button" className="primary-button">
							Get Started
						</button>
						<button type="button" className="ghost-button">
							Read Whitepaper
						</button>
					</div>
				</div>
				<div className="scan-indicator">Initialize Scan</div>
			</div>

			<section className="trusted-section">
				<div className="section-kicker centered">Trusted by Science</div>
				<div className="trusted-logos">
					{partnerLogos.map((logo) => (
						<span key={logo}>{logo}</span>
					))}
				</div>
			</section>

			<section className="science-grid">
				<article className="panel science-panel hero-panel">
					<h2>
						Built for Precision.
						<br />
						Validated by <span>Reality.</span>
					</h2>
					<p>
						Our models are trained exclusively on peer-reviewed biological data,
						ensuring that every insight is clinically relevant and scientifically
						sound.
					</p>
				</article>
				<article className="panel science-panel compact-panel">
					<div className="mini-star" />
					<h3>{scienceCards[0].title}</h3>
					<p>{scienceCards[0].body}</p>
					<span className="micro-label">Core Engine v6.2</span>
				</article>
				<article className="panel science-panel">
					<div className="dna-mark" />
					<h3>{scienceCards[1].title}</h3>
					<p>{scienceCards[1].body}</p>
					<span className="micro-label">Gene map index</span>
				</article>
				<article className="panel science-panel image-panel">
					<img src={imageAssets.scienceClinical} alt="Clinical grade biological data" />
					<div className="bio-image-overlay" />
					<h3>{scienceCards[2].title}</h3>
					<p>{scienceCards[2].body}</p>
				</article>
			</section>

			<section className="terminal-stage">
				<div className="terminal-frame">
					<div className="terminal-header">
						<div className="terminal-dots">
							<span />
							<span />
							<span />
						</div>
						<span>HELIX TERMINAL :: SESSION 08772</span>
					</div>
					<div className="terminal-content">
						<div className="terminal-message ai">
							&apos;System ready. Analysis of sample HX-402 complete. Identified
							structural anomaly in the binding pocket of Protein X-4.&apos;
						</div>
						<div className="terminal-message user">
							&apos;Propose a molecular modification to increase affinity by 20%
							while maintaining solubility.&apos;
						</div>
						<div className="terminal-message output">
							<div>:: Calculating affinity...</div>
							<div>:: Mapping solubility co-efficients...</div>
							<div>:: Model generated.</div>
						</div>
					</div>
				</div>
			</section>

			<footer className="marketing-footer">
				<div className="footer-column wide">
					<BrandLockup label="HELIX" className="footer-brand" size="footer" />
					<p>
						Advancing biological understanding through precision intelligence and
						clinical-grade datasets.
					</p>
				</div>
				<div className="footer-column">
					<span className="footer-label">Research</span>
					<a href="#0">Documentation</a>
					<a href="#0">Whitepaper</a>
					<a href="#0">API Reference</a>
				</div>
				<div className="footer-column">
					<span className="footer-label">Platform</span>
					<a href="#0">System Status</a>
					<a href="#0">Security</a>
					<a href="#0">Data Privacy</a>
				</div>
				<div className="footer-column">
					<span className="footer-label">Legal</span>
					<a href="#0">Terms</a>
					<a href="#0">Privacy</a>
					<a href="#0">Ethics</a>
				</div>
			</footer>
		</section>
	);
}

function AccuracyPage() {
	return (
		<section className="page accuracy-page">
			<section className="split-hero accuracy-hero">
				<div className="hero-column">
					<div className="section-kicker">Technical Specification v4.2</div>
					<h1 className="hero-title left">
						Uncompromising
						<br />
						<span>Accuracy.</span>
					</h1>
					<p className="hero-body left">
						Helix is trained exclusively on peer-reviewed biological literature
						and clinical data. No hallucination. No generalized datasets. Just
						pure molecular intelligence.
					</p>
					<div className="verified-line">Verified Clinical Core</div>
				</div>
				<div className="specimen-card">
					<img
						className="specimen-image"
						src={imageAssets.accuracySpecimen}
						alt="Microscopic cellular specimen"
					/>
					<div className="specimen-stats">
						<div>Latency: 14ms</div>
						<div>Fidelity: 99.98%</div>
					</div>
				</div>
			</section>

			<section className="content-block neural-link">
				<div className="neural-heading">
					<div>
						<h2>The Neural Link</h2>
						<p>
							Our proprietary architecture maps disparate biological datasets into
							a unified multidimensional latent space, enabling cross-domain
							discovery across genomics, proteomics, and clinical records.
						</p>
					</div>
					<div className="utility-chip">Redundancy: Active</div>
				</div>
				<div className="capability-grid">
					{accuracyCapabilities.map((item) => (
						<article key={item.title} className="capability-card">
							<div className="capability-icon" />
							<h3>{item.title}</h3>
							<p>{item.body}</p>
						</article>
					))}
				</div>
			</section>

			<section className="content-block integrity-block">
				<h2 className="centered-heading">Data Integrity</h2>
				<div className="integrity-list">
					{integrityRows.map((row) => (
						<div key={row.id} className="integrity-item">
							<span className="integrity-id">{row.id}</span>
							<div className="integrity-copy">
								<h3>{row.title}</h3>
								<p>{row.body}</p>
							</div>
							<div className="integrity-meter">
								<div style={{ width: row.progress }} />
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="accuracy-bottom-grid">
				<article className="panel fidelity-panel">
					<h3>Clinical Fidelity</h3>
					<p>
						Helix models outperform general LLMs by 400% in biological entity
						recognition and relational extraction.
					</p>
					<div className="code-box">
						<div>SEQ_ID: HX-882-ALPHA</div>
						<div>STABILITY_SCORE: 0.992</div>
						<div>K_PARAMETER: 1.22e-9</div>
					</div>
				</article>
				<article className="error-card">
					<strong>0.02%</strong>
					<span>Error Margin</span>
				</article>
				<article className="panel status-card">
					<div className="live-chip">Live Status</div>
					<p>94.2 TB Verified</p>
					<img src={imageAssets.accuracyStatus} alt="Live status waveform" />
					<div className="wave-art" />
				</article>
			</section>

			<footer className="marketing-footer compact">
				<div className="footer-column wide">
					<div className="footer-title">HELIX BIOLABS</div>
					<p>© 2024 HELIX BIOLABS. PROCURED FOR CLINICAL USE.</p>
				</div>
				<div className="footer-column">
					<a href="#0">Research</a>
					<a href="#0">Documentation</a>
				</div>
				<div className="footer-column">
					<a href="#0">API</a>
					<a href="#0">System Status</a>
				</div>
				<div className="footer-column">
					<a href="#0">Privacy</a>
					<a href="#0">Terms</a>
				</div>
			</footer>
		</section>
	);
}

function EnterprisePage() {
	return (
		<section className="page enterprise-page">
			<section className="split-hero enterprise-hero">
				<div className="hero-column">
					<div className="section-kicker">Institutional Protocol v4.2</div>
					<h1 className="hero-title left">
						Designed for the
						<br />
						<span className="soft-italic">Modern</span>
						<br />
						<span className="soft-italic">Laboratory.</span>
					</h1>
				</div>
				<div className="hero-side-note">
					Deploying secure, scalable AI infrastructure tailored for clinical
					research and molecular discovery at a global scale.
				</div>
			</section>

			<section className="laboratory-banner">
				<img src={imageAssets.enterpriseHero} alt="Laboratory biological cultures" />
				<div className="banner-image-wash" />
				<div className="banner-stats">
					<div className="banner-stat">
						<span>Current Throughput</span>
						<strong>1.2 PB / DAY</strong>
					</div>
					<div className="banner-stat">
						<span>Active Clusters</span>
						<strong>402</strong>
					</div>
				</div>
			</section>

			<section className="enterprise-grid">
				{enterpriseCards.map((card) => (
					<article key={card.title} className={card.className}>
						<div className="capability-icon" />
						<h3>{card.title}</h3>
						<p>{card.body}</p>
						{card.title === "Global Collaboration" && (
							<span className="micro-label">Cross-region sync active</span>
						)}
						{card.title === "Custom Model Training" && (
							<img
								className="training-image"
								src={imageAssets.enterpriseTraining}
								alt="Custom model training visualization"
							/>
						)}
					</article>
				))}
				<article className="metric-tile">
					<strong>99.99%</strong>
					<span>System Uptime Guarantee</span>
				</article>
				<article className="metric-tile">
					<strong>256-bit</strong>
					<span>Quantum-resistant Encryption</span>
				</article>
				<article className="enterprise-card enterprise-card-wide short">
					<div>
						<h3>Enterprise API Access</h3>
						<p>Direct node integration</p>
					</div>
					<div className="api-box">[]</div>
				</article>
			</section>

			<section className="procurement-section">
				<div className="procurement-heading">
					<h2>Initiate Procurement Protocol</h2>
					<p>FORM ID: HELIX-ENT-2024-REQ</p>
				</div>
				<form className="procurement-form">
					<label>
						<span>Principal Collaborator</span>
						<input type="text" placeholder="FULL NAME" />
					</label>
					<label>
						<span>Institutional Email</span>
						<input type="email" placeholder="ADMIN@INSTITUTION.EDU" />
					</label>
					<label>
						<span>Research Domain</span>
						<select defaultValue="MOLECULAR DYNAMICS">
							<option>MOLECULAR DYNAMICS</option>
							<option>GENOMIC SEQUENCING</option>
							<option>CLINICAL TRIALS</option>
						</select>
					</label>
					<label>
						<span>Computational Scale</span>
						<select defaultValue="TIER 1 (1-10 NODES)">
							<option>TIER 1 (1-10 NODES)</option>
							<option>TIER 2 (10-100 NODES)</option>
							<option>TIER 3 (UNLIMITED)</option>
						</select>
					</label>
					<label className="full-width">
						<span>Deployment Requirements</span>
						<textarea rows="4" placeholder="DESCRIBE SPECIFIC COLLABORATION NEEDS..." />
					</label>
					<div className="form-actions">
						<label className="checkline">
							<input type="checkbox" defaultChecked />
							<span>
								I authorize Helix Biolabs to process this request under clinical
								data handling standards and contact me via secured channels.
							</span>
						</label>
						<button type="button" className="primary-button">
							Submit Protocol
						</button>
					</div>
				</form>
			</section>

			<footer className="marketing-footer enterprise-footer">
				<div className="footer-column">
					<span className="footer-label">Research</span>
					<a href="#0">Publications</a>
					<a href="#0">Methodology</a>
					<a href="#0">Datasets</a>
				</div>
				<div className="footer-column">
					<span className="footer-label">Optimization</span>
					<a href="#0">API Docs</a>
					<a href="#0">SDK Reference</a>
					<a href="#0">Dashboard</a>
				</div>
				<div className="footer-column">
					<span className="footer-label">System Status</span>
					<a href="#0">All Nodes Operational</a>
				</div>
				<div className="footer-column wide right-brand">
					<BrandLockup label="HELIX" className="footer-brand" size="footer" />
					<p>Bioluminescent data architecture for clinical excellence.</p>
				</div>
			</footer>
		</section>
	);
}

function WorkspacePage({ onClose }) {
	const [sessions, setSessions] = useState(initialWorkspaceSessions);
	const [activeSessionId, setActiveSessionId] = useState(initialWorkspaceSessions[0].id);
	const [draft, setDraft] = useState("");
	const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
	const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
	const inputRef = useRef(null);
	const currentUser = getSignedInUser();
	const userDisplayName = currentUser?.name || currentUser?.email || "";

	const activeSession = useMemo(
		() =>
			sessions.find((session) => session.id === activeSessionId) ??
			initialWorkspaceSessions[0],
		[sessions, activeSessionId],
	);

	useEffect(() => {
		inputRef.current?.focus();
	}, [activeSessionId]);

	function createSession() {
		const session = {
			id: `session-${Date.now()}`,
			title: "Untitled Session",
			messages: [],
			updatedAt: Date.now(),
		};

		setSessions((current) => [session, ...current]);
		setActiveSessionId(session.id);
		setDraft("");
	}

	function handleSendMessage() {
		const trimmed = draft.trim();
		if (!trimmed) return;

		setSessions((current) =>
			current.map((session) => {
				if (session.id !== activeSessionId) return session;

				const nextMessages = [
					...session.messages,
					{
						id: `message-${Date.now()}`,
						role: "user",
						content: trimmed,
						timestamp: formatTime(new Date()),
					},
				];

				return {
					...session,
					title: session.messages.length === 0 ? buildSessionTitle(trimmed) : session.title,
					messages: nextMessages,
					updatedAt: Date.now(),
				};
			}),
		);

		setDraft("");
	}

	function handleComposerKeyDown(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	function handleExportSession() {
		if (!activeSession) return;

		const lines = [
			activeSession.title,
			"",
			...(activeSession.messages.length
				? activeSession.messages.map(
						(message) =>
							`[${message.timestamp}] ${message.role.toUpperCase()}: ${message.content}`,
				  )
				: ["No messages yet."]),
		];

		const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${slugify(activeSession.title)}.txt`;
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div
			className={[
				"workspace-page",
				leftSidebarOpen ? "" : "left-collapsed",
				rightSidebarOpen ? "" : "right-collapsed",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<aside className="workspace-sidebar">
				<BrandLockup label="Helix" className="workspace-brand" size="sidebar" />
				<button type="button" className="workspace-button" onClick={createSession}>
					<span>+</span>
					New Session
				</button>
				<div className="workspace-group">
					<span className="workspace-label">Recent</span>
					<div className="workspace-list">
						{sessions.map((session) => (
							<button
								key={session.id}
								type="button"
								className={
									session.id === activeSessionId ? "workspace-item active" : "workspace-item"
								}
								onClick={() => setActiveSessionId(session.id)}
							>
								<span className="workspace-item-title">{session.title}</span>
								<span className="workspace-item-meta">
									{session.messages.length
										? `${session.messages.length} message${session.messages.length > 1 ? "s" : ""}`
										: "Empty"}
								</span>
							</button>
						))}
					</div>
				</div>
				<div className="workspace-group">
					<span className="workspace-label">Workspace</span>
					<div className="workspace-reserved" aria-hidden="true" />
				</div>
				<div className="workspace-user">
					<div className="user-dot">{userDisplayName ? buildInitials(userDisplayName) : ""}</div>
					{userDisplayName ? (
						<div>
							<strong>{userDisplayName}</strong>
						</div>
					) : null}
				</div>
			</aside>

			<section className="workspace-main">
				<header className="workspace-topbar">
					<div className="workspace-topbar-side left">
						<button
							type="button"
							className="workspace-toggle"
							onClick={() => setLeftSidebarOpen((current) => !current)}
							aria-label={leftSidebarOpen ? "Hide left sidebar" : "Show left sidebar"}
						>
							<span className="icon icon-sidebar" aria-hidden="true" />
						</button>
						<div className="workspace-title-block">
							<BrandLockup label="Helix" className="workspace-brand-inline" size="topbar" />
							<span className="workspace-brand-pill">Your AI lab partner for biology</span>
						</div>
					</div>
					<div className="workspace-heading">
						{activeSession.messages.length > 0 ? activeSession.title : ""}
					</div>
					<div className="workspace-top-actions">
						<button type="button" className="workspace-top-button" onClick={handleExportSession}>
							Export
						</button>
						<button
							type="button"
							className="workspace-toggle"
							onClick={() => setRightSidebarOpen((current) => !current)}
							aria-label={rightSidebarOpen ? "Hide right sidebar" : "Show right sidebar"}
						>
							<span className="icon icon-panel" aria-hidden="true" />
						</button>
						<button type="button" className="workspace-top-button" onClick={onClose}>
							<span className="icon icon-close" aria-hidden="true" />
						</button>
					</div>
				</header>

				{!leftSidebarOpen && (
					<button
						type="button"
						className="workspace-rail-toggle workspace-rail-toggle-left"
						onClick={() => setLeftSidebarOpen(true)}
						aria-label="Show left sidebar"
					>
						Open Sidebar
					</button>
				)}
				{!rightSidebarOpen && (
					<button
						type="button"
						className="workspace-rail-toggle workspace-rail-toggle-right"
						onClick={() => setRightSidebarOpen(true)}
						aria-label="Show right sidebar"
					>
						Open Panel
					</button>
				)}

				<div className="workspace-conversation">
					{activeSession.messages.length === 0 ? (
						<div className="workspace-empty">
							<div className="workspace-empty-logo-wrap">
								<img
									src={helixLogoSrc}
									alt="Helix logo"
									className="workspace-empty-logo"
								/>
								<div className="workspace-logo-tooltip">
									Hi, I&apos;m Helik. How can I help you today?
								</div>
							</div>
							<div className="workspace-empty-label">Helix Workspace</div>
							<h3>Welcome to Helix</h3>
							<p>From cells to systems — ask biology, get clarity.</p>
						</div>
					) : (
						activeSession.messages.map((message, index) => (
							<div key={message.id} className="message-stack">
								<div
									className={
										message.role === "user"
											? `bubble user-bubble${index === activeSession.messages.length - 1 ? " lower" : ""}`
											: "bubble ai-bubble"
									}
								>
									{message.role === "assistant" && (
										<div className="bubble-label">HELIX</div>
									)}
									<p>{message.content}</p>
								</div>
								<div className={message.role === "user" ? "message-meta right" : "message-meta"}>
									{message.timestamp} {message.role === "user" ? "YOU" : "HELIX"}
								</div>
							</div>
						))
					)}
				</div>

				<div className="workspace-composer">
					<div className="composer-shell">
						<span className="composer-side">IN</span>
						<input
							ref={inputRef}
							type="text"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={handleComposerKeyDown}
							placeholder="Type a message..."
						/>
						<span className="composer-side">TXT</span>
					</div>
					<button type="button" className="composer-send" onClick={handleSendMessage}>
						↑
					</button>
				</div>
			</section>

			<aside className="workspace-context">
				<button
					type="button"
					className="workspace-context-toggle"
					onClick={() => setRightSidebarOpen(false)}
					aria-label="Hide right sidebar"
				>
					<span className="icon icon-close" aria-hidden="true" />
				</button>
				<div className="context-placeholder" aria-hidden="true" />
			</aside>
		</div>
	);
}

function capitalize(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSessionTitle(text) {
	const clean = text.replace(/\s+/g, " ").trim();
	return clean.length > 28 ? `${clean.slice(0, 28)}...` : clean;
}

function formatTime(date) {
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function slugify(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "session";
}

function getSignedInUser() {
	if (typeof window === "undefined") return null;
	return window.__HELIX_AUTH_USER__ ?? null;
}

function buildInitials(value) {
	const words = value
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2);

	if (words.length === 0) return "U";

	return words.map((word) => word.charAt(0).toUpperCase()).join("");
}

function BrandLockup({ label, className = "", size = "marketing" }) {
	return (
		<div className={`brand-lockup ${className}`.trim()}>
			<img src={helixLogoSrc} alt="Helix logo" className={`brand-logo brand-logo-${size}`} />
			<span>{label}</span>
		</div>
	);
}

export default App;
