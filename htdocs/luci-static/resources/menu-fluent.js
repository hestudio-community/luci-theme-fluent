'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
	__init__() {
		this.setupSidebar();
		ui.menu.load().then((tree) => this.render(tree));
	},

	setupSidebar() {
		const toggleBtn = document.getElementById('menu-toggle');
		const toggleBtnMobile = document.getElementById('menu-toggle-mobile');
		const sidebar = document.getElementById('sidebar');
		const overlay = document.getElementById('sidebar-overlay');

		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => {
				sidebar.classList.toggle('collapsed');
				document.body.classList.toggle('sidebar-collapsed');
				try {
					localStorage.setItem('fluent-sidebar-collapsed',
						sidebar.classList.contains('collapsed') ? '1' : '0');
				} catch(e) {}
			});
		}

		if (toggleBtnMobile) {
			toggleBtnMobile.addEventListener('click', () => {
				sidebar.classList.toggle('mobile-open');
				overlay.classList.toggle('active');
			});
		}

		if (overlay) {
			overlay.addEventListener('click', () => {
				sidebar.classList.remove('mobile-open');
				overlay.classList.remove('active');
			});
		}

		try {
			if (localStorage.getItem('fluent-sidebar-collapsed') === '1') {
				sidebar.classList.add('collapsed');
				document.body.classList.add('sidebar-collapsed');
			}
		} catch(e) {}
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

	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		const ul = E('ul', { 'class': 'tabs' });
		const children = ui.menu.getChildren(tree);
		let activeNode = null;

		children.forEach(child => {
			const isActive = (L.env.dispatchpath[3 + (level || 0)] == child.name);
			const activeClass = isActive ? ' active' : '';
			const className = 'tabmenu-item-%s %s'.format(child.name, activeClass);

			ul.appendChild(E('li', { 'class': className }, [
				E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ] )]));

			if (isActive)
				activeNode = child;
		});

		if (ul.children.length == 0)
			return E([]);

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			this.renderTabMenu(activeNode, url + '/' + activeNode.name, (level || 0) + 1);

		return ul;
	},

	getMenuIcon(name) {
		const icons = {
			'status': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM3 10a7 7 0 1114 0 7 7 0 01-14 0z"/><path d="M10 5.5a.5.5 0 01.5.5v4l2.85 1.71a.5.5 0 11-.51.86l-3.09-1.86A.5.5 0 019.5 10.5V6a.5.5 0 01.5-.5z"/></svg>',
			'system': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M1.91 7.38A8.5 8.5 0 0110 1.5c2.39 0 4.53.99 6.07 2.57l.42-.98a.5.5 0 01.92.39l-.96 2.24a.5.5 0 01-.65.26L13.55 4.8a.5.5 0 01.26-.96l1.02.44A7.5 7.5 0 002.88 7.77a.5.5 0 11-.97-.4zm16.18 5.24A8.5 8.5 0 0110 18.5a8.49 8.49 0 01-6.07-2.57l-.42.98a.5.5 0 01-.92-.39l.96-2.24a.5.5 0 01.65-.26l2.25 1.18a.5.5 0 01-.26.96l-1.02-.44a7.5 7.5 0 0011.95-3.49.5.5 0 11.97.4z"/></svg>',
			'network': '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a3 3 0 00-1 5.83v1.34a5.24 5.24 0 00-4.78 3.49l-1.39-.8A3 3 0 102 15.5a3 3 0 001.85-.64l1.94 1.12a.5.5 0 00.68-.18A4.24 4.24 0 0110 13.17a4.24 4.24 0 013.53 2.63.5.5 0 00.68.18l1.94-1.12A3 3 0 1018 11.5a3 3 0 00-1.17.24l-1.38.8A5.24 5.24 0 0011 9.17V7.83A3 3 0 0010 2z"/></svg>',
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

	renderMainMenu(tree, url, level) {
		const ul = level ? E('ul', { 'class': 'nav-submenu' }) : document.querySelector('#topmenu');
		const children = ui.menu.getChildren(tree);

		if (children.length == 0 || level > 1)
			return E([]);

		children.forEach(child => {
			const submenu = this.renderMainMenu(child, url + '/' + child.name, (level || 0) + 1);
			const isActive = L.env.dispatchpath.length > (level || 0) + 1 &&
				L.env.dispatchpath[(level || 0) + 1] == child.name;
			const hasSubmenu = submenu.firstElementChild;
			const isOpen = isActive && hasSubmenu;

			const li = E('li', { 'class': 'nav-item' + (isActive ? ' active' : '') + (isOpen ? ' open' : '') });

			if (!level) {
				const iconHtml = this.getMenuIcon(child.name);
				const link = E('a', {
					'class': 'nav-link' + (isActive ? ' active' : ''),
					'href': hasSubmenu ? '#' : L.url(url, child.name),
					'click': hasSubmenu ? (ev) => {
						ev.preventDefault();
						li.classList.toggle('open');
					} : null
				}, []);
				link.innerHTML =
					'<span class="nav-icon">' + iconHtml + '</span>' +
					'<span class="nav-text">' + _(child.title) + '</span>' +
					(hasSubmenu ? '<span class="nav-arrow"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M7.65 4.15c.2-.2.5-.2.7 0l5.49 5.46c.21.22.21.57 0 .78l-5.49 5.46a.5.5 0 01-.7-.7L12.79 10 7.65 4.85a.5.5 0 010-.7z"/></svg></span>' : '');
				li.appendChild(link);
			} else {
				li.appendChild(E('a', {
					'class': 'nav-sublink' + (isActive ? ' active' : ''),
					'href': L.url(url, child.name)
				}, [ _(child.title) ]));
			}

			if (hasSubmenu)
				li.appendChild(submenu);

			ul.appendChild(li);
		});

		ul.style.display = '';

		return ul;
	},

	renderModeMenu(tree) {
		const ul = document.querySelector('#modemenu');
		const children = ui.menu.getChildren(tree);

		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length
				? child.name === L.env.requestpath[0]
				: index === 0;

			ul.appendChild(E('li', { 'class': isActive ? 'active' : '' }, [
				E('a', { 'href': L.url(child.name) }, [ _(child.title) ])
			]));

			if (isActive)
				this.renderMainMenu(child, child.name);
		});

		if (ul.children.length > 1)
			ul.style.display = '';
	}
});
