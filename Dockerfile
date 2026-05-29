FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    libgmp10 \
    zlib1g \
    libssl3 \
    libnuma1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG SIMPLEX_VERSION=v6.5.2
ARG TARGETARCH
RUN case "$TARGETARCH" in \
    amd64) SIMPLEX_ARCH="x86_64" ;; \
    arm64) SIMPLEX_ARCH="aarch64" ;; \
    *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac && \
  curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/download/${SIMPLEX_VERSION}/simplex-chat-ubuntu-22_04-${SIMPLEX_ARCH}" && \
  chmod +x /usr/local/bin/simplex-chat

ARG WEBSOCAT_VERSION=v1.14.1
ARG TARGETARCH
RUN case "$TARGETARCH" in \
    amd64) WEBSOCAT_ARCH=x86_64 ;; \
    arm64) WEBSOCAT_ARCH=aarch64 ;; \
    *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
  esac && \
  curl -L -o /usr/local/bin/websocat \
    "https://github.com/vi/websocat/releases/download/${WEBSOCAT_VERSION}/websocat.${WEBSOCAT_ARCH}-unknown-linux-musl" && \
  chmod +x /usr/local/bin/websocat

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV HOME=/data
WORKDIR /data

EXPOSE 5225

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]