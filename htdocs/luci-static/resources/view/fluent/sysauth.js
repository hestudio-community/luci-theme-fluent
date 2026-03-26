'use strict';
'require view';

function findEnhancedAuthControl(field) {
	if (!field?.dataset.fluentEnhanced)
		return null;

	const host = field.nextElementSibling;

	if (!host?.matches('.fluent-enhanced-control'))
		return null;

	return host.querySelector('fluent-text-input, fluent-textarea, fluent-dropdown');
}

function focusAuthField(field) {
	const control = findEnhancedAuthControl(field);

	(control || field)?.focus();
}

return view.extend({
	init() {
		const form = document.getElementById('sysauth-form');
		const btn = document.getElementById('login-submit');
		const username = document.getElementById('luci_username');
		const password = document.getElementById('luci_password');

		if (!form || !btn)
			return;

		form.addEventListener('submit', () => {
			btn.disabled = true;
			btn.textContent = _('Logging in…');
			btn.setAttribute('aria-busy', 'true');
			document.body.classList.add('auth-submitting');
		});

		window.requestAnimationFrame(() => {
			const initialField = username?.value?.trim() ? (password || username) : (username || password);

			focusAuthField(initialField);
		});
	},

	addFooter() {},
});
