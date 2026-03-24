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

	function queryAllIncludingSelf(root, selector) {
		const matches = [];

		if (root?.nodeType === Node.ELEMENT_NODE && root.matches(selector))
			matches.push(root);

		if (root?.querySelectorAll)
			matches.push(...root.querySelectorAll(selector));

		return matches;
	}

	function hideNativeControl(node) {
		node.classList.add(proxyClass);
		node.setAttribute('tabindex', '-1');
	}

	function reportEnhancementError(kind, error, node) {
		console.error(`[fluent] Failed to enhance ${kind}`, node, error);
	}

	function runEnhancer(kind, fn) {
		try {
			fn();
		}
		catch (error) {
			reportEnhancementError(kind, error);
		}
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

	function findDropdownListbox(control) {
		return Array.from(control.children).find((child) =>
			child.tagName === 'FLUENT-LISTBOX' && !child.hasAttribute('slot')) || null;
	}

	function ensureDropdownListbox(control) {
		let listbox = findDropdownListbox(control);

		if (listbox)
			return listbox;

		listbox = create('fluent-listbox');

		const slottedControl = Array.from(control.children).find((child) =>
			child.getAttribute?.('slot') === 'control');

		if (slottedControl)
			control.insertBefore(listbox, slottedControl);
		else
			control.appendChild(listbox);

		return listbox;
	}

	function syncEnhancedSelectValue(control, select, attempt) {
		const selectedValue = select.value ?? '';
		const expectedOptions = select.options.length;
		const controlOptions = control.options?.length ?? 0;

		if (attempt == null)
			attempt = 0;

		if (attempt < 10 && (!control.listbox || controlOptions !== expectedOptions)) {
			requestAnimationFrame(() => syncEnhancedSelectValue(control, select, attempt + 1));
			return;
		}

		control.value = selectedValue;
	}

	function getClassInstance(node) {
		return window.DOM?.findClassInstance?.(node) ?? null;
	}

	function getDropdownItems(dropdown) {
		return Array.from(dropdown.querySelector('ul')?.children ?? []).filter((node) => node.tagName === 'LI');
	}

	function getDropdownItemValue(item) {
		if (item.hasAttribute('placeholder'))
			return '';

		return item.getAttribute('data-value') ?? item.innerText.trim();
	}

	function getDropdownItemLabel(item) {
		return item.innerText.trim();
	}

	function syncEnhancedDropdownValue(control, dropdown, attempt) {
		const instance = getClassInstance(dropdown);
		const selectedValue = instance?.getValue?.() ?? dropdown.value ?? '';
		const expectedOptions = getDropdownItems(dropdown).length;
		const controlOptions = control.options?.length ?? 0;

		if (attempt == null)
			attempt = 0;

		if (attempt < 10 && (!control.listbox || controlOptions !== expectedOptions)) {
			requestAnimationFrame(() => syncEnhancedDropdownValue(control, dropdown, attempt + 1));
			return;
		}

		control.value = selectedValue;
	}

	function triggerLinkActivation(link) {
		if (!link)
			return;

		link.click();
	}

	function resolveButtonVariant(node) {
		if (node.classList.contains('cbi-button-apply') ||
			node.classList.contains('cbi-button-action') ||
			node.classList.contains('cbi-button-edit') ||
			node.classList.contains('cbi-button-reload') ||
			node.classList.contains('important') ||
			node.classList.contains('primary'))
			return 'primary';

		if (node.classList.contains('cbi-button-negative') ||
			node.classList.contains('cbi-button-reset') ||
			node.classList.contains('cbi-button-remove') ||
			node.classList.contains('danger') ||
			node.classList.contains('error'))
			return 'danger';

		if (node.classList.contains('cbi-button-save') ||
			node.classList.contains('cbi-button-positive') ||
			node.classList.contains('cbi-button-fieldadd') ||
			node.classList.contains('cbi-button-add'))
			return 'success';

		if (node.classList.contains('cbi-button-link') ||
			node.classList.contains('cbi-button-download') ||
			node.classList.contains('cbi-button-find') ||
			node.classList.contains('cbi-button-up') ||
			node.classList.contains('cbi-button-down'))
			return 'neutral-subtle';

		return 'neutral-outline';
	}

	function resolveButtonAppearance(variant) {
		if (variant === 'primary')
			return 'primary';

		if (variant === 'neutral-subtle')
			return 'subtle';

		return 'outline';
	}

	function updateInvalidState(nativeNode, host) {
		const invalid = nativeNode.classList.contains('cbi-input-invalid') ||
			!!nativeNode.closest('.cbi-value-error');

		host.classList.toggle('is-invalid', invalid);
	}

	function isInlineEnhancedSelect(select) {
		return select.classList.contains('cbi-button') ||
			select.classList.contains('btn') ||
			!!select.closest('.control-group, .cbi-page-actions, .cbi-section-actions');
	}

	function getRuntimeCapabilities() {
		return {
			textInputs: hasComponent('fluent-text-input'),
			textareas: hasComponent('fluent-textarea'),
			selects: hasComponent('fluent-dropdown') && hasComponent('fluent-listbox') && hasComponent('fluent-option'),
			switches: hasComponent('fluent-switch'),
			buttons: hasComponent('fluent-button'),
			anchorButtons: hasComponent('fluent-anchor-button'),
			badges: hasComponent('fluent-badge')
		};
	}

	function enhanceTextInputs(root, capabilities) {
		if (!capabilities.textInputs)
			return;

		queryAllIncludingSelf(root, 'input.cbi-input-text, input.cbi-input-password').forEach((input) => {
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

	function enhanceTextareas(root, capabilities) {
		if (!capabilities.textareas)
			return;

		queryAllIncludingSelf(root, 'textarea.cbi-input-textarea').forEach((textarea) => {
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

	function enhanceSelects(root, capabilities) {
		if (!capabilities.selects)
			return;

		queryAllIncludingSelf(root, 'select.cbi-input-select').forEach((select) => {
			if (select.dataset.fluentEnhanced || select.multiple || select.size > 1 || select.closest('.cbi-dynlist'))
				return;

			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-select-control' });
			const control = create('fluent-dropdown', {
				appearance: 'filled-lighter'
			});

			const syncHostLayout = () => {
				const inline = isInlineEnhancedSelect(select);

				host.classList.toggle('fluent-enhanced-select-inline', inline);
				host.style.width = (inline && select.style.width) ? select.style.width : '';
				host.style.minWidth = (inline && select.style.minWidth) ? select.style.minWidth : '';
				host.style.maxWidth = (inline && select.style.maxWidth) ? select.style.maxWidth : '';
			};

			const rebuildOptions = () => {
				const listbox = ensureDropdownListbox(control);

				listbox.replaceChildren();

				Array.from(select.options).forEach((option) => {
					const item = create('fluent-option', {
						value: option.value,
						disabled: option.disabled
					}, option.textContent);

					if (option.selected)
						item.setAttribute('selected', '');

					listbox.appendChild(item);
				});

				syncHostLayout();
				syncBooleanAttr(control, 'disabled', select.disabled);
				updateInvalidState(select, host);
				syncEnhancedSelectValue(control, select);
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
				attributeFilter: ['class', 'disabled', 'selected', 'style']
			});

			select.after(host);
			host.appendChild(control);
			rebuildOptions();
			hideNativeControl(select);
			select.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceCheckboxes(root, capabilities) {
		return;
	}

	function enhanceDropdowns(root, capabilities) {
		if (!capabilities.selects)
			return;

		queryAllIncludingSelf(root, '.cbi-dropdown:not(.btn):not(.cbi-button)').forEach((dropdown) => {
			if (dropdown.dataset.fluentEnhanced ||
				dropdown.hasAttribute('multiple') ||
				dropdown.querySelector('.create-item-input') ||
				dropdown.closest('.cbi-dynlist'))
				return;

			const host = create('div', { class: 'fluent-enhanced-control fluent-enhanced-select-control fluent-enhanced-dropdown-control' });
			const control = create('fluent-dropdown', {
				appearance: 'filled-lighter'
			});

			const syncHostLayout = () => {
				host.style.width = dropdown.style.width || '';
				host.style.minWidth = dropdown.style.minWidth || '';
				host.style.maxWidth = dropdown.style.maxWidth || '';
			};

			const rebuildOptions = () => {
				const listbox = ensureDropdownListbox(control);

				listbox.replaceChildren();

				getDropdownItems(dropdown).forEach((item) => {
					const label = getDropdownItemLabel(item);
					const value = getDropdownItemValue(item);

					if (!label && !item.hasAttribute('placeholder'))
						return;

					const option = create('fluent-option', {
						value,
						disabled: item.hasAttribute('unselectable') || item.hasAttribute('disabled')
					}, label);

					if (item.hasAttribute('selected'))
						option.setAttribute('selected', '');

					listbox.appendChild(option);
				});

				syncHostLayout();
				syncBooleanAttr(control, 'disabled', dropdown.hasAttribute('disabled'));
				updateInvalidState(dropdown, host);
				syncEnhancedDropdownValue(control, dropdown);
			};

			control.addEventListener('change', () => {
				const instance = getClassInstance(dropdown);
				const value = control.value ?? '';

				if (instance?.setValue)
					instance.setValue(value);

				rebuildOptions();
			});

			dropdown.addEventListener('cbi-dropdown-change', rebuildOptions);
			new MutationObserver(rebuildOptions).observe(dropdown, {
				attributes: true,
				childList: true,
				subtree: true,
				attributeFilter: ['class', 'disabled', 'selected', 'data-value', 'placeholder', 'display', 'open']
			});

			dropdown.after(host);
			host.appendChild(control);
			rebuildOptions();
			hideNativeControl(dropdown);
			dropdown.dataset.fluentEnhanced = 'true';
		});
	}

	function enhanceButtons(root, capabilities) {
		if (!capabilities.buttons && !capabilities.anchorButtons)
			return;

		queryAllIncludingSelf(root, 'button.cbi-button, button.btn, input[type="submit"], input[type="button"], input[type="reset"], a.btn, a.cbi-button').forEach((node) => {
			if (node.dataset.fluentEnhanced ||
				node.id === 'menu-toggle' ||
				node.id === 'menu-toggle-mobile' ||
				node.closest('.fluent-nav-header, .fluent-topbar, .cbi-dynlist, .control-group, .cbi-dropdown'))
				return;

			let host = null;

			try {
				const isAnchor = node.tagName === 'A';

				if (isAnchor ? !capabilities.anchorButtons : !capabilities.buttons)
					return;

				const variant = resolveButtonVariant(node);
				const control = create(isAnchor ? 'fluent-anchor-button' : 'fluent-button', {
					appearance: resolveButtonAppearance(variant),
					href: isAnchor ? node.getAttribute('href') : null,
					target: isAnchor ? node.getAttribute('target') : null,
					rel: isAnchor ? node.getAttribute('rel') : null
				}, (node.value || node.textContent || '').trim());

				host = create('span', { class: 'fluent-button-proxy' });
				Array.from(node.classList).forEach((className) => {
					if (className === 'btn' ||
						className === 'important' ||
						className === 'primary' ||
						className.startsWith('cbi-button'))
						host.classList.add(`native-${className}`);
				});

				const syncFromNative = () => {
					const nextVariant = resolveButtonVariant(node);

					control.textContent = (node.value || node.textContent || '').trim();
					control.setAttribute('appearance', resolveButtonAppearance(nextVariant));
					syncBooleanAttr(control, 'disabled', !!node.disabled);
					if (isAnchor) {
						control.setAttribute('href', node.getAttribute('href') || '');
						if (node.getAttribute('target'))
							control.setAttribute('target', node.getAttribute('target'));
						else
							control.removeAttribute('target');

						if (node.getAttribute('rel'))
							control.setAttribute('rel', node.getAttribute('rel'));
						else
							control.removeAttribute('rel');
					}
					host.dataset.buttonVariant = nextVariant;
				};

				control.addEventListener('click', (ev) => {
					if (isAnchor)
						return;

					ev.preventDefault();
					node.click();
				});

				syncFromNative();
				new MutationObserver(syncFromNative).observe(node, {
					attributes: true,
					childList: true,
					characterData: true,
					subtree: true,
					attributeFilter: ['class', 'disabled', 'href', 'rel', 'target', 'title', 'value']
				});

				host.appendChild(control);
				node.after(host);
				hideNativeControl(node);
				node.dataset.fluentEnhanced = 'true';
			}
			catch (error) {
				host?.remove();
				reportEnhancementError('button', error, node);
			}
		});
	}

	function enhanceTabLists() {
	}

	function enhanceIndicators(capabilities) {
		if (!capabilities.badges)
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
			badge.setAttribute('appearance', indicator.getAttribute('data-style') === 'inactive' ? 'tint' : 'filled');
			badge.setAttribute('color', indicator.getAttribute('data-style') === 'inactive' ? 'subtle' : 'brand');
			badge.setAttribute('shape', 'rounded');
			badge.setAttribute('size', 'small');
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

		const capabilities = getRuntimeCapabilities();

		runEnhancer('text inputs', () => enhanceTextInputs(root, capabilities));
		runEnhancer('textareas', () => enhanceTextareas(root, capabilities));
		runEnhancer('selects', () => enhanceSelects(root, capabilities));
		runEnhancer('dropdowns', () => enhanceDropdowns(root, capabilities));
		runEnhancer('checkboxes', () => enhanceCheckboxes(root, capabilities));
		runEnhancer('buttons', () => enhanceButtons(root, capabilities));
		runEnhancer('tabs', () => enhanceTabLists(root));
		runEnhancer('indicators', () => enhanceIndicators(capabilities));
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
