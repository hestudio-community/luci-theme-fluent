#
# Copyright (C) 2024 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Fluent UI 2 Theme
LUCI_DEPENDS:=+luci-base
LUCI_DESCRIPTION:=A modern theme based on Microsoft Fluent UI 2 design system.
# csstidy lowercases CSS custom property names and breaks var() references.
LUCI_MINIFY_CSS:=0


PKG_LICENSE:=Apache-2.0

define Package/luci-theme-fluent/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Fluent
	uci -q delete luci.themes.FluentDark
	uci -q delete luci.themes.FluentLight
	uci commit luci
}
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
