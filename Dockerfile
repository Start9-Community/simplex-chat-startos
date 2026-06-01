FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    libgmp10 \
    zlib1g \
    libssl3 \
    libnuma1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# simplex-chat: pinned binary + SHA-256 per architecture.
# When bumping SIMPLEX_VERSION, refresh hashes from the upstream release page:
# https://github.com/simplex-chat/simplex-chat/releases/tag/v6.5.2
ARG SIMPLEX_VERSION=v6.5.2
ARG SIMPLEX_SHA256_X86_64=02e4b2037f626250a30cf1a6ffb44ae65314957fdbc487a2833d68ced48f500d
ARG SIMPLEX_SHA256_AARCH64=c62db0142560600fd2d72b9f767de6baf565cd1890d66dcb366babd78bc0e720
ARG TARGETARCH
RUN case "$TARGETARCH" in \
    amd64) SIMPLEX_ARCH="x86_64";  SIMPLEX_SHA256="${SIMPLEX_SHA256_X86_64}"  ;; \
    arm64) SIMPLEX_ARCH="aarch64"; SIMPLEX_SHA256="${SIMPLEX_SHA256_AARCH64}" ;; \
    *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac && \
  curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/download/${SIMPLEX_VERSION}/simplex-chat-ubuntu-22_04-${SIMPLEX_ARCH}" && \
  echo "${SIMPLEX_SHA256} /usr/local/bin/simplex-chat" | sha256sum -c - && \
  chmod +x /usr/local/bin/simplex-chat

# websocat: pinned binary + SHA-256 per architecture.
# When bumping WEBSOCAT_VERSION, refresh hashes from the upstream release page:
# https://github.com/vi/websocat/releases/tag/v1.14.1
ARG WEBSOCAT_VERSION=v1.14.1
ARG WEBSOCAT_SHA256_X86_64=66f8dd3a0394761556339117f8bb5123bddefd44e087af2a72ec22b0bd08d514
ARG WEBSOCAT_SHA256_AARCH64=711a69576a2ff473fb01a90ffafb571c2ed019e55479d7ae71b12c2eadeb7011
ARG TARGETARCH
RUN case "$TARGETARCH" in \
    amd64) WEBSOCAT_ARCH=x86_64;  WEBSOCAT_SHA256="${WEBSOCAT_SHA256_X86_64}"  ;; \
    arm64) WEBSOCAT_ARCH=aarch64; WEBSOCAT_SHA256="${WEBSOCAT_SHA256_AARCH64}" ;; \
    *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac && \
  curl -L -o /usr/local/bin/websocat \
    "https://github.com/vi/websocat/releases/download/${WEBSOCAT_VERSION}/websocat.${WEBSOCAT_ARCH}-unknown-linux-musl" && \
  echo "${WEBSOCAT_SHA256} /usr/local/bin/websocat" | sha256sum -c - && \
  chmod +x /usr/local/bin/websocat

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV HOME=/data
WORKDIR /data

EXPOSE 5225

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
