export default class HeaderView {
	async render() {
		return `
     <header class="header">
				<div class="header-content">
					<div class="logo">
						<i data-lucide="sprout" width="24" height="24"></i>
						<span>RootFacts</span>
					</div>
					<div id="header-status" class="status-pill">
						<span id="status-dot" class="status-dot"></span>
						<span id="status-text">Memuat...</span>
					</div>
				</div>
			</header>
    `;
	}

	updateStatus(message) {
		const statusText = document.getElementById('status-text');
		if (statusText) statusText.textContent = message;
	}
}
