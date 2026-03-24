(function() {
	'use strict';

	const proxyClass = 'fluent-native-proxy';

	function ready(fn) {
		if (document.readyState === 'loading')
			document.addEventListener('DOMContentLoaded', fn, { once: true });
		else
			fn();
	}

	function hasComponent(name) {
		return !!window.customElements?.get(name);
	}

	function create(tag, attrs, text) {
		const el = document.createElement(tag);

		if (attrs) {
			for (const [key, value] of Object.entries(attrs)) {
				if (value == null || value === false)
					continue;

				if (value === true)
					el.setAttribute(key, '');
				else
					el.setAttribute(key, value);
			}
		}

		if (text != null)
			el.textContent = text;

		return el;
	}

	function hideNativeControl(node) {
		node.classList.add(proxyClass);
		node.setAttribute('tabindex', '-1');
	}

	function dispatch(node, type) {
		node.dispatchEvent(new Event(type, { bubbles: true }));
	}

	function dispatchKeyboardLike(node, type) {
		try {
			node.dispatchEvent(new KeyboardEvent(type, { bubbles: true }));
		}
		catch (e) {
			dispatch(node, type);
		}
	}

	function syncBooleanAttr(node, attr, enabled) {
		if (enabled)
			node.setAttribute(attr, '');
		else
			node.removeAttribute(attr);
	}

	function resolveButtonAppearance(node) {
		if (node.classList.contains('cbi-button-apply') ||
			node.classList.contains('cbi-button-save') ||
			node.classList.contains('cbi-button-positive') ||
			node.classList.contains('important') ||
			node.classList.contains('primary'))
			return 'accent';

		if (node.classList.contains('cbi-button-negative') ||
			node.classList.contains('cbi-button-reset') ||
			node.classList.contains('danger') ||
			node.classList.contains('error'))
			return 'outline';

		return 'neutral';
	}

	function updateInvalidState(nativeNode, host) {
		const invalid = nativeNode.classList.contains('cbi-input-invalid') ||
			!!nativeNode.closest('.cbi-value-error');

		host.classList.toggle('is-invalid', invalid);
	}

	function enhanceTextInputs(root) {
		if (!hasComponent('fluent-text-input'))
			return;

		root.querySelectorAll('input.cbi-input-text, input.cbi-input-password').forEach((input) => {
			if (input.dataset.fluentEnhanced || input.closest('.cbi-dropdown, .cbi-dynlist'))
				return;

			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-text-control' });
			const control = create('fluent-text-input', {
				appearance: 'filled-lighter',
				type: input.type === 'password' ? 'password' : (input.type || 'text'),
				placeholder: input.getAttribute('placeholder'),
				name: input.name || null
			});

			const syncFromNative = () => {
				control.value = input.value ?? '';
				syncBooleanAttr(control, 'disabled', input.disabled);
				syncBooleanAttr(control, 'readonly', input.readOnly);
				updateInvalidState(input, host);
			};

			control.addEventListener('input', () => {
				input.value = control.value ?? '';
				dispatch(input, 'input');
				dispatchKeyboardLike(input, 'keyup');
			});

			control.addEventListener('change', () => {
				input.value = control.value ?? '';
				dispatch(input, 'change');
			});

			control.addEventListener('blur', () => dispatch(input, 'blur'));
			input.addEventListener('input', syncFromNative);
			input.addEventListener('change', syncFromNative);

			new MutationObserver(syncFromNative).observe(input, {
				attributes: true,
				attributeFilter: ['class', 'disabled', 'readonly', 'placeholder', 'value', 'type']
			});

			syncFromNative();
			input.after(host);
			host.appendChild(control);
			hideNativeControl(input);
			input.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceTextareas(root) {
		if (!hasComponent('fluent-textarea'))
			return;

		root.querySelectorAll('textarea.cbi-input-textarea').forEach((textarea) => {
			if (textarea.dataset.fluentEnhanced || textarea.closest('.cbi-dropdown, .cbi-dynlist'))
				return;

			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-textarea-control' });
			const control = create('fluent-textarea', {
				appearance: 'filled-lighter',
				placeholder: textarea.getAttribute('placeholder'),
				name: textarea.name || null
			});

			const syncFromNative = () => {
				control.value = textarea.value ?? '';
				syncBooleanAttr(control, 'disabled', textarea.disabled);
				syncBooleanAttr(control, 'readonly', textarea.readOnly);
				updateInvalidState(textarea, host);
			};

			control.addEventListener('input', () => {
				textarea.value = control.value ?? '';
				dispatch(textarea, 'input');
				dispatchKeyboardLike(textarea, 'keyup');
			});

			control.addEventListener('change', () => {
				textarea.value = control.value ?? '';
				dispatch(textarea, 'change');
			});

			control.addEventListener('blur', () => dispatch(textarea, 'blur'));
			textarea.addEventListener('input', syncFromNative);
			textarea.addEventListener('change', syncFromNative);

			new MutationObserver(syncFromNative).observe(textarea, {
				attributes: true,
				attributeFilter: ['class', 'disabled', 'readonly', 'placeholder']
			});

			syncFromNative();
			textarea.after(host);
			host.appendChild(control);
			hideNativeControl(textarea);
			textarea.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceSelects(root) {
		if (!hasComponent('fluent-dropdown') || !hasComponent('fluent-option'))
			return;

		root.querySelectorAll('select.cbi-input-select').forEach((select) => {
			if (select.dataset.fluentEnhanced || select.multiple || select.size > 1 || select.closest('.cbi-dynlist'))
				return;

			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-select-control' });
			const control = create('fluent-dropdown', {
				appearance: 'filled-lighter',
				name: select.name || null
			});

			const rebuildOptions = () => {
				control.replaceChildren();

				Array.from(select.options).forEach((option) => {
					const item = create('fluent-option', {
						value: option.value,
						disabled: option.disabled
					}, option.textContent);

					if (option.selected)
						item.setAttribute('selected', '');

					control.appendChild(item);
				});

				control.value = select.value ?? '';
				syncBooleanAttr(control, 'disabled', select.disabled);
				updateInvalidState(select, host);
			};

			control.addEventListener('change', () => {
				select.value = control.value ?? '';
				dispatch(select, 'change');
			});

			select.addEventListener('change', rebuildOptions);
			new MutationObserver(rebuildOptions).observe(select, {
				attributes: true,
				childList: true,
				subtree: true,
				attributeFilter: ['class', 'disabled', 'selected']
			});

			rebuildOptions();
			select.after(host);
			host.appendChild(control);
			hideNativeControl(select);
			select.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceCheckboxes(root) {
		if (!hasComponent('fluent-switch'))
			return;

		root.querySelectorAll('.cbi-checkbox > input[type="checkbox"]').forEach((input) => {
			if (input.dataset.fluentEnhanced)
				return;

			const frame = input.parentElement;
			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-switch-control' });
			const control = create('fluent-switch', {
				name: input.name || null
			});

			const syncFromNative = () => {
				control.checked = !!input.checked;
				syncBooleanAttr(control, 'disabled', input.disabled);
				updateInvalidState(input, host);
			};

			control.addEventListener('change', () => {
				input.checked = !!control.checked;
				dispatch(input, 'click');
				dispatch(input, 'change');
			});

			input.addEventListener('change', syncFromNative);
			new MutationObserver(syncFromNative).observe(input, {
				attributes: true,
				attributeFilter: ['class', 'disabled', 'checked']
			});

			syncFromNative();
			frame.appendChild(host);
			host.appendChild(control);
			hideNativeControl(input);
			frame.querySelectorAll('label').forEach((label) => label.classList.add('fluent-hidden-decorator'));
			input.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceButtons(root) {
		if (!hasComponent('fluent-button') || !hasComponent('fluent-anchor-button'))
			return;

		root.querySelectorAll('button.cbi-button, button.btn, input[type="submit"], input[type="button"], input[type="reset"], a.btn').forEach((node) => {
			if (node.dataset.fluentEnhanced ||
				node.id === 'menu-toggle' ||
				node.id === 'menu-toggle-mobile' ||
				node.closest('.fluent-nav-header, .fluent-topbar, .cbi-dynlist, .control-group'))
				return;

			const isAnchor = node.tagName === 'A';
			const host = create('span', { class: 'fluent-button-proxy' });
			const control = create(isAnchor ? 'fluent-anchor-button' : 'fluent-button', {
				appearance: resolveButtonAppearance(node),
				href: isAnchor ? node.getAttribute('href') : null,
				target: isAnchor ? node.getAttribute('target') : null,
				rel: isAnchor ? node.getAttribute('rel') : null
			}, (node.value || node.textContent || '').trim());

			const syncFromNative = () => {
				control.textContent = (node.value || node.textContent || '').trim();
				syncBooleanAttr(control, 'disabled', !!node.disabled);
			};

			control.addEventListener('click', (ev) => {
				if (isAnchor)
					return;

				ev.preventDefault();
				node.click();
			});

			syncFromNative();
			if (!isAnchor) {
				new MutationObserver(syncFromNative).observe(node, {
					attributes: true,
					attributeFilter: ['disabled', 'value', 'class']
				});
			}
			node.after(host);
			host.appendChild(control);
			if (!isAnchor)
				hideNativeControl(node);
			else
				node.classList.add(proxyClass);

			node.dataset.fluentEnhanced = 'true';
		});
	}

	function isActiveTabItem(item) {
		return item.classList.contains('active') ||
			item.classList.contains('cbi-tab') ||
			item.getAttribute('data-tab-active') === 'true';
	}

	function enhanceTabLists(root) {
		if (!hasComponent('fluent-tabs') || !hasComponent('fluent-tab') || !hasComponent('fluent-tab-panel'))
			return;

		root.querySelectorAll('ul.cbi-tabmenu, #tabmenu > ul.tabs').forEach((list, listIndex) => {
			if (list.dataset.fluentEnhanced)
				return;

			const tabs = create('fluent-tabs', {
				class: 'fluent-tabs-proxy',
				appearance: 'subtle',
				size: 'small'
			});

			const renderTabs = () => {
				tabs.replaceChildren();
				let activeId = null;
				let visibleIndex = 0;

				Array.from(list.children).forEach((item) => {
					if (item.style.display === 'none')
						return;

					const link = item.querySelector('a');
					if (!link)
						return;

					const tabId = `${list.id || 'fluent-tab'}-${listIndex}-${visibleIndex}`;
					const tab = create('fluent-tab', { id: tabId, slot: 'tab' }, link.textContent.trim());
					const panel = create('fluent-tab-panel', {
						slot: 'tabpanel',
						class: 'fluent-tab-panel-proxy',
						hidden: true
					});

					tab.addEventListener('click', (ev) => {
						ev.preventDefault();
						link.click();
					});

					if (isActiveTabItem(item))
						activeId = tabId;

					tabs.appendChild(tab);
					tabs.appendChild(panel);
					visibleIndex++;
				});

				if (activeId)
					tabs.setAttribute('activeid', activeId);
			};

			renderTabs();
			new MutationObserver(renderTabs).observe(list, {
				attributes: true,
				childList: true,
				subtree: true,
				attributeFilter: ['class', 'style', 'data-tab-active']
			});

			list.after(tabs);
			list.classList.add(proxyClass, 'fluent-native-tabs');
			list.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceIndicators() {
		if (!hasComponent('fluent-badge'))
			return;

		document.querySelectorAll('#indicators > span[data-indicator]').forEach((indicator) => {
			const label = indicator.firstChild?.nodeType === Node.TEXT_NODE
				? indicator.firstChild.data.trim()
				: indicator.dataset.fluentLabel || '';

			if (label)
				indicator.dataset.fluentLabel = label;

			let badge = indicator.querySelector('fluent-badge');
			if (!badge) {
				badge = create('fluent-badge', { class: 'fluent-indicator-badge' });
				indicator.textContent = '';
				indicator.appendChild(badge);
			}

			badge.textContent = indicator.dataset.fluentLabel || '';
			indicator.classList.toggle('inactive', indicator.getAttribute('data-style') === 'inactive');
		});
	}

	function enhanceModalNode(modal) {
		if (!hasComponent('fluent-dialog') || !modal)
			return;

		const current = modal.firstElementChild;
		if (current?.tagName === 'FLUENT-DIALOG')
			return;

		const dialog = create('fluent-dialog', {
			class: 'fluent-runtime-dialog',
			modal: true,
			open: true
		});

		while (modal.firstChild)
			dialog.appendChild(modal.firstChild);

		modal.appendChild(dialog);
		enhanceRoot(dialog);
	}

	function patchUiModal() {
		if (!window.L?.require)
			return;

		L.require('ui').then((ui) => {
			if (ui.__fluentModalPatched)
				return;

			ui.__fluentModalPatched = true;

			const originalShowModal = ui.showModal;
			const originalHideModal = ui.hideModal;

			ui.showModal = function() {
				const dialog = originalShowModal.apply(this, arguments);
				enhanceModalNode(dialog);
				return dialog;
			};

			ui.hideModal = function() {
				const dialog = document.querySelector('#modal_overlay .modal > fluent-dialog');
				if (dialog)
					dialog.removeAttribute('open');

				return originalHideModal.apply(this, arguments);
			};
		});
	}

	function enhanceRoot(root) {
		if (!root || root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE)
			return;

		enhanceTextInputs(root);
		enhanceTextareas(root);
		enhanceSelects(root);
		enhanceCheckboxes(root);
		enhanceButtons(root);
		enhanceTabLists(root);
		enhanceIndicators();
	}

	function observeDom() {
		const observer = new MutationObserver((records) => {
			for (const record of records) {
				if (record.type === 'childList') {
					record.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE)
							enhanceRoot(node);
					});
				}
				else if (record.target instanceof Element) {
					enhanceRoot(record.target);
				}
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: false
		});
	}

	function syncThemeState() {
		const dark = document.documentElement.getAttribute('data-darkmode') === 'true';
		document.documentElement.setAttribute('data-fluent-theme', dark ? 'dark' : 'light');
		document.body?.setAttribute('data-fluent-theme', dark ? 'dark' : 'light');
	}

	function observeThemeState() {
		syncThemeState();

		new MutationObserver(syncThemeState).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-darkmode']
		});
	}

	ready(() => {
		syncThemeState();
		enhanceRoot(document);
		observeThemeState();
		observeDom();
		patchUiModal();
	});
})();
