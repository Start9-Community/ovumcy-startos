# Upstream's image is FROM scratch, with no /proc for a StartOS subcontainer; take its binary onto alpine.
# Bump the tag and digest together — see UPDATING.md.
FROM ghcr.io/ovumcy/ovumcy-web:sha-8918dac@sha256:2f3a952e90166e8e33d00b1789d41565b648bfb7b3133b322dd26339c714bc8a AS upstream

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
