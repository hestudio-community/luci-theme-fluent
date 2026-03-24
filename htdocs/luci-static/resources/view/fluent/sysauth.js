'use strict';
'require view';

	return view.extend({
		init() {
			const form = document.getElementById('sysauth-form');
			const btn = document.getElementById('login-submit');
			const password = document.getElementById('luci_password');

			if (!form || !btn)
				return;

			form.addEventListener('submit', () => {
				btn.disabled = true;
				btn.textContent = _('Logging in…');
				btn.setAttribute('aria-busy', 'true');
				document.body.classList.add('auth-submitting');
			});

			password?.focus();
		},

	addFooter() {},
});
