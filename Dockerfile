# Upstream's image is FROM scratch, with no /proc for a StartOS subcontainer; take its binary onto alpine.
# Bump the tag and digest together — see UPDATING.md.
FROM ghcr.io/ovumcy/ovumcy-web:sha-d28ddba@sha256:07d6a9bfc3483c61643c0f7828a73524c91a268767b9cae703364f649c7aaf19 AS upstream

# Floating tag on purpose, where the binary above is a digest: this is the trust store the app checks
# a webhook receiver against, and only a rebuild moves it when a CA is withdrawn.
FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S -g 10001 ovumcy \
    && adduser -S -D -H -u 10001 -G ovumcy -h /app ovumcy \
    && mkdir -p /app/data /app/fence \
    && chown -R 10001:10001 /app

COPY --from=upstream --chown=10001:10001 /app/ovumcy /app/ovumcy

WORKDIR /app
EXPOSE 8080
USER 10001:10001
CMD ["/app/ovumcy"]
