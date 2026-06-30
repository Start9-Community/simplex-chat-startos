# Updating the upstream version

SimpleX Websocket Bridge runs the [SimpleX Chat](https://github.com/simplex-chat/simplex-chat)
client headless. The runtime is the standalone container image built from
[lundog/simplex-chat-docker](https://github.com/lundog/simplex-chat-docker) and
published to Docker Hub as `lundog/simplex-chat`. "Upstream" here means the
SimpleX Chat release that image bundles; this repo consumes the image via
`dockerTag` and does not build it.

## Determining the upstream version

- **simplex-chat** ([simplex-chat/simplex-chat](https://github.com/simplex-chat/simplex-chat)) — fetch the latest release tag:

  ```sh
  gh release view -R simplex-chat/simplex-chat --json tagName -q .tagName
  ```

  The current pin lives in `startos/manifest/index.ts` at
  `images.simplex.source.dockerTag` (the version after the `:` in
  `lundog/simplex-chat:<version>`).

## Applying the bump

1. In [lundog/simplex-chat-docker](https://github.com/lundog/simplex-chat-docker),
   bump the pinned simplex-chat version, then build and publish a matching
   multi-arch (amd64 + arm64) tag to `lundog/simplex-chat`. The Dockerfile,
   entrypoint supervisor, and the `--files-folder`/`--temp-folder` flags all
   live there, not in this repo.
2. Bump `dockerTag` in `startos/manifest/index.ts` to
   `lundog/simplex-chat:<new version>` (drop the leading `v` from the release tag).
3. Bump the package `version` and update `releaseNotes` in
   `startos/versions/current.ts`. Add a migration only if the new version needs
   one (see the [packaging guide on versions](https://docs.start9.com/packaging)).
