HUGO ?= hugo
DEV_FLAGS ?= server --bind 0.0.0.0 --buildDrafts --buildFuture --disableFastRender
BUILD_FLAGS ?= --gc --minify --cleanDestinationDir

.PHONY: dev build deploy clean

## Start the live-reload dev server (drafts + future content included).
dev:
	$(HUGO) $(DEV_FLAGS)

## Production build Hugo site into ./public (suitable for DO static deploy).
build:
	$(HUGO) $(BUILD_FLAGS)

## Build for deploy; use this as the DigitalOcean build command.
deploy: build

## Remove generated assets.
clean:
	rm -rf public resources/_gen
