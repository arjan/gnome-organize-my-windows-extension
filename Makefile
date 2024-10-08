NAME=organize-my-windows
DOMAIN=github.com

.PHONY: all pack install clean $(NAME).zip

all: $(NAME).zip

node_modules: package.json
	npm install

dist/extension.js dist/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

$(NAME).zip: dist/extension.js dist/prefs.js schemas/gschemas.compiled
	@cp -r schemas dist/
	@cp metadata.json dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

install: $(NAME).zip
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist node_modules $(NAME).zip

install-symlink: $(NAME).zip
	rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	ln -s $(PWD)/dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

run-nested: install
	dbus-run-session -- gnome-shell --nested --wayland
