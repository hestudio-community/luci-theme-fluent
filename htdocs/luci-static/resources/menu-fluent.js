'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
	__init__() {
		this.sidebarMediaQuery = window.matchMedia('(max-width: 768px)');
		this.setupSidebar();
		ui.menu.load().then((tree) => this.render(tree));
	},

	setMobileSidebarOpen(open) {
		const sidebar = document.getElementById('sidebar');
		const overlay = document.getElementById('sidebar-overlay');

		sidebar?.classList.toggle('mobile-open', open);
		overlay?.classList.toggle('active', open);
	},

	storeSidebarPreference(collapsed) {
		try {
			localStorage.setItem('fluent-sidebar-collapsed', collapsed ? '1' : '0');
		} catch (e) {}
	},

	syncSidebarPreference() {
		const sidebar = document.getElementById('sidebar');
		let collapsed = false;

		if (!sidebar)
			return;

		try {
			collapsed = localStorage.getItem('fluent-sidebar-collapsed') === '1';
		} catch (e) {}

		if (this.sidebarMediaQuery?.matches) {
			collapsed = false;
			this.setMobileSidebarOpen(false);
		}

		sidebar.classList.toggle('collapsed', collapsed);
		document.body.classList.toggle('sidebar-collapsed', collapsed);
	},

	setupSidebar() {
		const toggleBtn = document.getElementById('menu-toggle');
		const toggleBtnMobile = document.getElementById('menu-toggle-mobile');
		const sidebar = document.getElementById('sidebar');
		const overlay = document.getElementById('sidebar-overlay');

		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => {
				const collapsed = !sidebar?.classList.contains('collapsed');
				this.storeSidebarPreference(collapsed);
				this.syncSidebarPreference();
			});
		}

		if (toggleBtnMobile) {
			toggleBtnMobile.addEventListener('click', () => {
				this.setMobileSidebarOpen(!sidebar?.classList.contains('mobile-open'));
			});
		}

		if (overlay) {
			overlay.addEventListener('click', () => {
				this.setMobileSidebarOpen(false);
			});
		}

		if (this.sidebarMediaQuery?.addEventListener)
			this.sidebarMediaQuery.addEventListener('change', () => this.syncSidebarPreference());
		else if (this.sidebarMediaQuery?.addListener)
			this.sidebarMediaQuery.addListener(() => this.syncSidebarPreference());

		this.syncSidebarPreference();
	},

	render(tree) {
		let node = tree;
		let url = '';

		this.renderModeMenu(tree);

		if (L.env.dispatchpath.length >= 3) {
			for (var i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url = url + (url ? '/' : '') + L.env.dispatchpath[i];
			}

			if (node)
				this.renderTabMenu(node, url);
		}
	},

	getTabActiveId(tabs) {
		return tabs?.activeid || tabs?.getAttribute('activeid');
	},

	bindTabChangeNavigation(tabs, destinations) {
		let activeId = this.getTabActiveId(tabs);

		tabs.addEventListener('change', () => {
			const nextId = this.getTabActiveId(tabs);
			const href = nextId ? destinations[nextId] : null;

			if (!nextId || nextId === activeId || !href)
				return;

			activeId = nextId;
			window.location.href = href;
		});
	},

	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		const children = ui.menu.getChildren(tree);
		const depth = level || 0;
		const tabs = document.createElement('ul');
		let activeNode = null;
		let firstNode = null;

		if (!depth) {
			container.replaceChildren();
			container.style.display = 'none';
		}

		tabs.className = 'tabs';

		children.forEach(child => {
			const isActive = (L.env.dispatchpath[3 + depth] == child.name);
			const href = L.url(url, child.name);
			const tab = document.createElement('li');
			const link = document.createElement('a');

			if (!firstNode)
				firstNode = child;

			tab.className = 'tabmenu-item-%s%s'.format(child.name, isActive ? ' active' : '');
			link.href = href;
			link.textContent = _(child.title);
			tab.appendChild(link);
			tabs.appendChild(tab);

			if (isActive) {
				activeNode = child;
			}
		});

		if (!activeNode && firstNode && tabs.firstElementChild) {
			activeNode = firstNode;
			tabs.firstElementChild.classList.add('active');
		}

		if (!tabs.children.length) {
			if (!depth)
				container.style.display = 'none';

			return E([]);
		}

		container.appendChild(tabs);

		if (activeNode)
			this.renderTabMenu(activeNode, url + '/' + activeNode.name, depth + 1);

		container.style.display = '';
		return tabs;
	},

	getMenuIcon(name) {
		const icons = {
			'status': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM3 10a7 7 0 1114 0 7 7 0 01-14 0z"/><path d="M10 5.5a.5.5 0 01.5.5v4l2.85 1.71a.5.5 0 11-.51.86l-3.09-1.86A.5.5 0 019.5 10.5V6a.5.5 0 01.5-.5z"/></svg>',
			'system': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M1.91 7.38A8.5 8.5 0 0110 1.5c2.39 0 4.53.99 6.07 2.57l.42-.98a.5.5 0 01.92.39l-.96 2.24a.5.5 0 01-.65.26L13.55 4.8a.5.5 0 01.26-.96l1.02.44A7.5 7.5 0 002.88 7.77a.5.5 0 11-.97-.4zm16.18 5.24A8.5 8.5 0 0110 18.5a8.49 8.49 0 01-6.07-2.57l-.42.98a.5.5 0 01-.92-.39l.96-2.24a.5.5 0 01.65-.26l2.25 1.18a.5.5 0 01-.26.96l-1.02-.44a7.5 7.5 0 0011.95-3.49.5.5 0 11.97.4z"/></svg>',
			'network': '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 3c-1.89 1.83-3 4.26-3 7s1.11 5.17 3 7c1.89-1.83 3-4.26 3-7s-1.11-5.17-3-7z"/><path d="M3 10h14"/><path d="M5.5 6.5h9"/><path d="M5.5 13.5h9"/></svg>',
			'services': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v3A2.5 2.5 0 0115.5 10h-11A2.5 2.5 0 012 7.5v-3zM4.5 3A1.5 1.5 0 003 4.5v3A1.5 1.5 0 004.5 9h11A1.5 1.5 0 0017 7.5v-3A1.5 1.5 0 0015.5 3h-11zM5 6a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z"/><path d="M2 12.5A2.5 2.5 0 014.5 10h11a2.5 2.5 0 012.5 2.5v3a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-3zM4.5 11A1.5 1.5 0 003 12.5v3A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5v-3a1.5 1.5 0 00-1.5-1.5h-11zM5 14a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z"/></svg>',
			'vpn': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-3 6V6a3 3 0 116 0v2H7zm3 4a1.5 1.5 0 01.5 2.91V16a.5.5 0 01-1 0v-1.09A1.5 1.5 0 0110 12z"/></svg>',
			'nas': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm10 3.5a.75.75 0 100-1.5.75.75 0 000 1.5zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm12 1.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>',
			'admin': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a4 4 0 100 8 4 4 0 000-8zM7 6a3 3 0 116 0 3 3 0 01-6 0zm-3 9a3 3 0 013-3h6a3 3 0 013 3 2 2 0 01-2 2H6a2 2 0 01-2-2zm3-2a2 2 0 00-2 2 1 1 0 001 1h8a1 1 0 001-1 2 2 0 00-2-2H7z"/></svg>',
			'logout': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2.25a.5.5 0 01-1 0V4.25C12 3.56 11.44 3 10.75 3h-5.5C4.56 3 4 3.56 4 4.25v11.5c0 .69.56 1.25 1.25 1.25h5.5c.69 0 1.25-.56 1.25-1.25v-2.25a.5.5 0 011 0v2.25A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"/><path d="M15.15 10.5H7.5a.5.5 0 010-1h7.65l-1.83-1.83a.5.5 0 01.71-.7l2.68 2.68a.5.5 0 010 .7l-2.68 2.68a.5.5 0 01-.71-.7l1.83-1.83z"/></svg>'
		};

		const key = (name || '').toLowerCase();
		for (const [k, v] of Object.entries(icons)) {
			if (key.indexOf(k) !== -1)
				return v;
		}

		return '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 5.5A1.5 1.5 0 015 4h10a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 16H5a1.5 1.5 0 01-1.5-1.5v-9zM5 5a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-9A.5.5 0 0015 5H5z"/></svg>';
	},

	createMenuIcon(name) {
		const icon = document.createElement('span');

		icon.className = 'nav-icon';
		icon.setAttribute('aria-hidden', 'true');
		icon.innerHTML = this.getMenuIcon(name);

		return icon;
	},

	createMenuChevron() {
		const chevron = document.createElement('span');

		chevron.className = 'nav-arrow';
		chevron.setAttribute('aria-hidden', 'true');
		chevron.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M7.15 4.65a.5.5 0 01.7 0l4.5 4.5a.5.5 0 010 .7l-4.5 4.5a.5.5 0 11-.7-.7L11.29 10 7.15 5.35a.5.5 0 010-.7z"/></svg>';

		return chevron;
	},

	renderMainMenu(tree, url, level) {
		const children = ui.menu.getChildren(tree);
		const depth = level || 0;
		const list = document.createElement('ul');

		if (children.length == 0 || depth > 1)
			return null;

		list.className = depth ? 'nav-submenu' : 'nav';

		children.forEach(child => {
			const title = _(child.title);
			const itemUrl = L.url(url, child.name);
			const submenu = this.renderMainMenu(child, url + '/' + child.name, depth + 1);
			const isActive = L.env.dispatchpath.length > depth + 1 &&
				L.env.dispatchpath[depth + 1] == child.name;
			const hasSubmenu = !!submenu;
			const item = document.createElement('li');

			item.className = 'nav-item' +
				(hasSubmenu ? ' has-submenu' : '') +
				(isActive ? ' active' : '') +
				(hasSubmenu && isActive ? ' open' : '');

			if (!depth) {
				const group = document.createElement('div');
				const link = document.createElement('a');
				const label = document.createElement('span');

				group.className = 'nav-link-group';
				link.className = 'nav-link' + (isActive ? ' active' : '');
				link.href = itemUrl;
				link.title = title;
				link.setAttribute('aria-label', title);
				link.appendChild(this.createMenuIcon(child.name));

				label.className = 'nav-text';
				label.textContent = title;
				link.appendChild(label);

				if (isActive && (!hasSubmenu || L.env.dispatchpath.length === depth + 2))
					link.setAttribute('aria-current', 'page');

				group.appendChild(link);

				if (hasSubmenu) {
					const expand = document.createElement('button');

					expand.type = 'button';
					expand.className = 'nav-expand';
					expand.title = title;
					expand.setAttribute('aria-label', title);
					expand.setAttribute('aria-expanded', isActive ? 'true' : 'false');
					expand.appendChild(this.createMenuChevron());
					expand.addEventListener('click', (ev) => {
						const expanded = !item.classList.contains('open');

						ev.preventDefault();
						ev.stopPropagation();
						item.classList.toggle('open', expanded);
						expand.setAttribute('aria-expanded', expanded ? 'true' : 'false');
					});

					group.appendChild(expand);
				}

				item.appendChild(group);
			}
			else {
				const link = document.createElement('a');

				link.className = 'nav-sublink' + (isActive ? ' active' : '');
				link.href = itemUrl;
				link.textContent = title;
				link.title = title;
				link.setAttribute('aria-label', title);

				if (isActive)
					link.setAttribute('aria-current', 'page');

				item.appendChild(link);
			}

			if (hasSubmenu)
				item.appendChild(submenu);

			list.appendChild(item);
		});

		if (!depth) {
			const root = document.querySelector('#topmenu');

			root.replaceChildren(list);
			root.style.display = '';

			return root;
		}

		return list;
	},

	renderModeMenu(tree) {
		const tabs = document.querySelector('#modemenu');
		const mainMenu = document.querySelector('#topmenu');
		const children = ui.menu.getChildren(tree);
		const destinations = Object.create(null);
		let activeId = null;
		let firstChild = null;

		tabs.replaceChildren();
		tabs.style.display = 'none';
		mainMenu?.replaceChildren();
		if (mainMenu)
			mainMenu.style.display = 'none';

		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length
				? child.name === L.env.requestpath[0]
				: index === 0;
			const tabId = 'mode-tab-%s'.format(index);
			const tab = document.createElement('fluent-tab');
			const panel = document.createElement('fluent-tab-panel');
			const href = L.url(child.name);

			if (!firstChild)
				firstChild = child;

			tab.id = tabId;
			tab.setAttribute('slot', 'tab');
			tab.textContent = _(child.title);
			destinations[tabId] = href;

			panel.setAttribute('slot', 'tabpanel');
			panel.className = 'fluent-tab-panel-proxy';
			panel.hidden = true;

			tabs.appendChild(tab);
			tabs.appendChild(panel);

			if (isActive)
				activeId = tabId;

			if (isActive)
				this.renderMainMenu(child, child.name);
		});

		if (!activeId && firstChild) {
			activeId = 'mode-tab-0';
			this.renderMainMenu(firstChild, firstChild.name);
		}

		if (children.length > 1) {
			tabs.style.display = '';
			if (activeId)
				tabs.setAttribute('activeid', activeId);

			this.bindTabChangeNavigation(tabs, destinations);
		}
	}
});
